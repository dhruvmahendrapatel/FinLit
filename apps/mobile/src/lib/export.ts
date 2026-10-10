import { serializeExport, toISODate, type FamilyState } from "@finlit/core";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

export type ExportOutcome = "shared" | "downloaded" | "unavailable";

/** Hand the family a portable JSON copy of their data (DPDP access/portability). */
export async function shareFamilyExport(state: FamilyState): Promise<ExportOutcome> {
  const json = serializeExport(state, new Date().toISOString());
  const name = `chillar-export-${toISODate(new Date())}.json`;

  if (Platform.OS === "web") {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = name;
    anchor.click();
    URL.revokeObjectURL(url);
    return "downloaded";
  }

  const file = new File(Paths.cache, name);
  file.write(json);
  if (!(await Sharing.isAvailableAsync())) return "unavailable";
  await Sharing.shareAsync(file.uri, { mimeType: "application/json", dialogTitle: "Export Chillar data" });
  return "shared";
}
