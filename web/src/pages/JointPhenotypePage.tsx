import React from "react";

import AdvancedJointPhenotypeTest from "../components/marketing_site/joint_analysis/AdvancedJointPhenotypeTest";
import JointPhenotypeTest from "../components/marketing_site/joint_analysis/JointPhenotypeTest";

const JointPhenotypePage: React.FC = () => {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      {/* Header */}
      <header className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 py-16">
        <div className="absolute inset-0 bg-black/20" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              Joint Phenotype Analysis
            </h1>
            <p className="mt-6 text-lg leading-8 text-blue-100">
              Analyze combined trait inheritance using Mendel's law of
              independent assortment. Calculate joint phenotype probabilities
              across multiple traits simultaneously.
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Multi-Trait Genetic Analysis
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Test how multiple genetic traits are inherited together. Our
              system implements the Cartesian product approach to calculate all
              possible phenotype combinations and their probabilities.
            </p>
          </div>
        </div>

        {/* How it Works */}
        <div className="mb-16 rounded-2xl bg-white p-8 shadow-lg ring-1 ring-gray-200">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6">
            How Joint Phenotype Analysis Works
          </h3>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-blue-600 font-bold text-lg">1</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Individual Analysis
              </h4>
              <p className="text-sm text-gray-600">
                Calculate genotype probabilities for each trait separately using
                Punnett squares
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-green-600 font-bold text-lg">2</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Cartesian Product
              </h4>
              <p className="text-sm text-gray-600">
                Generate all possible combinations of trait outcomes across
                multiple traits
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-purple-600 font-bold text-lg">3</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Combined Probabilities
              </h4>
              <p className="text-sm text-gray-600">
                Multiply individual probabilities and aggregate by phenotype
                combinations
              </p>
            </div>
          </div>
        </div>

        {/* Joint Phenotype Test Component */}
        <AdvancedJointPhenotypeTest />

        {/* Simple Example Test */}
        <div className="mt-12">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Quick Example Test
          </h3>
          <JointPhenotypeTest />
        </div>
      </section>
    </main>
  );
};

export default JointPhenotypePage;
