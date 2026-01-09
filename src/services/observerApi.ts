//src/services/observerApi.ts

import { supabase } from "@/lib/supabaseClient";

export type ObservationType =
  | "meteo_visual"
  | "runway"
  | "apron_ground"
  | "infrastructure"
  | "general";

export type Privacy = "public" | "collaborators";

export async function requireSession(nextPath?: string) {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!data.session) {
    // retorno para a UI decidir redirecionamento
    return { session: null as any, redirectTo: nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login" };
  }
  return { session: data.session, redirectTo: null as string | null };
}

/** Aeródromo por ICAO */
export async function getAerodromeByIcao(icao: string) {
  const { data, error } = await supabase
    .from("aerodromes")
    .select("id, icao, name, city, uf")
    .eq("icao", icao.toUpperCase())
    .single();

  if (error) throw error;
  return data;
}

/** Lista observações (RLS já filtra visibilidade) */
export async function listObservationsByAerodrome(aerodromeId: string, limit = 30) {
  const { data, error } = await supabase
    .from("observations")
    .select("id, created_at, event_time, type, caption, privacy, status, created_by")
    .eq("aerodrome_id", aerodromeId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

/** Mídias por lista de observações */
export async function listMediaByObservationIds(observationIds: string[]) {
  if (!observationIds.length) return [];
  const { data, error } = await supabase
    .from("observation_media")
    .select("id, observation_id, storage_bucket, storage_path, mime_type, bytes, created_at")
    .in("observation_id", observationIds)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/** Signed URL (bucket privado) */
export async function signedMediaUrl(bucket: string, path: string, expiresSeconds = 600) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresSeconds);
  if (error) throw error;
  return data?.signedUrl ?? null;
}

/** Criar observação + upload + registrar mídia (fluxo MVP) */
export async function createObservationWithImage(opts: {
  aerodromeId: string;
  type: ObservationType;
  caption?: string | null;
  privacy: Privacy;
  file: File;
}) {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  const user = userData?.user;
  if (!user) throw new Error("not authenticated");

  // 1) cria observation
  const { data: obs, error: obsErr } = await supabase
    .from("observations")
    .insert({
      created_by: user.id,
      aerodrome_id: opts.aerodromeId,
      type: opts.type,
      caption: (opts.caption ?? "").trim() || null,
      status: "published",
      privacy: opts.privacy,
      source: "user",
    })
    .select("id")
    .single();

  if (obsErr) throw obsErr;
  const observationId = (obs as any).id as string;

  // 2) upload no bucket privado
  const bucket = "observer-media";
  const safeName = (opts.file.name || "image.jpg")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "");
  const storagePath = `observations/${observationId}/${Date.now()}_${safeName}`;

  const { error: upErr } = await supabase.storage.from(bucket).upload(storagePath, opts.file, {
    contentType: opts.file.type,
    upsert: false,
  });
  if (upErr) throw upErr;

  // 3) registra mídia
  const { error: mErr } = await supabase.from("observation_media").insert({
    observation_id: observationId,
    media_type: "image",
    storage_bucket: bucket,
    storage_path: storagePath,
    mime_type: opts.file.type,
    bytes: opts.file.size,
  });
  if (mErr) throw mErr;

  return { observationId, storagePath };
}

/** Convite */
export async function createInvite() {
  const { data, error } = await supabase.rpc("create_invite", {
    role_to_grant: "collaborator",
    expires_in_hours: 168,
    max_uses: 1,
  });
  if (error) throw error;
  return data; // retorno é uma linha de invites
}

export async function acceptInvite(token: string) {
  const { error } = await supabase.rpc("accept_invite", { p_token: token });
  if (error) throw error;
}
