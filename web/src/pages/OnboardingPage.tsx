import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import * as authApi from "../services/auth.api";
import type { OnboardingPayload } from "../types/auth";
import {
  FaDna,
  FaUsers,
  FaChartBar,
  FaMicroscope,
  FaClipboardList,
  FaCogs,
  FaSeedling,
  FaLeaf,
  FaTree,
  FaGraduationCap,
  FaBookOpen,
  FaUniversity,
  FaHospital,
  FaBuilding,
  FaLightbulb,
  FaUser,
  FaFlask,
  FaFish,
  FaBacterium,
} from "react-icons/fa";
import { GiMouse, GiFly } from "react-icons/gi";
import { LuWorm } from "react-icons/lu";
import { FiCheckCircle } from "react-icons/fi";

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    research_interests: [] as string[],
    experience_level: "",
    use_case: "",
    organism_focus: [] as string[],
    organization: "",
    title: "",
    department: "",
  });

  const researchInterestsOptions = [
    {
      id: "mendelian",
      label: "Mendelian Genetics",
      description: "Study single-gene inheritance patterns",
      icon: <FaDna className="text-3xl text-blue-600 dark:text-blue-400" />,
    },
    {
      id: "population",
      label: "Population Genetics",
      description: "Analyze genetic variation in populations",
      icon: (
        <FaUsers className="text-3xl text-purple-600 dark:text-purple-400" />
      ),
    },
    {
      id: "polygenic",
      label: "Polygenic Scores",
      description: "Calculate complex trait predictions",
      icon: (
        <FaChartBar className="text-3xl text-green-600 dark:text-green-400" />
      ),
    },
    {
      id: "gwas",
      label: "GWAS Studies",
      description: "Genome-wide association analysis",
      icon: (
        <FaMicroscope className="text-3xl text-indigo-600 dark:text-indigo-400" />
      ),
    },
    {
      id: "trait_analysis",
      label: "Trait Analysis",
      description: "Explore genetic trait databases",
      icon: (
        <FaClipboardList className="text-3xl text-orange-600 dark:text-orange-400" />
      ),
    },
    {
      id: "simulation",
      label: "Genetic Simulations",
      description: "Model genetic scenarios and outcomes",
      icon: <FaCogs className="text-3xl text-slate-600 dark:text-slate-400" />,
    },
  ];

  const experienceLevels = [
    {
      id: "beginner",
      label: "Beginner",
      description: "New to genetics research",
      icon: (
        <FaSeedling className="text-4xl text-green-500 dark:text-green-400" />
      ),
    },
    {
      id: "intermediate",
      label: "Intermediate",
      description: "Some genetics background",
      icon: <FaLeaf className="text-4xl text-green-600 dark:text-green-400" />,
    },
    {
      id: "advanced",
      label: "Advanced",
      description: "Experienced researcher",
      icon: <FaTree className="text-4xl text-green-700 dark:text-green-400" />,
    },
    {
      id: "expert",
      label: "Expert",
      description: "Genetics professional",
      icon: (
        <FaGraduationCap className="text-4xl text-blue-600 dark:text-blue-400" />
      ),
    },
  ];

  const useCases = [
    {
      id: "education",
      label: "Education",
      description: "Teaching genetics concepts",
      icon: (
        <FaBookOpen className="text-4xl text-blue-600 dark:text-blue-400" />
      ),
    },
    {
      id: "academic",
      label: "Academic Research",
      description: "University research projects",
      icon: (
        <FaUniversity className="text-4xl text-purple-600 dark:text-purple-400" />
      ),
    },
    {
      id: "clinical",
      label: "Clinical Research",
      description: "Medical genetics studies",
      icon: <FaHospital className="text-4xl text-red-600 dark:text-red-400" />,
    },
    {
      id: "industry",
      label: "Industry",
      description: "Biotech or pharma applications",
      icon: (
        <FaBuilding className="text-4xl text-slate-600 dark:text-slate-400" />
      ),
    },
    {
      id: "personal",
      label: "Personal Interest",
      description: "Exploring genetics for fun",
      icon: (
        <FaLightbulb className="text-4xl text-yellow-500 dark:text-yellow-400" />
      ),
    },
  ];

  const organisms = [
    {
      id: "human",
      label: "Human",
      icon: <FaUser className="text-4xl text-blue-600 dark:text-blue-400" />,
    },
    {
      id: "mouse",
      label: "Mouse",
      icon: <GiMouse className="text-4xl text-slate-600 dark:text-slate-400" />,
    },
    {
      id: "arabidopsis",
      label: "Arabidopsis",
      icon: (
        <FaSeedling className="text-4xl text-green-600 dark:text-green-400" />
      ),
    },
    {
      id: "drosophila",
      label: "Drosophila",
      icon: <GiFly className="text-4xl text-amber-600 dark:text-amber-400" />,
    },
    {
      id: "zebrafish",
      label: "Zebrafish",
      icon: <FaFish className="text-4xl text-cyan-600 dark:text-cyan-400" />,
    },
    {
      id: "yeast",
      label: "Yeast",
      icon: (
        <FaBacterium className="text-4xl text-purple-600 dark:text-purple-400" />
      ),
    },
    {
      id: "c_elegans",
      label: "C. elegans",
      icon: (
        <LuWorm className="text-4xl text-orange-600 dark:text-orange-400" />
      ),
    },
    {
      id: "other",
      label: "Other",
      icon: (
        <FaFlask className="text-4xl text-indigo-600 dark:text-indigo-400" />
      ),
    },
  ];

  const steps = [
    { id: "welcome", title: "Welcome", subtitle: "Let's get started" },
    {
      id: "interests",
      title: "Research Interests",
      subtitle: "What areas interest you?",
    },
    {
      id: "experience",
      title: "Experience Level",
      subtitle: "Your genetics background",
    },
    {
      id: "use_case",
      title: "Primary Use",
      subtitle: "How will you use Zygotrix?",
    },
    {
      id: "profile",
      title: "Professional Info",
      subtitle: "Tell us about yourself",
    },
    {
      id: "organisms",
      title: "Model Organisms",
      subtitle: "Which organisms do you study?",
    },
    { id: "complete", title: "All Set!", subtitle: "Ready to explore" },
  ];

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item)
      ? array.filter((i) => i !== item)
      : [...array, item];
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      const payload: OnboardingPayload = {
        ...formData,
        onboarding_completed: true,
      };
      await authApi.completeOnboarding(payload);
      await refreshUser();
      navigate("/studio");
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1: // Research Interests
        return formData.research_interests.length > 0;
      case 2: // Experience Level
        return !!formData.experience_level;
      case 3: // Use Case
        return !!formData.use_case;
      case 5: // Organisms
        return formData.organism_focus.length > 0;
      default:
        return true;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 transition-colors duration-300 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <div className="w-full max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {Math.round(((currentStep + 1) / steps.length) * 100)}% Complete
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full transition-all duration-500 ease-out bg-gradient-to-r from-blue-600 to-purple-600"
              style={{
                width: `${((currentStep + 1) / steps.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Main Card */}
        <div className="overflow-hidden bg-white border shadow-xl dark:bg-slate-800 rounded-2xl border-slate-200 dark:border-slate-700">
          {/* Step Content */}
          <div className="p-8 md:p-12 min-h-[500px] flex flex-col">
            {/* Welcome Step */}
            {currentStep === 0 && (
              <div className="flex flex-col items-center justify-center flex-1 space-y-6 text-center animate-fadeIn">
                <div className="flex items-center justify-center w-24 h-24 mb-4 rounded-full bg-gradient-to-br from-blue-600 to-purple-600">
                  <FaDna className="text-5xl text-white" />
                </div>
                <div>
                  <h1 className="mb-3 text-4xl font-bold text-slate-900 dark:text-white">
                    Welcome to Zygotrix!
                  </h1>
                  <p className="max-w-2xl text-xl text-slate-600 dark:text-slate-300">
                    Your advanced platform for genetics research and analysis
                  </p>
                </div>
                <div className="grid w-full max-w-3xl grid-cols-1 gap-4 mt-8 md:grid-cols-3">
                  <div className="p-4 border border-blue-100 bg-blue-50 dark:bg-blue-900/30 rounded-xl dark:border-blue-800">
                    <FaMicroscope className="mb-2 text-3xl text-blue-600 dark:text-blue-400" />
                    <h3 className="mb-1 font-semibold text-slate-900 dark:text-white">
                      Research Tools
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Powerful genetics analysis
                    </p>
                  </div>
                  <div className="p-4 border border-purple-100 bg-purple-50 dark:bg-purple-900/30 rounded-xl dark:border-purple-800">
                    <FaChartBar className="mb-2 text-3xl text-purple-600 dark:text-purple-400" />
                    <h3 className="mb-1 font-semibold text-slate-900 dark:text-white">
                      Simulations
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Model genetic scenarios
                    </p>
                  </div>
                  <div className="p-4 border border-green-100 bg-green-50 dark:bg-green-900/30 rounded-xl dark:border-green-800">
                    <FaBookOpen className="mb-2 text-3xl text-green-600 dark:text-green-400" />
                    <h3 className="mb-1 font-semibold text-slate-900 dark:text-white">
                      Trait Database
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Explore genetic traits
                    </p>
                  </div>
                </div>
                <p className="mt-6 text-slate-500 dark:text-slate-400">
                  Let's personalize your experience in just a few steps
                </p>
              </div>
            )}

            {/* Research Interests Step */}
            {currentStep === 1 && (
              <div className="flex flex-col flex-1 animate-fadeIn">
                <div className="mb-8 text-center">
                  <h2 className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">
                    What interests you?
                  </h2>
                  <p className="text-slate-600 dark:text-slate-300">
                    Select all areas that apply (choose at least one)
                  </p>
                </div>
                <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
                  {researchInterestsOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          research_interests: toggleArrayItem(
                            formData.research_interests,
                            option.id
                          ),
                        })
                      }
                      className={`p-5 rounded-xl border-2 text-left transition-all ${
                        formData.research_interests.includes(option.id)
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30 shadow-md"
                          : "border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">{option.icon}</div>
                        <div className="flex-1">
                          <h3 className="mb-1 font-semibold text-slate-900 dark:text-white">
                            {option.label}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            {option.description}
                          </p>
                        </div>
                        {formData.research_interests.includes(option.id) && (
                          <FiCheckCircle className="flex-shrink-0 w-6 h-6 text-blue-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Experience Level Step */}
            {currentStep === 2 && (
              <div className="flex flex-col flex-1 animate-fadeIn">
                <div className="mb-8 text-center">
                  <h2 className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">
                    Your Experience Level
                  </h2>
                  <p className="text-slate-600 dark:text-slate-300">
                    Help us tailor the experience to your needs
                  </p>
                </div>
                <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
                  {experienceLevels.map((level) => (
                    <button
                      key={level.id}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          experience_level: level.id,
                        })
                      }
                      className={`p-6 rounded-xl border-2 text-center transition-all ${
                        formData.experience_level === level.id
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30 shadow-md"
                          : "border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex justify-center mb-3">
                        {level.icon}
                      </div>
                      <h3 className="mb-1 text-lg font-semibold text-slate-900 dark:text-white">
                        {level.label}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {level.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Use Case Step */}
            {currentStep === 3 && (
              <div className="flex flex-col flex-1 animate-fadeIn">
                <div className="mb-8 text-center">
                  <h2 className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">
                    Primary Use Case
                  </h2>
                  <p className="text-slate-600 dark:text-slate-300">
                    How will you be using Zygotrix?
                  </p>
                </div>
                <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
                  {useCases.map((useCase) => (
                    <button
                      key={useCase.id}
                      onClick={() =>
                        setFormData({ ...formData, use_case: useCase.id })
                      }
                      className={`p-6 rounded-xl border-2 transition-all ${
                        formData.use_case === useCase.id
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30 shadow-md"
                          : "border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-sm"
                      }`}
                    >
                      <div className="text-center">
                        <div className="flex justify-center mb-3">
                          {useCase.icon}
                        </div>
                        <h3 className="mb-1 text-lg font-semibold text-slate-900 dark:text-white">
                          {useCase.label}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          {useCase.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Profile Information Step */}
            {currentStep === 4 && (
              <div className="flex flex-col flex-1 animate-fadeIn">
                <div className="mb-8 text-center">
                  <h2 className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">
                    Professional Information
                  </h2>
                  <p className="text-slate-600 dark:text-slate-300">
                    Optional - you can skip this step
                  </p>
                </div>
                <div className="w-full max-w-xl mx-auto space-y-6">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                      Organization
                    </label>
                    <input
                      type="text"
                      value={formData.organization}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          organization: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-white border rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="University, Institute, or Company"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-white border rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Research Scientist, PhD Student"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                      Department
                    </label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          department: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-white border rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Genetics, Biology, Bioinformatics"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Organisms Step */}
            {currentStep === 5 && (
              <div className="flex flex-col flex-1 animate-fadeIn">
                <div className="mb-8 text-center">
                  <h2 className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">
                    Model Organisms
                  </h2>
                  <p className="text-slate-600 dark:text-slate-300">
                    Which organisms do you work with? (select at least one)
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {organisms.map((organism) => (
                    <button
                      key={organism.id}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          organism_focus: toggleArrayItem(
                            formData.organism_focus,
                            organism.id
                          ),
                        })
                      }
                      className={`p-5 rounded-xl border-2 text-center transition-all ${
                        formData.organism_focus.includes(organism.id)
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30 shadow-md"
                          : "border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex justify-center mb-2">
                        {organism.icon}
                      </div>
                      <h3 className="text-sm font-medium text-slate-900 dark:text-white">
                        {organism.label}
                      </h3>
                      {formData.organism_focus.includes(organism.id) && (
                        <FiCheckCircle className="w-5 h-5 mx-auto mt-2 text-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Complete Step */}
            {currentStep === 6 && (
              <div className="flex flex-col items-center justify-center flex-1 space-y-6 text-center animate-fadeIn">
                <div className="flex items-center justify-center w-24 h-24 mb-4 rounded-full bg-gradient-to-br from-green-500 to-emerald-600">
                  <FiCheckCircle className="w-16 h-16 text-white" />
                </div>
                <div>
                  <h1 className="mb-3 text-4xl font-bold text-slate-900 dark:text-white">
                    You're All Set!
                  </h1>
                  <p className="max-w-2xl text-xl text-slate-600 dark:text-slate-300">
                    Your workspace is ready. Let's start exploring Zygotrix!
                  </p>
                </div>
                <div className="max-w-2xl p-6 border border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl dark:border-blue-800">
                  <h3 className="mb-3 font-semibold text-slate-900 dark:text-white">
                    Your Selections:
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm text-left">
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">
                        Interests:
                      </span>
                      <span className="ml-2 font-medium text-slate-900 dark:text-white">
                        {formData.research_interests.length} selected
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">
                        Experience:
                      </span>
                      <span className="ml-2 font-medium text-slate-900 dark:text-white">
                        {formData.experience_level || "Not set"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">
                        Use Case:
                      </span>
                      <span className="ml-2 font-medium text-slate-900 dark:text-white">
                        {formData.use_case || "Not set"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">
                        Organisms:
                      </span>
                      <span className="ml-2 font-medium text-slate-900 dark:text-white">
                        {formData.organism_focus.length} selected
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Footer */}
          <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center justify-between">
              <button
                onClick={handleBack}
                disabled={currentStep === 0}
                className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-0 disabled:cursor-not-allowed transition-opacity"
              >
                ← Back
              </button>

              <div className="flex gap-3">
                {currentStep > 0 && currentStep < steps.length - 1 && (
                  <button
                    onClick={handleSkip}
                    className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    Skip
                  </button>
                )}

                {currentStep < steps.length - 1 ? (
                  <button
                    onClick={handleNext}
                    disabled={!isStepValid()}
                    className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                  >
                    Continue →
                  </button>
                ) : (
                  <button
                    onClick={handleComplete}
                    disabled={isSubmitting}
                    className="px-8 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Get Started"
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-center gap-2 mt-6">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentStep
                  ? "w-8 bg-blue-600"
                  : index < currentStep
                  ? "w-2 bg-blue-400"
                  : "w-2 bg-slate-300 dark:bg-slate-600"
              }`}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default OnboardingPage;
