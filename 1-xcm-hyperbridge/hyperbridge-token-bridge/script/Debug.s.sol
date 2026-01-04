// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/TokenBridge.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DebugScript is Script {
    // Optimism Sepolia addresses
    address constant TOKEN_GATEWAY = 0xFcDa26cA021d5535C3059547390E6cCd8De7acA6;
    address constant WETH = 0x4200000000000000000000000000000000000006;
    address constant USD_FEE_TOKEN = 0xA801da100bF16D07F668F4A49E1f71fc54D05177;
    bytes32 constant WETH_ASSET_ID = 0x9d73bf7de387b25f0aff297e40734d86f04fc00110134e7b3399c968c2d4af75;
    
    function run() external {
        // Get the user's address from the environment variable
        address user = vm.envAddress("USER_ADDRESS");
        
        // Get the deployed bridge contract address
        address bridgeContract = vm.envAddress("BRIDGE_CONTRACT");
        
        console.log("=== Debugging User State ===");
        console.log("User address:", user);
        console.log("Bridge contract:", bridgeContract);
        console.log("");
        
        // Check WETH balance
        uint256 wethBalance = IERC20(WETH).balanceOf(user);
        console.log("User WETH balance:", wethBalance);
        console.log("User WETH balance (ether):", wethBalance / 1e18);
        
        // Check Fee Token balance
        uint256 feeTokenBalance = IERC20(USD_FEE_TOKEN).balanceOf(user);
        console.log("User USD fee token balance:", feeTokenBalance);
        console.log("User USD fee token (ether):", feeTokenBalance / 1e18);
        
        // Check WETH allowance to bridge
        uint256 wethAllowance = IERC20(WETH).allowance(user, bridgeContract);
        console.log("WETH allowance to bridge:", wethAllowance);
        
        // Check Fee Token allowance to bridge
        uint256 feeTokenAllowance = IERC20(USD_FEE_TOKEN).allowance(user, bridgeContract);
        console.log("Fee token allowance to bridge:", feeTokenAllowance);
        console.log("");
        
        // Check bridge contract balances
        uint256 bridgeWethBalance = IERC20(WETH).balanceOf(bridgeContract);
        console.log("Bridge WETH balance:", bridgeWethBalance);
        
        uint256 bridgeFeeTokenBalance = IERC20(USD_FEE_TOKEN).balanceOf(bridgeContract);
        console.log("Bridge USD fee token balance:", bridgeFeeTokenBalance);
        console.log("");
        
        // Estimate the fee for the exact transaction parameters
        TokenBridge bridge = TokenBridge(payable(bridgeContract));
        bytes memory destChain = hex"45564d2d3131313535313131"; // "EVM-11155111"
        uint256 amount = 1000000000000000; // 0.001 ether
        
        uint256 estimatedFee = bridge.estimateFee(destChain, amount);
        console.log("Estimated fee for 0.001 WETH bridge:", estimatedFee);
        console.log("Estimated fee (ether):", estimatedFee / 1e18);
        console.log("");
        
        // Check if user has enough tokens
        console.log("=== Requirements Check ===");
        console.log("Has enough WETH?", wethBalance >= amount);
        console.log("Has enough fee tokens?", feeTokenBalance >= estimatedFee);
        console.log("Has WETH approval?", wethAllowance >= amount);
        console.log("Has fee token approval?", feeTokenAllowance >= estimatedFee);
        console.log("");
        
        // Check native ETH balance for msg.value
        uint256 ethBalance = user.balance;
        console.log("User native ETH balance:", ethBalance);
        console.log("User native ETH (ether):", ethBalance / 1e18);
        console.log("Has enough ETH for msg.value?", ethBalance >= amount);
    }
}
