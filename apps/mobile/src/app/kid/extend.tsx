import { Redirect, useRouter } from "expo-router";
import { useEffect } from "react";

import { useSessionStore } from "@/store/session-store";
import { toast } from "@/store/toast-store";

/** Landing route after a parent enters their PIN from the time-up screen. */
export default function Extend() {
  const router = useRouter();
  const isUnlocked = useSessionStore((s) => s.isParentUnlocked);
  const grantExtension = useSessionStore((s) => s.grantExtension);
  const unlocked = isUnlocked();

  useEffect(() => {
    if (!unlocked) return;
    grantExtension(10);
    toast({ title: "10 more minutes unlocked", body: "Parent override for today", emoji: "⏰", tone: "success" });
    router.replace("/kid");
  }, [unlocked, grantExtension, router]);

  if (!unlocked) return <Redirect href={{ pathname: "/pin", params: { next: "/kid/extend" } }} />;
  return null;
}
