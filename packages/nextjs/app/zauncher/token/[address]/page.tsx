"use client";

import { useParams } from "next/navigation";

export default function TokenPage() {
  const { address } = useParams();
  return <div>Token: {address}</div>;
}
