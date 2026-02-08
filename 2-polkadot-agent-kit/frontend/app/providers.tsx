"use client";

import { createConfig } from "@luno-kit/react";
import {
  kusama,
  polkadot,
  westend,
  paseoAssetHub,
  polkadotAssetHub,
} from "@luno-kit/react/chains";
import {
  novaConnector,
  polkadotjsConnector,
  polkagateConnector,
  subwalletConnector,
  talismanConnector,
  walletConnectConnector,
} from "@luno-kit/react/connectors";
import { LunoKitProvider } from "@luno-kit/ui";

// Hydration chain configuration
const hydration = {
  id: "hydration",
  name: "Hydration",
  network: "hydration",
  nativeCurrency: { name: "HDX", symbol: "HDX", decimals: 12 },
  rpcUrls: {
    default: { http: [], webSocket: ["wss://rpc.hydradx.cloud"] },
    public: { http: [], webSocket: ["wss://rpc.hydradx.cloud"] },
  },
} as const;

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_ID || "";

const connectors = [
  polkadotjsConnector(),
  subwalletConnector(),
  talismanConnector(),
  polkagateConnector(),
  ...(walletConnectProjectId
    ? [
        walletConnectConnector({ projectId: walletConnectProjectId }),
        novaConnector({ projectId: walletConnectProjectId }),
      ]
    : []),
];

const lunoConfig = createConfig({
  appName: "Polkadot Agent - Staking & Swaps",
  chains: [
    polkadot,
    kusama,
    westend,
    paseoAssetHub,
    polkadotAssetHub,
    hydration as any,
  ],
  connectors,
  autoConnect: true,
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return <LunoKitProvider config={lunoConfig}>{children}</LunoKitProvider>;
}
