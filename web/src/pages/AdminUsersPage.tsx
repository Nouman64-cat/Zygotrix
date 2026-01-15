import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import * as adminApi from "../services/admin.api";
import type {
  AdminUserListItem,
  AdminUserStats,
  UserRole,
} from "../types/auth";
import type { AdminUserFilters } from "../services/admin.api";
import useDocumentTitle from "../hooks/useDocumentTitle";

const AdminUsersPage: React.FC = () => {
  useDocumentTitle("User Management");

  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [stats, setStats] = useState<AdminUserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive" | "">(
    ""
  );

  // Modal states
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showLoginHistoryModal, setShowLoginHistoryModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserListItem | null>(
    null
  );
  const [deactivateReason, setDeactivateReason] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("user");

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState<{
    new_user_registration_email_enabled: boolean;
  } | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);

  const isSuperAdmin = currentUser?.user_role === "super_admin";
  const isAdmin = currentUser?.user_role === "admin" || isSuperAdmin;

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: AdminUserFilters = {
        page,
        page_size: pageSize,
      };

      if (searchTerm) filters.search = searchTerm;
      if (roleFilter) filters.role = roleFilter;
      if (statusFilter) filters.status = statusFilter;

      const response = await adminApi.fetchAdminUsers(filters);
      setUsers(response.users);
      setTotalPages(response.total_pages);
      setTotal(response.total);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch users";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, roleFilter, statusFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const statsData = await adminApi.fetchAdminStats();
      setStats(statsData);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }, []);

  const fetchNotificationSettings = useCallback(async () => {
    try {
      const settings = await adminApi.fetchChatbotSettings();
      setNotificationSettings({
        new_user_registration_email_enabled:
          settings.new_user_registration_email_enabled,
      });
    } catch (err) {
      console.error("Failed to fetch notification settings:", err);
    }
  }, []);

  const handleToggleRegistrationEmail = async () => {
    if (!notificationSettings) return;

    try {
      setSettingsLoading(true);
      const newValue =
        !notificationSettings.new_user_registration_email_enabled;
      await adminApi.updateChatbotSettings({
        new_user_registration_email_enabled: newValue,
      });
      setNotificationSettings({
        new_user_registration_email_enabled: newValue,
      });
      setSuccessMessage(
        `New user registration email notifications ${newValue ? "enabled" : "disabled"
        }.`
      );
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to update notification settings";
      setError(errorMessage);
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchStats();
      fetchNotificationSettings();
    }
  }, [isAdmin, fetchUsers, fetchStats, fetchNotificationSettings]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleDeactivate = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(selectedUser.id);
      await adminApi.deactivateUser(
        selectedUser.id,
        deactivateReason || undefined
      );
      setSuccessMessage(`User ${selectedUser.email} has been deactivated.`);
      setShowDeactivateModal(false);
      setDeactivateReason("");
      fetchUsers();
      fetchStats();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to deactivate user";
      setError(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivate = async (userId: string) => {
    try {
      setActionLoading(userId);
      await adminApi.reactivateUser(userId);
      setSuccessMessage("User has been reactivated.");
      fetchUsers();
      fetchStats();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to reactivate user";
      setError(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(selectedUser.id);
      await adminApi.deleteUser(selectedUser.id);
      setSuccessMessage(
        `User ${selectedUser.email} has been permanently deleted.`
      );
      setShowDeleteModal(false);
      fetchUsers();
      fetchStats();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete user";
      setError(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(selectedUser.id);
      await adminApi.updateUserRole(selectedUser.id, newRole);
      setSuccessMessage(`User role has been updated to ${newRole}.`);
      setShowRoleModal(false);
      fetchUsers();
      fetchStats();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update user role";
      setError(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "admin":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();

    // Both dates are already in the same timezone context when using Date objects
    // The issue was the ISO string from backend - ensure proper parsing
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    // Show relative time for recent activity
    if (diffSecs < 60) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    // Show date for older activity
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Auto-hide success messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
              Access Denied
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              User Management
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage users across Zygotrix Web and University
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 bg-white rounded-lg shadow dark:bg-gray-800">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Users
              </p>
              <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.total_users}
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow dark:bg-gray-800">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Active Users
              </p>
              <p className="mt-1 text-2xl font-semibold text-green-600 dark:text-green-400">
                {stats.active_users}
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow dark:bg-gray-800">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Inactive Users
              </p>
              <p className="mt-1 text-2xl font-semibold text-red-600 dark:text-red-400">
                {stats.inactive_users}
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow dark:bg-gray-800">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Admins / Super Admins
              </p>
              <p className="mt-1 text-2xl font-semibold text-purple-600 dark:text-purple-400">
                {stats.by_role.admin} / {stats.by_role.super_admin}
              </p>
            </div>
          </div>
        )}

        {/* Notification Settings */}
        {isSuperAdmin && notificationSettings && (
          <div className="p-4 bg-white rounded-lg shadow dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Email Notification Settings
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Receive email notifications when new users register
                </p>
              </div>
              <div className="flex items-center">
                <button
                  onClick={handleToggleRegistrationEmail}
                  disabled={settingsLoading}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 cursor-pointer ${notificationSettings.new_user_registration_email_enabled
                    ? "bg-indigo-600"
                    : "bg-gray-200 dark:bg-gray-600"
                    } ${settingsLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                  role="switch"
                  aria-checked={
                    notificationSettings.new_user_registration_email_enabled
                  }
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationSettings.new_user_registration_email_enabled
                      ? "translate-x-6"
                      : "translate-x-1"
                      }`}
                  />
                </button>
                <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {notificationSettings.new_user_registration_email_enabled
                    ? "Enabled"
                    : "Disabled"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {successMessage && (
          <div className="p-4 border border-green-200 rounded-lg bg-green-50 dark:bg-green-900/20 dark:border-green-800">
            <p className="text-green-800 dark:text-green-200">
              {successMessage}
            </p>
          </div>
        )}
        {error && (
          <div className="p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/20 dark:border-red-800">
            <p className="text-red-800 dark:text-red-200">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-600 underline dark:text-red-400"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="p-4 bg-white rounded-lg shadow dark:bg-gray-800">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as UserRole | "");
                setPage(1);
              }}
              className="px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as "active" | "inactive" | "");
                setPage(1);
              }}
              className="px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button
              type="submit"
              className="px-6 py-2 text-white transition-colors bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Search
            </button>
          </form>
        </div>

        {/* Users Table */}
        <div className="overflow-hidden bg-white rounded-lg shadow dark:bg-gray-800">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-b-2 border-indigo-600 rounded-full animate-spin"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500 dark:text-gray-400">
                No users found.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                      User
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                      Role
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                      Status
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                      Last Accessed
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                      Location / Browser
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase dark:text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.full_name || "—"}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </div>
                          {user.organization && (
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              {user.organization}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(
                            user.user_role
                          )}`}
                        >
                          {user.user_role.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(
                            user.is_active
                          )}`}
                        >
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={async () => {
                            try {
                              setActionLoading(user.id);
                              const newStatus = user.subscription_status === "pro" ? "free" : "pro";
                              await adminApi.updateUserSubscription(user.id, newStatus);
                              setSuccessMessage(`User subscription updated to ${newStatus.toUpperCase()}`);
                              fetchUsers();
                            } catch (err) {
                              const errorMessage = err instanceof Error ? err.message : "Failed to update subscription";
                              setError(errorMessage);
                            } finally {
                              setActionLoading(null);
                            }
                          }}
                          disabled={actionLoading === user.id}
                          className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full transition-colors ${user.subscription_status === "pro"
                              ? "bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:from-amber-500 hover:to-orange-600"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                            } disabled:opacity-50`}
                          title={`Click to switch to ${user.subscription_status === "pro" ? "Free" : "Pro"}`}
                        >
                          {user.subscription_status === "pro" ? (
                            <>
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              PRO
                            </>
                          ) : (
                            "Free"
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900 dark:text-white">
                            {user.last_accessed_at
                              ? formatDateTime(user.last_accessed_at)
                              : "Never"}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          {user.last_location && (
                            <div className="flex items-center gap-1 text-sm text-gray-900 dark:text-white">
                              <svg
                                className="w-3.5 h-3.5 text-gray-400"
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
                              <span>{user.last_location}</span>
                            </div>
                          )}
                          {user.last_browser && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                              <svg
                                className="w-3 h-3 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                                />
                              </svg>
                              <span>{user.last_browser}</span>
                            </div>
                          )}
                          {!user.last_location && !user.last_browser && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              —
                            </span>
                          )}
                          {/* Login History Button */}
                          {user.login_history &&
                            user.login_history.length > 0 && (
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowLoginHistoryModal(true);
                                }}
                                className="text-xs text-indigo-500 dark:text-indigo-400 mt-1 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline"
                              >
                                View {user.login_history.length} login(s)
                              </button>
                            )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-400">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                        <div className="flex justify-end space-x-2">
                          {/* Don't show actions for current user or super admins (unless current user is super admin) */}
                          {user.id !== currentUser?.id && (
                            <>
                              {user.is_active ? (
                                <button
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowDeactivateModal(true);
                                  }}
                                  disabled={
                                    actionLoading === user.id ||
                                    user.user_role === "super_admin"
                                  }
                                  className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title={
                                    user.user_role === "super_admin"
                                      ? "Cannot deactivate super admin"
                                      : "Deactivate user"
                                  }
                                >
                                  Deactivate
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleReactivate(user.id)}
                                  disabled={actionLoading === user.id}
                                  className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50"
                                >
                                  Reactivate
                                </button>
                              )}

                              {isSuperAdmin &&
                                user.user_role !== "super_admin" && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setSelectedUser(user);
                                        setNewRole(user.user_role as UserRole);
                                        setShowRoleModal(true);
                                      }}
                                      disabled={actionLoading === user.id}
                                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 disabled:opacity-50"
                                    >
                                      Role
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedUser(user);
                                        setShowDeleteModal(true);
                                      }}
                                      disabled={actionLoading === user.id}
                                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                                    >
                                      Delete
                                    </button>
                                  </>
                                )}
                            </>
                          )}
                          {user.id === currentUser?.id && (
                            <span className="italic text-gray-400 dark:text-gray-500">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && users.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 dark:bg-gray-800 dark:border-gray-700 sm:px-6">
              <div className="flex justify-between flex-1 sm:hidden">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md dark:border-gray-600 dark:text-gray-200 dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="relative inline-flex items-center px-4 py-2 ml-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md dark:border-gray-600 dark:text-gray-200 dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Showing{" "}
                    <span className="font-medium">
                      {(page - 1) * pageSize + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(page * pageSize, total)}
                    </span>{" "}
                    of <span className="font-medium">{total}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex -space-x-px rounded-md shadow-sm">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Deactivate Modal */}
        {showDeactivateModal && selectedUser && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
              <div
                className="fixed inset-0 transition-opacity  bg-black/50"
                onClick={() => setShowDeactivateModal(false)}
              />
              <div className="relative inline-block px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl dark:bg-gray-800 sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div>
                  <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full dark:bg-yellow-900">
                    <svg
                      className="w-6 h-6 text-yellow-600 dark:text-yellow-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                      Deactivate User
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Are you sure you want to deactivate{" "}
                        <strong>{selectedUser.email}</strong>? They will no
                        longer be able to access their account.
                      </p>
                    </div>
                    <div className="mt-4">
                      <label
                        htmlFor="reason"
                        className="block text-sm font-medium text-left text-gray-700 dark:text-gray-300"
                      >
                        Reason (optional)
                      </label>
                      <textarea
                        id="reason"
                        rows={3}
                        value={deactivateReason}
                        onChange={(e) => setDeactivateReason(e.target.value)}
                        className="block w-full px-3 py-2 mt-1 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Enter reason for deactivation..."
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="button"
                    onClick={handleDeactivate}
                    disabled={actionLoading === selectedUser.id}
                    className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-yellow-600 border border-transparent rounded-md shadow-sm hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 sm:col-start-2 sm:text-sm disabled:opacity-50 cursor-pointer"
                  >
                    {actionLoading === selectedUser.id
                      ? "Processing..."
                      : "Deactivate"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeactivateModal(false);
                      setDeactivateReason("");
                    }}
                    className="inline-flex justify-center w-full px-4 py-2 mt-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && selectedUser && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
              <div
                className="fixed inset-0 transition-opacity bg-black/50"
                onClick={() => setShowDeleteModal(false)}
              />
              <div className="relative inline-block px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl dark:bg-gray-800 sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div>
                  <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full dark:bg-red-900">
                    <svg
                      className="w-6 h-6 text-red-600 dark:text-red-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                      Delete User Permanently
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        This action cannot be undone. This will permanently
                        delete the account for{" "}
                        <strong>{selectedUser.email}</strong> and all associated
                        data.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={actionLoading === selectedUser.id}
                    className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
                  >
                    {actionLoading === selectedUser.id
                      ? "Processing..."
                      : "Delete"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="inline-flex justify-center w-full px-4 py-2 mt-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Update Role Modal */}
        {showRoleModal && selectedUser && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
              <div
                className="fixed inset-0 transition-opacity bg-black/50"
                onClick={() => setShowRoleModal(false)}
              />
              <div className="relative inline-block px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl dark:bg-gray-800 sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div>
                  <div className="flex items-center justify-center w-12 h-12 mx-auto bg-indigo-100 rounded-full dark:bg-indigo-900">
                    <svg
                      className="w-6 h-6 text-indigo-600 dark:text-indigo-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                      Update User Role
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Change the role for{" "}
                        <strong>{selectedUser.email}</strong>
                      </p>
                    </div>
                    <div className="mt-4">
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value as UserRole)}
                        className="block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm cursor-pointer"
                      >
                        <option className="cursor-pointer" value="user">
                          User
                        </option>
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="button"
                    onClick={handleUpdateRole}
                    disabled={actionLoading === selectedUser.id}
                    className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm disabled:opacity-50 cursor-pointer"
                  >
                    {actionLoading === selectedUser.id
                      ? "Processing..."
                      : "Update Role"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRoleModal(false)}
                    className="inline-flex justify-center w-full px-4 py-2 mt-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Login History Modal */}
        {showLoginHistoryModal && selectedUser && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
              <div
                className="fixed inset-0 transition-opacity bg-black/50"
                onClick={() => setShowLoginHistoryModal(false)}
              />
              <div className="relative inline-block px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl dark:bg-gray-800 sm:my-8 sm:align-middle sm:max-w-xl sm:w-full sm:p-6">
                <div>
                  <div className="flex items-center justify-center w-12 h-12 mx-auto bg-indigo-100 rounded-full dark:bg-indigo-900">
                    <svg
                      className="w-6 h-6 text-indigo-600 dark:text-indigo-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                      Login History
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Recent login activity for{" "}
                        <strong>{selectedUser.email}</strong>
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 max-h-80 overflow-y-auto">
                    {selectedUser.login_history &&
                      selectedUser.login_history.length > 0 ? (
                      <div className="space-y-3">
                        {selectedUser.login_history.map((entry, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <svg
                                  className="w-4 h-4 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                                  />
                                </svg>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {entry.browser}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDateTime(entry.timestamp)}
                              </span>
                            </div>
                            <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <svg
                                  className="w-3.5 h-3.5"
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
                                <span>{entry.location}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <svg
                                  className="w-3.5 h-3.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                  />
                                </svg>
                                <span className="font-mono text-xs">
                                  {entry.ip_address}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
                        No login history available
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-5 sm:mt-6">
                  <button
                    type="button"
                    onClick={() => setShowLoginHistoryModal(false)}
                    className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminUsersPage;
