"use client";

import { useParams } from "next/navigation";
import ApplicationsPage from "../../applications/page";

const STAGING_MAP: Record<string, string> = {
  onhand: "Onhand",
  akad: "Akad",
  sppk: "SPPK",
  inproses: "Inproses",
  "reject-cancel": "Reject/Cancel",
};

export default function StagingPage() {
  const params = useParams<{ staging?: string }>();
  const raw = typeof params?.staging === "string" ? params.staging : "";
  const key = raw.toLowerCase();
  const staging = STAGING_MAP[key];

  return <ApplicationsPage initialStaging={staging} />;
}
