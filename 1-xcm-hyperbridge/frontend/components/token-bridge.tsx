"use client";

// React imports
import { useState, useEffect, useMemo } from "react";

// Wagmi imports
import {
  type BaseError,
  useWaitForTransactionReceipt,
  useConfig,
  useWriteContract,
  useReadContracts,
  useAccount,
  useSwitchChain,
} from "wagmi";

// Viem imports
import { parseUnits, formatUnits, isAddress, Address, toHex } from "viem";

// Lucide imports (for icons)
import {
  Ban,
  ExternalLink,
  ChevronDown,
  X,
  Hash,
  LoaderCircle,
  CircleCheck,
  ArrowRight,
  Wallet,
  RefreshCw,
} from "lucide-react";

// Zod imports
import { z } from "zod";

// Zod resolver imports
import { zodResolver } from "@hookform/resolvers/zod";

// React hook form imports
import { useForm } from "react-hook-form";

// UI imports
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogTitle,
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
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Utils imports
import { truncateHash } from "@/lib/utils";

// Component imports
import CopyButton from "@/components/copy-button";

// Library imports
import { getSigpassWallet } from "@/lib/sigpass";
import { useAtomValue } from 'jotai'
import { addressAtom } from '@/components/sigpasskit'
import { Skeleton } from "./ui/skeleton";
import { localConfig, bridgeNetworkPairs, type BridgeNetworkPair } from "@/app/providers";
import { bridgeConfigs, chainIdentifiers } from "@/lib/bridge-config";

// ABI imports
import { erc20AbiExtend, tokenBridgeAbi } from "@/lib/abi";

// Supported chain IDs type
type SupportedChainId = 420420420 | 11155111 | 97 | 11155420;

