// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {Test, Vm} from "@forge/Test.sol";
import {console} from "@forge/console.sol";
import {ITokenGateway, TeleportParams} from "@hyperbridge/core/contracts/apps/TokenGateway.sol";
import {TokenBridge} from "../src/TokenBridge.sol";
import {BridgeableToken} from "../src/BridgeableToken.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {StateMachine} from "@hyperbridge/core/contracts/libraries/StateMachine.sol";

// Mock contracts for local integration testing
contract MockTokenGateway {
    event TeleportCalled(address sender, uint256 amount, uint256 nativeCost);
    
    mapping(bytes32 => address) private _erc20Addresses;
    
    function teleport(TeleportParams calldata params) external payable {
        emit TeleportCalled(msg.sender, params.amount, params.nativeCost);
    }
    
    function setERC20(bytes32 assetId, address tokenAddress) external {
        _erc20Addresses[assetId] = tokenAddress;
    }
    
    function erc20(bytes32 assetId) external view returns (address) {
        return _erc20Addresses[assetId];
    }
}

/**
 * @title LocalIntegrationTest
 * @notice Local integration testing for TokenBridge and BridgeableToken
 * @dev These tests verify the contracts work together correctly without network fork
 */
contract LocalIntegrationTest is Test {
    BridgeableToken public bridgeableToken;
    TokenBridge public bridge;
    MockTokenGateway public gateway;
    
    address public user = address(0xBEEF);
    address public recipient = address(0xCAFE);
    bytes public destChain;
    uint256 public chainId;
    string public constant TOKEN_SYMBOL = "BRG";
    
    uint256 public constant INITIAL_BALANCE = 10000 * 10**18;
    uint256 public constant BRIDGE_AMOUNT = 100 * 10**18;
    
    function setUp() public {
        // Deploy mock gateway
        gateway = new MockTokenGateway();
        
        // Deploy bridgeable token
        bridgeableToken = new BridgeableToken(
            "Bridgeable Token",
            "BRG",
            address(gateway)
        );
        
        // Deploy token bridge (using bridgeableToken as fee token for simplicity)
        bridge = new TokenBridge(address(gateway), address(bridgeableToken));
        
        // Mint tokens to user via gateway (since only gateway can mint)
        vm.prank(address(gateway));
        bridgeableToken.mint(user, INITIAL_BALANCE);
        
        // Give user some ETH
        vm.deal(user, 10 ether);

        // Set destination chain (using same chainId for simplicity)
        chainId = 11155111; // Sepolia
        destChain = StateMachine.evm(chainId);
    }
    
    /// @notice Test BridgeableToken and TokenBridge integration
    function testBridgeableTokenAndBridgeIntegration() public {
        vm.startPrank(user);
        
        // Approve bridge to spend tokens
        bridgeableToken.approve(address(bridge), BRIDGE_AMOUNT);
        
        // Record logs to verify teleport was called
        vm.recordLogs();
        
        bridge.bridgeTokens(
            address(bridgeableToken),
            TOKEN_SYMBOL,
            BRIDGE_AMOUNT,
            recipient,
            destChain
        );
        
        // Check that TeleportCalled event was emitted
        Vm.Log[] memory logs = vm.getRecordedLogs();
        bool teleportCalled = false;
        for (uint i = 0; i < logs.length; i++) {
            if (logs[i].topics[0] == keccak256("TeleportCalled(address,uint256,uint256)")) {
                teleportCalled = true;
                break;
            }
        }
        assertTrue(teleportCalled, "TeleportCalled event should be emitted");
        
        vm.stopPrank();
    }
    
    /// @notice Test faucet functionality
    function testBridgeableTokenFaucet() public {
        address newUser = address(0x1234);
        
        uint256 balanceBefore = bridgeableToken.balanceOf(newUser);
        assertEq(balanceBefore, 0);
        
        vm.prank(newUser);
        bridgeableToken.faucet();
        
        uint256 balanceAfter = bridgeableToken.balanceOf(newUser);
        assertEq(balanceAfter, 1000 * 10**bridgeableToken.decimals());
    }
    
    /// @notice Test gateway address is set correctly
    function testBridgeableTokenGateway() public view {
        assertEq(bridgeableToken.gateway(), address(gateway));
    }
    
    /// @notice Test token name and symbol
    function testBridgeableTokenMetadata() public view {
        assertEq(bridgeableToken.name(), "Bridgeable Token");
        assertEq(bridgeableToken.symbol(), "BRG");
    }
    
    /// @notice Test bridging transfers correct amount
    function testBridgeTransfersCorrectAmount() public {
        vm.startPrank(user);
        
        uint256 userBalanceBefore = bridgeableToken.balanceOf(user);
        
        bridgeableToken.approve(address(bridge), BRIDGE_AMOUNT);
        
        bridge.bridgeTokens(
            address(bridgeableToken),
            TOKEN_SYMBOL,
            BRIDGE_AMOUNT,
            recipient,
            destChain
        );
        
        uint256 userBalanceAfter = bridgeableToken.balanceOf(user);
        assertEq(userBalanceAfter, userBalanceBefore - BRIDGE_AMOUNT);
        
        vm.stopPrank();
    }
    
    /// @notice Test bridge with native value
    function testBridgeWithNativeValue() public {
        vm.startPrank(user);
        
        bridgeableToken.approve(address(bridge), BRIDGE_AMOUNT);
        
        uint256 nativeCost = 0.1 ether;
        uint256 gatewayBalanceBefore = address(gateway).balance;
        
        bridge.bridgeTokens{value: nativeCost}(
            address(bridgeableToken),
            TOKEN_SYMBOL,
            BRIDGE_AMOUNT,
            recipient,
            destChain
        );
        
        // Gateway should have received the native value
        assertEq(address(gateway).balance, gatewayBalanceBefore + nativeCost);
        
        vm.stopPrank();
    }
    
    /// @notice Test getERC20Address returns correct address
    function testGetERC20Address() public {
        bytes32 assetId = bridge.getAssetId(TOKEN_SYMBOL);
        
        // Set the ERC20 address in mock gateway
        gateway.setERC20(assetId, address(bridgeableToken));
        
        address returnedAddress = bridge.getERC20Address(assetId);
        assertEq(returnedAddress, address(bridgeableToken));
    }
    
    /// @notice Test multiple users can bridge
    function testMultipleUsersBridge() public {
        address user2 = address(0xDEAD);
        
        // Mint tokens to user2 via gateway
        vm.prank(address(gateway));
        bridgeableToken.mint(user2, INITIAL_BALANCE);
        vm.deal(user2, 10 ether);
        
        uint256 user1BalanceBefore = bridgeableToken.balanceOf(user);
        uint256 user2BalanceBefore = bridgeableToken.balanceOf(user2);
        
        // User 1 bridges
        vm.startPrank(user);
        bridgeableToken.approve(address(bridge), BRIDGE_AMOUNT);
        bridge.bridgeTokens(
            address(bridgeableToken),
            TOKEN_SYMBOL,
            BRIDGE_AMOUNT,
            recipient,
            destChain
        );
        vm.stopPrank();
        
        // User 2 bridges
        vm.startPrank(user2);
        bridgeableToken.approve(address(bridge), BRIDGE_AMOUNT);
        bridge.bridgeTokens(
            address(bridgeableToken),
            TOKEN_SYMBOL,
            BRIDGE_AMOUNT,
            recipient,
            destChain
        );
        vm.stopPrank();
        
        assertEq(bridgeableToken.balanceOf(user), user1BalanceBefore - BRIDGE_AMOUNT);
        assertEq(bridgeableToken.balanceOf(user2), user2BalanceBefore - BRIDGE_AMOUNT);
    }
}

