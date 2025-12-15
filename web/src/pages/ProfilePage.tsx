import React, { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import ProfilePictureUpload from "../components/common/ProfilePictureUpload";
import { useAuth } from "../context/AuthContext";
import * as authApi from "../services/auth.api";
import type { UpdateProfilePayload } from "../types/auth";
import useDocumentTitle from "../hooks/useDocumentTitle";

const ProfilePage: React.FC = () => {
  useDocumentTitle("Profile");

  const { user, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    organization: "",
    department: "",
    title: "",
    bio: "",
    location: "",
    timezone: "Pacific Standard Time (PST)",
  });

  // Initialize profile data from user object
  useEffect(() => {
    if (user) {
      const nameParts = user.full_name?.split(" ") || [];
      setProfileData({
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        email: user.email || "",
        phone: user.phone || "",
        organization: user.organization || "",
        department: user.department || "",
        title: user.title || "",
        bio: user.bio || "",
        location: user.location || "",
        timezone: user.timezone || "Pacific Standard Time (PST)",
      });
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const payload: UpdateProfilePayload = {
        full_name: `${profileData.firstName} ${profileData.lastName}`.trim(),
        phone: profileData.phone || undefined,
        organization: profileData.organization || undefined,
        department: profileData.department || undefined,
        title: profileData.title || undefined,
        bio: profileData.bio || undefined,
        location: profileData.location || undefined,
        timezone: profileData.timezone || undefined,
      };

      await authApi.updateProfile(payload);
      await refreshUser();

      setSaveMessage({
        type: "success",
        text: "Profile updated successfully!",
      });
      setIsEditing(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error("Failed to update profile:", error);
      setSaveMessage({
        type: "error",
        text: "Failed to update profile. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original data
    if (user) {
      const nameParts = user.full_name?.split(" ") || [];
      setProfileData({
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        email: user.email || "",
        phone: user.phone || "",
        organization: user.organization || "",
        department: user.department || "",
        title: user.title || "",
        bio: user.bio || "",
        location: user.location || "",
        timezone: user.timezone || "Pacific Standard Time (PST)",
      });
    }
    setIsEditing(false);
    setSaveMessage(null);
  };

  const timezones = [
    "Pacific Standard Time (PST)",
    "Mountain Standard Time (MST)",
    "Central Standard Time (CST)",
    "Eastern Standard Time (EST)",
    "Alaska Standard Time (AKST)",
    "Hawaii-Aleutian Standard Time (HST)",
    "Greenwich Mean Time (GMT)",
    "Central European Time (CET)",
    "Eastern European Time (EET)",
    "India Standard Time (IST)",
    "China Standard Time (CST)",
    "Japan Standard Time (JST)",
    "Australian Eastern Standard Time (AEST)",
  ];

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Profile Settings</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Manage your personal information and preferences
              </p>
            </div>
            <div className="flex gap-3">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 dark:bg-blue-700 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 dark:bg-blue-700 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Success/Error Message */}
          {saveMessage && (
            <div
              className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${
                saveMessage.type === "success"
                  ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
              }`}
            >
              {saveMessage.type === "success" ? (
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              <span className="font-medium">{saveMessage.text}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Picture & Quick Info */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 sticky top-6">
              <div className="text-center">
                <div className="mx-auto mb-6">
                  <ProfilePictureUpload
                    userId={user?.id || ""}
                    currentImageUrl={user?.profile_picture_url || undefined}
                    onUploadSuccess={async (imageUrl, thumbnailUrl) => {
                      await authApi.updateProfilePicture(
                        imageUrl,
                        thumbnailUrl
                      );
                      await refreshUser();
                    }}
                    onUploadError={(error) => {
                      console.error("Profile picture upload failed:", error);
                      setSaveMessage({
                        type: "error",
                        text: "Failed to upload profile picture",
                      });
                    }}
                    size="lg"
                  />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {profileData.firstName} {profileData.lastName}
                </h3>
                {profileData.title && (
                  <p className="text-blue-600 dark:text-blue-400 text-sm font-medium mt-1">
                    {profileData.title}
                  </p>
                )}
                {profileData.organization && (
                  <p className="text-slate-600 dark:text-slate-400 text-sm mt-0.5">
                    {profileData.organization}
                  </p>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex items-start gap-3 text-sm">
                  <svg
                    className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-slate-700 dark:text-slate-300 break-all">
                    {profileData.email}
                  </span>
                </div>
                {profileData.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <svg
                      className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <span className="text-slate-700 dark:text-slate-300">{profileData.phone}</span>
                  </div>
                )}
                {profileData.location && (
                  <div className="flex items-center gap-3 text-sm">
                    <svg
                      className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span className="text-slate-700 dark:text-slate-300">
                      {profileData.location}
                    </span>
                  </div>
                )}
                {user && (
                  <div className="flex items-center gap-3 text-sm">
                    <svg
                      className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-slate-700 dark:text-slate-300">
                      Member since{" "}
                      {new Date(user.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-600 dark:text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Personal Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    First Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          firstName: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-shadow"
                      placeholder="Enter first name"
                    />
                  ) : (
                    <p className="text-slate-900 dark:text-slate-200 py-2.5 px-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      {profileData.firstName || (
                        <span className="text-slate-400 dark:text-slate-500">Not set</span>
                      )}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Last Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          lastName: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-shadow"
                      placeholder="Enter last name"
                    />
                  ) : (
                    <p className="text-slate-900 dark:text-slate-200 py-2.5 px-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      {profileData.lastName || (
                        <span className="text-slate-400 dark:text-slate-500">Not set</span>
                      )}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={profileData.email}
                      disabled
                      className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-600 px-2 py-1 rounded">
                      Cannot be changed
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Phone Number
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          phone: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-shadow"
                      placeholder="+1 (555) 123-4567"
                    />
                  ) : (
                    <p className="text-slate-900 dark:text-slate-200 py-2.5 px-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      {profileData.phone || (
                        <span className="text-slate-400 dark:text-slate-500">Not set</span>
                      )}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Location
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.location}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          location: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-shadow"
                      placeholder="City, State/Country"
                    />
                  ) : (
                    <p className="text-slate-900 dark:text-slate-200 py-2.5 px-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      {profileData.location || (
                        <span className="text-slate-400 dark:text-slate-500">Not set</span>
                      )}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Timezone
                  </label>
                  {isEditing ? (
                    <select
                      value={profileData.timezone}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          timezone: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-shadow"
                    >
                      {timezones.map((tz) => (
                        <option key={tz} value={tz}>
                          {tz}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-slate-900 dark:text-slate-200 py-2.5 px-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      {profileData.timezone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-600 dark:text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Professional Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Organization
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.organization}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          organization: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-shadow"
                      placeholder="Company or institution name"
                    />
                  ) : (
                    <p className="text-slate-900 dark:text-slate-200 py-2.5 px-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      {profileData.organization || (
                        <span className="text-slate-400 dark:text-slate-500">Not set</span>
                      )}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Department
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.department}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          department: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-shadow"
                      placeholder="Department or team"
                    />
                  ) : (
                    <p className="text-slate-900 dark:text-slate-200 py-2.5 px-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      {profileData.department || (
                        <span className="text-slate-400 dark:text-slate-500">Not set</span>
                      )}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Job Title
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.title}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          title: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-shadow"
                      placeholder="Your role or position"
                    />
                  ) : (
                    <p className="text-slate-900 dark:text-slate-200 py-2.5 px-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      {profileData.title || (
                        <span className="text-slate-400 dark:text-slate-500">Not set</span>
                      )}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Bio
                  </label>
                  {isEditing ? (
                    <textarea
                      value={profileData.bio}
                      onChange={(e) =>
                        setProfileData({ ...profileData, bio: e.target.value })
                      }
                      rows={4}
                      className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-shadow resize-none"
                      placeholder="Tell us about yourself, your research interests, or professional background..."
                    />
                  ) : (
                    <p className="text-slate-900 dark:text-slate-200 py-2.5 px-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg min-h-[100px]">
                      {profileData.bio || (
                        <span className="text-slate-400 dark:text-slate-500">Not set</span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
