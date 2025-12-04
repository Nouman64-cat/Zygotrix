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

const AdminUsersPage: React.FC = () => {
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
  const [selectedUser, setSelectedUser] = useState<AdminUserListItem | null>(
    null
  );
  const [deactivateReason, setDeactivateReason] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("user");

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

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchStats();
    }
  }, [isAdmin, fetchUsers, fetchStats]);

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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
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
      <div className="space-y-6 p-6">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Users
              </p>
              <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.total_users}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Active Users
              </p>
              <p className="mt-1 text-2xl font-semibold text-green-600 dark:text-green-400">
                {stats.active_users}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Inactive Users
              </p>
              <p className="mt-1 text-2xl font-semibold text-red-600 dark:text-red-400">
                {stats.inactive_users}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Admins / Super Admins
              </p>
              <p className="mt-1 text-2xl font-semibold text-purple-600 dark:text-purple-400">
                {stats.by_role.admin} / {stats.by_role.super_admin}
              </p>
            </div>
          </div>
        )}

        {/* Messages */}
        {successMessage && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-green-800 dark:text-green-200">
              {successMessage}
            </p>
          </div>
        )}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-600 dark:text-red-400 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as UserRole | "");
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
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
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Onboarding
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <span
                            className={`inline-flex px-2 py-1 text-xs rounded ${
                              user.onboarding_completed
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                            }`}
                            title="Web Onboarding"
                          >
                            Web
                          </span>
                          <span
                            className={`inline-flex px-2 py-1 text-xs rounded ${
                              user.university_onboarding_completed
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                            }`}
                            title="University Onboarding"
                          >
                            Uni
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
                            <span className="text-gray-400 dark:text-gray-500 italic">
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
            <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
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
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
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
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                onClick={() => setShowDeactivateModal(false)}
              />
              <div className="relative inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div>
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900">
                    <svg
                      className="h-6 w-6 text-yellow-600 dark:text-yellow-400"
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
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
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
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-left"
                      >
                        Reason (optional)
                      </label>
                      <textarea
                        id="reason"
                        rows={3}
                        value={deactivateReason}
                        onChange={(e) => setDeactivateReason(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-yellow-600 text-base font-medium text-white hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
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
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
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
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                onClick={() => setShowDeleteModal(false)}
              />
              <div className="relative inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div>
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900">
                    <svg
                      className="h-6 w-6 text-red-600 dark:text-red-400"
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
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
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
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
                  >
                    {actionLoading === selectedUser.id
                      ? "Processing..."
                      : "Delete"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
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
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                onClick={() => setShowRoleModal(false)}
              />
              <div className="relative inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div>
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900">
                    <svg
                      className="h-6 w-6 text-indigo-600 dark:text-indigo-400"
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
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
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
                        className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        <option value="user">User</option>
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
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
                  >
                    {actionLoading === selectedUser.id
                      ? "Processing..."
                      : "Update Role"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRoleModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                  >
                    Cancel
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