export default function TokenBridge() {
  // useConfig hook to get config
  const config = useConfig();

  // useAccount hook to get account
  const account = useAccount();

  // useSwitchChain hook
  const { switchChainAsync, isPending: isSwitchingChain } = useSwitchChain();

  // useMediaQuery hook to check if the screen is desktop
  const isDesktop = useMediaQuery("(min-width: 768px)");
  
  // useState hooks
  const [open, setOpen] = useState(false);
  const [selectedPairIndex, setSelectedPairIndex] = useState<number>(0);
  const [tokenAddress, setTokenAddress] = useState<Address | "">("");

  // get the address from session storage (sigpass wallet)
  const sigpassAddress = useAtomValue(addressAtom);
  
  // Determine active address (sigpass or connected wallet)
  const activeAddress = sigpassAddress || account.address;

  // Selected network pair
  const selectedPair: BridgeNetworkPair = bridgeNetworkPairs[selectedPairIndex];

  // useWriteContract hooks for approve and bridge
  const {
    data: approveHash,
    error: approveError,
    isPending: isApprovePending,
    writeContractAsync: writeApproveAsync,
    reset: resetApprove,
  } = useWriteContract({
    config: sigpassAddress ? localConfig : config,
  });

  const {
    data: bridgeHash,
    error: bridgeError,
    isPending: isBridgePending,
    writeContractAsync: writeBridgeAsync,
    reset: resetBridge,
  } = useWriteContract({
    config: sigpassAddress ? localConfig : config,
  });

  // Get bridge config for source chain
  const sourceBridgeConfig = bridgeConfigs[selectedPair.source.id];
  const bridgeContract = sourceBridgeConfig?.tokenBridge;
  const defaultToken = sourceBridgeConfig?.defaultBridgeToken;

  // Get token info
  const effectiveTokenAddress = (tokenAddress || defaultToken || "0x0000000000000000000000000000000000000000") as Address;
  
  const { 
    data: tokenData,
    refetch: refetchTokenData,
    isLoading: isLoadingTokenData,
  } = useReadContracts({ 
    contracts: [
      { 
        address: effectiveTokenAddress,
        abi: erc20AbiExtend,
        functionName: 'balanceOf',
        args: [activeAddress as Address],
        chainId: selectedPair.source.id as SupportedChainId,
      },
      { 
        address: effectiveTokenAddress,
        abi: erc20AbiExtend,
        functionName: 'decimals',
        chainId: selectedPair.source.id as SupportedChainId,
      },
      { 
        address: effectiveTokenAddress,
        abi: erc20AbiExtend,
        functionName: 'symbol',
        chainId: selectedPair.source.id as SupportedChainId,
      },
      { 
        address: effectiveTokenAddress,
        abi: erc20AbiExtend,
        functionName: 'name',
        chainId: selectedPair.source.id as SupportedChainId,
      },
      {
        address: effectiveTokenAddress,
        abi: erc20AbiExtend,
        functionName: 'allowance',
        args: [activeAddress as Address, bridgeContract as Address],
        chainId: selectedPair.source.id as SupportedChainId,
      }
    ],
    config: sigpassAddress ? localConfig : config,
    query: {
      enabled: !!activeAddress && !!effectiveTokenAddress && !!bridgeContract,
    }
  });

  // Extract token data
  const tokenBalance = tokenData?.[0]?.result as bigint | undefined;
  const tokenDecimals = tokenData?.[1]?.result as number | undefined;
  const tokenSymbol = tokenData?.[2]?.result as string | undefined;
  const tokenAllowance = tokenData?.[4]?.result as bigint | undefined;

  // Form schema for bridge transaction
  const formSchema = useMemo(() => z.object({
    recipient: z
      .string()
      .min(2)
      .max(50)
      .refine((val) => val === "" || isAddress(val), {
        message: "Invalid address format",
      }) as z.ZodType<Address | "">,
    amount: z
      .string()
      .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
        message: "Amount must be a positive number",
      })
      .refine((val) => /^\d*\.?\d{0,18}$/.test(val), {
        message: "Amount cannot have more than 18 decimal places",
      })
      .superRefine((val, ctx) => {
        if (!tokenBalance || !tokenDecimals) return;
        
        const inputAmount = parseUnits(val, tokenDecimals);

        if (inputAmount > tokenBalance) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Amount exceeds available balance",
          });
        }
      }),
  }), [tokenBalance, tokenDecimals]);

  // Define form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipient: "",
      amount: "",
    },
  });

  // Watch for transaction hashes and open dialog/drawer when received
  useEffect(() => {
    if (bridgeHash) {
      setOpen(true);
    }
  }, [bridgeHash]);

  // Wait for approve transaction
  const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed } =
    useWaitForTransactionReceipt({
      hash: approveHash,
      config: sigpassAddress ? localConfig : config,
    });

  // Wait for bridge transaction
  const { isLoading: isBridgeConfirming, isSuccess: isBridgeConfirmed } =
    useWaitForTransactionReceipt({
      hash: bridgeHash,
      config: sigpassAddress ? localConfig : config,
    });

  // Refetch token data when bridge is confirmed
  useEffect(() => {
    if (isBridgeConfirmed) {
      refetchTokenData();
    }
  }, [isBridgeConfirmed, refetchTokenData]);

  // Check if on correct chain
  const isOnCorrectChain = account.chainId === selectedPair.source.id;

  // Handle chain switch
  async function handleSwitchChain() {
    try {
      await switchChainAsync({ chainId: selectedPair.source.id });
    } catch (error) {
      console.error("Failed to switch chain:", error);
    }
  }

  // Submit handler
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!activeAddress || !tokenDecimals || !bridgeContract) return;

    const amount = parseUnits(values.amount, tokenDecimals);

    try {
      // Check if approval is needed
      const needsApproval = !tokenAllowance || tokenAllowance < amount;

      if (needsApproval && bridgeContract) {
        // First approve the bridge contract
        if (sigpassAddress) {
          await writeApproveAsync({
            account: await getSigpassWallet(),
            address: effectiveTokenAddress,
            abi: erc20AbiExtend,
            functionName: 'approve',
            args: [bridgeContract, amount],
            chainId: selectedPair.source.id as SupportedChainId,
          });
        } else {
          await writeApproveAsync({
            address: effectiveTokenAddress,
            abi: erc20AbiExtend,
            functionName: 'approve',
            args: [bridgeContract, amount],
            chainId: selectedPair.source.id as SupportedChainId,
          });
        }
      }
    } catch (error) {
      console.error("Approval failed:", error);
    }
  }

  // Execute bridge after approval
  async function executeBridge() {
    const values = form.getValues();
    if (!activeAddress || !tokenDecimals || !bridgeContract) return;

    const amount = parseUnits(values.amount, tokenDecimals);
    const destChainId = chainIdentifiers[selectedPair.destination.id];
    const destChainBytes = toHex(destChainId || "");

    try {
      if (sigpassAddress) {
        await writeBridgeAsync({
          account: await getSigpassWallet(),
          address: bridgeContract,
          abi: tokenBridgeAbi,
          functionName: 'bridgeTokens',
          args: [effectiveTokenAddress, amount, values.recipient as Address, destChainBytes as `0x${string}`],
          chainId: selectedPair.source.id as SupportedChainId,
        });
      } else {
        await writeBridgeAsync({
          address: bridgeContract,
          abi: tokenBridgeAbi,
          functionName: 'bridgeTokens',
          args: [effectiveTokenAddress, amount, values.recipient as Address, destChainBytes as `0x${string}`],
          chainId: selectedPair.source.id as SupportedChainId,
        });
      }
    } catch (error) {
      console.error("Bridge failed:", error);
    }
  }

  // Reset the form and transaction state
  function resetTransaction() {
    form.reset();
    resetApprove();
    resetBridge();
    setOpen(false);
  }

  // Get block explorer URL for transaction
  function getExplorerUrl(hash: string, chainId: number) {
    const chain = bridgeNetworkPairs.find(p => p.source.id === chainId || p.destination.id === chainId);
    const targetChain = chain?.source.id === chainId ? chain.source : chain?.destination;
    return targetChain?.blockExplorers?.default?.url 
      ? `${targetChain.blockExplorers.default.url}/tx/${hash}`
      : `https://etherscan.io/tx/${hash}`;
  }

  // Transaction status component
  const TransactionStatusContent = () => (
    <div className="flex flex-col gap-4">
      {/* Step 1: Approval */}
      <div className="flex flex-col gap-2 p-4 border rounded-lg">
        <div className="flex items-center gap-2 font-medium">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">1</span>
          Token Approval
        </div>
        {approveHash ? (
          <div className="flex flex-row gap-2 items-center text-sm">
            <Hash className="w-4 h-4" />
            <a 
              className="flex flex-row gap-2 items-center underline underline-offset-4" 
              href={getExplorerUrl(approveHash, selectedPair.source.id)} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              {truncateHash(approveHash)}
              <ExternalLink className="w-4 h-4" />
            </a>
            <CopyButton copyText={approveHash} />
          </div>
        ) : null}
        {isApprovePending && (
          <div className="flex flex-row gap-2 items-center text-yellow-500 text-sm">
            <LoaderCircle className="w-4 h-4 animate-spin" /> Confirm in wallet...
          </div>
        )}
        {isApproveConfirming && (
          <div className="flex flex-row gap-2 items-center text-yellow-500 text-sm">
            <LoaderCircle className="w-4 h-4 animate-spin" /> Waiting for confirmation...
          </div>
        )}
        {isApproveConfirmed && (
          <div className="flex flex-row gap-2 items-center text-green-500 text-sm">
            <CircleCheck className="w-4 h-4" /> Approved!
          </div>
        )}
        {approveError && (
          <div className="flex flex-row gap-2 items-center text-red-500 text-sm">
            <X className="w-4 h-4" /> {(approveError as BaseError).shortMessage || approveError.message}
          </div>
        )}
      </div>

      {/* Step 2: Bridge */}
      <div className="flex flex-col gap-2 p-4 border rounded-lg">
        <div className="flex items-center gap-2 font-medium">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">2</span>
          Bridge Transaction
        </div>
        {bridgeHash ? (
          <div className="flex flex-row gap-2 items-center text-sm">
            <Hash className="w-4 h-4" />
            <a 
              className="flex flex-row gap-2 items-center underline underline-offset-4" 
              href={getExplorerUrl(bridgeHash, selectedPair.source.id)} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              {truncateHash(bridgeHash)}
              <ExternalLink className="w-4 h-4" />
            </a>
            <CopyButton copyText={bridgeHash} />
          </div>
        ) : null}
        {!isApproveConfirmed && !bridgeHash && (
          <div className="flex flex-row gap-2 items-center text-muted-foreground text-sm">
            <Ban className="w-4 h-4" /> Waiting for approval...
          </div>
        )}
        {isApproveConfirmed && !bridgeHash && !isBridgePending && (
          <Button onClick={executeBridge} className="w-full mt-2">
            Execute Bridge
          </Button>
        )}
        {isBridgePending && (
          <div className="flex flex-row gap-2 items-center text-yellow-500 text-sm">
            <LoaderCircle className="w-4 h-4 animate-spin" /> Confirm in wallet...
          </div>
        )}
        {isBridgeConfirming && (
          <div className="flex flex-row gap-2 items-center text-yellow-500 text-sm">
            <LoaderCircle className="w-4 h-4 animate-spin" /> Waiting for confirmation...
          </div>
        )}
        {isBridgeConfirmed && (
          <div className="flex flex-row gap-2 items-center text-green-500 text-sm">
            <CircleCheck className="w-4 h-4" /> Bridge transaction submitted!
          </div>
        )}
        {bridgeError && (
          <div className="flex flex-row gap-2 items-center text-red-500 text-sm">
            <X className="w-4 h-4" /> {(bridgeError as BaseError).shortMessage || bridgeError.message}
          </div>
        )}
      </div>

      {/* Final Status */}
      {isBridgeConfirmed && (
        <div className="flex flex-col gap-2 p-4 border rounded-lg bg-green-500/10 border-green-500">
          <div className="flex items-center gap-2 text-green-500 font-medium">
            <CircleCheck className="w-5 h-5" />
            Bridge Initiated Successfully!
          </div>
          <p className="text-sm text-muted-foreground">
            Your tokens are being bridged from {selectedPair.source.name} to {selectedPair.destination.name}. 
            This process may take several minutes to complete.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-6 w-[320px] md:w-[450px]">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold">Token Bridge</h2>
        <p className="text-sm text-muted-foreground">
          Bridge tokens across chains using Hyperbridge
        </p>
      </div>

      <div className="flex flex-col gap-4 p-4 border rounded-lg">
        {/* <FormLabel>Network Route</FormLabel> */}
        <Select
          value={selectedPairIndex.toString()}
          onValueChange={(value: any) => setSelectedPairIndex(parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select network pair" />
          </SelectTrigger>
          <SelectContent>
            {bridgeNetworkPairs.map((pair, index) => (
              <SelectItem key={index} value={index.toString()}>
                <div className="flex items-center gap-2">
                  <span>{pair.source.name}</span>
                  <ArrowRight className="w-4 h-4" />
                  <span>{pair.destination.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">From</span>
            <span className="font-medium">{selectedPair.source.name}</span>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground" />
          <div className="flex flex-col text-right">
            <span className="text-xs text-muted-foreground">To</span>
            <span className="font-medium">{selectedPair.destination.name}</span>
          </div>
        </div>
      </div>

      {!activeAddress ? (
        <div className="flex flex-col items-center gap-4 p-6 border rounded-lg border-dashed">
          <Wallet className="w-12 h-12 text-muted-foreground" />
          <p className="text-center text-muted-foreground">
            Please connect your wallet to use the bridge
          </p>
        </div>
      ) : !isOnCorrectChain && !sigpassAddress ? (
        <div className="flex flex-col items-center gap-4 p-6 border rounded-lg border-dashed">
          <RefreshCw className="w-12 h-12 text-muted-foreground" />
          <p className="text-center text-muted-foreground">
            Please switch to {selectedPair.source.name} to continue
          </p>
          <Button onClick={handleSwitchChain} disabled={isSwitchingChain}>
            {isSwitchingChain ? (
              <>
                <LoaderCircle className="w-4 h-4 animate-spin mr-2" />
                Switching...
              </>
            ) : (
              `Switch to ${selectedPair.source.name}`
            )}
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Token</span>
              {isLoadingTokenData ? (
                <Skeleton className="h-5 w-20" />
              ) : (
                <span className="font-medium">{tokenSymbol || "Unknown"}</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Balance</span>
              {isLoadingTokenData ? (
                <Skeleton className="h-5 w-24" />
              ) : (
                <span className="font-medium">
                  {tokenBalance && tokenDecimals 
                    ? `${formatUnits(tokenBalance, tokenDecimals)} ${tokenSymbol || ""}`
                    : "0"
                  }
                </span>
              )}
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="tokenAddress" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Token Address (Optional)
                </label>
                <Input
                  id="tokenAddress"
                  placeholder="0x... (leave empty for default token)"
                  value={tokenAddress}
                  onChange={(e) => setTokenAddress(e.target.value as Address | "")}
                />
                <p className="text-sm text-muted-foreground">
                  Enter a custom token address or use the default bridge token
                </p>
              </div>

              <FormField
                control={form.control}
                name="recipient"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient Address</FormLabel>
                    <FormControl>
                      <Input placeholder="0xA0Cf…251e" {...field} />
                    </FormControl>
                    <FormDescription>
                      The address to receive tokens on {selectedPair.destination.name}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <div className="relative">
                        {isDesktop ? (
                          <Input
                            type="number"
                            placeholder="0.0"
                            {...field}
                            required
                          />
                        ) : (
                          <Input
                            type="text"
                            inputMode="decimal"
                            pattern="[0-9]*[.]?[0-9]*"
                            placeholder="0.0"
                            {...field}
                            required
                          />
                        )}
                        {tokenBalance && tokenDecimals && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 text-xs"
                            onClick={() => form.setValue('amount', formatUnits(tokenBalance, tokenDecimals))}
                          >
                            MAX
                          </Button>
                        )}
                      </div>
                    </FormControl>
                    <FormDescription>
                      Amount of {tokenSymbol || "tokens"} to bridge
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isApprovePending || isBridgePending ? (
                <Button type="submit" disabled className="w-full">
                  <LoaderCircle className="w-4 h-4 animate-spin mr-2" /> 
                  {isApprovePending ? "Approving..." : "Bridging..."}
                </Button>
              ) : (
                <Button type="submit" className="w-full">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Bridge Tokens
                </Button>
              )}
            </form>
          </Form>
        </>
      )}

      {/* Transaction Status Dialog/Drawer */}
      {isDesktop ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setOpen(true)}
            disabled={!approveHash && !bridgeHash}
          >
            Transaction Status <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Bridge Transaction Status</DialogTitle>
              <DialogDescription>
                Follow the progress of your bridge transaction
              </DialogDescription>
            </DialogHeader>
            <TransactionStatusContent />
            <DialogFooter className="flex gap-2">
              {isBridgeConfirmed && (
                <Button onClick={resetTransaction} className="w-full">
                  New Bridge
                </Button>
              )}
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={open} onOpenChange={setOpen}>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setOpen(true)}
            disabled={!approveHash && !bridgeHash}
          >
            Transaction Status <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Bridge Transaction Status</DrawerTitle>
              <DrawerDescription>
                Follow the progress of your bridge transaction
              </DrawerDescription>
            </DrawerHeader>
            <div className="p-4">
              <TransactionStatusContent />
            </div>
            <DrawerFooter className="flex gap-2">
              {isBridgeConfirmed && (
                <Button onClick={resetTransaction} className="w-full">
                  New Bridge
                </Button>
              )}
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
