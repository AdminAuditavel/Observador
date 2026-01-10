// src/lib/validation.ts

import { supabase } from "./supabaseClient";

export async function validateInviteToken(token: string) {
  const { data, error } = await supabase
    .from("invites")
    .select("role, is_valid")
    .eq("code", token)
    .single();

  if (error) {
    console.error("Erro ao validar token de convite:", error);
    throw new Error("Token de convite inválido");
  }

  if (!data || !data.is_valid) {
    throw new Error("Convite inválido ou expirado");
  }

  return data.role;  // Retorna a role do colaborador ou moderador
}
