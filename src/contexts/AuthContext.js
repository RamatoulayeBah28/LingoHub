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

  function signup(email, password) {
    return supabase.auth.signUp({ email, password });
  }

  async function login(email, password) {
    // try supabase login first
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!error) return data;

    // if failed try lazy firebase migration
    if (error.message === "Invalid login credentials") {
      const res = await fetch(
        `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/migrate-password`,
        {
          method: "POST",
          headers: { " Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        },
      );
      if (!res.ok) {
        throw new Error("Invalid email or password");
      }
      // migration successful
      const { data: retryData, error: retryError } =
        await supabase.auth.signInWithPassword({ email, password });
      if (retryError) {
        throw retryError;
      }
      return retryData;
    }
    throw error;
  }

  function loginWithGoogle() {
    return supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
  }

  function logout() {
    return supabase.auth.signOut();
  }

  useEffect(() => {
    const unsubscribe = supabase.auth.onAuthStateChange((event, session) => {
      setCurrentUser(session?.user ?? null);
      setLoading(false);
    });

    return unsubscribe;
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
