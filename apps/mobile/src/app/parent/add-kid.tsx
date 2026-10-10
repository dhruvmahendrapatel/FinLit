import { AddKidsFlow } from "@/components/flows/AddKidsFlow";

export default function ParentAddKid() {
  return <AddKidsFlow onDone="/parent/family" />;
}
