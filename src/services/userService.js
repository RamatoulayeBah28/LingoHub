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

export async function getUserProfile(userId) {
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();
  return data || null;
}

export async function updateUserProfile(userId, fields) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  try {
    await supabase
      .from("users")
      .update({
        username: fields.username,
        display_name: fields.display_name,
        preferred_language: fields.preferred_language,
      })
      .eq("id", userId);
    return true;
  } catch (e) {
    console.error("Error updating user profile: ", e);
    return false;
  }
}

export async function deleteUserProfile(userId) {
  await supabase.from("users").delete().eq("id", userId);
}
