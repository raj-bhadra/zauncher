import { useEffect, useState } from "react";
import { ZTokenInput } from "./ZTokenInput";
import { Box, Button, Stack, Tooltip, Typography } from "@mui/material";
import { Address, formatUnits } from "viem";
import { useZBondingCurveBuyEstimates } from "~~/hooks/helper/useZBondingCurve";
import { TokenInfo } from "~~/types/tokenInfo";
import initialMockChains from "~~/utils/helper/initialChains";
import quoteTokenInfo from "~~/utils/helper/quoteTokenInfo";

export const Buy = ({
  baseTokenAddress,
  baseTokenInfo,
  isObserverOperatorSet,
  getObserverOperatorAccessOnQuoteAndBaseToken,
  buyBaseAssetToken,
}: {
  baseTokenAddress: Address;
  baseTokenInfo: TokenInfo;
  isObserverOperatorSet: boolean;
  getObserverOperatorAccessOnQuoteAndBaseToken: () => void;
  buyBaseAssetToken: (baseTokenAddress: Address, amount: bigint) => void;
}) => {
  const [tokenAmount, setTokenAmount] = useState<string>("");
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^[0-9]*$/.test(value)) {
      setTokenAmount(value);
    }
  };
  const [debouncedTokenAmount, setDebouncedTokenAmount] = useState<string>("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTokenAmount(tokenAmount);
    }, 500);
    return () => clearTimeout(timer);
  }, [tokenAmount]);
  const { buyEstimateResult } = useZBondingCurveBuyEstimates({
    baseAssetToken: baseTokenAddress,
    amountIn: debouncedTokenAmount ? BigInt(debouncedTokenAmount) * BigInt(10 ** 6) : 0n,
    initialMockChains: initialMockChains,
  });
  const hasBuyEstimate = debouncedTokenAmount !== "0" && buyEstimateResult.data;
  const estimatedQuoteTokenAmount = hasBuyEstimate
    ? formatUnits(buyEstimateResult.data as bigint, baseTokenInfo.decimals) + " " + baseTokenInfo.symbol
    : "";
  return (
    <Stack direction="column" spacing={2} justifyContent="center" alignItems="center" sx={{ marginTop: 4 }}>
      <ZTokenInput
        baseTokenAddress={baseTokenAddress}
        baseTokenInfo={baseTokenInfo}
        isBuy={true}
        onChange={onChange}
        value={tokenAmount}
      />
      <Typography sx={{ minHeight: "24px" }}>{estimatedQuoteTokenAmount}</Typography>
      {isObserverOperatorSet && (
        <Button
          variant="contained"
          disabled={tokenAmount === ""}
          onClick={() =>
            buyBaseAssetToken(baseTokenAddress, BigInt(tokenAmount ? BigInt(tokenAmount) * BigInt(10 ** 6) : 0n))
          }
        >
          Encrypted Buy {baseTokenInfo.symbol}
        </Button>
      )}
      {!isObserverOperatorSet && (
        <Tooltip title="Bonding Curve Requires Observer & Operator Access To Conduct The Trade">
          <Button variant="contained" onClick={getObserverOperatorAccessOnQuoteAndBaseToken}>
            Get Observer and Operator Access
          </Button>
        </Tooltip>
      )}
    </Stack>
  );
};
