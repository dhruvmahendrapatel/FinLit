import { isOnboarded } from "@finlit/core";
import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { kidTheme } from "@/design";
import { useFamilyStore } from "@/store/family-store";

export default function Index() {
  const hydrated = useFamilyStore((s) => s.hydrated);
  const state = useFamilyStore((s) => s.state);
  if (!hydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={kidTheme.colors.primary} />
      </View>
    );
  }
  return <Redirect href={isOnboarded(state) ? "/who" : "/welcome"} />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: kidTheme.colors.bg },
});
