"use client";

import { useMemo, useState } from "react";
import { Buy } from "./Buy";
import { Sell } from "./Sell";
import { useFhevm } from "@fhevm-sdk";
import { Box, Divider, Paper, Typography } from "@mui/material";
import { Button } from "@mui/material";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { Address } from "viem";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import { useZBondingCurve } from "~~/hooks/helper/useZBondingCurve";
import { TokenInfo } from "~~/types/tokenInfo";
import initialMockChains from "~~/utils/helper/initialChains";

export const BondingCurveTrade = ({
  baseTokenAddress,
  baseTokenInfo,
}: {
  baseTokenAddress: Address;
  baseTokenInfo: TokenInfo;
}) => {
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
  // tabs for buy and sell
  const [tab, setTab] = useState("buy");
  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setTab(newValue);
  };
  const {
    getObserverOperatorAccessOnQuoteAndBaseToken,
    buyBaseAssetToken,
    buyQuoteAssetToken,
    quoteBaseTokenInfo,
    baseTokenObserver,
    quoteTokenObserver,
    isOperatorForBaseToken,
    isOperatorForQuoteToken,
    decrypteBaseTokenBalance,
    refreshBaseTokenBalanceHandle,
    decryptedBaseTokenBalance,
    isApprovalLoading,
    isBuying,
    isSelling,
  } = useZBondingCurve({
    baseTokenAddress,
    instance: fhevmInstance,
    initialMockChains: initialMockChains,
  });
  const isObserverOperatorSet = useMemo(() => {
    return baseTokenObserver && quoteTokenObserver && isOperatorForBaseToken && isOperatorForQuoteToken;
  }, [baseTokenObserver, quoteTokenObserver, isOperatorForBaseToken, isOperatorForQuoteToken]);
  return (
    <Paper variant="outlined" sx={{ padding: 2 }}>
      <Typography variant="h4">Trade</Typography>
      <Typography variant="body1">Trade {baseTokenInfo.symbol} with zUSDC on z bonding curve</Typography>
      <Divider sx={{ marginTop: 2 }} />
      {/* <Box>
        <Button onClick={() => decrypteBaseTokenBalance()}>Decrypt Base Token Balance</Button>
        <Button onClick={() => refreshBaseTokenBalanceHandle()}>Refresh Base Token Balance Handle</Button>
      </Box> */}
      {/* <Box>
        <Typography>
          Decrypted Base Token Balance: {formatUnits(decryptedBaseTokenBalance ?? 0n, baseTokenInfo.decimals)}
        </Typography>
      </Box> */}
      <Box>
        <Tabs value={tab} onChange={handleTabChange} variant="fullWidth">
          <Tab label="Buy" value="buy" />
          <Tab label="Sell" value="sell" />
        </Tabs>
      </Box>
      {tab === "buy" && (
        <Buy
          baseTokenAddress={baseTokenAddress}
          baseTokenInfo={baseTokenInfo}
          isObserverOperatorSet={isObserverOperatorSet}
          getObserverOperatorAccessOnQuoteAndBaseToken={getObserverOperatorAccessOnQuoteAndBaseToken}
          buyBaseAssetToken={buyBaseAssetToken}
          isApprovalLoading={isApprovalLoading}
          isBuying={isBuying}
        />
      )}
      {tab === "sell" && (
        <Sell
          baseTokenAddress={baseTokenAddress}
          baseTokenInfo={baseTokenInfo}
          isObserverOperatorSet={isObserverOperatorSet}
          getObserverOperatorAccessOnQuoteAndBaseToken={getObserverOperatorAccessOnQuoteAndBaseToken}
          buyQuoteAssetToken={buyQuoteAssetToken}
          isApprovalLoading={isApprovalLoading}
          isSelling={isSelling}
        />
      )}
    </Paper>
  );
};
