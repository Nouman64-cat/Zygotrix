import { Link } from "react-router-dom";
import { FiArrowUpRight, FiGithub, FiLinkedin, FiTwitter } from "react-icons/fi";
import Container from "../common/Container";
import Logo from "../navigation/Logo";

const footerLinks = [
  {
    title: "Programs",
    links: [
      { label: "Course Catalog", to: "/courses" },
      { label: "Learning Paths", to: "/paths" },
      { label: "Practice Studio", to: "/practice" },
      { label: "Simulation Studio", to: "/simulation-studio" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Zygotrix", to: "/about" },
      { label: "Community", to: "/community" },
      { label: "Enterprise", to: "/enterprise" },
      { label: "Press Kit", to: "/resources" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", to: "/support" },
      { label: "FAQs", to: "/resources#faqs" },
      { label: "Contact", to: "/contact" },
      { label: "Accessibility", to: "/accessibility" },
    ],
  },
];

const socialLinks = [
  { label: "Twitter", icon: <FiTwitter />, href: "https://twitter.com" },
  { label: "LinkedIn", icon: <FiLinkedin />, href: "https://linkedin.com" },
  { label: "GitHub", icon: <FiGithub />, href: "https://github.com" },
];

const SiteFooter = () => {
  return (
    <footer className="border-t border-white/5 bg-[#050816] pt-16 pb-10">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-4">
            <Logo />
            <p className="text-sm text-slate-300">
              Zygotrix University empowers product builders with studio-grade courses,
              adaptive practice, and mentorship that mirrors modern teams.
            </p>
            <Link
              to="/enterprise"
              className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-200 transition hover:text-white"
            >
              Zygotrix for Teams
              <FiArrowUpRight />
            </Link>
          </div>

          <div className="grid gap-8 text-sm lg:col-span-8 sm:grid-cols-2 md:grid-cols-3">
            {footerLinks.map((section) => (
              <div key={section.title}>
                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">
                  {section.title}
                </h3>
                <ul className="mt-4 space-y-3">
                  {section.links.map((link) => (
                    <li key={link.to}>
                      <Link className="text-slate-300 transition hover:text-white" to={link.to}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-6 border-t border-white/10 pt-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            {socialLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-slate-200 transition hover:border-indigo-400 hover:bg-indigo-400/20 hover:text-white"
              >
                <span className="text-lg">{item.icon}</span>
              </a>
            ))}
          </div>
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Zygotrix University. Crafted with curiosity and care.
          </p>
        </div>
      </Container>
    </footer>
  );
};

export default SiteFooter;
