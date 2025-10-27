"use client";

import { useParams } from "next/navigation";
import { Address } from "viem";
import { Token } from "~~/components/Token";

export default function TokenPage() {
  const { address } = useParams();
  return <Token address={address as Address} />;
}