/**
 * @title TokenBridgeForkTest
 * @notice Fork testing for TokenBridge contract using Optimism Sepolia network
 * @dev These tests verify the contract works with real deployed contracts on Optimism Sepolia
 */
contract IntegrationTest is Test {
    // Optimism Sepolia network addresses from deployments.toml
    address public constant TOKEN_GATEWAY = 0xFcDa26cA021d5535C3059547390E6cCd8De7acA6;
    address public constant USD_FEE_TOKEN = 0xA801da100bF16D07F668F4A49E1f71fc54D05177;
    address public constant TOKEN_FAUCET = 0x1794aB22388303ce9Cb798bE966eeEBeFe59C3a3;
    address public constant WETH = 0x4200000000000000000000000000000000000006;

    uint256 public constant DEFAULT_TIMEOUT = 86400; // 24 hours
    
    // The correct asset ID for WETH on Hyperbridge
    // This is NOT a simple keccak256 hash of "WETH" but a more complex identifier
    bytes32 public constant WETH_ASSET_ID = 0x9d73bf7de387b25f0aff297e40734d86f04fc00110134e7b3399c968c2d4af75;

    uint256 public chainId;

    bytes public destChain;
    
    ITokenGateway public tokenGateway;
    TokenBridge public bridge;
    
    address public user = address(0x1234);
    address public recipient = address(0x5678);
    
    string public constant OPTIMISM_SEPOLIA_RPC = "https://sepolia.optimism.io";
    
    function setUp() public {
        // Create fork of Optimism Sepolia
        vm.createSelectFork(OPTIMISM_SEPOLIA_RPC);

        chainId = vm.getChainId();
        
        destChain = StateMachine.evm(chainId);
        
        // Initialize the token gateway
        tokenGateway = ITokenGateway(TOKEN_GATEWAY);
        
        // Deploy our bridge contract with default relayer fee
        bridge = new TokenBridge(TOKEN_GATEWAY, USD_FEE_TOKEN);
        
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
    
    /// @notice Test that bridge contract is deployed correctly
    function testBridgeDeployment() public view {
        assertEq(address(bridge.tokenGateway()), TOKEN_GATEWAY);
        assertEq(bridge.feeToken(), USD_FEE_TOKEN);
    }
    
    /// @notice Test getAssetId calculation
    function testGetAssetIdOnFork() public view {
        bytes32 assetId = bridge.getAssetId("WETH");
        // Note: The actual WETH_ASSET_ID is different from simple keccak256
        // This test verifies the function works, not that it matches the on-chain ID
        assertTrue(assetId != bytes32(0));
    }
    
    /// @notice Test getERC20Address with real TokenGateway
    function testGetERC20AddressOnFork() public view {
        address wethAddress = bridge.getERC20Address(WETH_ASSET_ID);
        assertEq(wethAddress, WETH);
    }

    function testAssetId() public view {
        bytes32 assetId = bridge.getAssetId("DOT");
        console.logBytes32(assetId);
    }
}
