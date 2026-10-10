import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from "react-native";

import { Button, IconButton, Screen, Text } from "@/components/ui";
import { useTheme } from "@/design";
import { useOnboardingStore } from "@/store/onboarding-store";

function Field({ label, value, onChange, placeholder, keyboardType, hint }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; keyboardType?: "default" | "phone-pad"; hint?: string }) {
  const { colors, radius, fontFamily, space } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Text variant="label" tone="muted">
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textSoft}
        keyboardType={keyboardType ?? "default"}
        style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, fontFamily: fontFamily.semiBold, color: colors.text, paddingHorizontal: space.lg }]}
      />
      {hint ? (
        <Text variant="caption" tone="soft">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

export default function OnboardingParent() {
  const { space } = useTheme();
  const router = useRouter();
  const draft = useOnboardingStore();
  const [name, setName] = useState(draft.parentName);
  const [phone, setPhone] = useState(draft.phone);
  const [city, setCity] = useState(draft.city);
  const canContinue = name.trim().length > 1 && phone.replace(/\D/g, "").length >= 10;

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ gap: space.xl }}>
        <IconButton name="chevron-back" accessibilityLabel="Back" onPress={() => router.back()} />
        <View style={{ gap: space.xs }}>
          <Text variant="caption" tone="primary">
            Step 1 of 3
          </Text>
          <Text variant="title">Tell us about you</Text>
          <Text variant="body" tone="muted">
            You’re the account holder. Kids get their own profiles, no phone numbers needed.
          </Text>
        </View>
        <View style={{ gap: space.lg }}>
          <Field label="Your name" value={name} onChange={setName} placeholder="Priya Sharma" />
          <Field label="Mobile number" value={phone} onChange={setPhone} placeholder="+91 98765 43210" keyboardType="phone-pad" hint="Used for login and alerts. Demo build: no OTP is sent." />
          <Field label="City" value={city} onChange={setCity} placeholder="Pune" />
        </View>
        <Button
          title="Continue"
          size="lg"
          full
          disabled={!canContinue}
          onPress={() => {
            const digits = phone.replace(/\D/g, "");
            const masked = `+91 ${digits.slice(-10, -8)}••• ••${digits.slice(-3)}`;
            draft.set({ parentName: name.trim(), phone: masked, city: city.trim(), familyName: `The ${name.trim().split(" ").slice(-1)[0] ?? ""} Family` });
            router.push("/onboarding/consent");
          }}
        />
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { height: 54, borderWidth: 1.5, fontSize: 16 },
});
