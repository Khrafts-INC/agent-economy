// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/USDCEscrow.sol";

contract DeployScript is Script {
    // Circle's official USDC on Base Sepolia
    // https://developers.circle.com/stablecoins/evm-smart-contracts
    address constant BASE_SEPOLIA_USDC = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        USDCEscrow escrow = new USDCEscrow(BASE_SEPOLIA_USDC);
        
        vm.stopBroadcast();
        
        console.log("USDCEscrow deployed to:", address(escrow));
        console.log("USDC address:", BASE_SEPOLIA_USDC);
    }
}
