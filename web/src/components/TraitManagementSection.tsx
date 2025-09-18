import React, { useMemo, useState } from "react";

import type { TraitInfo } from "../types/api";
import { createTrait, deleteTrait, updateTrait } from "../services/zygotrixApi";

type TraitManagementSectionProps = {
  traits: TraitInfo[];
  loading: boolean;
  error: string | null;
  reload: () => void;
};

type FormState = {
  key: string;
  name: string;
  description: string;
  alleles: string;
  phenotypeRules: string;
  metadataPairs: string;
};

type StatusMessage = {
  tone: "success" | "error";
  text: string;
};

const emptyForm: FormState = {
  key: "",
  name: "",
  description: "",
  alleles: "",
  phenotypeRules: "",
  metadataPairs: "",
};

const toFormState = (trait: TraitInfo): FormState => ({
  key: trait.key,
  name: trait.name,
  description: trait.description ?? "",
  alleles: trait.alleles.join(", "),
  phenotypeRules: Object.entries(trait.phenotype_map)
    .map(([genotype, phenotype]) => `${genotype}=${phenotype}`)
    .join("\n"),
  metadataPairs: trait.metadata
    ? Object.entries(trait.metadata)
        .map(([k, v]) => `${k}=${v}`)
        .join("\n")
    : "",
});

const parsePairs = (value: string): Record<string, string> => {
  const pairs: Record<string, string> = {};
  value
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .forEach((line) => {
      const [rawKey, ...rest] = line.split("=");
      const key = rawKey?.trim();
      const val = rest.join("=").trim();
      if (key) {
        pairs[key] = val;
      }
    });
  return pairs;
};

const parseAlleles = (value: string): string[] =>
  value
    .split(/[,\s]+/)
    .map((allele) => allele.trim())
    .filter(Boolean);

