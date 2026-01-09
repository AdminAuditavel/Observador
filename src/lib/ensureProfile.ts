import { supabase } from "./supabaseClient";

export async function ensureProfile() {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;

  const user = userData?.user;
  if (!user) return;

  // upsert básico: cria profile se não existir (role padrão "user")
  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      // role fica default 'user' no banco; não setar aqui evita sobrescrever
    },
    { onConflict: "id" }
  );

  if (error) throw error;
}
