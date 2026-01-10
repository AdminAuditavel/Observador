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

  // helper to fetch profile and merge into auth user object
  async function fetchAndMergeProfile(authUser: any) {
    if (!authUser?.id) return { ...authUser };

    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, display_name, role, avatar_url, contact_email, contact_phone, organization, notes")
        .eq("id", authUser.id)
        .maybeSingle();

      if (profileError) {
        console.warn("profile fetch error", profileError);
        return { ...authUser };
      }

      return {
        ...authUser,
        profile: profileData ?? null,
        role: profileData?.role,
        avatar_url: profileData?.avatar_url,
      };
    } catch (err) {
      console.error("fetchAndMergeProfile error", err);
      return { ...authUser };
    }
  }

  useEffect(() => {
    let mounted = true;
    let subscription: any = null;

    async function init() {
      setLoading(true);

      try {
        // If auth redirect returned tokens in the URL fragment, let Supabase client parse them.
        // supabase-js v2 exposes getSessionFromUrl; adapt if your SDK version differs.
        if (typeof window !== "undefined" && window.location.hash && window.location.hash.includes("access_token")) {
          try {
            // parse fragment and set session in client
            await (supabase.auth as any).getSessionFromUrl?.();
            // remove fragment to keep URL clean
            history.replaceState(null, document.title, window.location.pathname + window.location.search);
          } catch (err) {
            // Non-fatal: parsing may fail in some edge cases; continue
            console.warn("getSessionFromUrl error", err);
          }
        }

        // Get current authenticated user (if any)
        const { data: userData } = await supabase.auth.getUser();
        const authUser = userData?.user ?? null;

        if (!authUser) {
          if (!mounted) return;
          setUser(null);
          setLoading(false);
          return;
        }

        const merged = await fetchAndMergeProfile(authUser);
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

    // subscribe to auth state changes
    const sub = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (session?.user) {
          const merged = await fetchAndMergeProfile(session.user);
          setUser(merged);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("onAuthStateChange handler error", err);
        setUser(null);
      }
    });

    // keep subscription ref for cleanup
    subscription = (sub as any)?.data?.subscription ?? sub;

    return () => {
      mounted = false;
      try {
        subscription?.unsubscribe?.();
      } catch {
        // ignore
      }
    };
  }, []);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
