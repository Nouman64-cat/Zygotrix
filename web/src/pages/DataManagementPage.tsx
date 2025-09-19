import React from "react";
import DashboardLayout from "../layouts/DashboardLayout";

const DataManagementPage: React.FC = () => {
  const datasets = [
    {
      id: 1,
      name: "1000 Genomes Project",
      type: "Population Genomics",
      size: "2.5 TB",
      records: "2,504",
      lastUpdated: "2024-09-15",
      status: "Active",
      source: "External",
    },
    {
      id: 2,
      name: "UK Biobank Subset",
      type: "Biomedical Database",
      size: "1.8 TB",
      records: "500,000",
      lastUpdated: "2024-09-12",
      status: "Active",
      source: "External",
    },
    {
      id: 3,
      name: "Custom Trait Database",
      type: "Trait Repository",
      size: "125 GB",
      records: "15,847",
      lastUpdated: "2024-09-18",
      status: "Active",
      source: "Internal",
    },
    {
      id: 4,
      name: "GWAS Catalog Extract",
      type: "Association Studies",
      size: "45 GB",
      records: "89,235",
      lastUpdated: "2024-09-10",
      status: "Processing",
      source: "External",
    },
    {
      id: 5,
      name: "Clinical Variants",
      type: "Medical Genetics",
      size: "89 GB",
      records: "234,567",
      lastUpdated: "2024-09-08",
      status: "Active",
      source: "Internal",
    },
  ];

  const storageMetrics = [
    {
      title: "Total Storage Used",
      value: "4.7 TB",
      total: "10 TB",
      percentage: 47,
      color: "bg-blue-500",
    },
    {
      title: "Active Datasets",
      value: "4",
      total: "5",
      percentage: 80,
      color: "bg-green-500",
    },
    {
      title: "Data Processing",
      value: "1",
      total: "5",
      percentage: 20,
      color: "bg-yellow-500",
    },
    {
      title: "Backup Status",
      value: "98%",
      total: "100%",
      percentage: 98,
      color: "bg-purple-500",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Processing":
        return "bg-yellow-100 text-yellow-800";
      case "Error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSourceColor = (source: string) => {
    return source === "Internal"
      ? "bg-blue-100 text-blue-800"
      : "bg-gray-100 text-gray-800";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Data Management
              </h1>
              <p className="text-slate-600 mt-1">
                Manage your genetic datasets, monitor storage usage, and control
                data pipelines.
              </p>
            </div>
            <div className="flex gap-3">
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                Upload Data
              </button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                New Dataset
              </button>
            </div>
          </div>
        </div>

        {/* Storage Metrics */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {storageMetrics.map((metric) => (
            <div
              key={metric.title}
              className="bg-white rounded-lg shadow-sm border border-slate-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    {metric.title}
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {metric.value}
                  </p>
                </div>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full ${metric.color}`}
                  style={{ width: `${metric.percentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-500">of {metric.total}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:border-slate-300 hover:shadow-md transition-all">
              <div className="p-2 bg-orange-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="font-medium text-slate-900">Backup Data</h3>
                <p className="text-sm text-slate-600">Create backup copies</p>
              </div>
            </button>

            <button className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:border-slate-300 hover:shadow-md transition-all">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="font-medium text-slate-900">Cleanup Storage</h3>
                <p className="text-sm text-slate-600">Remove unused files</p>
              </div>
            </button>

            <button className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:border-slate-300 hover:shadow-md transition-all">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="font-medium text-slate-900">Validate Data</h3>
                <p className="text-sm text-slate-600">Check data integrity</p>
              </div>
            </button>
          </div>
        </div>

        {/* Datasets Table */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">
              All Datasets
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Dataset Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Records
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {datasets.map((dataset) => (
                  <tr key={dataset.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-slate-900">
                          {dataset.name}
                        </div>
                        <div className="text-sm text-slate-500">
                          Updated: {dataset.lastUpdated}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-900">
                        {dataset.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {dataset.size}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {dataset.records}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            dataset.status
                          )}`}
                        >
                          {dataset.status}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getSourceColor(
                            dataset.source
                          )}`}
                        >
                          {dataset.source}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button className="text-blue-600 hover:text-blue-700">
                          View
                        </button>
                        <button className="text-green-600 hover:text-green-700">
                          Export
                        </button>
                        <button className="text-red-600 hover:text-red-700">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DataManagementPage;
