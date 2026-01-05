// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {ITokenGateway, TeleportParams} from "@hyperbridge/core/contracts/apps/TokenGateway.sol";
import {StateMachine} from "@hyperbridge/core/contracts/libraries/StateMachine.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title TokenBridge
 * @notice A contract that enables cross-chain token transfers using Hyperbridge's TokenGateway
 * @dev This contract wraps the TokenGateway interface to provide a simpler API for bridging tokens
 */
contract TokenBridge {
    ITokenGateway public immutable tokenGateway;
    address public immutable feeToken;

    /// @notice Default timeout for cross-chain transfers (24 hours)
    uint64 public constant DEFAULT_TIMEOUT = 86400;

    /// @notice Default relayer fee (can be overridden)
    uint256 public defaultRelayerFee;

    /// @notice Event emitted when tokens are bridged
    event TokensBridged(
        address indexed token,
        bytes32 indexed assetId,
        uint256 amount,
        address indexed sender,
        bytes32 recipient,
        bytes destination,
        bytes32 commitment
    );

    /// @notice Error thrown when token transfer fails
    error TokenTransferFailed();

    /// @notice Error thrown when invalid amount is provided
    error InvalidAmount();

    /// @notice Error thrown when invalid recipient is provided
    error InvalidRecipient();

    /// @notice Error thrown when zero address is provided
    error ZeroAddress();

    constructor(address _tokenGateway, address _feeToken, uint256 _defaultRelayerFee) {
        if (_tokenGateway == address(0)) revert ZeroAddress();
        if (_feeToken == address(0)) revert ZeroAddress();

        tokenGateway = ITokenGateway(_tokenGateway);
        feeToken = _feeToken;
        defaultRelayerFee = _defaultRelayerFee;
    }

    /**
     * @notice Internal function to handle the actual bridging logic
     * @param token The token address to bridge
     * @param assetId The asset identifier
     * @param amount The amount to bridge
     * @param recipient The recipient address on the destination chain
     * @param destChain The destination chain identifier
     * @param relayerFee The fee to pay the relayer
     * @param timeout The timeout in seconds for the request
     * @param redeem Whether to redeem ERC20 on the destination
     * @param feeAmount The amount of fee tokens to transfer from user (0 to use estimation)
     */
    function _bridgeTokens(
        address token,
        bytes32 assetId,
        uint256 amount,
        address recipient,
        bytes memory destChain,
        uint256 relayerFee,
        uint64 timeout,
        bool redeem,
        uint256 feeAmount
    ) internal {
        if (amount == 0) revert InvalidAmount();
        if (recipient == address(0)) revert InvalidRecipient();

        // Transfer tokens from user to this contract
        bool success = IERC20(token).transferFrom(msg.sender, address(this), amount);
        if (!success) revert TokenTransferFailed();

        // Approve tokenGateway to spend tokens
        IERC20(token).approve(address(tokenGateway), amount);

        // Handle fee token approval and transfer
        // The TokenGateway will pull fee tokens from this contract, so we need to have them
        if (feeToken != token) {
            // Calculate or use provided fee amount
            // Fee calculation: base_fee + (message_size * per_byte_fee) + relayer_incentive
            // For cross-chain txs: ~0.3-0.5 USD for simple transfers, more for complex operations
            uint256 finalFeeAmount = feeAmount;
            if (finalFeeAmount == 0) {
                // Estimate based on message size and typical fees
                // TeleportParams struct size: ~200-300 bytes
                // Per-byte fee on most chains: ~0.003 USD (0.003e18)
                // Total: ~0.6-1 USD, we use 1 USD as safe estimate
                finalFeeAmount = estimateFee(destChain, amount);
            }
            
            // Transfer fee tokens from user to this contract
            // User must have approved this bridge contract to spend their fee tokens
            IERC20(feeToken).transferFrom(msg.sender, address(this), finalFeeAmount);
            
            // Approve max amount for fee token to avoid repeated approvals
            IERC20(feeToken).approve(address(tokenGateway), type(uint256).max);
        }

        bytes32 recipientBytes32 = bytes32(uint256(uint160(recipient)));

        uint256 finalRelayerFee = relayerFee == 0 ? defaultRelayerFee : relayerFee;

        uint64 finalTimeout = timeout == 0 ? DEFAULT_TIMEOUT : timeout;

        TeleportParams memory teleportParams = TeleportParams({
            amount: amount,
            relayerFee: finalRelayerFee,
            assetId: assetId,
            redeem: redeem,
            to: recipientBytes32,
            dest: destChain,
            timeout: finalTimeout,
            nativeCost: msg.value,
            data: ""
        });
        tokenGateway.teleport{value: msg.value}(teleportParams);

        emit TokensBridged(
            token,
            assetId,
            amount,
            msg.sender,
            recipientBytes32,
            destChain,
            bytes32(0)
        );
    }

    /**
     * @notice Bridge tokens to another chain
     * @param token The token address to bridge
     * @param symbol The token symbol to bridge (used to generate assetId)
     * @param amount The amount to bridge
     * @param recipient The recipient address on the destination chain
     * @param destChain The destination chain identifier (e.g., StateMachine.evm(11155111) for Sepolia)
     * @param relayerFee The fee to pay the relayer (0 to use default)
     * @param timeout The timeout in seconds for the request (0 to use default)
     * @param redeem Whether to redeem ERC20 on the destination (true) or mint hyper-fungible token (false)
     */
    function bridgeTokens(
        address token,
        string memory symbol,
        uint256 amount,
        address recipient,
        bytes memory destChain,
        uint256 relayerFee,
        uint64 timeout,
        bool redeem
    ) external payable {
        // Generate assetId from symbol (keccak256 hash)
        bytes32 assetId = keccak256(bytes(symbol));
        _bridgeTokens(token, assetId, amount, recipient, destChain, relayerFee, timeout, redeem, 0);
    }
    
    /**
     * @notice Bridge tokens to another chain with explicit fee amount
     * @param token The token address to bridge
     * @param symbol The token symbol to bridge (used to generate assetId)
     * @param amount The amount to bridge
     * @param recipient The recipient address on the destination chain
     * @param destChain The destination chain identifier (e.g., StateMachine.evm(11155111) for Sepolia)
     * @param relayerFee The fee to pay the relayer (0 to use default)
     * @param timeout The timeout in seconds for the request (0 to use default)
     * @param redeem Whether to redeem ERC20 on the destination (true) or mint hyper-fungible token (false)
     * @param feeAmount The amount of fee tokens to transfer from user (0 for automatic estimation)
     */
    function bridgeTokens(
        address token,
        string memory symbol,
        uint256 amount,
        address recipient,
        bytes memory destChain,
        uint256 relayerFee,
        uint64 timeout,
        bool redeem,
        uint256 feeAmount
    ) external payable {
        // Generate assetId from symbol (keccak256 hash)
        bytes32 assetId = keccak256(bytes(symbol));
        _bridgeTokens(token, assetId, amount, recipient, destChain, relayerFee, timeout, redeem, feeAmount);
    }

    /**
     * @notice Convenience function with default parameters
     * @param token The token address to bridge
     * @param symbol The token symbol to bridge
     * @param amount The amount to bridge
     * @param recipient The recipient address on the destination chain
     * @param destChain The destination chain identifier
     */
    function bridgeTokens(
        address token,
        string memory symbol,
        uint256 amount,
        address recipient,
        bytes memory destChain
    ) external payable {
        // Generate assetId from symbol (keccak256 hash)
        bytes32 assetId = keccak256(bytes(symbol));
        _bridgeTokens(token, assetId, amount, recipient, destChain, 0, 0, true, 0);
    }

    /**
     * @notice Bridge tokens using a pre-computed assetId
     * @param token The token address to bridge
     * @param assetId The pre-computed asset identifier
     * @param amount The amount to bridge
     * @param recipient The recipient address on the destination chain
     * @param destChain The destination chain identifier
     * @param relayerFee The fee to pay the relayer (0 to use default)
     * @param timeout The timeout in seconds for the request (0 to use default)
     * @param redeem Whether to redeem ERC20 on the destination (true) or mint hyper-fungible token (false)
     */
    function bridgeTokensWithAssetId(
        address token,
        bytes32 assetId,
        uint256 amount,
        address recipient,
        bytes memory destChain,
        uint256 relayerFee,
        uint64 timeout,
        bool redeem
    ) external payable {
        _bridgeTokens(token, assetId, amount, recipient, destChain, relayerFee, timeout, redeem, 0);
    }
    
    /**
     * @notice Bridge tokens using a pre-computed assetId with explicit fee amount
     * @param token The token address to bridge
     * @param assetId The pre-computed asset identifier
     * @param amount The amount to bridge
     * @param recipient The recipient address on the destination chain
     * @param destChain The destination chain identifier
     * @param relayerFee The fee to pay the relayer (0 to use default)
     * @param timeout The timeout in seconds for the request (0 to use default)
     * @param redeem Whether to redeem ERC20 on the destination (true) or mint hyper-fungible token (false)
     * @param feeAmount The amount of fee tokens to transfer from user (0 for automatic estimation)
     */
    function bridgeTokensWithAssetId(
        address token,
        bytes32 assetId,
        uint256 amount,
        address recipient,
        bytes memory destChain,
        uint256 relayerFee,
        uint64 timeout,
        bool redeem,
        uint256 feeAmount
    ) external payable {
        _bridgeTokens(token, assetId, amount, recipient, destChain, relayerFee, timeout, redeem, feeAmount);
    }

    /**
     * @notice Estimate the fee amount for a cross-chain transfer
     * @param destChain The destination chain identifier
     * @param amount The amount being bridged
     * @return The estimated fee in fee token units
     * @dev This is a conservative estimate. Actual fees may be lower.
     *      Formula: base_fee + (estimated_message_size * avg_per_byte_fee)
     *      - Base fee: ~0.3 USD (covers proof verification ~150k gas @ $0.002/k gas)
     *      - Message size: ~200-300 bytes for TeleportParams
     *      - Per-byte fee: ~0.003 USD average across chains
     *      - Result: 0.3 + (250 * 0.003) = 1.05 USD, rounded to 1.5 USD for safety
     */
    function estimateFee(bytes memory destChain, uint256 amount) public pure returns (uint256) {
        // Base fee for proof verification and execution (~150k gas)
        uint256 baseFee = 0.3 ether; // 0.3 USD
        
        // Estimate message size
        // TeleportParams: amount(32) + relayerFee(32) + assetId(32) + redeem(1) + 
        //                 to(32) + dest(variable) + timeout(8) + nativeCost(32) + data(variable)
        // Typical size: ~200-300 bytes
        uint256 estimatedMessageSize = 200 + destChain.length;
        
        // Average per-byte fee (varies by chain, using conservative estimate)
        uint256 perByteFee = 0.003 ether; // 0.003 USD per byte
        
        // Calculate total
        uint256 messageFee = estimatedMessageSize * perByteFee;
        
        // Add 50% safety margin for gas price volatility
        uint256 totalFee = (baseFee + messageFee) * 150 / 100;
        
        return totalFee;
    }

    /**
     * @notice Update the default relayer fee
     * @param newRelayerFee The new default relayer fee
     */
    function setDefaultRelayerFee(uint256 newRelayerFee) external {
        defaultRelayerFee = newRelayerFee;
    }

    /**
     * @notice Get the assetId for a given symbol
     * @param symbol The token symbol
     * @return The assetId (keccak256 hash of symbol)
     */
    function getAssetId(string memory symbol) external pure returns (bytes32) {
        return keccak256(bytes(symbol));
    }

    /**
     * @notice Get the ERC20 address for a given assetId
     * @param assetId The asset identifier
     * @return The ERC20 token address
     */
    function getERC20Address(bytes32 assetId) external view returns (address) {
        return tokenGateway.erc20(assetId);
    }
}
