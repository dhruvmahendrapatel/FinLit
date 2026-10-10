import { Directory, File, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

export type PhotoSource = "camera" | "library";

export type PhotoResult = { status: "ok"; uri: string } | { status: "cancelled" } | { status: "denied" };

/**
 * Pick a proof photo for a chore. Native photos are copied into the app's document
 * directory so they survive cache clears; on web the picker's URI is used as-is.
 */
export async function captureProofPhoto(source: PhotoSource): Promise<PhotoResult> {
  const useCamera = source === "camera" && Platform.OS !== "web";
  if (useCamera) {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return { status: "denied" };
  }
  const result = useCamera
    ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.4, allowsEditing: false })
    : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.4, allowsMultipleSelection: false });
  if (result.canceled) return { status: "cancelled" };
  const asset = result.assets[0];
  if (!asset) return { status: "cancelled" };
  if (Platform.OS === "web") return { status: "ok", uri: asset.uri };
  return { status: "ok", uri: persistPhoto(asset.uri) };
}

function persistPhoto(uri: string): string {
  try {
    const dir = new Directory(Paths.document, "chore-proofs");
    if (!dir.exists) dir.create();
    const src = new File(uri);
    const dest = new File(dir, `${Date.now()}.jpg`);
    src.copy(dest);
    return dest.uri;
  } catch {
    return uri;
  }
}
