import { AddKidsFlow } from "@/components/flows/AddKidsFlow";

export default function OnboardingKids() {
  return <AddKidsFlow onDone="/who" stepLabel="Step 3 of 3" />;
}
