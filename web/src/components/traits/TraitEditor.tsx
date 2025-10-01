import React, { useState, useEffect } from "react";
import type {
  TraitInfo,
  TraitCreatePayload,
  TraitUpdatePayload,
  GeneInfo,
  TraitVisibility,
} from "../../types/api";

interface TraitEditorProps {
  trait?: TraitInfo;
  isOpen: boolean;
  onClose: () => void;
  onSave: (traitData: TraitCreatePayload | TraitUpdatePayload) => Promise<void>;
  isLoading?: boolean;
}

const TraitEditor: React.FC<TraitEditorProps> = ({
  trait,
  isOpen,
  onClose,
  onSave,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<TraitCreatePayload>({
    key: "",
    name: "",
    alleles: [],
    phenotype_map: {},
    category: "physical_traits",
    inheritance_pattern: "autosomal_dominant",
    gene_info: {
      gene: "",
      chromosome: "",
      locus: "",
    },
    verification_status: "experimental",
    visibility: "private",
    tags: [],
    references: [],
    description: "",
  });

  const [phenotypeEntries, setPhenotypeEntries] = useState<
    Array<{ genotype: string; phenotype: string }>
  >([{ genotype: "", phenotype: "" }]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (trait) {
      setFormData({
        key: trait.key,
        name: trait.name,
        alleles: trait.alleles,
        phenotype_map: trait.phenotype_map,
        category: trait.category,
        inheritance_pattern: trait.inheritance_pattern,
        gene_info: trait.gene_info,
        verification_status: trait.verification_status,
        visibility: trait.visibility,
        tags: trait.tags || [],
        references: trait.references || [],
        description: trait.description || "",
      });

      // Convert phenotype_map to entries for editing
      const entries = Object.entries(trait.phenotype_map).map(
        ([genotype, phenotype]) => ({
          genotype,
          phenotype,
        })
      );
      setPhenotypeEntries(
        entries.length > 0 ? entries : [{ genotype: "", phenotype: "" }]
      );
    } else {
      // Reset form for new trait
      setFormData({
        key: "",
        name: "",
        alleles: [],
        phenotype_map: {},
        category: "physical_traits",
        inheritance_pattern: "autosomal_dominant",
        gene_info: {
          gene: "",
          chromosome: "",
          locus: "",
        },
        verification_status: "experimental",
        visibility: "private",
        tags: [],
        references: [],
        description: "",
      });
      setPhenotypeEntries([{ genotype: "", phenotype: "" }]);
    }
    setErrors({});
  }, [trait, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Trait name is required";
    }

    if (!formData.gene_info?.gene?.trim()) {
      newErrors["gene_info.gene"] = "Gene name is required";
    }

    // Validate phenotype entries
    const validEntries = phenotypeEntries.filter(
      (entry) => entry.genotype.trim() && entry.phenotype.trim()
    );
    if (validEntries.length === 0) {
      newErrors.phenotype_map =
        "At least one genotype-phenotype mapping is required";
    }

    // Check for duplicate genotypes
    const genotypes = validEntries.map((entry) => entry.genotype.trim());
    const uniqueGenotypes = new Set(genotypes);
    if (genotypes.length !== uniqueGenotypes.size) {
      newErrors.phenotype_map = "Duplicate genotypes are not allowed";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof TraitCreatePayload, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleGeneInfoChange = (field: keyof GeneInfo, value: string) => {
    setFormData((prev) => ({
      ...prev,
      gene_info: {
        gene: prev.gene_info?.gene || "",
        chromosome: prev.gene_info?.chromosome || "",
        locus: prev.gene_info?.locus || "",
        [field]: value,
      },
    }));
  };

  const handlePhenotypeEntryChange = (
    index: number,
    field: "genotype" | "phenotype",
    value: string
  ) => {
    const newEntries = [...phenotypeEntries];
    newEntries[index] = {
      ...newEntries[index],
      [field]: value,
    };
    setPhenotypeEntries(newEntries);
  };

  const addPhenotypeEntry = () => {
    setPhenotypeEntries((prev) => [...prev, { genotype: "", phenotype: "" }]);
  };

  const removePhenotypeEntry = (index: number) => {
    if (phenotypeEntries.length > 1) {
      setPhenotypeEntries((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleTagsChange = (tagsString: string) => {
    const tags = tagsString
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    handleInputChange("tags", tags);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Build phenotype_map from entries
    const phenotype_map: Record<string, string> = {};
    phenotypeEntries
      .filter((entry) => entry.genotype.trim() && entry.phenotype.trim())
      .forEach((entry) => {
        phenotype_map[entry.genotype.trim()] = entry.phenotype.trim();
      });

    const submitData = {
      ...formData,
      phenotype_map,
    };

    try {
      await onSave(submitData);
      onClose();
    } catch (error) {
      console.error("Error saving trait:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {trait ? "Edit Trait" : "Create New Trait"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="trait-name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Trait Name *
              </label>
              <input
                id="trait-name"
                type="text"
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 text-sm ${
                  errors.name
                    ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                }`}
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="e.g., Eye Color"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Category
              </label>
              <select
                id="category"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                value={formData.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
              >
                <option value="physical_traits">Physical Traits</option>
                <option value="sensory_traits">Sensory Traits</option>
                <option value="behavioral_traits">Behavioral Traits</option>
                <option value="disease_traits">Disease Traits</option>
                <option value="metabolic_traits">Metabolic Traits</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="inheritance-pattern"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Inheritance Pattern
              </label>
              <select
                id="inheritance-pattern"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                value={formData.inheritance_pattern}
                onChange={(e) =>
                  handleInputChange("inheritance_pattern", e.target.value)
                }
              >
                <option value="autosomal_dominant">Autosomal Dominant</option>
                <option value="autosomal_recessive">Autosomal Recessive</option>
                <option value="x_linked">X-Linked</option>
                <option value="y_linked">Y-Linked</option>
                <option value="mitochondrial">Mitochondrial</option>
                <option value="polygenic">Polygenic</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="verification-status"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Verification Status
              </label>
              <select
                id="verification-status"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                value={formData.verification_status}
                onChange={(e) =>
                  handleInputChange("verification_status", e.target.value)
                }
              >
                <option value="experimental">Experimental</option>
                <option value="simplified">Simplified</option>
                <option value="verified">Verified</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="visibility"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Visibility
              </label>
              <select
                id="visibility"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                value={formData.visibility}
                onChange={(e) =>
                  handleInputChange(
                    "visibility",
                    e.target.value as TraitVisibility
                  )
                }
              >
                <option value="private">Private</option>
                <option value="team">Team</option>
                <option value="public">Public</option>
              </select>
            </div>
          </div>

          {/* Gene Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Gene Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="gene-name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Gene Name *
                </label>
                <input
                  id="gene-name"
                  type="text"
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 text-sm ${
                    errors["gene_info.gene"]
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  }`}
                  value={formData.gene_info?.gene || ""}
                  onChange={(e) => handleGeneInfoChange("gene", e.target.value)}
                  placeholder="e.g., HERC2"
                />
                {errors["gene_info.gene"] && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors["gene_info.gene"]}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="chromosome"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Chromosome
                </label>
                <input
                  id="chromosome"
                  type="text"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  value={formData.gene_info?.chromosome || ""}
                  onChange={(e) =>
                    handleGeneInfoChange("chromosome", e.target.value)
                  }
                  placeholder="e.g., 15"
                />
              </div>

              <div>
                <label
                  htmlFor="locus"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Locus
                </label>
                <input
                  id="locus"
                  type="text"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  value={formData.gene_info?.locus || ""}
                  onChange={(e) =>
                    handleGeneInfoChange("locus", e.target.value)
                  }
                  placeholder="e.g., 15q13.1"
                />
              </div>
            </div>
          </div>

          {/* Phenotype Map */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Genotype-Phenotype Mapping
            </h3>
            {errors.phenotype_map && (
              <p className="mb-2 text-sm text-red-600">
                {errors.phenotype_map}
              </p>
            )}
            <div className="space-y-3">
              {phenotypeEntries.map((entry, index) => (
                <div
                  key={`phenotype-${index}-${entry.genotype}`}
                  className="flex gap-3 items-start"
                >
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Genotype (e.g., AA, Aa, aa)"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                      value={entry.genotype}
                      onChange={(e) =>
                        handlePhenotypeEntryChange(
                          index,
                          "genotype",
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Phenotype (e.g., Brown eyes)"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                      value={entry.phenotype}
                      onChange={(e) =>
                        handlePhenotypeEntryChange(
                          index,
                          "phenotype",
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removePhenotypeEntry(index)}
                    disabled={phenotypeEntries.length === 1}
                    className="p-2 text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    <svg
                      className="h-5 w-5"
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
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addPhenotypeEntry}
                className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-800"
              >
                <svg
                  className="h-4 w-4"
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
                Add Genotype-Phenotype Mapping
              </button>
            </div>
          </div>

          {/* Tags and Description */}
          <div className="space-y-4">
            <div>
              <label
                htmlFor="tags"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Tags (comma-separated)
              </label>
              <input
                id="tags"
                type="text"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                value={formData.tags?.join(", ") || ""}
                onChange={(e) => handleTagsChange(e.target.value)}
                placeholder="genetics, eye-color, dominant"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Describe the trait, its inheritance pattern, and any relevant details..."
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {(() => {
                if (isLoading) return "Saving...";
                return trait ? "Update Trait" : "Create Trait";
              })()}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TraitEditor;
