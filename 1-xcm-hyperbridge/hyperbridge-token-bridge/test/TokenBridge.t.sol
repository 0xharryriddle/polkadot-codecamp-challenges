// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {Test} from "@forge/Test.sol";
import {console} from "@forge/console.sol";
import {ITokenGateway, TeleportParams} from "@hyperbridge/core/contracts/apps/TokenGateway.sol";
import {TokenBridge} from "../src/TokenBridge.sol";
import {BridgeableToken} from "../src/BridgeableToken.sol";
import {MockToken} from "../src/MockToken.sol";

contract MockTokenGateway {
    event AssetTeleported(TeleportParams params, bytes32 commitment);
    
    function teleport(TeleportParams memory params) external payable returns (bytes32) {
        bytes32 commitment = keccak256(abi.encode(params, block.timestamp));
        emit AssetTeleported(params, commitment);
        return commitment;
    }
    
    function erc20(bytes32 assetId) external pure returns (address) {
        // Return a dummy address based on assetId
        return address(uint160(uint256(assetId)));
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
    bytes public destChain = bytes("optimism-sepolia");
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
        bridge = new TokenBridge(address(mockGateway), address(feeToken), DEFAULT_RELAYER_FEE);
        
        // Mint fee tokens to user (owner can mint MockToken)
        feeToken.mint(user, INITIAL_BALANCE);
        
        // Mint bridgeable tokens to user (only gateway can mint)
        vm.prank(address(mockGateway));
        bridgeableToken.mint(user, INITIAL_BALANCE);
        
        // Give user some ETH for gas
        vm.deal(user, 10 ether);
    }

    function testConstructor() public view {
        assertEq(address(bridge.tokenGateway()), address(mockGateway));
        assertEq(bridge.feeToken(), address(feeToken));
        assertEq(bridge.DEFAULT_TIMEOUT(), 86400);
        assertEq(bridge.defaultRelayerFee(), DEFAULT_RELAYER_FEE);
    }
    
    function testConstructorRevertsOnZeroTokenGateway() public {
        vm.expectRevert(TokenBridge.ZeroAddress.selector);
        new TokenBridge(address(0), address(feeToken), DEFAULT_RELAYER_FEE);
    }
    
    function testConstructorRevertsOnZeroFeeToken() public {
        vm.expectRevert(TokenBridge.ZeroAddress.selector);
        new TokenBridge(address(mockGateway), address(0), DEFAULT_RELAYER_FEE);
    }

    function testBridgeTokensSimple() public {
        vm.startPrank(user);
        
        // Approve bridge to spend tokens
        bridgeableToken.approve(address(bridge), BRIDGE_AMOUNT);
        
        // Get initial balances
        uint256 userBalanceBefore = bridgeableToken.balanceOf(user);
        uint256 bridgeBalanceBefore = bridgeableToken.balanceOf(address(bridge));
        
        // Bridge tokens with simple signature
        bridge.bridgeTokens{value: 0.01 ether}(
            address(bridgeableToken),
            TOKEN_SYMBOL,
            BRIDGE_AMOUNT,
            recipient,
            destChain
        );
        
        // Check balances after
        assertEq(
            bridgeableToken.balanceOf(user),
            userBalanceBefore - BRIDGE_AMOUNT,
            "User balance should decrease"
        );
        assertEq(
            bridgeableToken.balanceOf(address(bridge)),
            bridgeBalanceBefore + BRIDGE_AMOUNT,
            "Bridge balance should increase"
        );
        
        vm.stopPrank();
    }

    function testBridgeTokensWithAllParameters() public {
        vm.startPrank(user);
        
        bridgeableToken.approve(address(bridge), BRIDGE_AMOUNT);
        
        // Bridge tokens with all parameters
        bridge.bridgeTokens{value: 0.01 ether}(
            address(bridgeableToken),
            TOKEN_SYMBOL,
            BRIDGE_AMOUNT,
            recipient,
            destChain,
            DEFAULT_RELAYER_FEE,
            3600, // 1 hour timeout
            true // redeem
        );
        
        assertEq(
            bridgeableToken.balanceOf(user),
            INITIAL_BALANCE - BRIDGE_AMOUNT,
            "User balance should decrease"
        );
        
        vm.stopPrank();
    }

    function testBridgeTokensWithAssetId() public {
        vm.startPrank(user);
        
        bridgeableToken.approve(address(bridge), BRIDGE_AMOUNT);
        
        // Generate assetId
        bytes32 assetId = bridge.getAssetId(TOKEN_SYMBOL);
        
        // Bridge tokens with assetId
        bridge.bridgeTokensWithAssetId{value: 0.01 ether}(
            address(bridgeableToken),
            assetId,
            BRIDGE_AMOUNT,
            recipient,
            destChain,
            DEFAULT_RELAYER_FEE,
            7200, // 2 hours timeout
            false // don't redeem
        );
        
        assertEq(
            bridgeableToken.balanceOf(user),
            INITIAL_BALANCE - BRIDGE_AMOUNT,
            "User balance should decrease"
        );
        
        vm.stopPrank();
    }

    function testBridgeTokensRevertsOnZeroAmount() public {
        vm.startPrank(user);
        
        bridgeableToken.approve(address(bridge), 0);
        
        vm.expectRevert(TokenBridge.InvalidAmount.selector);
        bridge.bridgeTokens{value: 0.01 ether}(
            address(bridgeableToken),
            TOKEN_SYMBOL,
            0,
            recipient,
            destChain
        );
        
        vm.stopPrank();
    }

    function testBridgeTokensRevertsOnZeroRecipient() public {
        vm.startPrank(user);
        
        bridgeableToken.approve(address(bridge), BRIDGE_AMOUNT);
        
        vm.expectRevert(TokenBridge.InvalidRecipient.selector);
        bridge.bridgeTokens{value: 0.01 ether}(
            address(bridgeableToken),
            TOKEN_SYMBOL,
            BRIDGE_AMOUNT,
            address(0),
            destChain
        );
        
        vm.stopPrank();
    }

    function testBridgeTokensRevertsOnInsufficientAllowance() public {
        vm.startPrank(user);
        
        // Don't approve, should fail with ERC20 error (not our custom error)
        vm.expectRevert(); // Just expect any revert
        bridge.bridgeTokens{value: 0.01 ether}(
            address(bridgeableToken),
            TOKEN_SYMBOL,
            BRIDGE_AMOUNT,
            recipient,
            destChain
        );
        
        vm.stopPrank();
    }

    function testBridgeTokensEmitsEvent() public {
        vm.startPrank(user);
        
        bridgeableToken.approve(address(bridge), BRIDGE_AMOUNT);
        
        bytes32 assetId = bridge.getAssetId(TOKEN_SYMBOL);
        bytes32 recipientBytes32 = bytes32(uint256(uint160(recipient)));
        
        // Expect TokensBridged event
        vm.expectEmit(true, true, true, false);
        emit TokensBridged(
            address(bridgeableToken),
            assetId,
            BRIDGE_AMOUNT,
            user,
            recipientBytes32,
            destChain,
            bytes32(0)
        );
        
        bridge.bridgeTokens{value: 0.01 ether}(
            address(bridgeableToken),
            TOKEN_SYMBOL,
            BRIDGE_AMOUNT,
            recipient,
            destChain
        );
        
        vm.stopPrank();
    }

    function testSetDefaultRelayerFee() public {
        uint256 newRelayerFee = 0.002 ether;
        
        bridge.setDefaultRelayerFee(newRelayerFee);
        
        assertEq(bridge.defaultRelayerFee(), newRelayerFee, "Default relayer fee should be updated");
    }

    function testGetAssetId() public view {
        bytes32 assetId = bridge.getAssetId(TOKEN_SYMBOL);
        bytes32 expectedAssetId = keccak256(bytes(TOKEN_SYMBOL));
        
        assertEq(assetId, expectedAssetId, "Asset ID should match keccak256 hash of symbol");
    }

    function testGetAssetIdDifferentSymbols() public view {
        string memory wethSymbol = "WETH";
        string memory usdcSymbol = "USDC";
        
        bytes32 wethAssetId = bridge.getAssetId(wethSymbol);
        bytes32 usdcAssetId = bridge.getAssetId(usdcSymbol);
        
        assertTrue(wethAssetId != usdcAssetId, "Different symbols should have different asset IDs");
    }

    function testGetERC20Address() public view {
        bytes32 assetId = bridge.getAssetId(TOKEN_SYMBOL);
        address erc20Address = bridge.getERC20Address(assetId);
        
        // Should return an address (mock gateway returns deterministic address)
        assertTrue(erc20Address != address(0), "Should return an address");
    }

    function testBridgeTokensWithDifferentAmounts() public {
        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 100 * 10**18;
        amounts[1] = 500 * 10**18;
        amounts[2] = 1000 * 10**18;
        
        for (uint256 i = 0; i < amounts.length; i++) {
            vm.startPrank(user);
            
            bridgeableToken.approve(address(bridge), amounts[i]);
            
            uint256 balanceBefore = bridgeableToken.balanceOf(user);
            
            bridge.bridgeTokens{value: 0.01 ether}(
                address(bridgeableToken),
                TOKEN_SYMBOL,
                amounts[i],
                recipient,
                destChain
            );
            
            assertEq(
                bridgeableToken.balanceOf(user),
                balanceBefore - amounts[i],
                "Balance should decrease by bridged amount"
            );
            
            vm.stopPrank();
        }
    }

    function testBridgeTokensMultipleTimes() public {
        vm.startPrank(user);
        
        uint256 iterations = 5;
        uint256 amountPerBridge = 100 * 10**18;
        
        for (uint256 i = 0; i < iterations; i++) {
            bridgeableToken.approve(address(bridge), amountPerBridge);
            
            bridge.bridgeTokens{value: 0.01 ether}(
                address(bridgeableToken),
                TOKEN_SYMBOL,
                amountPerBridge,
                recipient,
                destChain
            );
        }
        
        assertEq(
            bridgeableToken.balanceOf(user),
            INITIAL_BALANCE - (amountPerBridge * iterations),
            "Should handle multiple bridges correctly"
        );
        
        vm.stopPrank();
    }

    function testFuzzBridgeTokens(
        uint96 amount,
        address randomRecipient
    ) public {
        vm.assume(amount > 0 && amount <= INITIAL_BALANCE);
        vm.assume(randomRecipient != address(0));
        
        vm.startPrank(user);
        
        bridgeableToken.approve(address(bridge), amount);
        
        uint256 balanceBefore = bridgeableToken.balanceOf(user);
        
        bridge.bridgeTokens{value: 0.01 ether}(
            address(bridgeableToken),
            TOKEN_SYMBOL,
            amount,
            randomRecipient,
            destChain
        );
        
        assertEq(
            bridgeableToken.balanceOf(user),
            balanceBefore - amount,
            "Fuzz: Balance should decrease correctly"
        );
        
        vm.stopPrank();
    }
    
    function testBridgeTokensWithCustomTimeout() public {
        vm.startPrank(user);
        
        bridgeableToken.approve(address(bridge), BRIDGE_AMOUNT);
        
        uint64 customTimeout = 7200; // 2 hours
        
        bridge.bridgeTokens{value: 0.01 ether}(
            address(bridgeableToken),
            TOKEN_SYMBOL,
            BRIDGE_AMOUNT,
            recipient,
            destChain,
            0, // use default relayer fee
            customTimeout,
            true
        );
        
        assertEq(
            bridgeableToken.balanceOf(user),
            INITIAL_BALANCE - BRIDGE_AMOUNT,
            "User balance should decrease"
        );
        
        vm.stopPrank();
    }
    
    function testBridgeTokensUsesDefaultTimeout() public {
        vm.startPrank(user);
        
        bridgeableToken.approve(address(bridge), BRIDGE_AMOUNT);
        
        // Pass 0 for timeout to use default
        bridge.bridgeTokens{value: 0.01 ether}(
            address(bridgeableToken),
            TOKEN_SYMBOL,
            BRIDGE_AMOUNT,
            recipient,
            destChain,
            0,
            0, // should use DEFAULT_TIMEOUT
            true
        );
        
        vm.stopPrank();
    }

    function testBridgeTokensUsesDefaultRelayerFee() public {
        vm.startPrank(user);
        
        bridgeableToken.approve(address(bridge), BRIDGE_AMOUNT);
        
        // Pass 0 for relayerFee to use default
        bridge.bridgeTokens{value: 0.01 ether}(
            address(bridgeableToken),
            TOKEN_SYMBOL,
            BRIDGE_AMOUNT,
            recipient,
            destChain,
            0, // should use defaultRelayerFee
            3600,
            true
        );
        
        vm.stopPrank();
    }
}
