/**
 * API Route: Agent Account Balance
 *
 * Fetches the on-chain balance of the agent's Polkadot account
 * from Paseo AssetHub and Paseo relay chain.
 */

import { NextResponse } from "next/server";
import { ApiPromise, WsProvider } from "@polkadot/api";

const AGENT_ADDRESS = process.env.POLKADOT_ADDRESS || "";

interface ChainBalance {
  chain: string;
  token: string;
  decimals: number;
  free: string;
  reserved: string;
  frozen: string;
}

// RPC endpoints with fallbacks
const CHAINS = [
  {
    name: "Paseo Asset Hub",
    endpoints: [
      "wss://sys.ibp.network/asset-hub-paseo",
      "wss://asset-hub-paseo-rpc.polkadot.io",
    ],
  },
  {
    name: "Paseo Testnet",
    endpoints: ["wss://sys.ibp.network/paseo", "wss://paseo-rpc.dwellir.com"],
  },
];

async function fetchBalance(
  endpoints: string[],
  address: string,
): Promise<ChainBalance | null> {
  for (const endpoint of endpoints) {
    try {
      const provider = new WsProvider(endpoint, false);
      await provider.connect();

      // Wait for connection with timeout
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          provider.disconnect();
          reject(new Error("Connection timeout"));
        }, 10000);

        provider.on("connected", () => {
          clearTimeout(timeout);
          resolve();
        });
        provider.on("error", () => {
          clearTimeout(timeout);
          reject(new Error("Connection error"));
        });
      });

      const api = await ApiPromise.create({ provider, noInitWarn: true });

      const accountInfo = (await api.query.system.account(address)) as any;
      const { free, reserved, frozen } = accountInfo.data;

      const decimals = api.registry.chainDecimals[0];
      const token = api.registry.chainTokens[0];
      const chain = (await api.rpc.system.chain()).toString();

      await api.disconnect();

      return {
        chain,
        token,
        decimals,
        free: (Number(free) / 10 ** decimals).toFixed(4),
        reserved: (Number(reserved) / 10 ** decimals).toFixed(4),
        frozen: (Number(frozen) / 10 ** decimals).toFixed(4),
      };
    } catch {
      // Try next endpoint
      continue;
    }
  }
  return null;
}

export async function GET() {
  if (!AGENT_ADDRESS) {
    return NextResponse.json(
      {
        error: "Agent address not configured",
        address: null,
        balances: [],
      },
      { status: 400 },
    );
  }

  try {
    // Fetch balances from all chains in parallel
    const results = await Promise.allSettled(
      CHAINS.map((chain) => fetchBalance(chain.endpoints, AGENT_ADDRESS)),
    );

    const balances: ChainBalance[] = [];
    for (const result of results) {
      if (result.status === "fulfilled" && result.value) {
        balances.push(result.value);
      }
    }

    return NextResponse.json({
      address: AGENT_ADDRESS,
      balances,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Balance fetch error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch balances",
        address: AGENT_ADDRESS,
        balances: [],
      },
      { status: 500 },
    );
  }
}
