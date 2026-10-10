import { AppTabs } from "@/components/navigation/TabBar";
import { usePendingApprovals } from "@/hooks/use-family";

export default function ParentTabsLayout() {
  const approvals = usePendingApprovals();
  return (
    <AppTabs
      tabs={[
        { name: "index", href: "/parent", label: "Home", icon: "home-outline", activeIcon: "home" },
        { name: "chores", href: "/parent/chores", label: "Chores", icon: "checkbox-outline", activeIcon: "checkbox", ...(approvals.count > 0 ? { badge: approvals.count } : {}) },
        { name: "learn", href: "/parent/learn", label: "Learn", icon: "school-outline", activeIcon: "school" },
        { name: "family", href: "/parent/family", label: "Family", icon: "people-outline", activeIcon: "people" },
      ]}
    />
  );
}
