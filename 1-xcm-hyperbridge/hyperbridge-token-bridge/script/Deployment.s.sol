// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {console} from "@forge/console.sol";
import {BaseScript} from "./Base.s.sol";
import {BridgeableToken} from "../src/BridgeableToken.sol";
import {TokenBridge} from "../src/TokenBridge.sol";
import {MockToken} from "../src/MockToken.sol";

contract DeploymentScript is BaseScript {
    function run() external broadcast returns (BridgeableToken testToken, MockToken feeToken, TokenBridge bridge) {
        // Get the deployed TokenGateway address
        address tokenGatewayAddress = 0xFcDa26cA021d5535C3059547390E6cCd8De7acA6;

        // Get the chainId of the current chain
        uint256 chainId = block.chainid;

        string memory testTokenName = string(abi.encodePacked("BridgeableToken on Chain ", abi.encodePacked(chainId)));
        // Deploy a BridgeableToken token on a specified chain
        testToken = new BridgeableToken(testTokenName, "BTK", tokenGatewayAddress);
        
        string memory feeTokenName = string(abi.encodePacked("FeeToken on Chain ", abi.encodePacked(chainId)));
        // Deploy a ERC20 token to be used as fee token
        feeToken = new MockToken(feeTokenName, "FEE");
        
        // Deploy the TokenBridge contract
        bridge = new TokenBridge(tokenGatewayAddress, address(feeToken));
    }
}