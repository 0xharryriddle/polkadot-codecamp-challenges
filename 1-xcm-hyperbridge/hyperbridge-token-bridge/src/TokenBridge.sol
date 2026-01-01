// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {ITokenGateway, TeleportParams} from "@hyperbridge/core/contracts/apps/TokenGateway.sol";
import {StateMachine} from "@hyperbridge/core/contracts/libraries/StateMachine.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TokenBridge {
    ITokenGateway public immutable tokenGateway;
    address public immutable feeToken;

    constructor(address _tokenGateway, address _feeToken) {
        tokenGateway = ITokenGateway(_tokenGateway);
        feeToken = _feeToken;
    }

    /// @notice Bridge tokens to another chain
    /// @param token The token address to bridge
    /// @param symbol The token symbol to bridge
    /// @param amount The amount to bridge
    /// @param recipient The recipient address on the destination chain
    /// @param destChain The destination chain identifier
    function bridgeTokens(
        address token,
        string memory symbol,
        uint256 amount,
        address recipient,
        bytes memory destChain
    ) external payable {
        // Approve the gateway to spend tokens
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        IERC20(token).approve(address(tokenGateway), amount);
        IERC20(feeToken).approve(address(tokenGateway), type(uint256).max);

        // Initiate the cross-chain transfer
        
        
        // Implementation depends on TokenGateway interface
        TeleportParams memory bridgeParams = TeleportParams({
            amount: amount,
            relayerFee: 0, // Assuming no relayer fee for simplicity
            assetId: bytes32(uint256(uint160(token))),
            redeem: false,
            to: bytes32(uint256(uint160(recipient))),
            dest: destChain,
            timeout: uint64(block.timestamp + 1 hours),
            nativeCost: msg.value,
            data: ""
        });
        tokenGateway.teleport(bridgeParams);
    }
}
