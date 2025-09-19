import React from "react";
import DashboardLayout from "../layouts/DashboardLayout";

const TraitManagementPage: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Trait Management
              </h1>
              <p className="text-slate-600 mt-1">
                Manage your genetic trait configurations and datasets.
              </p>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Add New Trait
            </button>
          </div>
        </div>

        {/* Traits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((trait) => (
            <div
              key={trait}
              className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">
                  Trait {trait}
                </h3>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  Active
                </span>
              </div>
              <p className="text-slate-600 text-sm mb-4">
                Description of genetic trait {trait} and its properties.
              </p>
              <div className="flex gap-2">
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Edit
                </button>
                <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TraitManagementPage;
