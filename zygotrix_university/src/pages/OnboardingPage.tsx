import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FaDna,
  FaGraduationCap,
  FaBookOpen,
  FaLaptopCode,
  FaFlask,
  FaChartLine,
  FaSeedling,
  FaLeaf,
  FaTree,
  FaBriefcase,
  FaBookReader,
  FaClock,
  FaRocket,
  FaBalanceScale,
  FaTrophy,
  FaUsers,
} from "react-icons/fa";
import {
  HiAcademicCap,
  HiSparkles,
  HiLightningBolt,
  HiClipboardList,
} from "react-icons/hi";
import { FiCheckCircle } from "react-icons/fi";
import { BiDna, BiAtom } from "react-icons/bi";
import { MdScience, MdBiotech } from "react-icons/md";

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    learning_goals: [] as string[],
    experience_level: "",
    learning_style: "",
    topics_of_interest: [] as string[],
    time_commitment: "",
    institution: "",
    role: "",
    field_of_study: "",
  });

  const learningGoalsOptions = [
    {
      id: "fundamentals",
      label: "Learn Fundamentals",
      description: "Master the basics of genetics",
      icon: (
        <FaBookOpen className="text-3xl text-blue-600 dark:text-blue-400" />
      ),
    },
    {
      id: "mendelian",
      label: "Mendelian Genetics",
      description: "Understand inheritance patterns",
      icon: <FaDna className="text-3xl text-purple-600 dark:text-purple-400" />,
    },
    {
      id: "molecular",
      label: "Molecular Genetics",
      description: "Explore DNA and gene expression",
      icon: <BiDna className="text-3xl text-green-600 dark:text-green-400" />,
    },
    {
      id: "population",
      label: "Population Genetics",
      description: "Study genetic variation in populations",
      icon: (
        <FaUsers className="text-3xl text-indigo-600 dark:text-indigo-400" />
      ),
    },
    {
      id: "bioinformatics",
      label: "Bioinformatics",
      description: "Learn computational genetics tools",
      icon: (
        <FaLaptopCode className="text-3xl text-orange-600 dark:text-orange-400" />
      ),
    },
    {
      id: "career_prep",
      label: "Career Preparation",
      description: "Prepare for genetics careers",
      icon: (
        <FaBriefcase className="text-3xl text-slate-600 dark:text-slate-400" />
      ),
    },
  ];

  const experienceLevels = [
    {
      id: "complete_beginner",
      label: "Complete Beginner",
      description: "No prior genetics knowledge",
      icon: (
        <FaSeedling className="text-4xl text-green-500 dark:text-green-400" />
      ),
    },
    {
      id: "some_exposure",
      label: "Some Exposure",
      description: "High school biology level",
      icon: <FaLeaf className="text-4xl text-green-600 dark:text-green-400" />,
    },
    {
      id: "intermediate",
      label: "Intermediate",
      description: "Undergraduate coursework",
      icon: <FaTree className="text-4xl text-green-700 dark:text-green-400" />,
    },
    {
      id: "advanced",
      label: "Advanced",
      description: "Graduate-level knowledge",
      icon: (
        <FaGraduationCap className="text-4xl text-blue-600 dark:text-blue-400" />
      ),
    },
  ];

  const learningStyles = [
    {
      id: "visual",
      label: "Visual Learner",
      description: "Learn best with diagrams and videos",
      icon: (
        <HiSparkles className="text-4xl text-pink-600 dark:text-pink-400" />
      ),
    },
    {
      id: "reading",
      label: "Reading/Writing",
      description: "Prefer text-based learning",
      icon: (
        <FaBookReader className="text-4xl text-blue-600 dark:text-blue-400" />
      ),
    },
    {
      id: "hands_on",
      label: "Hands-On",
      description: "Learn by doing exercises",
      icon: (
        <FaFlask className="text-4xl text-purple-600 dark:text-purple-400" />
      ),
    },
    {
      id: "mixed",
      label: "Mixed Approach",
      description: "Combination of all styles",
      icon: (
        <FaBalanceScale className="text-4xl text-emerald-600 dark:text-emerald-400" />
      ),
    },
  ];

  const topicsOfInterest = [
    {
      id: "human_genetics",
      label: "Human Genetics",
      icon: <FaUsers className="text-4xl text-blue-600 dark:text-blue-400" />,
    },
    {
      id: "genetic_disorders",
      label: "Genetic Disorders",
      icon: <MdBiotech className="text-4xl text-red-600 dark:text-red-400" />,
    },
    {
      id: "evolution",
      label: "Evolution",
      icon: <BiAtom className="text-4xl text-amber-600 dark:text-amber-400" />,
    },
    {
      id: "genomics",
      label: "Genomics",
      icon: <FaDna className="text-4xl text-purple-600 dark:text-purple-400" />,
    },
    {
      id: "biotechnology",
      label: "Biotechnology",
      icon: <FaFlask className="text-4xl text-green-600 dark:text-green-400" />,
    },
    {
      id: "genetic_engineering",
      label: "Genetic Engineering",
      icon: (
        <MdScience className="text-4xl text-indigo-600 dark:text-indigo-400" />
      ),
    },
    {
      id: "plant_genetics",
      label: "Plant Genetics",
      icon: (
        <FaSeedling className="text-4xl text-lime-600 dark:text-lime-400" />
      ),
    },
    {
      id: "medical_genetics",
      label: "Medical Genetics",
      icon: (
        <HiClipboardList className="text-4xl text-cyan-600 dark:text-cyan-400" />
      ),
    },
  ];

  const timeCommitments = [
    {
      id: "casual",
      label: "Casual",
      description: "1-2 hours per week",
      icon: <FaClock className="text-4xl text-slate-600 dark:text-slate-400" />,
    },
    {
      id: "moderate",
      label: "Moderate",
      description: "3-5 hours per week",
      icon: (
        <FaChartLine className="text-4xl text-blue-600 dark:text-blue-400" />
      ),
    },
    {
      id: "dedicated",
      label: "Dedicated",
      description: "6-10 hours per week",
      icon: (
        <FaRocket className="text-4xl text-purple-600 dark:text-purple-400" />
      ),
    },
    {
      id: "intensive",
      label: "Intensive",
      description: "10+ hours per week",
      icon: (
        <HiLightningBolt className="text-4xl text-amber-500 dark:text-amber-400" />
      ),
    },
  ];

  const steps = [
    { id: "welcome", title: "Welcome", subtitle: "Let's get started" },
    {
      id: "goals",
      title: "Learning Goals",
      subtitle: "What do you want to learn?",
    },
    {
      id: "experience",
      title: "Experience Level",
      subtitle: "Your current knowledge",
    },
    {
      id: "style",
      title: "Learning Style",
      subtitle: "How do you learn best?",
    },
    {
      id: "topics",
      title: "Topics of Interest",
      subtitle: "What fascinates you?",
    },
    {
      id: "commitment",
      title: "Time Commitment",
      subtitle: "How much time can you dedicate?",
    },
    {
      id: "profile",
      title: "About You",
      subtitle: "Tell us a bit more",
    },
    { id: "complete", title: "All Set!", subtitle: "Ready to learn" },
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
      const { universityService } = await import(
        "../services/useCases/universityService"
      );
      await universityService.completeOnboarding({
        learning_goals: formData.learning_goals,
        experience_level: formData.experience_level,
        learning_style: formData.learning_style,
        topics_of_interest: formData.topics_of_interest,
        time_commitment: formData.time_commitment,
        institution: formData.institution || undefined,
        role: formData.role || undefined,
        field_of_study: formData.field_of_study || undefined,
        university_onboarding_completed: true,
      });
      await refreshProfile();
      navigate("/university");
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1: // Learning Goals
        return formData.learning_goals.length > 0;
      case 2: // Experience Level
        return !!formData.experience_level;
      case 3: // Learning Style
        return !!formData.learning_style;
      case 4: // Topics of Interest
        return formData.topics_of_interest.length > 0;
      case 5: // Time Commitment
        return !!formData.time_commitment;
      default:
        return true;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 transition-colors duration-300 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
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
              className="h-full transition-all duration-500 ease-out bg-gradient-to-r from-indigo-600 to-purple-600"
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
                <div className="flex items-center justify-center w-24 h-24 mb-4 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600">
                  <HiAcademicCap className="text-5xl text-white" />
                </div>
                <div>
                  <h1 className="mb-3 text-4xl font-bold text-slate-900 dark:text-white">
                    Welcome to Zygotrix University!
                  </h1>
                  <p className="max-w-2xl text-xl text-slate-600 dark:text-slate-300">
                    Your interactive platform for mastering genetics
                  </p>
                </div>
                <div className="grid w-full max-w-3xl grid-cols-1 gap-4 mt-8 md:grid-cols-3">
                  <div className="p-4 border border-indigo-100 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl dark:border-indigo-800">
                    <FaBookOpen className="mb-2 text-3xl text-indigo-600 dark:text-indigo-400" />
                    <h3 className="mb-1 font-semibold text-slate-900 dark:text-white">
                      Interactive Courses
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Learn at your own pace
                    </p>
                  </div>
                  <div className="p-4 border border-purple-100 bg-purple-50 dark:bg-purple-900/30 rounded-xl dark:border-purple-800">
                    <FaFlask className="mb-2 text-3xl text-purple-600 dark:text-purple-400" />
                    <h3 className="mb-1 font-semibold text-slate-900 dark:text-white">
                      Hands-On Practice
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Apply what you learn
                    </p>
                  </div>
                  <div className="p-4 border border-emerald-100 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl dark:border-emerald-800">
                    <FaTrophy className="mb-2 text-3xl text-emerald-600 dark:text-emerald-400" />
                    <h3 className="mb-1 font-semibold text-slate-900 dark:text-white">
                      Earn Certificates
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Track your progress
                    </p>
                  </div>
                </div>
                <p className="mt-6 text-slate-500 dark:text-slate-400">
                  Let's personalize your learning journey in just a few steps
                </p>
              </div>
            )}

            {/* Learning Goals Step */}
            {currentStep === 1 && (
              <div className="flex flex-col flex-1 animate-fadeIn">
                <div className="mb-8 text-center">
                  <h2 className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">
                    What are your learning goals?
                  </h2>
                  <p className="text-slate-600 dark:text-slate-300">
                    Select all that apply (choose at least one)
                  </p>
                </div>
                <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
                  {learningGoalsOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          learning_goals: toggleArrayItem(
                            formData.learning_goals,
                            option.id
                          ),
                        })
                      }
                      className={`p-5 rounded-xl border-2 text-left transition-all ${
                        formData.learning_goals.includes(option.id)
                          ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 shadow-md"
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
                        {formData.learning_goals.includes(option.id) && (
                          <FiCheckCircle className="flex-shrink-0 w-6 h-6 text-indigo-600" />
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
                    Your Current Knowledge Level
                  </h2>
                  <p className="text-slate-600 dark:text-slate-300">
                    Help us recommend the right starting point
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
                          ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 shadow-md"
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

            {/* Learning Style Step */}
            {currentStep === 3 && (
              <div className="flex flex-col flex-1 animate-fadeIn">
                <div className="mb-8 text-center">
                  <h2 className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">
                    How Do You Learn Best?
                  </h2>
                  <p className="text-slate-600 dark:text-slate-300">
                    We'll tailor content to your preferred style
                  </p>
                </div>
                <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
                  {learningStyles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() =>
                        setFormData({ ...formData, learning_style: style.id })
                      }
                      className={`p-6 rounded-xl border-2 transition-all ${
                        formData.learning_style === style.id
                          ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 shadow-md"
                          : "border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-sm"
                      }`}
                    >
                      <div className="text-center">
                        <div className="flex justify-center mb-3">
                          {style.icon}
                        </div>
                        <h3 className="mb-1 text-lg font-semibold text-slate-900 dark:text-white">
                          {style.label}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          {style.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Topics of Interest Step */}
            {currentStep === 4 && (
              <div className="flex flex-col flex-1 animate-fadeIn">
                <div className="mb-8 text-center">
                  <h2 className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">
                    Topics That Interest You
                  </h2>
                  <p className="text-slate-600 dark:text-slate-300">
                    Select all topics you'd like to explore (at least one)
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {topicsOfInterest.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          topics_of_interest: toggleArrayItem(
                            formData.topics_of_interest,
                            topic.id
                          ),
                        })
                      }
                      className={`p-5 rounded-xl border-2 text-center transition-all ${
                        formData.topics_of_interest.includes(topic.id)
                          ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 shadow-md"
                          : "border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex justify-center mb-2">
                        {topic.icon}
                      </div>
                      <h3 className="text-sm font-medium text-slate-900 dark:text-white">
                        {topic.label}
                      </h3>
                      {formData.topics_of_interest.includes(topic.id) && (
                        <FiCheckCircle className="w-5 h-5 mx-auto mt-2 text-indigo-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Time Commitment Step */}
            {currentStep === 5 && (
              <div className="flex flex-col flex-1 animate-fadeIn">
                <div className="mb-8 text-center">
                  <h2 className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">
                    Weekly Time Commitment
                  </h2>
                  <p className="text-slate-600 dark:text-slate-300">
                    How much time can you dedicate to learning?
                  </p>
                </div>
                <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
                  {timeCommitments.map((commitment) => (
                    <button
                      key={commitment.id}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          time_commitment: commitment.id,
                        })
                      }
                      className={`p-6 rounded-xl border-2 text-center transition-all ${
                        formData.time_commitment === commitment.id
                          ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 shadow-md"
                          : "border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex justify-center mb-3">
                        {commitment.icon}
                      </div>
                      <h3 className="mb-1 text-lg font-semibold text-slate-900 dark:text-white">
                        {commitment.label}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {commitment.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Profile Information Step */}
            {currentStep === 6 && (
              <div className="flex flex-col flex-1 animate-fadeIn">
                <div className="mb-8 text-center">
                  <h2 className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">
                    About You
                  </h2>
                  <p className="text-slate-600 dark:text-slate-300">
                    Optional - you can skip this step
                  </p>
                </div>
                <div className="w-full max-w-xl mx-auto space-y-6">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                      Institution / School
                    </label>
                    <input
                      type="text"
                      value={formData.institution}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          institution: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-white border rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="e.g., MIT, Stanford, High School Name"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                      Your Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-white border rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Select your role</option>
                      <option value="high_school_student">
                        High School Student
                      </option>
                      <option value="undergraduate">
                        Undergraduate Student
                      </option>
                      <option value="graduate">Graduate Student</option>
                      <option value="researcher">Researcher</option>
                      <option value="educator">Educator / Teacher</option>
                      <option value="professional">
                        Industry Professional
                      </option>
                      <option value="self_learner">Self-Learner</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                      Field of Study
                    </label>
                    <input
                      type="text"
                      value={formData.field_of_study}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          field_of_study: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-white border rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="e.g., Biology, Biochemistry, Medicine"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Complete Step */}
            {currentStep === 7 && (
              <div className="flex flex-col items-center justify-center flex-1 space-y-6 text-center animate-fadeIn">
                <div className="flex items-center justify-center w-24 h-24 mb-4 rounded-full bg-gradient-to-br from-green-500 to-emerald-600">
                  <FiCheckCircle className="w-16 h-16 text-white" />
                </div>
                <div>
                  <h1 className="mb-3 text-4xl font-bold text-slate-900 dark:text-white">
                    You're All Set!
                  </h1>
                  <p className="max-w-2xl text-xl text-slate-600 dark:text-slate-300">
                    Your personalized learning path is ready. Let's start
                    learning!
                  </p>
                </div>
                <div className="max-w-2xl p-6 border border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl dark:border-indigo-800">
                  <h3 className="mb-3 font-semibold text-slate-900 dark:text-white">
                    Your Learning Profile:
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm text-left">
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">
                        Goals:
                      </span>
                      <span className="ml-2 font-medium text-slate-900 dark:text-white">
                        {formData.learning_goals.length} selected
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">
                        Level:
                      </span>
                      <span className="ml-2 font-medium text-slate-900 dark:text-white capitalize">
                        {formData.experience_level.replace(/_/g, " ") ||
                          "Not set"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">
                        Style:
                      </span>
                      <span className="ml-2 font-medium text-slate-900 dark:text-white capitalize">
                        {formData.learning_style.replace(/_/g, " ") ||
                          "Not set"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">
                        Topics:
                      </span>
                      <span className="ml-2 font-medium text-slate-900 dark:text-white">
                        {formData.topics_of_interest.length} selected
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
                    className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
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
                      "Start Learning"
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
                  ? "w-8 bg-indigo-600"
                  : index < currentStep
                  ? "w-2 bg-indigo-400"
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
