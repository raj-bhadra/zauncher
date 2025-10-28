import { useMemo } from "react";
import { useFhevm } from "@fhevm-sdk";
import { Button, Typography } from "@mui/material";
import { formatUnits, parseUnits } from "viem";
import { useAccount } from "wagmi";
import { useConfidentialTokenWrapper } from "~~/hooks/helper/useConfidentialTokenWrapper";
import { useUsdc } from "~~/hooks/helper/useUsdc";
import initialMockChains from "~~/utils/helper/initialChains";

// shows usdc balance
// has a button to mint usdc using usdc contract
export const Usdc = () => {
  const { isConnected, chain } = useAccount();
  const provider = useMemo(() => {
    if (typeof window === "undefined") return undefined;

    // Get the wallet provider from window.ethereum
    return (window as any).ethereum;
  }, []);
  const chainId = chain?.id;
  const {
    instance: fhevmInstance,
    status: fhevmStatus,
    error: fhevmError,
  } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: true, // use enabled to dynamically create the instance on-demand
  });
  const { readUsdcBalanceResult, mintUsdc } = useUsdc({ initialMockChains });
  const {
    readConfidentialTokenWrapperBalanceResult,
    wrapUsdc,
    decrypt,
    decryptedBalance,
    isDecrypting,
    clearBalance,
    canDecrypt,
    refreshBalanceHandle,
  } = useConfidentialTokenWrapper({
    instance: fhevmInstance,
    initialMockChains,
    invalidateQuery: readUsdcBalanceResult.queryKey,
  });
  // 100 usdc
  const mintUsdcAmount = parseUnits("100", 6) as bigint;
  const wrapUsdcAmount = parseUnits("100", 6) as bigint;
  //wrap button is disabled if usdc balance is loading or error or less than wrapUsdcAmount
  const isWrapUsdcDisabled =
    readUsdcBalanceResult.isLoading ||
    readUsdcBalanceResult.isError ||
    (readUsdcBalanceResult?.data as bigint) < wrapUsdcAmount;
  return (
    <>
      <Typography>
        Confidential Token Wrapper Balance: {readConfidentialTokenWrapperBalanceResult?.data?.toString()}
      </Typography>
      <Button disabled={isWrapUsdcDisabled} onClick={() => wrapUsdc(wrapUsdcAmount)}>
        Wrap USDC
      </Button>
      <Button disabled={!canDecrypt} onClick={() => decrypt()}>
        Decrypt Balance
      </Button>
      <Typography>Decrypted Balance: {formatUnits(decryptedBalance ?? 0n, 6)}</Typography>
      <Button onClick={() => refreshBalanceHandle()}>Refresh Balance Handle</Button>
      <Typography>USDC Balance: {formatUnits((readUsdcBalanceResult?.data as bigint) ?? 0n, 6)}</Typography>
      <Button
        disabled={readUsdcBalanceResult.isLoading || readUsdcBalanceResult.isError}
        onClick={() => mintUsdc(mintUsdcAmount)}
      >
        Mint USDC
      </Button>
    </>
  );
};
