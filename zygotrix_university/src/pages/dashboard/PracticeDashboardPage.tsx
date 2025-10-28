import {
  FiActivity,
  FiCode,
  FiLayers,
  FiZap,
  FiClock,
  FiTrendingUp,
} from "react-icons/fi";

const PracticeDashboardPage = () => {
  return (
    <div className="space-y-8">
      {/* Coming Soon Hero Section */}
      <div className="relative overflow-hidden rounded-[1.75rem] border border-border bg-gradient-to-br from-accent/10 via-surface to-accent-secondary/10 p-12 text-center transition-colors">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative z-10">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-accent bg-accent-soft">
            <FiActivity className="h-10 w-10 text-accent" />
          </div>
          <h1 className="mb-4 text-4xl font-bold text-foreground">
            Practice Studio
          </h1>
          <div className="mx-auto mb-6 max-w-2xl">
            <p className="text-lg text-muted">
              An interactive learning environment designed to sharpen your
              genetics knowledge through hands-on practice and real-world
              scenarios.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-accent bg-accent-soft px-6 py-3 text-sm font-semibold text-accent">
            <FiZap className="h-4 w-4" />
            Coming Soon
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-[1.75rem] border border-border bg-surface p-6 transition-all hover:border-accent hover:shadow-lg">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
            <FiCode className="h-6 w-6 text-blue-400" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            Interactive Challenges
          </h3>
          <p className="text-sm text-muted">
            Solve genetics problems through interactive coding exercises and
            simulations that adapt to your skill level.
          </p>
        </div>

        <div className="rounded-[1.75rem] border border-border bg-surface p-6 transition-all hover:border-accent hover:shadow-lg">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
            <FiTrendingUp className="h-6 w-6 text-emerald-400" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            Progress Tracking
          </h3>
          <p className="text-sm text-muted">
            Monitor your improvement with detailed analytics, accuracy metrics,
            and personalized learning insights.
          </p>
        </div>

        <div className="rounded-[1.75rem] border border-border bg-surface p-6 transition-all hover:border-accent hover:shadow-lg">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10">
            <FiLayers className="h-6 w-6 text-purple-400" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            Curated Problem Sets
          </h3>
          <p className="text-sm text-muted">
            Access expertly crafted question sets covering Mendelian genetics,
            inheritance patterns, and more.
          </p>
        </div>

        <div className="rounded-[1.75rem] border border-border bg-surface p-6 transition-all hover:border-accent hover:shadow-lg">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10">
            <FiClock className="h-6 w-6 text-orange-400" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            Timed Challenges
          </h3>
          <p className="text-sm text-muted">
            Test your knowledge under pressure with timed practice sessions and
            competitive leaderboards.
          </p>
        </div>

        <div className="rounded-[1.75rem] border border-border bg-surface p-6 transition-all hover:border-accent hover:shadow-lg">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-pink-500/10">
            <FiZap className="h-6 w-6 text-pink-400" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            Instant Feedback
          </h3>
          <p className="text-sm text-muted">
            Get immediate explanations and hints for every problem to accelerate
            your learning journey.
          </p>
        </div>

        <div className="rounded-[1.75rem] border border-border bg-surface p-6 transition-all hover:border-accent hover:shadow-lg">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10">
            <FiActivity className="h-6 w-6 text-cyan-400" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            Adaptive Learning
          </h3>
          <p className="text-sm text-muted">
            Experience personalized difficulty adjustments based on your
            performance and learning patterns.
          </p>
        </div>
      </div>

      {/* What to Expect Section */}
      <div className="rounded-[1.75rem] border border-border bg-surface p-8 transition-colors">
        <h2 className="mb-6 text-2xl font-semibold text-foreground">
          What to Expect
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-3 text-lg font-semibold text-foreground">
              📚 Comprehensive Coverage
            </h3>
            <ul className="space-y-2 text-sm text-muted">
              <li>• Mendelian genetics fundamentals</li>
              <li>• Punnett square mastery</li>
              <li>• Complex inheritance patterns</li>
              <li>• Genetic probability calculations</li>
              <li>• Real-world genetic scenarios</li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold text-foreground">
              🎯 Learning Benefits
            </h3>
            <ul className="space-y-2 text-sm text-muted">
              <li>• Build confidence through repetition</li>
              <li>• Learn from detailed explanations</li>
              <li>• Track your improvement over time</li>
              <li>• Prepare for assessments effectively</li>
              <li>• Connect theory to practice</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Stay Updated */}
      <div className="rounded-[1.75rem] border border-accent/30 bg-gradient-to-br from-accent/5 to-accent-secondary/5 p-8 text-center transition-colors">
        <h2 className="mb-3 text-2xl font-semibold text-foreground">
          Stay Updated
        </h2>
        <p className="mx-auto mb-6 max-w-xl text-muted">
          We're working hard to bring you the best practice experience. In the
          meantime, continue your learning through course modules and explore
          other features.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <a
            href="/university/courses"
            className="rounded-[1.25rem] border border-accent bg-accent px-6 py-3 text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg"
          >
            Explore Courses
          </a>
          <a
            href="/university/analytics"
            className="rounded-[1.25rem] border border-border bg-surface px-6 py-3 text-sm font-semibold text-foreground transition-all hover:border-accent hover:bg-accent-soft"
          >
            View Analytics
          </a>
        </div>
      </div>
    </div>
  );
};

export default PracticeDashboardPage;
