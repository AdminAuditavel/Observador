// src/lib/signup.ts

import { supabase } from "./supabaseClient";
import { validateInviteToken } from "./validation";

export async function signupWithInvite(email: string, password: string, inviteToken: string | null) {
  try {
    // Se existir um código de convite, validá-lo
    let role = "user";  // Default role
    if (inviteToken) {
      role = await validateInviteToken(inviteToken);
    }

    // Criar o usuário no Supabase
    const { user, error: signupError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signupError) {
      throw signupError;
    }

    // Atualizar o perfil do usuário com a role atribuída
    if (user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ role })
        .eq("id", user.id);  // Atualiza o perfil com a role

      if (profileError) {
        throw profileError;
      }
    }

    return user; // Retornar o usuário após cadastro
  } catch (error: any) {
    console.error("Erro no cadastro:", error);
    throw new Error("Erro ao cadastrar o usuário");
  }
}
