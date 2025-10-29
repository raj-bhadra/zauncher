"use client";

import { useMemo, useState } from "react";
import { Buy } from "./Buy";
import { Sell } from "./Sell";
import { useFhevm } from "@fhevm-sdk";
import { Box, Typography } from "@mui/material";
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
    quoteBaseTokenInfo,
    baseTokenObserver,
    quoteTokenObserver,
    isOperatorForBaseToken,
    isOperatorForQuoteToken,
    decrypteBaseTokenBalance,
    refreshBaseTokenBalanceHandle,
    decryptedBaseTokenBalance,
  } = useZBondingCurve({
    baseTokenAddress,
    instance: fhevmInstance,
    initialMockChains: initialMockChains,
  });
  return (
    <Box>
      <Box>
        <Button onClick={getObserverOperatorAccessOnQuoteAndBaseToken}>Get Observer and Operator Access</Button>
        <Button onClick={() => buyBaseAssetToken(baseTokenAddress, BigInt(1e8))}>Buy Base Asset Token</Button>
        <Button onClick={() => decrypteBaseTokenBalance()}>Decrypt Base Token Balance</Button>
        <Button onClick={() => refreshBaseTokenBalanceHandle()}>Refresh Base Token Balance Handle</Button>
      </Box>
      <Box>
        <Typography>
          Decrypted Base Token Balance: {formatUnits(decryptedBaseTokenBalance ?? 0n, baseTokenInfo.decimals)}
        </Typography>
        <Typography>
          {baseTokenObserver ? "Base Token Observer: " + baseTokenObserver : "Base Token Observer: Not Set"}
          {quoteTokenObserver ? "Quote Token Observer: " + quoteTokenObserver : "Quote Token Observer: Not Set"}
          {isOperatorForBaseToken ? "Base Token Operator: " + isOperatorForBaseToken : "Base Token Operator: Not Set"}
          {isOperatorForQuoteToken
            ? "Quote Token Operator: " + isOperatorForQuoteToken
            : "Quote Token Operator: Not Set"}
        </Typography>
      </Box>
      <Box>
        <Tabs value={tab} onChange={handleTabChange}>
          <Tab label="Buy" value="buy" />
          <Tab label="Sell" value="sell" />
        </Tabs>
      </Box>
      {tab === "buy" && <Buy baseTokenAddress={baseTokenAddress} baseTokenInfo={baseTokenInfo} />}
      {tab === "sell" && <Sell baseTokenAddress={baseTokenAddress} baseTokenInfo={baseTokenInfo} />}
    </Box>
  );
};
