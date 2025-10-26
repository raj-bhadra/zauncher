import { Button, Typography } from "@mui/material";
import { formatUnits, parseUnits } from "viem";
import { useUsdc } from "~~/hooks/helper/useUsdcBalance";
import initialMockChains from "~~/utils/helper/initialChains";

// shows usdc balance
// has a button to mint usdc using usdc contract
export const Usdc = () => {
  const { readResult: usdcBalance, mintUsdc } = useUsdc({ initialMockChains });
  // 100 usdc
  const mintUsdcAmount = parseUnits("100", 6) as bigint;
  return (
    <>
      <Typography>USDC Balance: {formatUnits((usdcBalance?.data as bigint) ?? 0n, 6)}</Typography>
      <Button onClick={() => mintUsdc(mintUsdcAmount)}>Mint {formatUnits(mintUsdcAmount, 6)} USDC</Button>
    </>
  );
};
