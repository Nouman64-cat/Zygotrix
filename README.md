# Zygotrix

Zygotrix is an educational genetics simulation platform that helps students and curious learners explore how parental traits and genetic information can shape possible offspring characteristics. The project is designed as a safe, accessible learning companion�not a diagnostic or medical decision-making tool.

## Why Zygotrix?

- Illustrate how Mendelian inheritance and polygenic models interact to influence phenotype outcomes.
- Provide intuitive visualizations that turn complex genomic concepts into approachable learning experiences.
- Encourage responsible engagement with genetic data through clear guardrails, consent reminders, and privacy-first defaults.

## Repository Structure

- `genetics-engine/`: Core Python library that models inheritance logic and calculates trait probabilities; intentionally framework-agnostic so it can be packaged or published independently.
- `backend/`: FastAPI service that exposes the engine to web and mobile clients while handling authentication, persistence, and orchestration tasks.
- `web/`: Browser-based frontend that presents interactive simulations, reports, and visual dashboards for desktop users.
- `mobile/`: Mobile-first experience (React Native/Expo planned) optimized for handheld learning and quick scenario exploration.
- `docs/`: Concept notes, research references, and product documentation that support curriculum design and stakeholder communication.
- `examples/`: Sample datasets, notebooks, and walkthroughs that demonstrate how to operate the engine and interpret outputs.

This separation keeps the genetics engine clean and reusable, while the service and UI layers can evolve independently without coupling presentation concerns to core modeling logic.

## Core Capabilities

- **Trait-Based Inputs**: Capture parental traits such as eye color, hair color, blood type, height, and more.
- **Genetic Data Integration**: Optionally import VCF files from services like 23andMe or AncestryDNA to enrich the simulation.
- **Probabilistic Outputs**: Generate likelihood distributions for potential offspring traits (e.g., "60% chance blue eyes, 40% chance green eyes" or "expected height range: 165�173 cm").
- **Educational Reports**: Export summaries that explain the underlying genetics concepts and highlight learning takeaways.

## Simulation Workflow

1. **Collect Inputs**: Users provide parental traits and, optionally, VCF genetic data.
2. **Process Genetics**:
   - Apply Mendelian inheritance rules for simple traits (dominant/recessive allele modeling).
   - Calculate polygenic risk scores for complex traits such as height, weight, or disease susceptibility.
   - Reference public genomic datasets (SNPedia, ClinVar, GWAS Catalog) to map relevant variants to phenotypic outcomes.
3. **Present Results**: Visualize probability distributions, risk awareness summaries, and optional phenotype renderings that combine predicted traits with user-supplied imagery.
4. **Encourage Reflection**: Highlight how environmental factors and lifestyle choices can modulate genetic predispositions.

## Planned Features

- Interactive probability visualizations (charts, graphs, and comparative overlays).
- Environmental factor sliders to illustrate gene�environment interactions.
- AI-assisted phenotype previews using GANs or autoencoders for speculative child face morphs.
- Customizable educational reports for classroom or workshop use.
- Privacy controls that allow anonymous simulations and local-only data processing.

## Architecture Overview

- **Inputs**: Parent-reported traits, optional VCF files.
- **Core Engine**: Rule-based inheritance modeling, polygenic score calculations, and genomic database lookups.
- **Delivery Layer**: FastAPI backend plus web and mobile clients that translate engine outputs into interactive learning experiences.
- **Outputs**: Probabilistic trait charts, hereditary risk awareness dashboards, and optional phenotype visualizations.

## Technology Stack

- **Backend**: Python (pandas, numpy, scikit-learn, biopython) for data processing and modeling; FastAPI for service orchestration.
- **Visualization**: matplotlib, plotly, or D3.js (if delivered through a web UI).
- **Frontend (Planned)**: React/Next.js for web, React Native/Expo for mobile.
- **Machine Learning (Optional)**: GANs/autoencoders for phenotype visualization experiments.

## Data Sources & References

- **SNPedia**: Trait associations and allele frequency primers.
- **ClinVar**: Clinical significance references for select variants.
- **GWAS Catalog**: Polygenic risk score research and supporting literature.

## Roadmap

1. **Core Simulation Engine**: Implement rule-based inheritance and baseline probability calculations within `zygotrix_engine/`.
2. **VCF Integration**: Parse genetic files and reconcile variants with SNPedia/ClinVar records.
3. **Visualization Layer**: Build interactive charts and probability graphs for learners via the `web/` app.
4. **AI Phenotype Generator**: Prototype speculative phenotype rendering from trait predictions, coordinated across backend and client layers.
5. **Web Application**: Deploy an interactive, browser-based experience for classrooms and self-guided learning, followed by mobile rollout.

## Project Status

Zygotrix is in early-stage development. The internal team is focused on solidifying data models, validating inheritance logic, and designing user-centered education pathways. External collaboration is not currently open.

## Getting Started (Planned)

- Define Python environment requirements and dependency management approach (e.g., poetry, pipenv, conda).
- Outline data ingestion samples for both trait-based inputs and VCF files.
- Prototype core simulation modules within a test harness to validate inheritance logic.

Detailed setup instructions will be added as the initial modules are implemented.

## Ethics & Responsible Use

- Zygotrix is strictly for educational purposes and must not be used for medical decisions or clinical diagnoses.
- Always obtain informed consent before using personal genetic data.
- Respect privacy by storing sensitive files locally and deleting them after simulations are complete.
- Encourage thoughtful discussions about the limitations of genetic determinism and the importance of environmental context.

## License

License information will be added once finalized.
