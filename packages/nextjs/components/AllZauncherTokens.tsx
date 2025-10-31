"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ExploreIcon from "@mui/icons-material/Explore";
import LaunchIcon from "@mui/icons-material/Launch";
import { Alert, AlertTitle, Box, Button, Container, Paper, Stack, Typography } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useConfidentialTokenFactoryTokens } from "~~/hooks/helper/useConfidentialTokenFactory";
import initialMockChains from "~~/utils/helper/initialChains";

interface TokenInfo {
  name: string;
  symbol: string;
  tokenAddress: string;
  createdBy: string;
}

const formatAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}` as string;
};

const columns: GridColDef[] = [
  {
    field: "name",
    headerName: "Name",
    width: 150,
    // make it take max space
    flex: 1,
  },
  {
    field: "symbol",
    headerName: "Symbol",
    width: 100,
  },
  {
    field: "tokenAddress",
    headerName: "Token Address",
    width: 350,
    renderCell: params => {
      // show formatted addres and copy on click
      return formatAddress(params.value);
    },
  },
  {
    field: "createdBy",
    headerName: "Creator Address",
    width: 350,
    renderCell: params => {
      return <span>{formatAddress(params.value)}</span>;
    },
  },
];

export const AllZauncherTokens = () => {
  const router = useRouter();
  const navigate = (path: string) => {
    router.push(path);
  };
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  const { tokenCountResult, readPaginatedTokenInfosResult } = useConfidentialTokenFactoryTokens({
    initialMockChains,
    page: 0,
    pageSize: 10,
  });
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const tokenCountLoading = tokenCountResult.isLoading;
  const isTokenCountZero = tokenCountResult.isFetched && tokenCountResult.data === 0n;
  const rows = useMemo(() => {
    return (readPaginatedTokenInfosResult.data as TokenInfo[])?.map(token => ({
      id: token.tokenAddress,
      name: token.name,
      symbol: token.symbol,
      tokenAddress: token.tokenAddress,
      createdBy: token.createdBy,
    }));
  }, [readPaginatedTokenInfosResult.data]);
  return (
    <Container>
      <Paper variant="outlined" sx={{ padding: 2 }}>
        <Stack direction="column" spacing={2} sx={{ minHeight: "300px" }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <ExploreIcon fontSize="large" />
            <Typography variant="h2">Explore</Typography>
          </Stack>
          <Typography variant="body1">View and trade ERC 7984 tokens</Typography>
          {isTokenCountZero && !tokenCountLoading && (
            <Alert
              severity="success"
              action={
                isMounted ? (
                  <Link href="/zauncher/zaunch">
                    <Button color="inherit" size="large" startIcon={<LaunchIcon />}>
                      Zaunch
                    </Button>
                  </Link>
                ) : null
              }
            >
              <AlertTitle>No tokens found</AlertTitle>
              <Typography variant="body1">Zaunch a token to get started</Typography>
            </Alert>
          )}
          {!isTokenCountZero && !tokenCountLoading && (
            // disable filtering and sorting
            <Box>
              <DataGrid
                onRowClick={params => {
                  navigate(`/zauncher/token/${params.row.id}`);
                }}
                rows={rows}
                columns={columns}
                paginationModel={paginationModel}
                pageSizeOptions={[5]}
                onPaginationModelChange={setPaginationModel}
                loading={readPaginatedTokenInfosResult.isLoading}
                disableColumnFilter={true}
                disableColumnSorting={true}
                disableColumnMenu={true}
                sx={{
                  "& .MuiDataGrid-row:hover": {
                    cursor: "pointer",
                  },
                  // "--DataGrid-overlayHeight": "300px",
                }}
                autoHeight={true}
              />
            </Box>
          )}
        </Stack>
      </Paper>
    </Container>
  );
};
