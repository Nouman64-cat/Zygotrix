import React from "react";
import { Link } from "react-router-dom";
import { RiSparklingFill } from "react-icons/ri";
import { HiOutlineSparkles, HiLightningBolt, HiChatAlt2 } from "react-icons/hi";
import { BiAnalyse } from "react-icons/bi";
import zygoAILogo from "../../../../public/zygotrix-ai.png";

const ZygoAISection: React.FC = () => {
  const botName = import.meta.env.VITE_ZYGOTRIX_BOT_NAME || "ZygoAI";

  const features = [
    {
      icon: HiChatAlt2,
      title: "Conversational Assistant",
      description: "Ask questions about genetics concepts, get instant explanations, and receive step-by-step guidance through complex analyses.",
      gradient: "from-[#1E3A8A] to-[#3B82F6]",
    },
    {
      icon: BiAnalyse,
      title: "Smart Analysis",
      description: "Automatically interprets your simulation results, identifies patterns, and provides insights about genetic inheritance.",
      gradient: "from-[#3B82F6] to-[#10B981]",
    },
    {
      icon: HiLightningBolt,
      title: "Context-Aware Help",
      description: "Understands what page you're on and provides relevant assistance tailored to your current task or workflow.",
      gradient: "from-[#10B981] to-[#059669]",
    },
    {
      icon: HiOutlineSparkles,
      title: "Agentic Automation",
      description: "Control simulations with natural language commands - add traits, randomize alleles, and run experiments hands-free.",
      gradient: "from-[#1E3A8A] to-[#10B981]",
    },
  ];

  return (
    <section className="relative bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950 py-24 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#1E3A8A]/10 dark:bg-[#3B82F6]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#10B981]/10 dark:bg-[#10B981]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
      </div>

        <div className="flex justify-center items-center">

         <img src={zygoAILogo} alt="Zygotrix AI" className="w-64 h-64 object-contain" />
        </div>
      <div className="relative mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">


          <h2 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#1E3A8A] via-[#3B82F6] to-[#10B981] dark:from-[#3B82F6] dark:via-[#10B981] dark:to-[#059669] mb-6">
            Meet {botName}
          </h2>

          <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
            Your intelligent genetics companion. Available 24/7 to help you explore inheritance patterns,
            understand complex concepts, and accelerate your research with AI-powered insights.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg shadow-slate-200/40 dark:shadow-slate-950/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Icon */}
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} text-white shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-6 h-6" />
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {feature.description}
              </p>

              {/* Hover glow effect */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none`}></div>
            </div>
          ))}
        </div>

        {/* CTA Card */}
        <div className="relative max-w-4xl mx-auto">
          <div className="relative bg-gradient-to-r from-[#1E3A8A] via-[#3B82F6] to-[#10B981] rounded-3xl p-8 md:p-12 shadow-2xl shadow-[#1E3A8A]/20 dark:shadow-[#3B82F6]/20 overflow-hidden">
            {/* Animated sparkles background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <RiSparklingFill className="absolute top-4 right-8 w-8 h-8 text-white/20 animate-pulse" />
              <RiSparklingFill className="absolute bottom-8 left-12 w-6 h-6 text-white/20 animate-pulse" style={{ animationDelay: "0.5s" }} />
              <RiSparklingFill className="absolute top-1/2 right-20 w-4 h-4 text-white/20 animate-pulse" style={{ animationDelay: "1s" }} />
            </div>

            <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                  Experience {botName} in Action
                </h3>
                <p className="text-blue-100 text-base md:text-lg">
                  Discover how AI can transform your genetics research workflow.
                  Explore all the features and capabilities of our intelligent assistant.
                </p>
              </div>

              <Link
                to="/zygoai"
                className="flex-shrink-0 group inline-flex items-center gap-3 px-8 py-4 bg-white text-[#1E3A8A] rounded-full font-semibold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
              >
                <span>Explore {botName}</span>
                <HiOutlineSparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ZygoAISection;
