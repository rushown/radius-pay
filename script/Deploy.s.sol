// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/LinkPay.sol";

contract DeployLinkPay is Script {
    // Arc testnet USDC (ERC-20, 6 decimals)
    address constant USDC_ARC = 0x3600000000000000000000000000000000000000;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying LinkPay...");
        console.log("Deployer:", deployer);
        console.log("USDC address:", USDC_ARC);

        vm.startBroadcast(deployerPrivateKey);

        LinkPay linkPay = new LinkPay(USDC_ARC);

        vm.stopBroadcast();

        console.log("LinkPay deployed at:", address(linkPay));
        console.log("Chain ID:", block.chainid);
    }
}
