import type { Metadata } from "next";
import { GuidedDemo } from "@/components/guided-demo";

export const metadata: Metadata = {
  title: "FleekFlow — guided demo",
  description:
    "A two-minute guided walkthrough: a supplier lists a wholesale lot in conversation, a buyer orders it, and a mismatch reaches a reviewer with the confirmed record attached.",
};

export default async function DemoPage({ searchParams }: PageProps<"/demo">) {
  const params = await searchParams;
  return <GuidedDemo autoplay={"autoplay" in params} />;
}
