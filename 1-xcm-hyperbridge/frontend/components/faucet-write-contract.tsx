"use client";

// React imports
import { useState, useEffect } from "react";

// Wagmi imports
import {
  type BaseError,
  useWaitForTransactionReceipt,
  useConfig,
  useWriteContract,
  useReadContracts,
  useAccount,
  useChainId,
} from "wagmi";

// Viem imports
import { formatUnits } from "viem";

// Lucide imports (for icons)
import {
  Ban,
  ExternalLink,
  ChevronDown,
  X,
  Hash,
  LoaderCircle,
  CircleCheck,
  WalletMinimal,
  DollarSign,
} from "lucide-react";

// UI imports
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

// Utils imports
import { truncateHash } from "@/lib/utils";

// Component imports
import CopyButton from "@/components/copy-button";

// Library imports
import { getSigpassWallet } from "@/lib/sigpass";
import { useAtomValue } from "jotai";
import { addressAtom } from "@/components/sigpasskit";
import { Skeleton } from "./ui/skeleton";
import { localConfig } from "@/app/providers";

// Abi for Bridgeable Token
import { bridgeableTokenAbi } from "@/lib/abi";

// Bridge configuration
import { getBridgeConfig } from "@/lib/bridge-config";
export default function FaucetWriteContract() {
  // useConfig hook to get config
  const config = useConfig();

  // useAccount hook to get account
  const account = useAccount();

  // Get current chain ID
  const chainId = useChainId();

  // useMediaQuery hook to check if the screen is desktop
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // useState hook to open/close dialog/drawer
  const [open, setOpen] = useState(false);

  // get the address from session storage
  const address = useAtomValue(addressAtom);

  // Get bridge config for current chain
  const bridgeConfig = getBridgeConfig(chainId);
  const tokenAddress = bridgeConfig?.defaultBridgeToken;

  // useWriteContract hook to write contract
  const {
    data: hash,
    error,
    isPending,
    writeContractAsync,
  } = useWriteContract({
    config: address ? localConfig : config,
  });

  // useReadContracts hook to read contract
  const { data, refetch } = useReadContracts({
    contracts: [
      {
        address: tokenAddress,
        abi: bridgeableTokenAbi,
        functionName: "balanceOf",
        args: [address ? address : account.address],
      },
      {
        address: tokenAddress,
        abi: bridgeableTokenAbi,
        functionName: "decimals",
      },
      {
        address: tokenAddress,
        abi: bridgeableTokenAbi,
        functionName: "name",
      },
      {
        address: tokenAddress,
        abi: bridgeableTokenAbi,
        functionName: "symbol",
      },
    ],
    config: address ? localConfig : config,
  });

  // get the balance, decimals, name, and symbol from the data
  const balance = data?.[0]?.result as bigint | undefined;
  const decimals = data?.[1]?.result as number | undefined;
  const tokenName = data?.[2]?.result as string | undefined;
  const tokenSymbol = data?.[3]?.result as string | undefined;

  // Handle faucet request
  async function handleFaucet() {
    if (!tokenAddress || tokenAddress === "0x0000000000000000000000000000000000000000") {
      return;
    }

    try {
      if (address) {
        await writeContractAsync({
          account: await getSigpassWallet(),
          address: tokenAddress,
          abi: bridgeableTokenAbi,
          functionName: "faucet",
          chainId: chainId as 420420420 | 11155111 | 97 | 11155420,
        });
      } else {
        // Fallback to connected wallet
        await writeContractAsync({
          address: tokenAddress,
          abi: bridgeableTokenAbi,
          functionName: "faucet",
          chainId: chainId as 420420420 | 11155111 | 97 | 11155420,
        });
      }
    } catch (error: any) {
      console.error("Error calling faucet:", error);
    }
  }

  // Watch for transaction hash and open dialog/drawer when received
  useEffect(() => {
    if (hash) {
      setOpen(true);
    }
  }, [hash]);


  // useWaitForTransactionReceipt hook to wait for transaction receipt
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
      config: address ? localConfig : config,
    });

  // when isConfirmed, refetch the balance of the address
  useEffect(() => {
    if (isConfirmed) {
      refetch();
    }
  }, [isConfirmed, refetch]);

  // Check if chain/token is supported
  if (
    !bridgeConfig ||
    !tokenAddress ||
    tokenAddress === "0x0000000000000000000000000000000000000000"
  ) {
    return (
      <div className="flex flex-col gap-4 w-[320px] md:w-[425px]">
        <div className="flex flex-col gap-4 p-6 border rounded-lg items-center justify-center min-h-[200px]">
          <X className="w-12 h-12 text-muted-foreground" />
          <div className="text-center space-y-2">
            <h3 className="font-medium">Chain Not Supported</h3>
            <p className="text-sm text-muted-foreground">
              Faucet is not available on this chain. Please switch to Ethereum Sepolia or Optimism Sepolia.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-[320px] md:w-[425px]">
      {/* Token Info Card */}
      <div className="flex flex-col gap-4 p-6 border rounded-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Test Token Faucet</h2>
          <DollarSign className="h-6 w-6 text-primary" />
        </div>

        {/* Token Details */}
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Token</span>
            <span className="font-medium">
              {tokenName || <Skeleton className="w-[100px] h-4" />}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Symbol</span>
            <span className="font-medium">
              {tokenSymbol || <Skeleton className="w-[50px] h-4" />}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Your Balance</span>
            <div className="flex items-center gap-2">
              <WalletMinimal className="w-4 h-4" />
              <span className="font-medium">
                {balance !== undefined && decimals ? (
                  `${formatUnits(balance, decimals)} ${tokenSymbol}`
                ) : (
                  <Skeleton className="w-[80px] h-4" />
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Contract</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs">
                {truncateHash(tokenAddress)}
              </span>
              <CopyButton copyText={tokenAddress} />
            </div>
          </div>
        </div>

        {/* Faucet Button */}
        <Button
          onClick={handleFaucet}
          disabled={isPending || !account.address}
          className="w-full"
          size="lg"
        >
          {isPending ? (
            <>
              <LoaderCircle className="w-4 h-4 animate-spin mr-2" />
              Requesting Tokens...
            </>
          ) : (
            <>
              <DollarSign className="w-4 h-4 mr-2" />
              Request Test Tokens
            </>
          )}
        </Button>

        {!account.address && (
          <p className="text-sm text-center text-muted-foreground">
            Please connect your wallet to request tokens
          </p>
        )}
      </div>

      {/* Info Box */}
      <div className="p-4 border rounded-lg bg-muted/50 space-y-2 text-sm">
        <h4 className="font-medium">How it works</h4>
        <ul className="text-muted-foreground space-y-1 list-disc list-inside">
          <li>Connect your wallet to the supported network</li>
          <li>Click &quot;Request Test Tokens&quot; to receive tokens</li>
          <li>Use these tokens to test the bridge functionality</li>
          <li>You can request tokens multiple times if needed</li>
        </ul>
      </div>
      {/* Transaction Status Dialog/Drawer */}
      {isDesktop ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              Transaction status <ChevronDown />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Faucet Transaction</DialogTitle>
            </DialogHeader>
            <DialogDescription>
              Follow the transaction status below.
            </DialogDescription>
            <div className="flex flex-col gap-2">
              {hash ? (
                <div className="flex flex-row gap-2 items-center">
                  <Hash className="w-4 h-4" />
                  Transaction Hash
                  <a
                    className="flex flex-row gap-2 items-center underline underline-offset-4"
                    href={`${config.chains?.find((c) => c.id === chainId)?.blockExplorers?.default?.url}/tx/${hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {truncateHash(hash)}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <CopyButton copyText={hash} />
                </div>
              ) : (
                <div className="flex flex-row gap-2 items-center">
                  <Hash className="w-4 h-4" />
                  No transaction hash
                </div>
              )}
              {!isPending && !isConfirmed && !isConfirming && (
                <div className="flex flex-row gap-2 items-center">
                  <Ban className="w-4 h-4" /> No transaction submitted
                </div>
              )}
              {isConfirming && (
                <div className="flex flex-row gap-2 items-center text-yellow-500">
                  <LoaderCircle className="w-4 h-4 animate-spin" /> Waiting for
                  confirmation...
                </div>
              )}
              {isConfirmed && (
                <div className="flex flex-row gap-2 items-center text-green-500">
                  <CircleCheck className="w-4 h-4" /> Tokens received!
                </div>
              )}
              {error && (
                <div className="flex flex-row gap-2 items-center text-red-500">
                  <X className="w-4 h-4" /> Error:{" "}
                  {(error as BaseError).shortMessage || error.message}
                </div>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            <Button variant="outline" className="w-full">
              Transaction status <ChevronDown />
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Faucet Transaction</DrawerTitle>
              <DrawerDescription>
                Follow the transaction status below.
              </DrawerDescription>
            </DrawerHeader>
            <div className="flex flex-col gap-2 p-4">
              {hash ? (
                <div className="flex flex-row gap-2 items-center">
                  <Hash className="w-4 h-4" />
                  Transaction Hash
                  <a
                    className="flex flex-row gap-2 items-center underline underline-offset-4"
                    href={`${config.chains?.find((c) => c.id === chainId)?.blockExplorers?.default?.url}/tx/${hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {truncateHash(hash)}
                    <ExternalLink className="w-4 h-4" />
                    <CopyButton copyText={hash} />
                  </a>
                </div>
              ) : (
                <div className="flex flex-row gap-2 items-center">
                  <Hash className="w-4 h-4" />
                  No transaction hash
                </div>
              )}
              {!isPending && !isConfirmed && !isConfirming && (
                <div className="flex flex-row gap-2 items-center">
                  <Ban className="w-4 h-4" /> No transaction submitted
                </div>
              )}
              {isConfirming && (
                <div className="flex flex-row gap-2 items-center text-yellow-500">
                  <LoaderCircle className="w-4 h-4 animate-spin" /> Waiting for
                  confirmation...
                </div>
              )}
              {isConfirmed && (
                <div className="flex flex-row gap-2 items-center text-green-500">
                  <CircleCheck className="w-4 h-4" /> Tokens received!
                </div>
              )}
              {error && (
                <div className="flex flex-row gap-2 items-center text-red-500">
                  <X className="w-4 h-4" /> Error:{" "}
                  {(error as BaseError).shortMessage || error.message}
                </div>
              )}
            </div>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline">Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
}