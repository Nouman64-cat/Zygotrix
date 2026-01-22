import React, { useState } from "react";
import { FaUsers } from "react-icons/fa";

interface TableHeader {
    label: string;
    className?: string; // e.g. "text-right hidden sm:table-cell"
}

interface UserUsageTableProps<T> {
    title: string;
    titleIcon?: React.ReactNode;
    users: T[];
    headers: TableHeader[];
    renderRow: (user: T) => React.ReactNode;
    emptyMessage?: string;
    itemsPerPage?: number;
}

function UserUsageTable<T extends { user_id: string } | any>({
    title,
    titleIcon = <FaUsers className="w-5 h-5 text-indigo-500" />,
    users,
    headers,
    renderRow,
    emptyMessage = "No usage data available.",
    itemsPerPage = 10,
}: UserUsageTableProps<T>) {
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(users.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedUsers = users.slice(startIndex, startIndex + itemsPerPage);

    const handlePrevious = () => setCurrentPage((p) => Math.max(1, p - 1));
    const handleNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

    return (
        <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm">
            <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    {titleIcon}
                    {title}
                </h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-slate-800/50">
                            {headers.map((header, index) => (
                                <th
                                    key={index}
                                    className={`px-4 py-3 text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider ${header.className || "text-left"
                                        }`}
                                >
                                    {header.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                        {users.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={headers.length}
                                    className="px-4 py-12 text-center text-gray-400 dark:text-slate-500"
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            paginatedUsers.map((user) => renderRow(user))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {users.length > itemsPerPage && (
                <div className="px-4 py-3 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between">
                    <div className="text-sm text-gray-500 dark:text-slate-400">
                        Showing {startIndex + 1} to{" "}
                        {Math.min(currentPage * itemsPerPage, users.length)} of{" "}
                        {users.length} users
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrevious}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                            Previous
                        </button>
                        <span className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-slate-300">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={handleNext}
                            disabled={currentPage >= totalPages}
                            className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UserUsageTable;
