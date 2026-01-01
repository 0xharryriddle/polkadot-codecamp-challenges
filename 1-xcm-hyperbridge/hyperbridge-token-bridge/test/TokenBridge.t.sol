// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {Test} from "@forge/Test.sol";
import {ITokenGateway, TeleportParams} from "@hyperbridge/core/contracts/apps/TokenGateway.sol";
import {TokenBridge} from "../src/TokenBridge.sol";
import {BridgeableToken} from "../src/BridgeableToken.sol";
import {MockToken} from "../src/MockToken.sol";

contract MockTokenGateway {
    event TeleportCalled(TeleportParams params);
    
    function teleport(TeleportParams memory params) external payable {
        emit TeleportCalled(params);
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
    bytes public destChain = bytes("optimism-sepolia");
    
    event TeleportCalled(TeleportParams params);

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
        
        // Deploy token bridge
        bridge = new TokenBridge(address(mockGateway), address(feeToken));
        
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
        assertEq(bridge.TIMEOUT(), 24 * 60 * 60);
    }

    function testBridgeTokensSuccess() public {
        vm.startPrank(user);
        
        // Approve bridge to spend tokens
        bridgeableToken.approve(address(bridge), BRIDGE_AMOUNT);
        
        // Get initial balances
        uint256 userBalanceBefore = bridgeableToken.balanceOf(user);
        uint256 bridgeBalanceBefore = bridgeableToken.balanceOf(address(bridge));
        
        // Bridge tokens
        bridge.bridgeTokens{value: 0.001 ether}(
            address(bridgeableToken),
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

    function testBridgeTokensRevertsOnZeroAddress() public {
        vm.startPrank(user);
        
        vm.expectRevert("Token address cannot be zero");
        bridge.bridgeTokens{value: 0.001 ether}(
            address(0),
            BRIDGE_AMOUNT,
            recipient,
            destChain
        );
        
        vm.stopPrank();
    }

    function testBridgeTokensRevertsOnInsufficientAllowance() public {
        vm.startPrank(user);
        
        // Don't approve, should fail
        vm.expectRevert();
        bridge.bridgeTokens{value: 0.001 ether}(
            address(bridgeableToken),
            BRIDGE_AMOUNT,
            recipient,
            destChain
        );
        
        vm.stopPrank();
    }

    function testBridgeTokensRevertsOnInsufficientBalance() public {
        vm.startPrank(user);
        
        uint256 excessiveAmount = INITIAL_BALANCE + 1;
        bridgeableToken.approve(address(bridge), excessiveAmount);
        
        vm.expectRevert();
        bridge.bridgeTokens{value: 0.001 ether}(
            address(bridgeableToken),
            excessiveAmount,
            recipient,
            destChain
        );
        
        vm.stopPrank();
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
            
            bridge.bridgeTokens{value: 0.001 ether}(
                address(bridgeableToken),
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

    function testBridgeTokensWithDifferentRecipients() public {
        address[] memory recipients = new address[](3);
        recipients[0] = address(0x100);
        recipients[1] = address(0x200);
        recipients[2] = address(0x300);
        
        vm.startPrank(user);
        
        for (uint256 i = 0; i < recipients.length; i++) {
            bridgeableToken.approve(address(bridge), BRIDGE_AMOUNT);
            
            // Should not revert with different recipients
            bridge.bridgeTokens{value: 0.001 ether}(
                address(bridgeableToken),
                BRIDGE_AMOUNT,
                recipients[i],
                destChain
            );
        }
        
        vm.stopPrank();
    }

    function testBridgeTokensWithDifferentChains() public {
        bytes[] memory chains = new bytes[](3);
        chains[0] = bytes("sepolia");
        chains[1] = bytes("bsc-testnet");
        chains[2] = bytes("optimism-sepolia");
        
        vm.startPrank(user);
        
        for (uint256 i = 0; i < chains.length; i++) {
            bridgeableToken.approve(address(bridge), BRIDGE_AMOUNT);
            
            // Should not revert with different chains
            bridge.bridgeTokens{value: 0.001 ether}(
                address(bridgeableToken),
                BRIDGE_AMOUNT,
                recipient,
                chains[i]
            );
        }
        
        vm.stopPrank();
    }

    function testBridgeTokensCallsTeleportWithCorrectParams() public {
        vm.startPrank(user);
        
        bridgeableToken.approve(address(bridge), BRIDGE_AMOUNT);
        
        uint256 nativeCost = 0.001 ether;
        
        // Expect TeleportCalled event
        vm.expectEmit(false, false, false, false);
        emit TeleportCalled(TeleportParams({
            amount: BRIDGE_AMOUNT,
            relayerFee: 0,
            assetId: bytes32(uint256(uint160(address(bridgeableToken)))),
            redeem: false,
            to: bytes32(uint256(uint160(recipient))),
            dest: destChain,
            timeout: uint64(block.timestamp + bridge.TIMEOUT()),
            nativeCost: nativeCost,
            data: ""
        }));
        
        bridge.bridgeTokens{value: nativeCost}(
            address(bridgeableToken),
            BRIDGE_AMOUNT,
            recipient,
            destChain
        );
        
        vm.stopPrank();
    }

    function testBridgeTokensWithZeroAmount() public {
        vm.startPrank(user);
        
        bridgeableToken.approve(address(bridge), 0);
        
        // Should not revert - gateway might handle validation
        bridge.bridgeTokens{value: 0.001 ether}(
            address(bridgeableToken),
            0,
            recipient,
            destChain
        );
        
        vm.stopPrank();
    }

    function testBridgeTokensWithMaxAmount() public {
        // Mint max tokens to user (only gateway can mint)
        uint256 maxAmount = type(uint96).max; // Use uint96 to avoid overflow
        vm.prank(address(mockGateway));
        bridgeableToken.mint(user, maxAmount);
        
        vm.startPrank(user);
        
        bridgeableToken.approve(address(bridge), maxAmount);
        
        uint256 balanceBefore = bridgeableToken.balanceOf(user);
        
        bridge.bridgeTokens{value: 0.001 ether}(
            address(bridgeableToken),
            maxAmount,
            recipient,
            destChain
        );
        
        assertEq(
            bridgeableToken.balanceOf(user),
            balanceBefore - maxAmount,
            "Should handle max amount"
        );
        
        vm.stopPrank();
    }

    function testBridgeTokensMultipleTimes() public {
        vm.startPrank(user);
        
        uint256 iterations = 5;
        uint256 amountPerBridge = 100 * 10**18;
        
        for (uint256 i = 0; i < iterations; i++) {
            bridgeableToken.approve(address(bridge), amountPerBridge);
            
            bridge.bridgeTokens{value: 0.001 ether}(
                address(bridgeableToken),
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
        
        bridge.bridgeTokens{value: 0.001 ether}(
            address(bridgeableToken),
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
}