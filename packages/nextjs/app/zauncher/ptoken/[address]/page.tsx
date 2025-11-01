"use client";

import { useParams } from "next/navigation";
import { Address } from "viem";
import { PToken } from "~~/components/PToken";

export default function PTokenPage() {
  const { address } = useParams();
  return <PToken address={address as Address} />;
}
