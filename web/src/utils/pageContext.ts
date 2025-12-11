// Page context descriptions for the chatbot to understand where the user is

export interface PageContext {
  pageName: string;
  description: string;
  features: string[];
}

export function getPageContext(pathname: string): PageContext {
  // Studio pages
  if (pathname === '/studio' || pathname === '/studio/') {
    return {
      pageName: 'Portal Dashboard',
      description: 'The main portal/dashboard where users can access all studio features',
      features: [
        'View overview of available tools and features',
        'Navigate to different studio sections',
        'Access projects, simulations, and analytics',
        'Quick access to all genetics tools',
      ],
    };
  }

  if (pathname.startsWith('/studio/simulation-studio')) {
    return {
      pageName: 'Simulation Studio',
      description: 'Interactive genetics simulation workspace where users can create and run Mendelian genetics simulations',
      features: [
        'Add genetic traits to organisms',
        'Select parent organisms for breeding',
        'Configure simulation parameters (number of offspring)',
        'Change alleles and dominance patterns',
        'Run simulations to see genetic inheritance',
        'View results in Punnett squares',
        'Analyze phenotype and genotype ratios',
        'Save simulation results',
        'Visualize genetic crosses',
      ],
    };
  }

  if (pathname.startsWith('/studio/projects')) {
    return {
      pageName: 'Projects Page',
      description: 'Manage your genetics research projects',
      features: [
        'Create new genetics projects',
        'View all saved projects',
        'Edit and delete projects',
        'Organize projects by categories',
        'Search and filter projects',
        'Share projects with others',
      ],
    };
  }

  if (pathname.startsWith('/studio/workspace/')) {
    return {
      pageName: 'Project Workspace',
      description: 'Detailed workspace for working on a specific genetics project',
      features: [
        'Edit project details and parameters',
        'Run simulations within the project',
        'Analyze and visualize data',
        'Save and export results',
        'Collaborate with team members',
        'Track project progress',
      ],
    };
  }

  if (pathname.startsWith('/studio/browse-traits')) {
    return {
      pageName: 'Browse Traits',
      description: 'Explore and search available genetic traits',
      features: [
        'Browse all available genetic traits',
        'Search traits by name or category',
        'View trait details and alleles',
        'Filter traits by organism type',
        'Learn about different inheritance patterns',
        'Add traits to simulations',
      ],
    };
  }

  if (pathname.startsWith('/studio/analytics')) {
    return {
      pageName: 'Analytics Dashboard',
      description: 'View statistics and analytics from your simulations and projects',
      features: [
        'View simulation statistics',
        'Analyze genetic patterns',
        'Generate reports',
        'Export data for analysis',
        'Track experiment outcomes',
        'Visualize trends and patterns',
      ],
    };
  }

  if (pathname.startsWith('/studio/data')) {
    return {
      pageName: 'Data Management',
      description: 'Manage and organize your genetics data',
      features: [
        'Import genetic data',
        'Export simulation results',
        'Organize datasets',
        'Manage data files',
        'Data validation and cleaning',
      ],
    };
  }

  if (pathname.startsWith('/studio/population')) {
    return {
      pageName: 'Population Simulation',
      description: 'Run population genetics simulations',
      features: [
        'Simulate population genetics',
        'Model allele frequencies',
        'Study genetic drift',
        'Analyze selection pressure',
        'View population trends',
      ],
    };
  }

  if (pathname.startsWith('/studio/pgs-demo')) {
    return {
      pageName: 'Polygenic Score Demo',
      description: 'Demonstrate and calculate polygenic scores',
      features: [
        'Calculate polygenic scores',
        'Model complex traits',
        'Multiple gene interactions',
        'Risk score prediction',
      ],
    };
  }

  if (pathname.startsWith('/studio/profile')) {
    return {
      pageName: 'User Profile',
      description: 'Manage your user profile and account settings',
      features: [
        'Update profile information',
        'Change account settings',
        'View activity history',
        'Manage preferences',
      ],
    };
  }

  if (pathname.startsWith('/studio/preferences')) {
    return {
      pageName: 'Preferences',
      description: 'Configure your personal preferences',
      features: [
        'Set display preferences',
        'Configure notifications',
        'Customize workspace',
        'Set default parameters',
      ],
    };
  }

  if (pathname.startsWith('/studio/settings')) {
    return {
      pageName: 'Settings',
      description: 'Application settings and configuration',
      features: [
        'Configure application settings',
        'Manage integrations',
        'Security settings',
        'Account management',
      ],
    };
  }

  if (pathname.startsWith('/studio/admin')) {
    return {
      pageName: 'Admin Panel',
      description: 'Administrative controls and management',
      features: [
        'Manage users',
        'View system analytics',
        'Configure system settings',
        'Monitor platform activity',
      ],
    };
  }

  // Default for any other studio page
  if (pathname.startsWith('/studio')) {
    return {
      pageName: 'Studio',
      description: 'Zygotrix Studio - genetics simulation and analysis platform',
      features: [
        'Create and run genetics simulations',
        'Manage projects',
        'Analyze results',
        'Access various genetics tools',
      ],
    };
  }

  // Fallback
  return {
    pageName: 'Zygotrix Platform',
    description: 'Interactive genetics learning and simulation platform',
    features: [
      'Learn genetics concepts',
      'Run simulations',
      'Practice with interactive tools',
    ],
  };
}
