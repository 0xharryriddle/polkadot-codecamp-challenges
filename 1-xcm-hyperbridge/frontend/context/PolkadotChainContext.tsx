import { createContext, useContext } from "react";
import { PolkadotClient } from "polkadot-api";
import { PaseoAssetHubChainApi } from "@/api";

export const polkadotChainCtx = createContext<{
    client: PolkadotClient,
    api: PaseoAssetHubChainApi
} | null>(null);

export const usePolkadotChain = () => useContext(polkadotChainCtx)!;

export const PolkadotChainProvider = polkadotChainCtx.Provider;