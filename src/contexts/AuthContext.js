/*
Manages user authentication state and provides authentication functions such as signup, login, logout, and login with Google.
*/
import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../supabase";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function generateUniqueUsername() {
    let username;
    let isUnique = false;
    while (!isUnique) {
      username = "polyglot" + Math.floor(1000 + Math.random() * 9000);
      const { data } = await supabase
        .from("users")
        .select("id")
        .eq("username", username)
        .single();
      isUnique = !data;
    }
    return username;
  }

  // Runs independently — never blocks auth flow
  async function createProfileIfNeeded(user) {
    const isNewUser = new Date() - new Date(user.created_at) < 10000;
    if (!isNewUser) return;

    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!existing) {
      const username = await generateUniqueUsername();
      await supabase.from("users").insert({
        id: user.id,
        email: user.email,
        username,
        display_name:
          user.user_metadata?.full_name || user.user_metadata?.name || username,
        preferred_language: "en",
      });
    }
  }

  function signup(email, password) {
    return supabase.auth.signUp({ email, password });
  }

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error) return data;

    // Supabase login failed — try lazy Firebase migration for old users
    if (error.message === "Invalid login credentials") {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(
        `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/migrate-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
          signal: controller.signal,
        },
      );
      clearTimeout(timeout);

      if (!res.ok) throw new Error("Invalid email or password");

      const { data: retryData, error: retryError } =
        await supabase.auth.signInWithPassword({ email, password });
      if (retryError) throw retryError;
      return retryData;
    }

    throw error;
  }

  function loginWithGoogle() {
    return supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  }

  function logout() {
    return supabase.auth.signOut();
  }

  useEffect(() => {
    // Non-async callback — prevents deadlock with signInWithPassword
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setCurrentUser(session?.user ?? null);
      setLoading(false);

      // Fire profile creation independently — does not block auth resolution
      if (event === "SIGNED_IN" && session?.user) {
        createProfileIfNeeded(session.user);
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    loginWithGoogle,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
