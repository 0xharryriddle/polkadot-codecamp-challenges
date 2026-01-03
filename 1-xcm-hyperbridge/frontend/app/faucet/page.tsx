"use client";
import FaucetWriteContract from "@/components/faucet-write-contract";
import SigpassKit from "@/components/sigpasskit";

export default function FaucetPage() {
  return (
    <div className="flex flex-col gap-8 max-w-[768px] mx-auto min-h-screen items-center justify-center p-4">
      <SigpassKit />
      <h1 className="text-2xl font-bold">Test Token Faucet</h1>
      <FaucetWriteContract />
    </div>
  );
}
