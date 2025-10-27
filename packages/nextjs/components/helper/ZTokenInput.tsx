import { useState } from "react";
import { Box, InputAdornment, TextField, Typography } from "@mui/material";
import { Address } from "viem";
import { TokenInfo } from "~~/types/tokenInfo";
import quoteTokenInfo from "~~/utils/helper/quoteTokenInfo";

export const ZTokenInput = ({
  address,
  baseTokenInfo,
  isBuy,
}: {
  address: Address;
  baseTokenInfo: TokenInfo;
  isBuy: boolean;
}) => {
  const [tokenAmount, setTokenAmount] = useState<string>("");
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^[0-9]*$/.test(value)) {
      setTokenAmount(value);
    }
  };
  return (
    <Box>
      <TextField
        placeholder="0.0"
        value={tokenAmount}
        onChange={onChange}
        type="text"
        slotProps={{
          input: {
            inputProps: {
              inputMode: "numeric",
              pattern: "[0-9]*",
            },
            endAdornment: (
              <InputAdornment position="end">
                <Typography>{isBuy ? quoteTokenInfo.symbol : baseTokenInfo.symbol}</Typography>
              </InputAdornment>
            ),
          },
        }}
      />
    </Box>
  );
};
