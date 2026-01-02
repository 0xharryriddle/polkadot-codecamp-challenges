import TokenBridge from "@/components/token-bridge";
import SigpassKit from "@/components/sigpasskit";

export default function Home() {
  return (
    <div className="flex flex-col gap-8 max-w-[768px] mx-auto min-h-screen items-center justify-center p-4">
      {/* Page Title */}
      <h1 className="text-2xl font-bold text-center">Hyperbridge Token Bridge</h1>
      
      {/* Wallet Connection */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm text-muted-foreground">Connect your wallet to get started</p>
        <SigpassKit />
      </div>
      
      {/* Bridge Component */}
      <TokenBridge />
      
      {/* Info Section */}
      <div className="flex flex-col gap-4 p-4 border rounded-lg max-w-md text-sm text-muted-foreground">
        <h3 className="font-medium text-foreground">About Hyperbridge</h3>
        <p>
          Hyperbridge is a cross-chain bridge protocol that enables secure token transfers 
          between different blockchain networks using Polkadot&apos;s interoperability features.
        </p>
        <div className="flex flex-col gap-2">
          <h4 className="font-medium text-foreground">Supported Routes:</h4>
          <ul className="list-disc list-inside space-y-1">
            <li>Paseo Testnet → Ethereum Sepolia</li>
            <li>BSC Testnet → Ethereum Sepolia</li>
            <li>Optimism Sepolia → Ethereum Sepolia</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
