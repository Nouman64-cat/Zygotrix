import React, { useState, useEffect } from "react";
import type {
  TraitInfo,
  TraitCreatePayload,
  TraitUpdatePayload,
  GeneInfo,
  TraitVisibility,
} from "../../types/api";

interface TraitEditorProps {
  trait: TraitInfo | null;
  mode: "create" | "edit";
  onSave: (traitData: TraitCreatePayload | TraitUpdatePayload) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  dummyData?: TraitCreatePayload | null;
}

const TraitEditor: React.FC<TraitEditorProps> = ({
  trait,
  mode,
  onSave,
  onCancel,
  isLoading = false,
  dummyData,
}) => {
  const [formData, setFormData] = useState<TraitCreatePayload>({
    key: "",
    name: "",
    alleles: [],
    phenotype_map: {},
    category: "physical_traits",
    inheritance_pattern: "autosomal_dominant",
    gene_info: {
      genes: [""],
      chromosomes: [""],
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
    } else if (dummyData) {
      // Use dummy data when available for new trait creation
      setFormData({
        key: dummyData.key,
        name: dummyData.name,
        alleles: dummyData.alleles,
        phenotype_map: dummyData.phenotype_map,
        category: dummyData.category || "physical_traits",
        inheritance_pattern:
          dummyData.inheritance_pattern || "autosomal_dominant",
        gene_info: dummyData.gene_info || {
          genes: [""],
          chromosomes: [""],
          locus: "",
        },
        verification_status: dummyData.verification_status || "experimental",
        visibility: dummyData.visibility || "private",
        tags: dummyData.tags || [],
        references: dummyData.references || [],
        description: dummyData.description || "",
      });

      // Convert dummy data phenotype_map to entries for editing
      const entries = Object.entries(dummyData.phenotype_map).map(
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
          genes: [""],
          chromosomes: [""],
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
  }, [trait, mode, dummyData]);

  const validateGenotypes = (
    validEntries: Array<{ genotype: string; phenotype: string }>
  ) => {
    // Extract unique alleles from genotypes
    const alleleSet = new Set<string>();
    for (const entry of validEntries) {
      const genotype = entry.genotype.trim();
      if (!/^[A-Za-z]+$/.test(genotype)) {
        return "Genotypes should contain only letters (e.g., AA, Aa, aa)";
      }
      // Add each character as an allele
      for (const char of genotype) {
        alleleSet.add(char);
      }
    }

    // Generate expected genotypes (all combinations of alleles)
    const alleles = Array.from(alleleSet).sort();
    const expectedGenotypes = new Set<string>();

    for (const allele1 of alleles) {
      for (const allele2 of alleles) {
        // Create canonical genotype (sorted)
        const genotype = [allele1, allele2].sort().join("");
        expectedGenotypes.add(genotype);
      }
    }

    // Check if all expected genotypes are present
    const providedGenotypes = new Set(
      validEntries.map((entry) => entry.genotype.trim())
    );
    const missing = Array.from(expectedGenotypes).filter(
      (g) => !providedGenotypes.has(g)
    );

    if (missing.length > 0) {
      return `Missing required genotypes: ${missing.join(
        ", "
      )}. Please add phenotypes for all possible allele combinations.`;
    }

    return null;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Trait name is required";
    }

    if (!formData.gene_info?.genes?.[0]?.trim()) {
      newErrors["gene_info.genes"] = "Gene name is required";
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

    // Validate genotype format and completeness
    if (validEntries.length > 0) {
      const genotypeError = validateGenotypes(validEntries);
      if (genotypeError) {
        newErrors.phenotype_map = genotypeError;
      }
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

  const handleGeneInfoChange = (
    field: keyof GeneInfo | "gene" | "chromosome",
    value: string
  ) => {
    setFormData((prev) => {
      const currentGeneInfo = prev.gene_info || {
        genes: [],
        chromosomes: [],
        locus: "",
      };

      if (field === "gene") {
        // Handle legacy single gene field by updating the first element of genes array
        const newGenes = [...currentGeneInfo.genes];
        if (newGenes.length === 0) newGenes.push(value);
        else newGenes[0] = value;
        return {
          ...prev,
          gene_info: { ...currentGeneInfo, genes: newGenes },
        };
      } else if (field === "chromosome") {
        // Handle legacy single chromosome field by updating the first element of chromosomes array
        const newChromosomes = [...currentGeneInfo.chromosomes];
        if (newChromosomes.length === 0) newChromosomes.push(value);
        else newChromosomes[0] = value;
        return {
          ...prev,
          gene_info: { ...currentGeneInfo, chromosomes: newChromosomes },
        };
      } else {
        // Handle regular GeneInfo fields
        return {
          ...prev,
          gene_info: { ...currentGeneInfo, [field]: value },
        };
      }
    });
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

  const generateMissingGenotypes = () => {
    // Extract alleles from existing entries
    const alleleSet = new Set<string>();
    phenotypeEntries.forEach((entry) => {
      if (entry.genotype.trim()) {
        for (const char of entry.genotype.trim()) {
          if (/[A-Za-z]/.test(char)) {
            alleleSet.add(char);
          }
        }
      }
    });

    if (alleleSet.size === 0) return;

    // Generate all expected genotypes
    const alleles = Array.from(alleleSet).sort();
    const expectedGenotypes = new Set<string>();

    for (const allele1 of alleles) {
      for (const allele2 of alleles) {
        const genotype = [allele1, allele2].sort().join("");
        expectedGenotypes.add(genotype);
      }
    }

    // Find missing genotypes
    const existingGenotypes = new Set(
      phenotypeEntries
        .map((entry) => entry.genotype.trim())
        .filter((g) => g.length > 0)
    );

    const missing = Array.from(expectedGenotypes).filter(
      (g) => !existingGenotypes.has(g)
    );

    // Add missing genotypes
    if (missing.length > 0) {
      const newEntries = missing.map((genotype) => ({
        genotype,
        phenotype: "",
      }));
      setPhenotypeEntries((prev) => [...prev, ...newEntries]);
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

    // Generate key from trait name if creating new trait
    const key = trait
      ? trait.key
      : formData.name
          .toLowerCase()
          .replace(/\s+/g, "_")
          .replace(/[^a-z0-9_]/g, "");

    // Extract unique alleles from genotype patterns
    const alleleSet = new Set<string>();
    Object.keys(phenotype_map).forEach((genotype) => {
      // Split genotype into individual alleles (e.g., "TT" -> ["T", "T"], "Aa" -> ["A", "a"])
      for (const char of genotype) {
        if (/[A-Za-z]/.test(char)) {
          alleleSet.add(char);
        }
      }
    });
    const alleles = Array.from(alleleSet).sort();

    const submitData = {
      ...formData,
      key,
      phenotype_map,
      alleles,
    };

    try {
      await onSave(submitData);
      onCancel();
    } catch (error) {
      console.error("Error saving trait:", error);
    }
  };

  return (
    <>
      {/* Modal Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
        onClick={onCancel}
      />

      {/* Right-side Modal Panel */}
      <div className="fixed inset-y-0 right-0 w-full md:w-2/3 lg:w-1/2 bg-white shadow-2xl z-50 transform translate-x-0 transition-transform duration-300 ease-in-out rounded-tl-lg rounded-bl-lg">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm rounded-tl-lg">
            <h2 className="text-xl font-semibold text-gray-900">
              {trait ? "Edit Trait" : "Create New Trait"}
            </h2>
            <button
              onClick={onCancel}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              title="Close editor"
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

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Compact Basic Information */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div className="lg:col-span-2">
                    <label
                      htmlFor="trait-name"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Trait Name *
                    </label>
                    <input
                      id="trait-name"
                      type="text"
                      className={`block w-full px-2 py-1.5 border rounded text-sm ${
                        errors.name
                          ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                          : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      } focus:outline-none focus:ring-1`}
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      placeholder="e.g., Eye Color"
                    />
                    {errors.name && (
                      <p className="mt-0.5 text-xs text-red-600">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="category"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Category
                    </label>
                    <select
                      id="category"
                      className="block w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      value={formData.category}
                      onChange={(e) =>
                        handleInputChange("category", e.target.value)
                      }
                    >
                      <option value="physical_traits">Physical Traits</option>
                      <option value="sensory_traits">Sensory Traits</option>
                      <option value="behavioral_traits">
                        Behavioral Traits
                      </option>
                      <option value="disease_traits">Disease Traits</option>
                      <option value="metabolic_traits">Metabolic Traits</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="inheritance-pattern"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Inheritance
                    </label>
                    <select
                      id="inheritance-pattern"
                      className="block w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      value={formData.inheritance_pattern}
                      onChange={(e) =>
                        handleInputChange("inheritance_pattern", e.target.value)
                      }
                    >
                      <option value="autosomal_dominant">
                        Autosomal Dominant
                      </option>
                      <option value="autosomal_recessive">
                        Autosomal Recessive
                      </option>
                      <option value="x_linked">X-Linked</option>
                      <option value="y_linked">Y-Linked</option>
                      <option value="mitochondrial">Mitochondrial</option>
                      <option value="polygenic">Polygenic</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="verification-status"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Status
                    </label>
                    <select
                      id="verification-status"
                      className="block w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Visibility
                    </label>
                    <select
                      id="visibility"
                      className="block w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
              </div>

              {/* Compact Gene Information */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <h3 className="text-sm font-semibold text-green-900 mb-3 flex items-center">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                  Gene Information
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label
                      htmlFor="gene-name"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Gene *
                    </label>
                    <input
                      id="gene-name"
                      type="text"
                      className={`block w-full px-2 py-1.5 border rounded text-sm ${
                        errors["gene_info.gene"]
                          ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                          : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      } focus:outline-none focus:ring-1`}
                      value={formData.gene_info?.genes?.[0] || ""}
                      onChange={(e) =>
                        handleGeneInfoChange("gene", e.target.value)
                      }
                      placeholder="HERC2"
                    />
                    {errors["gene_info.gene"] && (
                      <p className="mt-0.5 text-xs text-red-600">
                        {errors["gene_info.gene"]}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="chromosome"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Chr
                    </label>
                    <input
                      id="chromosome"
                      type="text"
                      className="block w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      value={formData.gene_info?.chromosomes?.[0] || ""}
                      onChange={(e) =>
                        handleGeneInfoChange("chromosome", e.target.value)
                      }
                      placeholder="15"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="locus"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Locus
                    </label>
                    <input
                      id="locus"
                      type="text"
                      className="block w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      value={formData.gene_info?.locus || ""}
                      onChange={(e) =>
                        handleGeneInfoChange("locus", e.target.value)
                      }
                      placeholder="15q13.1"
                    />
                  </div>
                </div>
              </div>

              {/* Compact Phenotype Map */}
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                <h3 className="text-sm font-semibold text-purple-900 mb-2 flex items-center">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  Genotype-Phenotype Mapping
                </h3>
                <p className="text-xs text-gray-600 mb-3">
                  Define genotype combinations and their observable traits.{" "}
                  <span className="text-purple-600 font-medium">Tip:</span> Add
                  a few, then auto-generate missing ones.
                </p>
                {errors.phenotype_map && (
                  <p className="mb-2 text-xs text-red-600">
                    {errors.phenotype_map}
                  </p>
                )}
                <div className="space-y-2">
                  {phenotypeEntries.map((entry, index) => (
                    <div
                      key={`phenotype-${index}-${entry.genotype}`}
                      className="flex gap-2 items-center"
                    >
                      <div className="w-20">
                        <input
                          type="text"
                          placeholder="AA"
                          className="block w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-center font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
                      <svg
                        className="w-3 h-3 text-gray-400 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Brown eyes"
                          className="block w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
                        className="p-1 text-red-500 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer"
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2 pt-2 border-t border-purple-200">
                    <button
                      type="button"
                      onClick={addPhenotypeEntry}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded cursor-pointer"
                    >
                      <svg
                        className="h-3 w-3"
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
                      Add Mapping
                    </button>
                    <button
                      type="button"
                      onClick={generateMissingGenotypes}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-green-600 hover:text-green-800 hover:bg-green-50 rounded cursor-pointer"
                    >
                      <svg
                        className="h-3 w-3"
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
                      Auto-Generate
                    </button>
                  </div>
                </div>
              </div>

              {/* Compact Tags and Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Compact Tags */}
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                  <label
                    htmlFor="tags"
                    className="text-sm font-semibold text-amber-900 mb-2 flex items-center"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                      />
                    </svg>
                    Tags
                  </label>
                  <input
                    id="tags"
                    type="text"
                    className="block w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.tags?.join(", ") || ""}
                    onChange={(e) => handleTagsChange(e.target.value)}
                    placeholder="genetics, eye-color, dominant"
                  />
                </div>

                {/* Compact Description */}
                <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100 md:col-span-1">
                  <label
                    htmlFor="description"
                    className="text-sm font-semibold text-indigo-900 mb-2 flex items-center"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    className="block w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    placeholder="Describe inheritance pattern and details..."
                  />
                </div>
              </div>

              {/* Compact Form Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
      </div>
    </>
  );
};

export default TraitEditor;
