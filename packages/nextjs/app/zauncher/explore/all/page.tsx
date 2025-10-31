"use client";

import { useEffect, useState } from "react";
import { Container, Skeleton, Stack } from "@mui/material";
import { AllZauncherTokens } from "~~/components/AllZauncherTokens";

export default function AllTokensPage() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  return isMounted ? (
    <AllZauncherTokens />
  ) : (
    <Container maxWidth="md">
      <Skeleton variant="rectangular" width="100%" height={300} sx={{ borderRadius: 2 }} />
    </Container>
  );
}
