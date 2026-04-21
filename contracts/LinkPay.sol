// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title LinkPay
 * @notice Secure, one-time claim links for USDC on the Arc blockchain (Radius Pay).
 * @dev Uses a secret-hash pattern: the claimId is keccak256(secret).
 *      The secret never touches the chain; only its hash is stored.
 *
 * Security properties:
 *  - ReentrancyGuard on all state-mutating functions
 *  - onlyUnclaimed / onlyExpired modifiers prevent double-spend and premature reclaim
 *  - SafeERC20 wraps all token transfers
 *  - No external calls before state changes (checks-effects-interactions)
 *  - Pausable for emergency stop
 */
contract LinkPay is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    // ─── Constants ────────────────────────────────────────────────────────────

    /// @notice USDC ERC-20 contract on Arc (6 decimals)
    IERC20 public immutable usdc;

    /// @notice Default claim expiry if caller passes 0
    uint256 public constant DEFAULT_EXPIRY_SECONDS = 7 days;

    /// @notice Minimum amount: 0.01 USDC (6 decimals → 10_000)
    uint256 public constant MIN_AMOUNT = 10_000;

    // ─── State ────────────────────────────────────────────────────────────────

    struct Claim {
        address creator;
        uint256 amount;      // in USDC 6-decimal units
        uint256 expiresAt;   // unix timestamp
        address claimedBy;
        bool    claimed;
    }

    /// @dev claimId (= keccak256(secret)) → Claim
    mapping(bytes32 => Claim) private _claims;

    // ─── Events ───────────────────────────────────────────────────────────────

    event ClaimCreated(
        bytes32 indexed claimId,
        address indexed creator,
        uint256 amount,
        uint256 expiresAt
    );

    event ClaimClaimed(
        bytes32 indexed claimId,
        address indexed claimedBy,
        uint256 amount
    );

    event ClaimReclaimed(
        bytes32 indexed claimId,
        address indexed creator,
        uint256 amount
    );

    // ─── Errors ───────────────────────────────────────────────────────────────

    error ClaimAlreadyExists();
    error ClaimDoesNotExist();
    error ClaimAlreadyClaimed();
    error ClaimNotExpired();
    error ClaimExpired();
    error InvalidSecret();
    error InvalidAmount();
    error InvalidExpiry();
    error OnlyCreator();

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyUnclaimed(bytes32 claimId) {
        if (_claims[claimId].creator == address(0)) revert ClaimDoesNotExist();
        if (_claims[claimId].claimed) revert ClaimAlreadyClaimed();
        _;
    }

    modifier onlyNotExpired(bytes32 claimId) {
        if (block.timestamp >= _claims[claimId].expiresAt) revert ClaimExpired();
        _;
    }

    modifier onlyExpired(bytes32 claimId) {
        if (block.timestamp < _claims[claimId].expiresAt) revert ClaimNotExpired();
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(address usdcAddress) Ownable(msg.sender) {
        require(usdcAddress != address(0), "Zero address");
        usdc = IERC20(usdcAddress);
    }

    // ─── External: Create ─────────────────────────────────────────────────────

    /**
     * @notice Lock USDC and register a new claim link.
     * @param claimId         keccak256(secret) — computed off-chain by the frontend.
     * @param amount          USDC amount in 6-decimal units (e.g. 1_000_000 = 1 USDC).
     * @param expiryTimestamp Unix timestamp after which the claim expires.
     *                        Pass 0 to use DEFAULT_EXPIRY_SECONDS from now.
     */
    function createClaim(
        bytes32 claimId,
        uint256 amount,
        uint256 expiryTimestamp
    ) external nonReentrant whenNotPaused {
        if (amount < MIN_AMOUNT) revert InvalidAmount();
        if (_claims[claimId].creator != address(0)) revert ClaimAlreadyExists();

        uint256 expiry = expiryTimestamp == 0
            ? block.timestamp + DEFAULT_EXPIRY_SECONDS
            : expiryTimestamp;

        if (expiry <= block.timestamp) revert InvalidExpiry();

        // Effects before interactions (CEI pattern)
        _claims[claimId] = Claim({
            creator:   msg.sender,
            amount:    amount,
            expiresAt: expiry,
            claimedBy: address(0),
            claimed:   false
        });

        // Interaction — pull USDC from creator (must have approved this contract)
        usdc.safeTransferFrom(msg.sender, address(this), amount);

        emit ClaimCreated(claimId, msg.sender, amount, expiry);
    }

    // ─── External: Claim ──────────────────────────────────────────────────────

    /**
     * @notice Claim USDC using the raw secret from the link URL.
     * @param secret The 32-byte secret embedded in the claim URL.
     *               The contract re-derives claimId = keccak256(secret) and validates.
     */
    function claim(bytes32 secret)
        external
        nonReentrant
        whenNotPaused
    {
        bytes32 claimId = keccak256(abi.encodePacked(secret));

        if (_claims[claimId].creator == address(0)) revert InvalidSecret();
        if (_claims[claimId].claimed) revert ClaimAlreadyClaimed();
        if (block.timestamp >= _claims[claimId].expiresAt) revert ClaimExpired();

        uint256 amount = _claims[claimId].amount;

        // Effects before interactions
        _claims[claimId].claimed   = true;
        _claims[claimId].claimedBy = msg.sender;

        // Interaction
        usdc.safeTransfer(msg.sender, amount);

        emit ClaimClaimed(claimId, msg.sender, amount);
    }

    // ─── External: Reclaim ────────────────────────────────────────────────────

    /**
     * @notice Reclaim locked USDC after a claim link has expired unclaimed.
     * @param claimId The claimId (keccak256 of secret) of the expired claim.
     */
    function reclaim(bytes32 claimId)
        external
        nonReentrant
        whenNotPaused
        onlyUnclaimed(claimId)
        onlyExpired(claimId)
    {
        if (_claims[claimId].creator != msg.sender) revert OnlyCreator();

        uint256 amount = _claims[claimId].amount;

        // Effects
        _claims[claimId].claimed   = true;   // prevents re-entry via reclaim
        _claims[claimId].claimedBy = msg.sender;

        // Interaction
        usdc.safeTransfer(msg.sender, amount);

        emit ClaimReclaimed(claimId, msg.sender, amount);
    }

    // ─── View ─────────────────────────────────────────────────────────────────

    /**
     * @notice Fetch claim metadata by claimId.
     */
    function getClaim(bytes32 claimId)
        external
        view
        returns (
            address creator,
            uint256 amount,
            uint256 expiresAt,
            address claimedBy,
            bool claimed
        )
    {
        Claim storage c = _claims[claimId];
        return (c.creator, c.amount, c.expiresAt, c.claimedBy, c.claimed);
    }

    /**
     * @notice Derive claimId from a secret — mirrors the off-chain computation.
     */
    function deriveClaimId(bytes32 secret) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(secret));
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    /// @notice Emergency pause — blocks createClaim, claim, reclaim.
    function pause() external onlyOwner { _pause(); }

    /// @notice Unpause after an emergency.
    function unpause() external onlyOwner { _unpause(); }

    /**
     * @notice Recover any accidentally sent native token (Arc uses USDC for gas,
     *         but good practice to keep this).
     */
    function rescueNative() external onlyOwner {
        uint256 bal = address(this).balance;
        require(bal > 0, "Nothing to rescue");
        (bool ok,) = owner().call{value: bal}("");
        require(ok, "Transfer failed");
    }

    /**
     * @notice Recover ERC-20 tokens other than USDC accidentally sent to this contract.
     */
    function rescueERC20(address token, uint256 amount) external onlyOwner {
        require(token != address(usdc), "Cannot rescue USDC");
        IERC20(token).safeTransfer(owner(), amount);
    }
}
