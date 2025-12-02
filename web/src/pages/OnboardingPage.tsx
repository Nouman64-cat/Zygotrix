import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import * as authApi from "../services/auth.api";
import type { OnboardingPayload } from "../types/auth";

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
      icon: "🧬",
    },
    {
      id: "population",
      label: "Population Genetics",
      description: "Analyze genetic variation in populations",
      icon: "👥",
    },
    {
      id: "polygenic",
      label: "Polygenic Scores",
      description: "Calculate complex trait predictions",
      icon: "📊",
    },
    {
      id: "gwas",
      label: "GWAS Studies",
      description: "Genome-wide association analysis",
      icon: "🔬",
    },
    {
      id: "trait_analysis",
      label: "Trait Analysis",
      description: "Explore genetic trait databases",
      icon: "📋",
    },
    {
      id: "simulation",
      label: "Genetic Simulations",
      description: "Model genetic scenarios and outcomes",
      icon: "⚙️",
    },
  ];

  const experienceLevels = [
    {
      id: "beginner",
      label: "Beginner",
      description: "New to genetics research",
      icon: "🌱",
    },
    {
      id: "intermediate",
      label: "Intermediate",
      description: "Some genetics background",
      icon: "🌿",
    },
    {
      id: "advanced",
      label: "Advanced",
      description: "Experienced researcher",
      icon: "🌳",
    },
    {
      id: "expert",
      label: "Expert",
      description: "Genetics professional",
      icon: "🎓",
    },
  ];

  const useCases = [
    {
      id: "education",
      label: "Education",
      description: "Teaching genetics concepts",
      icon: "📚",
    },
    {
      id: "academic",
      label: "Academic Research",
      description: "University research projects",
      icon: "🎓",
    },
    {
      id: "clinical",
      label: "Clinical Research",
      description: "Medical genetics studies",
      icon: "🏥",
    },
    {
      id: "industry",
      label: "Industry",
      description: "Biotech or pharma applications",
      icon: "🏢",
    },
    {
      id: "personal",
      label: "Personal Interest",
      description: "Exploring genetics for fun",
      icon: "💡",
    },
  ];

  const organisms = [
    { id: "human", label: "Human", icon: "👤" },
    { id: "mouse", label: "Mouse", icon: "🐭" },
    { id: "arabidopsis", label: "Arabidopsis", icon: "🌱" },
    { id: "drosophila", label: "Drosophila", icon: "🪰" },
    { id: "zebrafish", label: "Zebrafish", icon: "🐟" },
    { id: "yeast", label: "Yeast", icon: "🦠" },
    { id: "c_elegans", label: "C. elegans", icon: "🪱" },
    { id: "other", label: "Other", icon: "🧫" },
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
    { id: "use_case", title: "Primary Use", subtitle: "How will you use Zygotrix?" },
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm text-slate-500">
              {Math.round(((currentStep + 1) / steps.length) * 100)}% Complete
            </span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500 ease-out"
              style={{
                width: `${((currentStep + 1) / steps.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Step Content */}
          <div className="p-8 md:p-12 min-h-[500px] flex flex-col">
            {/* Welcome Step */}
            {currentStep === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 animate-fadeIn">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4">
                  <span className="text-5xl">🧬</span>
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-slate-900 mb-3">
                    Welcome to Zygotrix!
                  </h1>
                  <p className="text-xl text-slate-600 max-w-2xl">
                    Your advanced platform for genetics research and analysis
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 w-full max-w-3xl">
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="text-3xl mb-2">🔬</div>
                    <h3 className="font-semibold text-slate-900 mb-1">
                      Research Tools
                    </h3>
                    <p className="text-sm text-slate-600">
                      Powerful genetics analysis
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                    <div className="text-3xl mb-2">📊</div>
                    <h3 className="font-semibold text-slate-900 mb-1">
                      Simulations
                    </h3>
                    <p className="text-sm text-slate-600">
                      Model genetic scenarios
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                    <div className="text-3xl mb-2">📚</div>
                    <h3 className="font-semibold text-slate-900 mb-1">
                      Trait Database
                    </h3>
                    <p className="text-sm text-slate-600">
                      Explore genetic traits
                    </p>
                  </div>
                </div>
                <p className="text-slate-500 mt-6">
                  Let's personalize your experience in just a few steps
                </p>
              </div>
            )}

            {/* Research Interests Step */}
            {currentStep === 1 && (
              <div className="flex-1 flex flex-col animate-fadeIn">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">
                    What interests you?
                  </h2>
                  <p className="text-slate-600">
                    Select all areas that apply (choose at least one)
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
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
                          ? "border-blue-600 bg-blue-50 shadow-md"
                          : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="text-3xl">{option.icon}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 mb-1">
                            {option.label}
                          </h3>
                          <p className="text-sm text-slate-600">
                            {option.description}
                          </p>
                        </div>
                        {formData.research_interests.includes(option.id) && (
                          <svg
                            className="w-6 h-6 text-blue-600 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Experience Level Step */}
            {currentStep === 2 && (
              <div className="flex-1 flex flex-col animate-fadeIn">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">
                    Your Experience Level
                  </h2>
                  <p className="text-slate-600">
                    Help us tailor the experience to your needs
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
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
                          ? "border-blue-600 bg-blue-50 shadow-md"
                          : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="text-4xl mb-3">{level.icon}</div>
                      <h3 className="font-semibold text-slate-900 mb-1 text-lg">
                        {level.label}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {level.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Use Case Step */}
            {currentStep === 3 && (
              <div className="flex-1 flex flex-col animate-fadeIn">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">
                    Primary Use Case
                  </h2>
                  <p className="text-slate-600">
                    How will you be using Zygotrix?
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                  {useCases.map((useCase) => (
                    <button
                      key={useCase.id}
                      onClick={() =>
                        setFormData({ ...formData, use_case: useCase.id })
                      }
                      className={`p-6 rounded-xl border-2 transition-all ${
                        formData.use_case === useCase.id
                          ? "border-blue-600 bg-blue-50 shadow-md"
                          : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-4xl mb-3">{useCase.icon}</div>
                        <h3 className="font-semibold text-slate-900 mb-1 text-lg">
                          {useCase.label}
                        </h3>
                        <p className="text-sm text-slate-600">
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
              <div className="flex-1 flex flex-col animate-fadeIn">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">
                    Professional Information
                  </h2>
                  <p className="text-slate-600">
                    Optional - you can skip this step
                  </p>
                </div>
                <div className="max-w-xl mx-auto w-full space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
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
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="University, Institute, or Company"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Research Scientist, PhD Student"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
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
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Genetics, Biology, Bioinformatics"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Organisms Step */}
            {currentStep === 5 && (
              <div className="flex-1 flex flex-col animate-fadeIn">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">
                    Model Organisms
                  </h2>
                  <p className="text-slate-600">
                    Which organisms do you work with? (select at least one)
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                          ? "border-blue-600 bg-blue-50 shadow-md"
                          : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="text-4xl mb-2">{organism.icon}</div>
                      <h3 className="font-medium text-slate-900 text-sm">
                        {organism.label}
                      </h3>
                      {formData.organism_focus.includes(organism.id) && (
                        <svg
                          className="w-5 h-5 text-blue-600 mx-auto mt-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Complete Step */}
            {currentStep === 6 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 animate-fadeIn">
                <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-16 h-16 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-slate-900 mb-3">
                    You're All Set!
                  </h1>
                  <p className="text-xl text-slate-600 max-w-2xl">
                    Your workspace is ready. Let's start exploring Zygotrix!
                  </p>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-100 max-w-2xl">
                  <h3 className="font-semibold text-slate-900 mb-3">
                    Your Selections:
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-left text-sm">
                    <div>
                      <span className="text-slate-600">Interests:</span>
                      <span className="ml-2 font-medium text-slate-900">
                        {formData.research_interests.length} selected
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600">Experience:</span>
                      <span className="ml-2 font-medium text-slate-900">
                        {formData.experience_level || "Not set"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600">Use Case:</span>
                      <span className="ml-2 font-medium text-slate-900">
                        {formData.use_case || "Not set"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600">Organisms:</span>
                      <span className="ml-2 font-medium text-slate-900">
                        {formData.organism_focus.length} selected
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Footer */}
          <div className="border-t border-slate-200 p-6 bg-slate-50">
            <div className="flex items-center justify-between">
              <button
                onClick={handleBack}
                disabled={currentStep === 0}
                className="px-5 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 disabled:opacity-0 disabled:cursor-not-allowed transition-opacity"
              >
                ← Back
              </button>

              <div className="flex gap-3">
                {currentStep > 0 && currentStep < steps.length - 1 && (
                  <button
                    onClick={handleSkip}
                    className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
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
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
                  : "w-2 bg-slate-300"
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
