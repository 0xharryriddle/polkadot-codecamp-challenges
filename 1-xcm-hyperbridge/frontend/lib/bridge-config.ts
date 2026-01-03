import { Address } from "viem";

// Bridge Configuration
// Update these addresses after deploying the TokenBridge contracts

export interface BridgeConfig {
    tokenBridge: Address;
    tokenGateway: Address;
    feeToken: Address;
    defaultBridgeToken: Address;
}

// Chain identifiers for Hyperbridge (StateMachine format)
export const chainIdentifiers: Record<number, string> = {
    11155111: "EVM-11155111", // Ethereum Sepolia
    97: "EVM-97", // BSC Testnet
    11155420: "EVM-11155420", // Optimism Sepolia
    420420420: "EVM-420420420", // Paseo Testnet
};

// Bridge contract configurations per chain
// Replace with actual deployed contract addresses
export const bridgeConfigs: Record<number, BridgeConfig> = {
    // Ethereum Sepolia
    11155111: {
        tokenBridge: "0x5169Fc3372a06375c6B1C4E47d00AeEd42b1b80F",
        tokenGateway: "0xFcDa26cA021d5535C3059547390E6cCd8De7acA6",
        feeToken: "0xAa1452b759708bc5b50264bdB78d7b9F22eD366F",
        defaultBridgeToken: "0xa44741349E5Fc8121b5Cd415661274937bC07281",
    },
    // BSC Testnet
    97: {
        tokenBridge: "0x0000000000000000000000000000000000000000",
        tokenGateway: "0x0000000000000000000000000000000000000000",
        feeToken: "0x0000000000000000000000000000000000000000",
        defaultBridgeToken: "0x0000000000000000000000000000000000000000",
    },
    // Optimism Sepolia
    11155420: {
        tokenBridge: "0xf64d93DC125AC1B366532BBbA165615f6D566C7F",
        tokenGateway: "0xFcDa26cA021d5535C3059547390E6cCd8De7acA6",
        feeToken: "0xb511e70ea8c6840e8E9b9f2b93bf1c3Ac483C98f",
        defaultBridgeToken: "0x2402C804aD8a6217BF73D8483dA7564065c56083",
    },
    // Paseo Testnet
    420420420: {
        tokenBridge: "0x0000000000000000000000000000000000000000",
        tokenGateway: "0x0000000000000000000000000000000000000000",
        feeToken: "0x0000000000000000000000000000000000000000",
        defaultBridgeToken: "0x0000000000000000000000000000000000000000",
    },
};

// Get bridge config for a chain
export function getBridgeConfig(chainId: number): BridgeConfig | undefined {
    return bridgeConfigs[chainId];
}

// Get chain identifier for Hyperbridge
export function getChainIdentifier(chainId: number): string | undefined {
    return chainIdentifiers[chainId];
}

// Check if a chain is supported for bridging
export function isBridgeSupported(chainId: number): boolean {
    return chainId in bridgeConfigs;
}
