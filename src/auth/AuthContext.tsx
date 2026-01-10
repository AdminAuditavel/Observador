// src/auth/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type AuthContextType = {
  user: any | null; // auth user merged with profile fields (e.g. role, avatar_url)
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function init() {
      setLoading(true);

      try {
        // 1) Se houver token no fragmento da URL (ex: #access_token=...), finalize a sessão no cliente:
        // supabase-js v2: getSessionFromUrl(); se você usa v1, adapte conforme SDK.
        if (typeof window !== "undefined" && window.location.hash.includes("access_token")) {
          try {
            // This will parse the fragment and set the session in the client
            await (supabase.auth as any).getSessionFromUrl?.();
            // Remove fragment to keep URL clean
            history.replaceState(null, document.title, window.location.pathname + window.location.search);
          } catch (err) {
            // ignore parse errors
            console.warn("getSessionFromUrl error", err);
          }
        }

        // 2) Get current session user (if any)
        const { data: userData } = await supabase.auth.getUser();
        const authUser = userData?.user ?? null;

        if (!authUser) {
          if (!mounted) return;
          setUser(null);
          setLoading(false);
          return;
        }

        // 3) Fetch profile row and merge role/avatar etc.
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, display_name, role, avatar_url, contact_email, contact_phone, organization, notes")
          .eq("id", authUser.id)
          .single();

        if (profileError) {
          // If profile missing, still provide authUser
          console.warn("profile fetch error", profileError);
          if (!mounted) return;
          setUser({ ...authUser });
          setLoading(false);
          return;
        }

        // merge profile fields onto auth user object for convenience
        const merged = { ...authUser, profile: profileData, role: profileData?.role, avatar_url: profileData?.avatar_url };
        if (!mounted) return;
        setUser(merged);
      } catch (err) {
        console.error("Auth init error", err);
        if (!mounted) return;
        setUser(null);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    init();

    // subscribe to auth changes to update user in realtime
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // session?.user may be null on logout
      if (session?.user) {
        // fetch profile and merge as above
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, display_name, role, avatar_url, contact_email, contact_phone, organization, notes")
          .eq("id", session.user.id)
          .maybeSingle();
        const merged = { ...session.user, profile: profileData ?? null, role: profileData?.role, avatar_url: profileData?.avatar_url };
        setUser(merged);
      } else {
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
