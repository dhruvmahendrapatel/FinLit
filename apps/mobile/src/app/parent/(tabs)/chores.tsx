import { commands, formatINR } from "@finlit/core";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { ChoreCard } from "@/components/kid";
import { ApprovalCard, LoanRequestCard } from "@/components/parent";
import { Button, Chip, EmptyState, Screen, Text } from "@/components/ui";
import { useTheme } from "@/design";
import { useToday } from "@/hooks/use-today";
import { tryCommand } from "@/lib/errors";
import { useDispatch, useFamilyState } from "@/store/family-store";
import { toast } from "@/store/toast-store";

type Tab = "approve" | "active" | "done";

export default function ParentChores() {
  const { space } = useTheme();
  const router = useRouter();
  const state = useFamilyState();
  const today = useToday();
  const dispatch = useDispatch();
  const [tab, setTab] = useState<Tab>("approve");
  const nameOf = (id: string | null | undefined) => (id ? state.kids.find((k) => k.id === id)?.name : undefined);

  const groups = useMemo(() => {
    const submitted = state.chores.filter((c) => c.status === "submitted");
    const loans = state.loans.filter((l) => l.status === "requested");
    const active = state.chores.filter((c) => c.status === "open" || c.status === "claimed" || c.status === "rejected").sort((a, b) => (a.dueOn ?? "9999").localeCompare(b.dueOn ?? "9999"));
    const done = state.chores.filter((c) => c.status === "approved").sort((a, b) => (b.resolvedAt ?? "").localeCompare(a.resolvedAt ?? "")).slice(0, 20);
    return { submitted, active, done, loans };
  }, [state.chores, state.loans]);

  const approve = (id: string) =>
    tryCommand(() => {
      const res = dispatch((s, now) => commands.approveChore(s, id, now));
      toast({ title: `Paid ${formatINR(res.paidPaise, { showPaise: false })} to ${nameOf(res.kidId) ?? "kid"}`, emoji: "🎉", tone: "success" });
    });
  const reject = (id: string) => tryCommand(() => dispatch((s, now) => commands.rejectChore(s, id, "Have another look and try again", now))) && toast({ title: "Sent back for another go", emoji: "🔁" });
  const remove = (id: string) => tryCommand(() => dispatch((s) => commands.deleteChore(s, id))) && toast({ title: "Chore removed", emoji: "🗑️" });
  const approveLoan = (id: string, rate: number) => tryCommand(() => dispatch((s, now) => commands.approveLoan(s, id, rate, now))) && toast({ title: "Loan approved", emoji: "🏦", tone: "success" });
  const declineLoan = (id: string) => tryCommand(() => dispatch((s, now) => commands.declineLoan(s, id, "Let’s save up for it first", now))) && toast({ title: "Loan declined", emoji: "🙅" });

  return (
    <Screen tabBarInset>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text variant="title">Chores</Text>
          <Text variant="body" tone="muted">
            Post work, approve it, pay it
          </Text>
        </View>
        <Button title="Post a chore" size="sm" onPress={() => router.push("/parent/chore/new")} />
      </View>
      <View style={[styles.tabs, { marginTop: space.lg }]}>
        <Chip label={`To approve · ${groups.submitted.length + groups.loans.length}`} selected={tab === "approve"} onPress={() => setTab("approve")} tone={groups.submitted.length + groups.loans.length ? "warning" : "neutral"} />
        <Chip label={`Active · ${groups.active.length}`} selected={tab === "active"} onPress={() => setTab("active")} />
        <Chip label="Paid" selected={tab === "done"} onPress={() => setTab("done")} />
      </View>

      <View style={{ gap: space.md, marginTop: space.lg }}>
        {tab === "approve" ? (
          groups.submitted.length + groups.loans.length ? (
            <>
              {groups.submitted.map((c) => (
                <ApprovalCard key={c.id} chore={c} kid={state.kids.find((k) => k.id === c.claimedBy)} onApprove={() => approve(c.id)} onReject={() => reject(c.id)} />
              ))}
              {groups.loans.map((l) => (
                <LoanRequestCard key={l.id} loan={l} kid={state.kids.find((k) => k.id === l.kidId)} onApprove={(rate) => approveLoan(l.id, rate)} onDecline={() => declineLoan(l.id)} />
              ))}
            </>
          ) : (
            <EmptyState emoji="✅" title="Nothing to approve" body="When a kid marks a chore done or asks for a loan, it lands here." />
          )
        ) : null}
        {tab === "active" ? (
          groups.active.length ? (
            groups.active.map((c) => (
              <ChoreCard
                key={c.id}
                chore={c}
                today={today}
                assigneeName={nameOf(c.claimedBy ?? c.kidId) ?? "Any kid"}
                {...(c.status === "open" ? { secondaryLabel: "Remove", onSecondary: () => remove(c.id) } : {})}
              />
            ))
          ) : (
            <EmptyState emoji="🧹" title="No open chores" body="Post one and set a reward." actionLabel="Post a chore" onAction={() => router.push("/parent/chore/new")} />
          )
        ) : null}
        {tab === "done" ? (
          groups.done.length ? (
            groups.done.map((c) => <ChoreCard key={c.id} chore={c} today={today} assigneeName={nameOf(c.claimedBy)} />)
          ) : (
            <EmptyState emoji="🌱" title="No paid chores yet" />
          )
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  tabs: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
});
