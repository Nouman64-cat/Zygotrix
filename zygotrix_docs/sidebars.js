/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docsSidebar: [
    {
      type: "doc",
      id: "intro",
      label: "Introduction",
    },
    {
      type: "category",
      label: "Getting Started",
      collapsed: false,
      items: [
        "getting-started/installation",
        "getting-started/quick-start",
        "getting-started/configuration",
      ],
    },
    {
      type: "category",
      label: "Architecture",
      items: [
        "architecture/overview",
        "architecture/backend",
        "architecture/cpp-engine",
        "architecture/database",
        "architecture/ai-chatbot",
      ],
    },
    {
      type: "category",
      label: "Features",
      items: [
        "features/ai-chatbot",
        "features/voice-control",
        "features/punnett-squares",
        "features/gwas-analysis",
        "features/dna-tools",
        "features/breeding-simulation",
        "features/university",
      ],
    },
    {
      type: "category",
      label: "Developer Guide",
      items: [
        "developer-guide/contributing",
        "developer-guide/code-style",
        "developer-guide/testing",
        "developer-guide/deployment",
      ],
    },
  ],
  apiSidebar: [
    {
      type: "doc",
      id: "api/introduction",
      label: "API Introduction",
    },
    {
      type: "category",
      label: "Authentication",
      items: [
        "api/auth/overview",
        "api/auth/signup",
        "api/auth/login",
        "api/auth/tokens",
      ],
    },
    {
      type: "category",
      label: "Traits",
      items: ["api/traits/list", "api/traits/search", "api/traits/details"],
    },
    {
      type: "category",
      label: "GWAS",
      items: [
        "api/gwas/upload-dataset",
        "api/gwas/run-analysis",
        "api/gwas/get-results",
      ],
    },
    {
      type: "category",
      label: "DNA Tools",
      items: ["api/dna/generate", "api/dna/transcribe", "api/dna/translate"],
    },
    {
      type: "category",
      label: "AI Chatbot",
      items: [
        "api/chatbot/conversations",
        "api/chatbot/messages",
        "api/chatbot/tools",
      ],
    },
  ],
};

export default sidebars;
