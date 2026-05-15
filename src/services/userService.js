import { supabase } from "../supabase";

export async function getDisplayName(userId) {
  const { data } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", userId)
    .single();
  return data?.display_name || null;
}

export async function getUserName(userId) {
  const { data } = await supabase
    .from("users")
    .select("username")
    .eq("id", userId)
    .single();
  return data?.username || null;
}

export async function createUserProfile() {}

export async function getUserProfile() {}
