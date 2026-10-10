import { AppTabs } from "@/components/navigation/TabBar";

export default function KidTabsLayout() {
  return (
    <AppTabs
      tabs={[
        { name: "index", href: "/kid", label: "Home", icon: "home-outline", activeIcon: "home" },
        { name: "chores", href: "/kid/chores", label: "Chores", icon: "checkbox-outline", activeIcon: "checkbox" },
        { name: "goals", href: "/kid/goals", label: "Goals", icon: "flag-outline", activeIcon: "flag" },
        { name: "learn", href: "/kid/learn", label: "Learn", icon: "school-outline", activeIcon: "school" },
        { name: "shop", href: "/kid/shop", label: "Shop", icon: "gift-outline", activeIcon: "gift" },
      ]}
    />
  );
}
