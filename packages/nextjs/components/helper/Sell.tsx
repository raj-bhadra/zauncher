import { useEffect, useState } from "react";
import { ZTokenInput } from "./ZTokenInput";
import { Box, Button, Stack, Tooltip, Typography } from "@mui/material";
import { Address } from "viem";
import { formatUnits } from "viem";
import { useZBondingCurveSellEstimates } from "~~/hooks/helper/useZBondingCurve";
import { TokenInfo } from "~~/types/tokenInfo";
import initialMockChains from "~~/utils/helper/initialChains";
import quoteTokenInfo from "~~/utils/helper/quoteTokenInfo";

export const Sell = ({
  baseTokenAddress,
  baseTokenInfo,
  isObserverOperatorSet,
  getObserverOperatorAccessOnQuoteAndBaseToken,
  buyQuoteAssetToken,
  isApprovalLoading,
}: {
  baseTokenAddress: Address;
  baseTokenInfo: TokenInfo;
  isObserverOperatorSet: boolean;
  getObserverOperatorAccessOnQuoteAndBaseToken: () => void;
  buyQuoteAssetToken: (baseTokenAddress: Address, amount: bigint) => void;
  isApprovalLoading: boolean;
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
  const { sellEstimateResult } = useZBondingCurveSellEstimates({
    baseAssetToken: baseTokenAddress,
    amountIn: debouncedTokenAmount ? BigInt(debouncedTokenAmount) * BigInt(10 ** 6) : 0n,
    initialMockChains: initialMockChains,
  });
  const hasSellEstimate = debouncedTokenAmount !== "0" && sellEstimateResult.data;
  const estimatedQuoteTokenAmount = hasSellEstimate
    ? formatUnits(sellEstimateResult.data as bigint, quoteTokenInfo.decimals) + " " + quoteTokenInfo.symbol
    : "";
  return (
    <Stack direction="column" spacing={2} justifyContent="center" alignItems="center" sx={{ marginTop: 4 }}>
      <ZTokenInput
        baseTokenAddress={baseTokenAddress}
        baseTokenInfo={baseTokenInfo}
        isBuy={false}
        onChange={onChange}
        value={tokenAmount}
      />
      <Typography sx={{ minHeight: "24px" }}>{estimatedQuoteTokenAmount}</Typography>
      {isObserverOperatorSet && (
        <Button
          variant="contained"
          disabled={tokenAmount === ""}
          onClick={() =>
            buyQuoteAssetToken(baseTokenAddress, BigInt(tokenAmount ? BigInt(tokenAmount) * BigInt(10 ** 6) : 0n))
          }
        >
          Encrypted Sell {baseTokenInfo.symbol}
        </Button>
      )}
      {!isObserverOperatorSet && (
        <Tooltip title="Bonding Curve Requires Observer & Operator Access To Conduct The Trade">
          <Button
            loading={isApprovalLoading}
            variant="contained"
            onClick={getObserverOperatorAccessOnQuoteAndBaseToken}
          >
            Get Observer and Operator Access
          </Button>
        </Tooltip>
      )}
    </Stack>
  );
};
