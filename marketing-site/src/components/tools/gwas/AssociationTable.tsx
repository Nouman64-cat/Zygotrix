import React, { useState, useMemo } from 'react';
import { cn } from './utils';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';

interface Association {
    rsid: string;
    chromosome: number;
    position: number;
    ref_allele: string;
    alt_allele: string;
    p_value: number;
    beta?: number;
    se?: number;
    maf: number;
    n_samples: number;
}

interface AssociationTableProps {
    associations: Association[];
}

type SortField = 'p_value' | 'chromosome' | 'position' | 'beta' | 'maf';
type SortDirection = 'asc' | 'desc';

export const AssociationTable: React.FC<AssociationTableProps> = ({ associations }) => {
    const [sortField, setSortField] = useState<SortField>('p_value');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Sort associations
    const sortedAssociations = useMemo(() => {
        return [...associations].sort((a, b) => {
            let aVal: number;
            let bVal: number;

            switch (sortField) {
                case 'p_value':
                    aVal = a.p_value;
                    bVal = b.p_value;
                    break;
                case 'chromosome':
                    aVal = a.chromosome;
                    bVal = b.chromosome;
                    break;
                case 'position':
                    aVal = a.position;
                    bVal = b.position;
                    break;
                case 'beta':
                    aVal = a.beta || 0;
                    bVal = b.beta || 0;
                    break;
                case 'maf':
                    aVal = a.maf;
                    bVal = b.maf;
                    break;
                default:
                    return 0;
            }

            return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        });
    }, [associations, sortField, sortDirection]);

    // Pagination
    const totalPages = Math.ceil(sortedAssociations.length / itemsPerPage);
    const paginatedAssociations = sortedAssociations.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Toggle sort
    const handleSort = (field: SortField) => {
        if (field === sortField) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Sort icon component
    const SortIcon: React.FC<{ field: SortField }> = ({ field }) => {
        if (field !== sortField) {
            return <FaSort className="w-3 h-3 text-gray-400" />;
        }
        return sortDirection === 'asc' ? (
            <FaSortUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
        ) : (
            <FaSortDown className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
        );
    };

    return (
        <div className="space-y-4">
            {/* Summary */}
            <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {paginatedAssociations.length} of {associations.length} top associations
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">
                                SNP ID
                            </th>
                            <th
                                className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                onClick={() => handleSort('chromosome')}
                            >
                                <div className="flex items-center gap-2">
                                    Chr
                                    <SortIcon field="chromosome" />
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                onClick={() => handleSort('position')}
                            >
                                <div className="flex items-center gap-2">
                                    Position
                                    <SortIcon field="position" />
                                </div>
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">
                                Alleles
                            </th>
                            <th
                                className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                onClick={() => handleSort('p_value')}
                            >
                                <div className="flex items-center justify-end gap-2">
                                    P-value
                                    <SortIcon field="p_value" />
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                onClick={() => handleSort('beta')}
                            >
                                <div className="flex items-center justify-end gap-2">
                                    Effect (β)
                                    <SortIcon field="beta" />
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                onClick={() => handleSort('maf')}
                            >
                                <div className="flex items-center justify-end gap-2">
                                    MAF
                                    <SortIcon field="maf" />
                                </div>
                            </th>
                            <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">
                                N
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {paginatedAssociations.map((assoc, idx) => {
                            const isSignificant = assoc.p_value < 5e-8;
                            return (
                                <tr
                                    key={`${assoc.rsid}-${idx}`}
                                    className={cn(
                                        'hover:bg-gray-50 dark:hover:bg-gray-800',
                                        isSignificant && 'bg-red-50/50 dark:bg-red-900/10'
                                    )}
                                >
                                    <td className="px-4 py-3 font-mono text-xs text-blue-600 dark:text-blue-400">
                                        {assoc.rsid}
                                    </td>
                                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                                        {assoc.chromosome}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs text-gray-700 dark:text-gray-300">
                                        {assoc.position.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs text-gray-700 dark:text-gray-300">
                                        {assoc.ref_allele}/{assoc.alt_allele}
                                    </td>
                                    <td className={cn(
                                        "px-4 py-3 text-right font-medium",
                                        isSignificant
                                            ? "text-red-600 dark:text-red-400"
                                            : "text-gray-900 dark:text-gray-100"
                                    )}>
                                        {assoc.p_value.toExponential(2)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100">
                                        {assoc.beta !== undefined ? assoc.beta.toFixed(3) : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100">
                                        {assoc.maf.toFixed(3)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                                        {assoc.n_samples.toLocaleString()}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className={cn(
                                "px-3 py-1.5 rounded text-sm font-medium transition-colors",
                                currentPage === 1
                                    ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                                    : "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                            )}
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className={cn(
                                "px-3 py-1.5 rounded text-sm font-medium transition-colors",
                                currentPage === totalPages
                                    ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                                    : "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                            )}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded"></div>
                    <span>Genome-wide significant (P &lt; 5×10⁻⁸)</span>
                </div>
                <div>
                    <strong>MAF:</strong> Minor Allele Frequency •
                    <strong>β:</strong> Effect Size •
                    <strong>N:</strong> Sample Size
                </div>
            </div>
        </div>
    );
};
