import { useState, useEffect } from "react";
import {
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
} from "../services/userService";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export function validatePasswordChange(newPassword, confirmPassword) {
  if (newPassword !== confirmPassword) {
    return "Passwords are not matching!";
  } else if (newPassword.length < 6) {
    return "Password must be 6 characters long!";
  }
  return null;
}

function Profile() {
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("en");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { currentUser, updatePassword, refreshDisplayName, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const userProfileData = await getUserProfile(currentUser.id);
        setUsername(userProfileData.username);
        setDisplayName(userProfileData.display_name);
        setPreferredLanguage(userProfileData.preferred_language);
      } catch (error) {
        console.error("Error displaying your profile:", error);
      }
    };
    loadUserProfile();
  }, [currentUser]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);

    try {
      await updateUserProfile(currentUser.id, {
        username,
        display_name: displayName,
        preferred_language: preferredLanguage,
      });
      setProfileMessage("Profile successfully updated!");
      refreshDisplayName();
    } catch (error) {
      console.error("Error updating profile:", error);
      setProfileMessage(
        "There was an error updating your profile. Please try again!",
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setSavingPassword(true);
    try {
      const error = validatePasswordChange(newPassword, confirmPassword);
      if (error) {
        setPasswordMessage(error);
        setSavingPassword(false);
        return;
      }

      await updatePassword(newPassword);
      setPasswordMessage("Success updating your password!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error updating password:", error);
      setPasswordMessage("Error updating your password. Please try again!");
    } finally {
      setSavingPassword(false);
    }
  };

  async function handleDeleteAccount() {
    try {
      await deleteUserProfile(currentUser.id);
      console.log("Account deleted successfully");
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Error deleting your account:", error);
    }
  }

  return (
    <div className="profile">
      <div className="profile-form">
        <form>
          <input
            type="text"
            id="username"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="text"
            id="display_name"
            name="display_name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
          <select
            name="preferred_language"
            id="preferred_language"
            value={preferredLanguage}
            onChange={(e) => setPreferredLanguage(e.target.value)}
          >
            <option value="en">English</option>
          </select>
        </form>
        <button
          type="button"
          onClick={handleSaveProfile}
          disabled={savingProfile}
        >
          Save Profile
        </button>

        {profileMessage && <p>{profileMessage}</p>}
      </div>
      <div className="password-form">
        <form>
          <input
            type="password"
            id="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <input
            type="password"
            id="confirm_password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </form>
        <button
          type="button"
          onClick={handleChangePassword}
          disabled={savingPassword}
        >
          Save Password
        </button>

        {passwordMessage && <p>{passwordMessage}</p>}
      </div>
      <button onClick={() => setShowDeleteModal(true)}>Delete Account</button>
      {showDeleteModal && (
        <div className="delete-modal">
          <div className="message">
            <h3>
              This is permanent and cannot be undone. Are you sure you want to
              delete your account?
            </h3>
          </div>
          <div className="buttons">
            <button onClick={() => setShowDeleteModal(false)}>Cancel</button>
            <button onClick={handleDeleteAccount}>Confirm Delete</button>
          </div>
        </div>
      )}
    </div>
  );
}
export default Profile;
