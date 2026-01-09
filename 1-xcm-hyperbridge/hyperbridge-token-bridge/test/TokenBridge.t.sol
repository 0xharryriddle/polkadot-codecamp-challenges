// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {Test, Vm} from "@forge/Test.sol";
import {console} from "@forge/console.sol";
import {ITokenGateway, TeleportParams} from "@hyperbridge/core/contracts/apps/TokenGateway.sol";
import {TokenBridge} from "../src/TokenBridge.sol";
import {BridgeableToken} from "../src/BridgeableToken.sol";
import {MockToken} from "../src/MockToken.sol";
import {StateMachine} from "@hyperbridge/core/contracts/libraries/StateMachine.sol";

contract MockTokenGateway {
    event TeleportCalled(address sender, uint256 amount, uint256 nativeCost);
    
    function teleport(TeleportParams calldata params) external payable {
        emit TeleportCalled(msg.sender, params.amount, params.nativeCost);
    }
    
    function erc20(bytes32) external pure returns (address) {
        return address(0);
    }
}

contract TokenBridgeTest is Test {
    TokenBridge public bridge;
    MockTokenGateway public mockGateway;
    BridgeableToken public bridgeableToken;
    MockToken public feeToken;
    
    address public owner = address(this);
    address public user = address(0x1);
    address public recipient = address(0x2);
    
    uint256 public constant INITIAL_BALANCE = 10000 * 10**18;
    uint256 public constant BRIDGE_AMOUNT = 1000 * 10**18;
    uint256 public constant DEFAULT_RELAYER_FEE = 0.001 ether;
    bytes public destChain;
    string public constant TOKEN_SYMBOL = "BTK";
    
    event TokensBridged(
        address indexed token,
        bytes32 indexed assetId,
        uint256 amount,
        address indexed sender,
        bytes32 recipient,
        bytes destination,
        bytes32 commitment
    );

    function setUp() public {
        // Deploy mock gateway
        mockGateway = new MockTokenGateway();
        
        // Deploy fee token (can be minted by owner)
        feeToken = new MockToken("FeeToken", "FEE");
        
        // Deploy bridgeable token (can only be minted by gateway)
        bridgeableToken = new BridgeableToken(
            "BridgeableToken",
            "BTK",
            address(mockGateway)
        );
        
        // Deploy token bridge with default relayer fee
        bridge = new TokenBridge(address(mockGateway), address(feeToken));
        
        // Mint fee tokens to user (owner can mint MockToken)
        feeToken.mint(user, INITIAL_BALANCE);
        
        // Mint bridgeable tokens to user (only gateway can mint)
        vm.prank(address(mockGateway));
        bridgeableToken.mint(user, INITIAL_BALANCE);
        
        // Give user some ETH for gas
        vm.deal(user, 10 ether);

        uint256 chainId = 11155111; // Sepolia

        destChain = StateMachine.evm(chainId);
    }

    // ============ Constructor Tests ============

    function testConstructorSetsTokenGateway() public view {
        assertEq(address(bridge.tokenGateway()), address(mockGateway));
    }

    function testConstructorSetsFeeToken() public view {
        assertEq(bridge.feeToken(), address(feeToken));
    }

    // ============ getAssetId Tests ============

    function testGetAssetIdReturnsCorrectHash() public view {
        bytes32 expectedAssetId = keccak256(abi.encodePacked(TOKEN_SYMBOL));
        bytes32 actualAssetId = bridge.getAssetId(TOKEN_SYMBOL);
        assertEq(actualAssetId, expectedAssetId);
    }

    function testGetAssetIdDifferentSymbols() public view {
        bytes32 assetIdBTK = bridge.getAssetId("BTK");
        bytes32 assetIdETH = bridge.getAssetId("ETH");
        bytes32 assetIdUSDC = bridge.getAssetId("USDC");
        
        // All should be different
        assertTrue(assetIdBTK != assetIdETH);
        assertTrue(assetIdBTK != assetIdUSDC);
        assertTrue(assetIdETH != assetIdUSDC);
    }

    function testGetAssetIdConsistency() public view {
        // Same symbol should always return same hash
        bytes32 assetId1 = bridge.getAssetId("TEST");
        bytes32 assetId2 = bridge.getAssetId("TEST");
        assertEq(assetId1, assetId2);
    }

    // ============ bridgeTokens Tests ============

    function testBridgeTokensCallsGateway() public {
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

    function testBridgeTokensTransfersTokens() public {
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
        
        // User should have less tokens
        assertEq(userBalanceAfter, userBalanceBefore - BRIDGE_AMOUNT);
        
        vm.stopPrank();
    }

    function testBridgeTokensWithValue() public {
        vm.startPrank(user);
        
        bridgeableToken.approve(address(bridge), BRIDGE_AMOUNT);
        
        uint256 nativeCost = 0.01 ether;
        uint256 gatewayBalanceBefore = address(mockGateway).balance;
        
        bridge.bridgeTokens{value: nativeCost}(
            address(bridgeableToken),
            TOKEN_SYMBOL,
            BRIDGE_AMOUNT,
            recipient,
            destChain
        );
        
        // Gateway should have received the native value
        assertEq(address(mockGateway).balance, gatewayBalanceBefore + nativeCost);
        
        vm.stopPrank();
    }

    function testBridgeTokensRevertsWithoutApproval() public {
        vm.startPrank(user);
        
        // Should revert because no approval was given
        vm.expectRevert();
        bridge.bridgeTokens(
            address(bridgeableToken),
            TOKEN_SYMBOL,
            BRIDGE_AMOUNT,
            recipient,
            destChain
        );
        
        vm.stopPrank();
    }

    function testBridgeTokensRevertsWithInsufficientBalance() public {
        address poorUser = address(0x999);
        vm.deal(poorUser, 1 ether);
        
        vm.startPrank(poorUser);
        
        // Approve but no balance
        bridgeableToken.approve(address(bridge), BRIDGE_AMOUNT);
        
        vm.expectRevert();
        bridge.bridgeTokens(
            address(bridgeableToken),
            TOKEN_SYMBOL,
            BRIDGE_AMOUNT,
            recipient,
            destChain
        );
        
        vm.stopPrank();
    }

    // ============ Fuzz Tests ============

    function testFuzzBridgeAmount(uint256 amount) public {
        // Bound the amount to reasonable values (min 1, max user balance)
        uint256 userBalance = bridgeableToken.balanceOf(user);
        vm.assume(amount > 0 && amount <= userBalance);
        
        vm.startPrank(user);
        
        bridgeableToken.approve(address(bridge), amount);
        
        uint256 userBalanceBefore = bridgeableToken.balanceOf(user);
        
        bridge.bridgeTokens(
            address(bridgeableToken),
            TOKEN_SYMBOL,
            amount,
            recipient,
            destChain
        );
        
        uint256 userBalanceAfter = bridgeableToken.balanceOf(user);
        assertEq(userBalanceAfter, userBalanceBefore - amount);
        
        vm.stopPrank();
    }

    function testFuzzGetAssetId(string memory symbol) public view {
        bytes32 expectedAssetId = keccak256(abi.encodePacked(symbol));
        bytes32 actualAssetId = bridge.getAssetId(symbol);
        assertEq(actualAssetId, expectedAssetId);
    }
}
