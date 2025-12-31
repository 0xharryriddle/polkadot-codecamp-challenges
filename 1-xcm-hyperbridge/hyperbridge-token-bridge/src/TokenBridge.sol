// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {ITokenGateway} from "@hyperbridge/core/contracts/apps/TokenGateway.sol";
import {
    StateMachine
} from "@hyperbridge/core/contracts/libraries/StateMachine.sol";

contract TokenBridge {
    ITokenGateway public immutable tokenGateway;

    constructor(address _tokenGateway) {
        tokenGateway = ITokenGateway(_tokenGateway);
    }

    /// @notice Bridge tokens to another chain
    /// @param token The token address to bridge
    /// @param amount The amount to bridge
    /// @param recipient The recipient address on the destination chain
    /// @param destChain The destination chain identifier
    function bridgeTokens(
        address token,
        uint256 amount,
        address recipient,
        bytes memory destChain
    ) external payable {
        // Approve the gateway to spend tokens
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        IERC20(token).approve(address(tokenGateway), amount);

        // Initiate the cross-chain transfer
        // Implementation depends on TokenGateway interface
    }
}
