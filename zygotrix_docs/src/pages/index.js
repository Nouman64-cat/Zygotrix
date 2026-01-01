import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <img 
          src="https://zygotrix.fra1.cdn.digitaloceanspaces.com/cdn/zygotrix-logo.png" 
          alt="Zygotrix Logo"
          style={{width: '120px', height: '120px', marginBottom: '1rem'}}
        />
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs">
            Get Started 🚀
          </Link>
        </div>
      </div>
    </header>
  );
}

const FeatureList = [
  {
    title: '🧬 Genetics Calculations',
    description: 'Calculate Punnett squares, genetic crosses, and inheritance patterns with our high-performance C++ engine.',
  },
  {
    title: '🤖 AI-Powered Assistant',
    description: 'Zigi, your intelligent genetics assistant powered by Claude AI, answers questions and performs calculations.',
  },
  {
    title: '📊 GWAS Analysis',
    description: 'Run genome-wide association studies on your VCF files with statistical analysis and visualization.',
  },
];

function Feature({title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center padding-horiz--md" style={{padding: '2rem'}}>
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="Documentation"
      description="Zygotrix - AI-Powered Genetics Education Platform Documentation">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
