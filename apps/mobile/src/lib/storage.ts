/**
 * Chore proof photos in Supabase Storage (private bucket `chore-proofs`).
 * URIs stored in FamilyState look like `supabase://chore-proofs/<family>/<chore>/<file>` so the
 * document stays portable; `resolveProofUri` turns them into short-lived signed URLs for display.
 * Everything falls back to the local file URI when the family is not linked to the cloud.
 */
import { File } from "expo-file-system";
import { Platform } from "react-native";

import { supabase } from "./supabase";
import { useSyncStore } from "@/store/sync-store";

export const PROOF_BUCKET = "chore-proofs";
const SCHEME = `supabase://${PROOF_BUCKET}/`;
const SIGNED_TTL_SECONDS = 60 * 60;

const signedCache = new Map<string, { url: string; expiresAt: number }>();

export function isRemoteProof(uri: string | undefined): boolean {
  return !!uri && uri.startsWith(SCHEME);
}

async function readImage(uri: string): Promise<{ body: ArrayBuffer; contentType: string }> {
  if (Platform.OS === "web") {
    const blob = await (await fetch(uri)).blob();
    return { body: await blob.arrayBuffer(), contentType: blob.type || "image/jpeg" };
  }
  const file = new File(uri);
  return { body: await file.arrayBuffer(), contentType: file.type ?? "image/jpeg" };
}

function extensionFor(contentType: string): string {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("heic")) return "heic";
  return "jpg";
}

/**
 * Upload a local proof photo for `choreId`. Returns the `supabase://` reference when the family is
 * synced to the cloud, otherwise (or on any failure) the original local URI so the flow never blocks.
 */
export async function uploadChoreProof(localUri: string, choreId: string): Promise<{ uri: string; uploaded: boolean }> {
  const sync = useSyncStore.getState();
  if (!supabase || sync.status !== "ready" || !sync.familyId) return { uri: localUri, uploaded: false };
  try {
    const { body, contentType } = await readImage(localUri);
    const path = `${sync.familyId}/${choreId}/${Date.now()}.${extensionFor(contentType)}`;
    const { error } = await supabase.storage.from(PROOF_BUCKET).upload(path, body, { contentType, upsert: false });
    if (error) return { uri: localUri, uploaded: false };
    return { uri: `${SCHEME}${path}`, uploaded: true };
  } catch {
    return { uri: localUri, uploaded: false };
  }
}

/** Display URL for a stored proof URI: signed URL for cloud photos, pass-through for local files. */
export async function resolveProofUri(uri: string): Promise<string | null> {
  if (!isRemoteProof(uri)) return uri;
  if (!supabase) return null;
  const path = uri.slice(SCHEME.length);
  const cached = signedCache.get(path);
  if (cached && cached.expiresAt > Date.now() + 30_000) return cached.url;
  const { data, error } = await supabase.storage.from(PROOF_BUCKET).createSignedUrl(path, SIGNED_TTL_SECONDS);
  if (error || !data) return null;
  signedCache.set(path, { url: data.signedUrl, expiresAt: Date.now() + SIGNED_TTL_SECONDS * 1000 });
  return data.signedUrl;
}
