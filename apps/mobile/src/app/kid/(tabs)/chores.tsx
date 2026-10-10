import { commands } from "@finlit/core";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { ChoreCard } from "@/components/kid";
import { Chip, EmptyState, Screen, Text } from "@/components/ui";
import { useTheme } from "@/design";
import { useActiveKid, useChoresForKid } from "@/hooks/use-family";
import { useToday } from "@/hooks/use-today";
import { tryCommand } from "@/lib/errors";
import { useDispatch } from "@/store/family-store";
import { toast } from "@/store/toast-store";

type Tab = "todo" | "waiting" | "done";

export default function KidChores() {
  const { space } = useTheme();
  const router = useRouter();
  const kid = useActiveKid();
  const buckets = useChoresForKid(kid?.id);
  const today = useToday();
  const dispatch = useDispatch();
  const [tab, setTab] = useState<Tab>("todo");
  if (!kid || !buckets) return null;

  const claim = (id: string) => tryCommand(() => dispatch((s, now) => commands.claimChore(s, id, kid.id, now))) && toast({ title: "It's yours!", emoji: "💪" });
  const unclaim = (id: string) => tryCommand(() => dispatch((s) => commands.unclaimChore(s, id, kid.id)));
  const submit = (id: string) => router.push({ pathname: "/kid/chore/[id]", params: { id } });

  const todoCount = buckets.available.length + buckets.inProgress.length + buckets.needsRetry.length;
  const earnable = [...buckets.available, ...buckets.inProgress].reduce((s, c) => s + c.rewardPaise, 0);

  return (
    <Screen tabBarInset>
      <Text variant="title">Chores</Text>
      <Text variant="body" tone="muted">
        ₹{Math.round(earnable / 100)} up for grabs right now
      </Text>
      <View style={[styles.tabs, { marginTop: space.lg }]}>
        <Chip label={`To do · ${todoCount}`} selected={tab === "todo"} onPress={() => setTab("todo")} />
        <Chip label={`Waiting · ${buckets.awaitingApproval.length}`} selected={tab === "waiting"} onPress={() => setTab("waiting")} />
        <Chip label="Done" selected={tab === "done"} onPress={() => setTab("done")} />
      </View>

      <View style={{ gap: space.md, marginTop: space.lg }}>
        {tab === "todo" ? (
          <>
            {buckets.needsRetry.map((c) => (
              <ChoreCard key={c.id} chore={c} today={today} actionLabel="Fixed it, check again" onAction={() => submit(c.id)} />
            ))}
            {buckets.inProgress.map((c) => (
              <ChoreCard key={c.id} chore={c} today={today} actionLabel="Mark done ✅" onAction={() => submit(c.id)} secondaryLabel="Not today" onSecondary={() => unclaim(c.id)} />
            ))}
            {buckets.available.map((c) => (
              <ChoreCard key={c.id} chore={c} today={today} actionLabel="I'll do it!" onAction={() => claim(c.id)} />
            ))}
            {todoCount === 0 ? <EmptyState emoji="🏖️" title="Nothing to do" body="Ask your parents to post a chore, or enjoy the break!" /> : null}
          </>
        ) : null}
        {tab === "waiting" ? (
          <>
            {buckets.awaitingApproval.map((c) => (
              <ChoreCard key={c.id} chore={c} today={today} />
            ))}
            {buckets.awaitingApproval.length === 0 ? <EmptyState emoji="📭" title="Nothing waiting" body="Finished chores show up here until a parent approves them." /> : null}
          </>
        ) : null}
        {tab === "done" ? (
          <>
            {buckets.done.map((c) => (
              <ChoreCard key={c.id} chore={c} today={today} />
            ))}
            {buckets.done.length === 0 ? <EmptyState emoji="🌱" title="No chores done yet" body="Your first approved chore will appear here." /> : null}
          </>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
});
