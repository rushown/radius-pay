// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/LinkPay.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @dev Minimal ERC-20 mock with 6 decimals (matches USDC on Arc)
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "USDC") {}

    function decimals() public pure override returns (uint8) { return 6; }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract LinkPayTest is Test {
    LinkPay internal linkPay;
    MockUSDC internal usdc;

    address internal owner   = address(0xA1);
    address internal alice   = address(0xA2); // creator
    address internal bob     = address(0xA3); // claimer
    address internal charlie = address(0xA4); // attacker

    // 10 USDC (6 decimals)
    uint256 internal constant AMOUNT = 10_000_000;

    // Secret + derived claimId
    bytes32 internal secret  = keccak256("supersecret");
    bytes32 internal claimId = keccak256(abi.encodePacked(secret));

    // ─── Setup ────────────────────────────────────────────────────────────────

    function setUp() public {
        vm.startPrank(owner);
        usdc    = new MockUSDC();
        linkPay = new LinkPay(address(usdc));
        vm.stopPrank();

        // Fund alice with USDC and approve contract
        usdc.mint(alice, 1_000_000_000); // 1000 USDC
        vm.prank(alice);
        usdc.approve(address(linkPay), type(uint256).max);

        // Fund bob with a tiny bit of gas (native – not strictly needed on Arc testnet)
        vm.deal(bob, 1 ether);
    }

    // ─── CreateClaim ──────────────────────────────────────────────────────────

    function test_CreateClaim_Success() public {
        vm.prank(alice);
        vm.expectEmit(true, true, false, true);
        emit LinkPay.ClaimCreated(claimId, alice, AMOUNT, block.timestamp + 7 days);

        linkPay.createClaim(claimId, AMOUNT, 0);

        (address creator, uint256 amount, uint256 expiresAt, address claimedBy, bool claimed)
            = linkPay.getClaim(claimId);

        assertEq(creator,   alice);
        assertEq(amount,    AMOUNT);
        assertEq(claimedBy, address(0));
        assertFalse(claimed);
        assertGt(expiresAt, block.timestamp);

        // Contract holds the USDC
        assertEq(usdc.balanceOf(address(linkPay)), AMOUNT);
    }

    function test_CreateClaim_MinAmountEnforced() public {
        vm.prank(alice);
        vm.expectRevert(LinkPay.InvalidAmount.selector);
        linkPay.createClaim(claimId, 9_999, 0); // below 10_000
    }

    function test_CreateClaim_DuplicateIdReverts() public {
        vm.prank(alice);
        linkPay.createClaim(claimId, AMOUNT, 0);

        vm.prank(alice);
        vm.expectRevert(LinkPay.ClaimAlreadyExists.selector);
        linkPay.createClaim(claimId, AMOUNT, 0);
    }

    function test_CreateClaim_PastExpiryReverts() public {
        vm.prank(alice);
        vm.expectRevert(LinkPay.InvalidExpiry.selector);
        linkPay.createClaim(claimId, AMOUNT, block.timestamp - 1);
    }

    function test_CreateClaim_CustomExpiry() public {
        uint256 custom = block.timestamp + 3 days;
        vm.prank(alice);
        linkPay.createClaim(claimId, AMOUNT, custom);

        (, , uint256 expiresAt, ,) = linkPay.getClaim(claimId);
        assertEq(expiresAt, custom);
    }

    // ─── Claim ────────────────────────────────────────────────────────────────

    function test_Claim_Success() public {
        vm.prank(alice);
        linkPay.createClaim(claimId, AMOUNT, 0);

        uint256 bobBefore = usdc.balanceOf(bob);

        vm.prank(bob);
        vm.expectEmit(true, true, false, true);
        emit LinkPay.ClaimClaimed(claimId, bob, AMOUNT);
        linkPay.claim(secret);

        assertEq(usdc.balanceOf(bob), bobBefore + AMOUNT);

        (, , , address claimedBy, bool claimed) = linkPay.getClaim(claimId);
        assertTrue(claimed);
        assertEq(claimedBy, bob);
    }

    function test_CannotClaimTwice() public {
        vm.prank(alice);
        linkPay.createClaim(claimId, AMOUNT, 0);

        vm.prank(bob);
        linkPay.claim(secret);

        // Second claim attempt must revert
        vm.prank(charlie);
        vm.expectRevert(LinkPay.ClaimAlreadyClaimed.selector);
        linkPay.claim(secret);
    }

    function test_Claim_WrongSecretReverts() public {
        vm.prank(alice);
        linkPay.createClaim(claimId, AMOUNT, 0);

        vm.prank(bob);
        vm.expectRevert(LinkPay.InvalidSecret.selector);
        linkPay.claim(bytes32("wrongsecret"));
    }

    function test_Claim_AfterExpiryReverts() public {
        vm.prank(alice);
        linkPay.createClaim(claimId, AMOUNT, 0);

        // Warp past expiry
        vm.warp(block.timestamp + 8 days);

        vm.prank(bob);
        vm.expectRevert(LinkPay.ClaimExpired.selector);
        linkPay.claim(secret);
    }

    // ─── Reclaim ──────────────────────────────────────────────────────────────

    function test_Reclaim_Success() public {
        vm.prank(alice);
        linkPay.createClaim(claimId, AMOUNT, 0);

        uint256 aliceBefore = usdc.balanceOf(alice);

        vm.warp(block.timestamp + 8 days);

        vm.prank(alice);
        vm.expectEmit(true, true, false, true);
        emit LinkPay.ClaimReclaimed(claimId, alice, AMOUNT);
        linkPay.reclaim(claimId);

        assertEq(usdc.balanceOf(alice), aliceBefore + AMOUNT);
    }

    function test_CannotReclaimBeforeExpiry() public {
        vm.prank(alice);
        linkPay.createClaim(claimId, AMOUNT, 0);

        vm.prank(alice);
        vm.expectRevert(LinkPay.ClaimNotExpired.selector);
        linkPay.reclaim(claimId);
    }

    function test_OnlyCreatorCanReclaim() public {
        vm.prank(alice);
        linkPay.createClaim(claimId, AMOUNT, 0);

        vm.warp(block.timestamp + 8 days);

        vm.prank(charlie);
        vm.expectRevert(LinkPay.OnlyCreator.selector);
        linkPay.reclaim(claimId);
    }

    function test_CannotReclaimAlreadyClaimed() public {
        vm.prank(alice);
        linkPay.createClaim(claimId, AMOUNT, 0);

        vm.prank(bob);
        linkPay.claim(secret);

        vm.warp(block.timestamp + 8 days);

        vm.prank(alice);
        vm.expectRevert(LinkPay.ClaimAlreadyClaimed.selector);
        linkPay.reclaim(claimId);
    }

    // ─── Pause / Unpause ──────────────────────────────────────────────────────

    function test_PausedBlocksOperations() public {
        vm.prank(owner);
        linkPay.pause();

        vm.prank(alice);
        vm.expectRevert();
        linkPay.createClaim(claimId, AMOUNT, 0);
    }

    function test_UnpauseRestoresOperations() public {
        vm.prank(owner);
        linkPay.pause();

        vm.prank(owner);
        linkPay.unpause();

        vm.prank(alice);
        linkPay.createClaim(claimId, AMOUNT, 0);

        (, , , , bool claimed) = linkPay.getClaim(claimId);
        assertFalse(claimed);
    }

    // ─── Access Control ───────────────────────────────────────────────────────

    function test_OnlyOwnerCanPause() public {
        vm.prank(alice);
        vm.expectRevert();
        linkPay.pause();
    }

    function test_DeriveClaimId() public view {
        bytes32 derived = linkPay.deriveClaimId(secret);
        assertEq(derived, claimId);
    }

    // ─── Fuzz ─────────────────────────────────────────────────────────────────

    /// @dev Fuzz: any amount >= MIN_AMOUNT should succeed
    function testFuzz_CreateAndClaim(uint256 fuzzAmount, bytes32 fuzzSecret) public {
        vm.assume(fuzzAmount >= 10_000 && fuzzAmount <= 500_000_000);

        bytes32 fuzzClaimId = keccak256(abi.encodePacked(fuzzSecret));

        usdc.mint(alice, fuzzAmount);
        vm.prank(alice);
        usdc.approve(address(linkPay), fuzzAmount);

        vm.prank(alice);
        linkPay.createClaim(fuzzClaimId, fuzzAmount, 0);

        uint256 bobBefore = usdc.balanceOf(bob);
        vm.prank(bob);
        linkPay.claim(fuzzSecret);

        assertEq(usdc.balanceOf(bob), bobBefore + fuzzAmount);
    }
}