const TraitManagementSection: React.FC<TraitManagementSectionProps> = ({ traits, loading, error, reload }) => {
  const traitMap = useMemo(() => Object.fromEntries(traits.map((trait) => [trait.key, trait])), [traits]);
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [processing, setProcessing] = useState(false);

  const resetToNew = () => {
    setSelectedKey("");
    setForm(emptyForm);
    setStatus(null);
  };

  const handleSelectTrait = (key: string) => {
    const trait = traitMap[key];
    if (!trait) {
      return;
    }
    setSelectedKey(key);
    setForm(toFormState(trait));
    setStatus(null);
  };

  const handleChange = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProcessing(true);
    setStatus(null);

    try {
      const alleles = parseAlleles(form.alleles);
      if (alleles.length === 0) {
        throw new Error("Please provide at least one allele (single-character symbols).");
      }
      if (alleles.some((allele) => allele.length !== 1)) {
        throw new Error("Alleles must be single-character symbols.");
      }

      const phenotypeMap = parsePairs(form.phenotypeRules);
      if (Object.keys(phenotypeMap).length === 0) {
        throw new Error("Please provide at least one phenotype rule (e.g. BB=Brown).");
      }

      const metadata = parsePairs(form.metadataPairs);

      const payload = {
        key: form.key.trim(),
        name: form.name.trim(),
        alleles,
        phenotype_map: phenotypeMap,
        description: form.description.trim() || undefined,
        metadata: Object.keys(metadata).length ? metadata : undefined,
      };

      if (!payload.key) {
        throw new Error("Trait key cannot be empty.");
      }
      if (!payload.name) {
        throw new Error("Trait name cannot be empty.");
      }

      const exists = Boolean(traitMap[payload.key]);
      if (exists) {
        await updateTrait(payload.key, payload);
        setStatus({ tone: "success", text: `Trait '${payload.key}' updated.` });
      } else {
        await createTrait(payload);
        setStatus({ tone: "success", text: `Trait '${payload.key}' created.` });
        setSelectedKey(payload.key);
      }

      reload();
    } catch (err) {
      setStatus({ tone: "error", text: err instanceof Error ? err.message : "Unable to save trait." });
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedKey) {
      return;
    }
    if (!window.confirm(`Delete trait '${selectedKey}'? This action cannot be undone.`)) {
      return;
    }

    setProcessing(true);
    setStatus(null);
    try {
      await deleteTrait(selectedKey);
      setStatus({ tone: "success", text: `Trait '${selectedKey}' deleted.` });
      resetToNew();
      reload();
    } catch (err) {
      setStatus({ tone: "error", text: err instanceof Error ? err.message : "Unable to delete trait." });
    } finally {
      setProcessing(false);
    }
  };

  const selectedTraitExists = Boolean(selectedKey && traitMap[selectedKey]);

  return (
    <section id="manage" className="bg-slate-100 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col gap-12 lg:flex-row">
          <div className="w-full lg:w-2/5">
            <div className="flex items-center justify-between">
              <div>
                <span className="inline-block rounded-full bg-[#1E3A8A]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#1E3A8A]">
                  Trait catalogue
                </span>
                <h2 className="mt-4 text-2xl font-semibold text-[#1E3A8A]">Manage registry entries</h2>
              </div>
              <button
                type="button"
                onClick={resetToNew}
                className="rounded-full border border-[#1E3A8A]/30 px-4 py-2 text-sm font-semibold text-[#1E3A8A] transition hover:border-[#1E3A8A]/60"
              >
                New trait
              </button>
            </div>
            <div className="mt-6 space-y-4">
              {loading && <p className="text-sm text-slate-500">Loading traits…</p>}
              {error && (
                <div className="rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}
              <div className="space-y-3">
                {traits.map((trait) => (
                  <button
                    key={trait.key}
                    type="button"
                    onClick={() => handleSelectTrait(trait.key)}
                    className={`w-full rounded-2xl border px-5 py-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E3A8A] ${
                      trait.key === selectedKey
                        ? "border-[#1E3A8A] bg-white"
                        : "border-slate-200 bg-white/60 hover:border-[#1E3A8A]/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-lg font-semibold text-[#1E3A8A]">{trait.name}</p>
                        <p className="text-xs uppercase tracking-[0.3em] text-[#4B5563]">{trait.key}</p>
                      </div>
                      <p className="text-xs text-slate-500">Alleles: {trait.alleles.join(", ")}</p>
                    </div>
                    {trait.description && <p className="mt-2 text-sm text-slate-600">{trait.description}</p>}
                  </button>
                ))}
                {!loading && !error && traits.length === 0 && (
                  <p className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
                    No custom traits yet. Create your first one using the form.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="w-full lg:w-3/5">
            <div className="rounded-3xl border border-white bg-white p-8 shadow-xl">
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#1E3A8A]" htmlFor="trait-key">
                      Trait key
                    </label>
                    <input
                      id="trait-key"
                      value={form.key}
                      onChange={handleChange("key")}
                      placeholder="e.g. coat_color"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-[#1E3A8A] focus:outline-none"
                      disabled={selectedTraitExists}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#1E3A8A]" htmlFor="trait-name">
                      Name
                    </label>
                    <input
                      id="trait-name"
                      value={form.name}
                      onChange={handleChange("name")}
                      placeholder="Coat Color"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-[#1E3A8A] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#1E3A8A]" htmlFor="trait-description">
                    Description
                  </label>
                  <textarea
                    id="trait-description"
                    rows={2}
                    value={form.description}
                    onChange={handleChange("description")}
                    placeholder="Optional description for readers."
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-[#1E3A8A] focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#1E3A8A]" htmlFor="trait-alleles">
                    Alleles (comma or space separated)
                  </label>
                  <input
                    id="trait-alleles"
                    value={form.alleles}
                    onChange={handleChange("alleles")}
                    placeholder="e.g. B, b"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-[#1E3A8A] focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#1E3A8A]" htmlFor="trait-phenotypes">
                    Phenotype rules (one per line, genotype=phenotype)
                  </label>
                  <textarea
                    id="trait-phenotypes"
                    rows={4}
                    value={form.phenotypeRules}
                    onChange={handleChange("phenotypeRules")}
                    placeholder={"BB=Brown\nBb=Brown\nbb=Blue"}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-[#1E3A8A] focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#1E3A8A]" htmlFor="trait-metadata">
                    Metadata (optional, one per line key=value)
                  </label>
                  <textarea
                    id="trait-metadata"
                    rows={3}
                    value={form.metadataPairs}
                    onChange={handleChange("metadataPairs")}
                    placeholder={"source=lab\nnotes=demo"}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-[#1E3A8A] focus:outline-none"
                  />
                </div>

                {status && (
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm ${
                      status.tone === "success"
                        ? "border border-emerald-300 bg-emerald-50 text-emerald-700"
                        : "border border-red-300 bg-red-50 text-red-700"
                    }`}
                  >
                    {status.text}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-4">
                  <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex items-center justify-center rounded-full bg-[#1E3A8A] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#1E3A8A]/30 transition hover:bg-[#162b63] disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {processing ? "Saving…" : selectedTraitExists ? "Update trait" : "Create trait"}
                  </button>
                  {selectedTraitExists && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={processing}
                      className="inline-flex items-center justify-center rounded-full border border-red-400 px-6 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-red-200 disabled:text-red-200"
                    >
                      Delete trait
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TraitManagementSection;


