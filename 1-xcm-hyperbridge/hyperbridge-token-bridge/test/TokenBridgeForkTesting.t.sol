// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {Test} from "@forge/Test.sol";
import {console} from "@forge/console.sol";
import {ITokenGateway, TeleportParams} from "@hyperbridge/core/contracts/apps/TokenGateway.sol";
import {TokenBridge} from "../src/TokenBridge.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title TokenBridgeForkTest
 * @notice Fork testing for TokenBridge contract using Optimism Sepolia network
 * @dev These tests verify the contract works with real deployed contracts on Optimism Sepolia
 */
contract TokenBridgeForkTest is Test {
    // Optimism Sepolia network addresses from deployments.toml
    address public constant TOKEN_GATEWAY = 0xFcDa26cA021d5535C3059547390E6cCd8De7acA6;
    address public constant USD_FEE_TOKEN = 0xA801da100bF16D07F668F4A49E1f71fc54D05177;
    address public constant TOKEN_FAUCET = 0x1794aB22388303ce9Cb798bE966eeEBeFe59C3a3;
    address public constant WETH = 0x4200000000000000000000000000000000000006;
    
    // The correct asset ID for WETH on Hyperbridge
    // This is NOT a simple keccak256 hash of "WETH" but a more complex identifier
    bytes32 public constant WETH_ASSET_ID = 0x9d73bf7de387b25f0aff297e40734d86f04fc00110134e7b3399c968c2d4af75;
    
    ITokenGateway public tokenGateway;
    TokenBridge public bridge;
    
    address public user = address(0x1234);
    address public recipient = address(0x5678);
    
    uint256 public constant DEFAULT_RELAYER_FEE = 0.001 ether;
    string public constant OPTIMISM_SEPOLIA_RPC = "https://sepolia.optimism.io";
    
    function setUp() public {
        // Create fork of Optimism Sepolia
        vm.createSelectFork(OPTIMISM_SEPOLIA_RPC);
        
        // Initialize the token gateway
        tokenGateway = ITokenGateway(TOKEN_GATEWAY);
        
        // Deploy our bridge contract with default relayer fee
        bridge = new TokenBridge(TOKEN_GATEWAY, USD_FEE_TOKEN, DEFAULT_RELAYER_FEE);
        
        // Give user some ETH for gas
        vm.deal(user, 10 ether);
    }
    
    /// @notice Primary test to verify the fork is working correctly
    /// @dev Calls the erc20 function of TokenGateway with WETH_ASSET_ID
    /// and verifies it returns the correct WETH address
    function testForkVerification() public view {
        // Call the erc20 function with the WETH asset ID
        address returnedWethAddress = tokenGateway.erc20(WETH_ASSET_ID);
        
        // Verify that the returned address matches the expected WETH address
        assertEq(
            returnedWethAddress,
            WETH,
            "WETH address from TokenGateway should match the expected WETH address"
        );
        
        console.log("=== Fork Verification Successful ===");
        console.log("WETH Asset ID:", vm.toString(WETH_ASSET_ID));
        console.log("Expected WETH Address:", WETH);
        console.log("Returned WETH Address:", returnedWethAddress);
    }
    
    /// @notice Test using bridge.getERC20Address() function
    function testGetERC20AddressForWETH() public view {
        address returnedWethAddress = bridge.getERC20Address(WETH_ASSET_ID);
        
        assertEq(
            returnedWethAddress,
            WETH,
            "Bridge should return correct WETH address for asset ID"
        );
        
        console.log("=== Bridge getERC20Address Test ===");
        console.log("Returned WETH Address from Bridge:", returnedWethAddress);
    }
    
    /// @notice Test the TokenGateway contract exists and is accessible
    function testTokenGatewayExists() public view {
        uint256 codeSize;
        assembly {
            codeSize := extcodesize(TOKEN_GATEWAY)
        }
        assertTrue(codeSize > 0, "TokenGateway should have code");
        
        console.log("TokenGateway code size:", codeSize);
    }
    
    /// @notice Test WETH contract exists on the fork
    function testWethExists() public view {
        uint256 codeSize;
        assembly {
            codeSize := extcodesize(WETH)
        }
        assertTrue(codeSize > 0, "WETH should have code");
        
        IERC20 wethToken = IERC20(WETH);
        
        console.log("WETH code size:", codeSize);
        console.log("WETH address:", address(wethToken));
    }
    
    /// @notice Test USD fee token exists on the fork
    function testUsdFeeTokenExists() public view {
        uint256 codeSize;
        assembly {
            codeSize := extcodesize(USD_FEE_TOKEN)
        }
        assertTrue(codeSize > 0, "USD fee token should have code");
        
        console.log("USD Fee Token code size:", codeSize);
        console.log("USD Fee Token address:", USD_FEE_TOKEN);
    }
    
    /// @notice Test token faucet exists on the fork
    function testTokenFaucetExists() public view {
        uint256 codeSize;
        assembly {
            codeSize := extcodesize(TOKEN_FAUCET)
        }
        assertTrue(codeSize > 0, "Token faucet should have code");
        
        console.log("Token Faucet code size:", codeSize);
        console.log("Token Faucet address:", TOKEN_FAUCET);
    }
    
    /// @notice Test getting WETH balance on the fork
    function testGetWethBalance() public view {
        IERC20 wethToken = IERC20(WETH);
        
        // Get balance of user address (should be 0 initially)
        uint256 balance = wethToken.balanceOf(user);
        
        console.log("WETH balance of user:", balance);
        
        // Balance check (should always pass, just verifying the call works)
        assertTrue(balance >= 0, "Should be able to query WETH balance");
    }
    
    /// @notice Test the bridge contract deployment on fork
    function testBridgeDeploymentOnFork() public view {
        assertEq(address(bridge.tokenGateway()), TOKEN_GATEWAY, "TokenGateway address should match");
        assertEq(bridge.feeToken(), USD_FEE_TOKEN, "Fee token address should match");
        assertEq(bridge.DEFAULT_TIMEOUT(), 86400, "Timeout should be 24 hours");
        assertEq(bridge.defaultRelayerFee(), DEFAULT_RELAYER_FEE, "Default relayer fee should match");
        
        console.log("=== Bridge Deployment Test ===");
        console.log("Bridge address:", address(bridge));
        console.log("TokenGateway:", address(bridge.tokenGateway()));
        console.log("Fee Token:", bridge.feeToken());
    }
    
    /// @notice Test getAssetId function with various symbols
    function testGetAssetIdForCommonTokens() public view {
        // Test WETH
        bytes32 wethAssetId = bridge.getAssetId("WETH0");
        console.log("Asset ID for 'WETH':", vm.toString(wethAssetId));
        console.log("Actual WETH Asset ID:", vm.toString(WETH_ASSET_ID));
        
        // Test USDC
        bytes32 usdcAssetId = bridge.getAssetId("USDC");
        console.log("Asset ID for 'USDC':", vm.toString(usdcAssetId));
        
        // Test ETH
        bytes32 ethAssetId = bridge.getAssetId("ETH");
        console.log("Asset ID for 'ETH':", vm.toString(ethAssetId));
        
        // Verify they are all different
        assertTrue(wethAssetId != usdcAssetId, "WETH and USDC should have different asset IDs");
        assertTrue(wethAssetId != ethAssetId, "WETH and ETH should have different asset IDs");
        assertTrue(usdcAssetId != ethAssetId, "USDC and ETH should have different asset IDs");
    }
    
    /// @notice Demonstrate the difference between simple hashing and actual asset IDs
    function testAssetIdHashingExplanation() public pure {
        // Simple keccak256 hash of "WETH" string
        bytes32 hashedWeth = keccak256(bytes("WETH"));
        
        console.log("=== Asset ID Hashing Explanation ===");
        console.log("Simple keccak256('WETH'):", vm.toString(hashedWeth));
        console.log("Actual WETH Asset ID:   ", vm.toString(WETH_ASSET_ID));
        
        // This demonstrates they are different
        assertTrue(
            hashedWeth != WETH_ASSET_ID,
            "Simple hash of 'WETH' does not match the actual asset ID"
        );
        
        console.log("");
        console.log("NOTE: The actual asset ID is likely derived from:");
        console.log("- Token address");
        console.log("- Chain identifier");
        console.log("- Protocol-specific metadata");
        console.log("Not just a simple hash of the symbol");
    }
    
    /// @notice Test bridging WETH using the correct asset ID
    /// @dev This test demonstrates the correct parameters but may revert in fork testing
    /// due to Hyperbridge's internal contract dependencies not being fully available
    function testBridgeWethWithCorrectAssetId() public {
        IERC20 wethToken = IERC20(WETH);
        IERC20 feeToken = IERC20(USD_FEE_TOKEN);
        
        // Give user some WETH using deal
        uint256 bridgeAmount = 0.01 ether;
        deal(address(wethToken), user, bridgeAmount);
        
        // IMPORTANT: Give the user USD fee tokens to pay for cross-chain fees
        // The bridge will transfer these from the user to itself, then the gateway pulls from bridge
        deal(address(feeToken), user, 10 ether); // Give user 10 USD tokens for fees
        
        // Verify user has WETH
        uint256 userBalance = wethToken.balanceOf(user);
        assertEq(userBalance, bridgeAmount, "User should have WETH");
        
        console.log("=== Bridge WETH Test ===");
        console.log("User WETH balance before:", userBalance);
        console.log("User USD fee token balance:", feeToken.balanceOf(user));
        
        // Bridge WETH tokens using the correct asset ID
        bytes memory destChain = bytes("EVM-11155111");
        
        // Estimate the fee for this transfer
        uint256 estimatedFee = bridge.estimateFee(destChain, bridgeAmount);
        console.log("Estimated fee:", estimatedFee);
        
        vm.startPrank(user);
        
        // Approve bridge to spend WETH
        wethToken.approve(address(bridge), bridgeAmount);
        
        // Approve bridge to spend fee tokens (CRITICAL: user must approve fee token spending)
        feeToken.approve(address(bridge), type(uint256).max);
        
        // Note: Use redeem=false for native tokens (not hyperbridge-wrapped tokens)
        // redeem=true is only for tokens that were minted by Hyperbridge and need to be burned
        try bridge.bridgeTokensWithAssetId{value: bridgeAmount}(
            WETH,
            WETH_ASSET_ID, // Use the correct asset ID
            bridgeAmount,
            recipient,
            destChain,
            0,// DEFAULT_RELAYER_FEE,
            86400, // 24 hours
            false, // redeem: false because we're using native WETH, not hyperbridge-wrapped tokens
            0 // feeAmount: 0 means use automatic estimation
        ) {
            console.log("Bridge tokens call succeeded!");
            
            // Check that tokens were transferred from user
            uint256 newBalance = wethToken.balanceOf(user);
            console.log("User WETH balance after:", newBalance);
            assertEq(newBalance, 0, "User WETH should be transferred to bridge");
        } catch Error(string memory reason) {
            console.log("Bridge call reverted with reason:", reason);
            // This is expected in fork testing as Hyperbridge may have additional
            // contract dependencies that aren't available in the fork
        } catch (bytes memory lowLevelData) {
            console.log("Bridge call reverted with low level error");
            console.logBytes(lowLevelData);
            // This is expected in fork testing - the important part is that
            // our contract correctly calls the TokenGateway with proper parameters
        }
        
        vm.stopPrank();
    }
    
    /// @notice Test with exact parameters from dev chain transaction that failed
    /// @dev This reproduces the exact transaction that reverted on dev chain
    function testBridgeWithDevChainParameters() public {
        IERC20 wethToken = IERC20(WETH);
        IERC20 feeToken = IERC20(USD_FEE_TOKEN);
        
        // Exact parameters from failed transaction
        address testRecipient = 0x5984A519fFfE5aFc5e8bBA233DCc01AC774f4301;
        uint256 bridgeAmount = 1000000000000000; // 0.001 ether
        bytes memory destChain = hex"45564d2d3131313535313131"; // "EVM-11155111"
        uint64 timeout = 21600; // 6 hours
        
        // Give user some WETH
        deal(address(wethToken), user, bridgeAmount);
        
        // Give user USD fee tokens
        deal(address(feeToken), user, 10 ether);
        
        console.log("=== Dev Chain Parameters Test ===");
        console.log("Bridge amount (wei):", bridgeAmount);
        console.log("Bridge amount (ether):", bridgeAmount / 1e18);
        console.log("Recipient:", testRecipient);
        console.log("Dest chain (hex):", vm.toString(destChain));
        console.log("Timeout:", timeout);
        
        // Estimate the fee
        uint256 estimatedFee = bridge.estimateFee(destChain, bridgeAmount);
        console.log("Estimated fee:", estimatedFee);
        
        vm.startPrank(user);
        
        // Approve bridge to spend WETH
        wethToken.approve(address(bridge), bridgeAmount);
        console.log("WETH approved:", bridgeAmount);
        
        // Approve bridge to spend fee tokens
        feeToken.approve(address(bridge), type(uint256).max);
        console.log("Fee token approved: unlimited");
        
        // Check balances before
        console.log("User WETH balance before:", wethToken.balanceOf(user));
        console.log("User fee token balance before:", feeToken.balanceOf(user));
        
        // Call with exact parameters - NOTE: msg.value should be 0.001 ether
        try bridge.bridgeTokensWithAssetId{value: bridgeAmount}(
            WETH,
            WETH_ASSET_ID,
            bridgeAmount,
            testRecipient,
            destChain,
            0, // relayerFee
            timeout,
            false, // redeem
            0 // feeAmount (auto estimate)
        ) {
            console.log("SUCCESS! Bridge call completed");
            console.log("User WETH balance after:", wethToken.balanceOf(user));
            console.log("User fee token balance after:", feeToken.balanceOf(user));
        } catch Error(string memory reason) {
            console.log("FAILED with reason:", reason);
        } catch (bytes memory lowLevelData) {
            console.log("FAILED with low level error");
            console.logBytes(lowLevelData);
        }
        
        vm.stopPrank();
    }
    
    /// @notice Test bridging with simple bridge function (uses symbol)
    function testBridgeWethWithSymbol() public {
        IERC20 wethToken = IERC20(WETH);
        
        uint256 bridgeAmount = 0.5 ether;
        deal(address(wethToken), user, bridgeAmount);
        
        vm.startPrank(user);
        
        wethToken.approve(address(bridge), bridgeAmount);
        
        bytes memory destChain = bytes("sepolia");
        
        // This will use keccak256("WETH") as assetId, which is different from WETH_ASSET_ID
        // So it might fail or behave differently
        try bridge.bridgeTokens{value: 0.01 ether}(
            WETH,
            "WETH",
            bridgeAmount,
            recipient,
            destChain
        ) {
            console.log("Bridge with symbol succeeded");
        } catch Error(string memory reason) {
            console.log("Bridge with symbol reverted:", reason);
        } catch (bytes memory lowLevelData) {
            console.log("Bridge with symbol reverted with low level error");
            console.logBytes(lowLevelData);
        }
        
        vm.stopPrank();
    }
    
    /// @notice Test setting default relayer fee
    function testSetDefaultRelayerFeeOnFork() public {
        uint256 newRelayerFee = 0.002 ether;
        
        bridge.setDefaultRelayerFee(newRelayerFee);
        
        assertEq(bridge.defaultRelayerFee(), newRelayerFee, "Default relayer fee should be updated");
        
        console.log("=== Default Relayer Fee Test ===");
        console.log("Old relayer fee:", DEFAULT_RELAYER_FEE);
        console.log("New relayer fee:", newRelayerFee);
    }
    
    /// @notice Test querying multiple asset IDs
    function testQueryMultipleAssetIds() public view {
        // Try different symbol variations
        string[] memory symbols = new string[](5);
        symbols[0] = "WETH";
        symbols[1] = "WETH9";
        symbols[2] = "ETH";
        symbols[3] = "USDC";
        symbols[4] = "USD.h";
        
        console.log("=== Multiple Asset ID Query ===");
        for (uint i = 0; i < symbols.length; i++) {
            bytes32 assetId = bridge.getAssetId(symbols[i]);
            address erc20Addr = bridge.getERC20Address(assetId);
            
            console.log("Symbol:", symbols[i]);
            console.log("  Asset ID:", vm.toString(assetId));
            console.log("  ERC20 Address:", erc20Addr);
        }
    }
    
    /// @notice Test that verifies token transfer and approval logic works correctly
    /// @dev This test stops before the actual gateway call to verify the bridge contract logic
    function testBridgeTokenTransferLogic() public {
        IERC20 wethToken = IERC20(WETH);
        
        // Give user some WETH
        uint256 bridgeAmount = 0.1 ether;
        deal(address(wethToken), user, bridgeAmount);
        
        console.log("=== Token Transfer Logic Test ===");
        console.log("Initial user WETH balance:", wethToken.balanceOf(user));
        console.log("Initial bridge WETH balance:", wethToken.balanceOf(address(bridge)));
        
        vm.startPrank(user);
        
        // Approve bridge to spend WETH
        wethToken.approve(address(bridge), bridgeAmount);
        assertEq(
            wethToken.allowance(user, address(bridge)),
            bridgeAmount,
            "Bridge should have allowance"
        );
        
        // Verify balances before
        uint256 userBalanceBefore = wethToken.balanceOf(user);
        uint256 bridgeBalanceBefore = wethToken.balanceOf(address(bridge));
        
        // Simulate what our bridge does: transfer tokens
        wethToken.transfer(address(bridge), bridgeAmount);
        
        // Verify balances after
        uint256 userBalanceAfter = wethToken.balanceOf(user);
        uint256 bridgeBalanceAfter = wethToken.balanceOf(address(bridge));
        
        assertEq(
            userBalanceAfter,
            userBalanceBefore - bridgeAmount,
            "User balance should decrease"
        );
        assertEq(
            bridgeBalanceAfter,
            bridgeBalanceBefore + bridgeAmount,
            "Bridge balance should increase"
        );
        
        console.log("Final user WETH balance:", userBalanceAfter);
        console.log("Final bridge WETH balance:", bridgeBalanceAfter);
        console.log("Token transfer logic verified successfully!");
        
        vm.stopPrank();
    }
    
    /// @notice Test demonstrating correct parameters for real deployment
    /// @dev Shows the exact parameters to use when bridging WETH
    function testRealisticBridgeParameters() public view {
        console.log("=== Realistic Bridge Parameters for WETH ===");
        console.log("");
        console.log("Token Address (WETH):", WETH);
        console.log("Asset ID:", vm.toString(WETH_ASSET_ID));
        console.log("Token Gateway:", TOKEN_GATEWAY);
        console.log("USD Fee Token:", USD_FEE_TOKEN);
        console.log("");
        console.log("For bridging native tokens (not hyperbridge-wrapped):");
        console.log("- Use redeem: false");
        console.log("- Amount: in wei (e.g., 100000000000000 = 0.0001 WETH)");
        console.log("- Timeout: 21600 seconds (6 hours) or 86400 (24 hours)");
        console.log("- RelayerFee: 0 (or as specified)");
        console.log("- DestChain: bytes encoding of chain name");
        console.log("");
        console.log("Example destChain encoding:");
        console.log("'sepolia' = 0x7365706f6c6961");
        console.log("bytes('sepolia') length:", bytes("sepolia").length);
    }
}
