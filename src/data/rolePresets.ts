import { RolePreset } from '../types';
import { SAMPLE_RESUME } from './sampleResume';

export const ROLE_PRESETS: RolePreset[] = [
  {
    id: 'software-engineer',
    roleName: 'Staff Software Engineer',
    candidateName: 'Alex Morgan',
    badge: 'Distributed Systems',
    description: 'High-scale backends, microservices, STAR methodology, and quantifiable cloud optimization.',
    iconName: 'code',
    theme: 'modern',
    accentColor: '#c96442', // Terracotta
    markdown: SAMPLE_RESUME,
  },
  {
    id: 'product-designer',
    roleName: 'Senior Product Designer',
    candidateName: 'Jordan Lee',
    badge: 'UI/UX & Design Systems',
    description: 'Figma component architectures, WCAG accessibility, user research, and cross-functional design sprints.',
    iconName: 'palette',
    theme: 'minimal',
    accentColor: '#7c3aed', // Imperial Violet
    markdown: `# Jordan Lee
Lead Product Designer | Design Systems & Complex Web Platforms

::: left
[icon:email jordan.lee@design.io](mailto:jordan.lee@design.io)
[icon:phone +1 (510) 555-0144](tel:+15105550144)
[icon:location Seattle, WA](https://maps.google.com)
:::

::: right
[icon:globe jordanlee.design](https://jordanlee.design)
[icon:linkedin linkedin.com/in/jordanleedesign](https://linkedin.com)
[icon:github github.com/jordanlee](https://github.com)
:::

## Summary
Product Designer with 7+ years of experience leading multi-disciplinary design systems and human-centered SaaS applications. Spearheaded design system adoption across 140+ engineers, cutting frontend component implementation time by 45%. Strong bridge between user research, Figma token workflows, and production React code.

## Experience

### Figma — Senior Product Designer (Design Systems)
*San Francisco, CA* | *2021 – Present*

\`Design Systems\` \`Figma Tokens\` \`WCAG 2.1 AA\` \`Prototyping\` \`React\`

- Architected the cross-platform design token pipeline, unifying 650+ color, typography, and elevation tokens across Web, iOS, and Android.
- Redesigned accessibility keyboard navigation flows, achieving **100% WCAG 2.1 AA compliance** across core product canvas workspaces.
- Conducted 30+ usability research sessions across enterprise design teams, boosting workflow completion satisfaction by **38%**.
- Partnered directly with engineering leads to co-author Storybook visual regression testing suites, eliminating UI bugs prior to staging.

### Linear — Product Designer
*Remote* | *2019 – 2021*

\`Interaction Design\` \`Micro-animations\` \`Information Architecture\` \`TypeScript\`

- Led the end-to-end UX overhaul of the issue triage backlog, decreasing average ticket resolution time by **24%** for 80,000+ active users.
- Designed keyboard shortcut interaction flows and command palette micro-interactions celebrated by developer communities.
- Reduced onboarding drop-off by **31%** through intuitive contextual guidance and empty-state illustrations.

## Design Tooling & Competencies

::: left
- **Design Tools:** Figma, FigJam, Principle, Framer, Adobe Creative Suite
- **User Research:** Usability Testing, Tree Testing, Journey Mapping
:::

::: right
- **Technical Skills:** HTML5, CSS3, Tailwind CSS, React, Storybook
- **Methodologies:** Agile Sprints, Design Thinking, Design Tokens
:::

## Education

### University of Washington
*Bachelor of Design in Interaction Design (BDes)* | *2015 – 2019*
- Dean's Honor Roll • Human-Computer Interaction Capstone Award
`,
  },
  {
    id: 'product-manager',
    roleName: 'Lead Product Manager',
    candidateName: 'Taylor Hayes',
    badge: 'Fintech & Growth',
    description: 'P&L management, product strategy, A/B experimentation, funnel optimization, and ARR growth.',
    iconName: 'briefcase',
    theme: 'executive',
    accentColor: '#059669', // Emerald
    markdown: `# Taylor Hayes
Principal Product Manager | Fintech Platforms & Growth Strategy

::: left
[icon:email taylor.hayes@fintech.com](mailto:taylor.hayes@fintech.com)
[icon:phone +1 (212) 555-0198](tel:+12125550198)
[icon:location New York, NY](https://maps.google.com)
:::

::: right
[icon:linkedin linkedin.com/in/taylorhayespm](https://linkedin.com)
[icon:globe taylorhayes.pm](https://taylorhayes.pm)
[icon:twitter twitter.com/taylorhayes](https://twitter.com)
:::

## Executive Profile
Product leader with 9+ years steering enterprise fintech platforms from zero to $45M ARR. Expert in conversion funnels, payments compliance, and multi-disciplinary squad leadership across engineering, design, and go-to-market.

## Professional Experience

### Plaid — Principal Product Manager, Enterprise Payments
*New York, NY* | *2021 – Present*

\`Payments API\` \`Go-To-Market\` \`P&L\` \`A/B Testing\` \`SQL\` \`Mixpanel\`

- Owned product roadmap and P&L for Instant Payouts, driving annual transaction processing volume from **$800M to $3.4B in 24 months**.
- Launched intelligent payment routing algorithms that decreased payment failure rates by **19%**, recovering **$4.2M in annual merchant revenue**.
- Managed cross-functional group of 28 engineers, 3 data scientists, and 2 product designers across 3 geographic pods.
- Formulated enterprise tier pricing structure that expanded net revenue retention (NRR) to **128%**.

### Brex — Senior Product Manager, Corporate Card
*New York, NY* | *2018 – 2021*

\`Growth Funnels\` \`Risk Modeling\` \`Segment\` \`Amplitude\`

- Spearheaded automated KYC/AML verification flow redesign, increasing onboarding pass-through rates by **32%** while lowering fraud risk by **15%**.
- Designed and launched Brex Rewards point exchange marketplace, generating **$12M in partner affiliate revenue**.

## Core Competencies

::: left
- **Product Strategy:** Vision & Roadmapping, OKR Planning, P&L Ownership
- **Analytics & Experimentation:** SQL, Amplitude, Mixpanel, Tableau, LaunchDarkly
:::

::: right
- **Industry Domains:** Open Banking, Payment Gateways, Risk & Compliance (SOC2)
- **Leadership:** Cross-Functional Squad Leadership, Executive Stakeholder Alignment
:::

## Education

### Columbia University
*Master of Business Administration (MBA)* | *2016 – 2018*
*Bachelor of Science in Industrial Engineering* | *2010 – 2014*
`,
  },
  {
    id: 'new-grad',
    roleName: 'Software Engineer (New Grad)',
    candidateName: 'Sam Rivera',
    badge: '1-Page University Focus',
    description: 'High GPA, hackathon championships, rigorous CS coursework, algorithms, and open source contributions.',
    iconName: 'graduation-cap',
    theme: 'classic',
    accentColor: '#1e3a8a', // Oxford Navy
    markdown: `# Sam Rivera
Computer Science Graduate | Software Engineering Candidate

::: left
[icon:email sam.rivera@berkeley.edu](mailto:sam.rivera@berkeley.edu)
[icon:phone +1 (510) 555-0189](tel:+15105550189)
[icon:location Berkeley, CA](https://maps.google.com)
:::

::: right
[icon:github github.com/samrivera](https://github.com)
[icon:linkedin linkedin.com/in/samriveracs](https://linkedin.com)
[icon:globe samrivera.dev](https://samrivera.dev)
:::

## Education

### University of California, Berkeley
*Bachelor of Science in Electrical Engineering & Computer Sciences (EECS)* | *May 2024*
- **GPA:** 3.92 / 4.00 (Summa Cum Laude)
- **Coursework:** Data Structures & Algorithms, Operating Systems, Computer Architecture, Database Systems, Computer Security
- **Awards:** Upsilon Pi Epsilon CS Honor Society, CalHacks 1st Place Winner (out of 400+ teams)

## Technical Skills

::: left
- **Languages:** Python, Java, C++, TypeScript, Go, SQL, HTML/CSS
- **Frameworks & Libraries:** React, Node.js, Express, FastAPI, PyTorch
:::

::: right
- **Developer Tools:** Git, Docker, Linux, Bash, PostgreSQL, Redis, AWS (S3, EC2)
- **Concepts:** Distributed Systems, REST APIs, CI/CD, Multithreading
:::

## Experience

### Meta — Software Engineer Intern
*Menlo Park, CA* | *Summer 2023*

\`Python\` \`React\` \`Hack/PHP\` \`GraphQL\` \`Mercurial\`

- Developed automated telemetry analysis tools for backend caching clusters, decreasing memory leak triage time by **35%**.
- Implemented real-time anomaly detection pipelines in Python processing over **2M metric events per minute**.
- Wrote unit and end-to-end integration tests achieving **94% test coverage** on critical payment settlement microservices.

## Notable Projects

### CloudFS — Distributed Fault-Tolerant File System
*C++ • Raft Consensus • RPC • Multithreading* | [icon:github github.com/samrivera/cloudfs](https://github.com)
- Built a distributed key-value storage engine in C++ implementing the Raft consensus protocol from scratch.
- Handled automatic leader election, log replication, and split-brain network partitions with sub-100ms recovery.

### CodeSync — Real-Time Collaborative Code Editor
*TypeScript • React • Node.js • WebSockets • Redis* | [icon:github github.com/samrivera/codesync](https://github.com)
- Engineered collaborative web IDE using Operational Transformation (OT) supporting 20+ concurrent keystrokes per document.
`,
  },
  {
    id: 'ai-research-engineer',
    roleName: 'Staff AI/ML Research Engineer',
    candidateName: 'Dr. Elena Rostova',
    badge: 'LLMs & Inference Systems',
    description: 'LLM fine-tuning, KV cache optimization, vLLM/TensorRT-LLM kernels, RLHF alignment, and distributed PyTorch training.',
    iconName: 'cpu',
    theme: 'swiss',
    accentColor: '#2563eb', // Pacific Blue
    markdown: `# Dr. Elena Rostova
Staff AI Research Engineer | LLM Inference & Efficient Foundation Models

::: left
[icon:email elena.rostova@deepintel.ai](mailto:elena.rostova@deepintel.ai)
[icon:phone +1 (415) 555-0139](tel:+14155550139)
[icon:location San Francisco, CA](https://maps.google.com)
:::

::: right
[icon:globe elenarostova.ai](https://elenarostova.ai)
[icon:github github.com/erostova](https://github.com)
[icon:linkedin linkedin.com/in/elena-rostova-phd](https://linkedin.com)
:::

## Executive Summary
AI Systems Researcher and Staff Engineer with 8+ years leading foundational model post-training and high-throughput inference architectures. Co-authored 6 NeurIPS/ICLR papers on speculative decoding and FlashAttention extensions. Championed production inference engine deployments saving $3.8M in annual GPU compute clusters across 12,000 H100 instances.

## Experience

### Anthropic — Staff AI Research Engineer, Inference Systems
*San Francisco, CA* | *2022 – Present*

\`PyTorch\` \`CUDA\` \`vLLM\` \`TensorRT-LLM\` \`Triton\` \`DeepSpeed\`

- Architected continuous batching and PagedAttention KV-cache management engine, decreasing time-to-first-token (TTFT) by **54%** and cutting p99 latency from **820ms to 240ms** under 25,000 concurrent user load.
- Co-designed custom FP8 quantization and speculative decoding kernels in CUDA/Triton, achieving **2.8× generation throughput** with zero measurable perplexity degradation across 70B parameter models.
- Led the distributed training and RLHF alignment infrastructure across 4,096 NVIDIA H100 GPUs with DeepSpeed ZeRO-3 and Megatron-LM, lowering inter-node communication overhead by **28%**.
- Spearheaded automated model checkpointing and failover recovery libraries, preventing over **320 hours of lost cluster training time**.

### DeepMind — Senior Machine Learning Research Scientist
*London, UK / Mountain View, CA* | *2019 – 2022*

\`JAX\` \`TensorFlow\` \`XLA\` \`TPU v4\` \`Ray\` \`Distributed Training\`

- Formulated novel sparse attention mechanism for multimodal transformer architectures, scaling context window from **8k to 128k tokens** with linear O(N) memory complexity.
- Directed 7 research engineers in benchmark evaluation suites for reasoning distillation, boosting HumanEval and GSM8k accuracy by **14.2%** over baseline weights.
- Engineered automated data curation pipelines filtering 12TB of pre-training web tokens, increasing data efficiency by **33%**.

## Technical Competencies

::: left
- **AI & Deep Learning:** PyTorch, JAX, Triton, vLLM, TensorRT-LLM, HuggingFace, DeepSpeed, Ray
- **Inference & Systems:** CUDA Kernels, PagedAttention, KV-Cache Optimization, FP8/INT4 Quantization
:::

::: right
- **Distributed Compute:** SLURM, Kubernetes (K8s), NCCL, InfiniBand RoCE, AWS Trainium, GCP TPU v4/v5e
- **Languages & Core:** Python, C++, CUDA C, Rust, Triton IR, Bash, SQL, Git
:::

## Education & Selected Publications

### Stanford University
*Ph.D. in Computer Science (Artificial Intelligence)* | *2015 – 2019*
- Dissertation: *Sparse Memory Systems and Low-Latency Kernels for Deep Sequence Models*
- Co-advised by Stanford AI Lab (SAIL). 3 Best Paper Nominations (NeurIPS, ICML).

### Carnegie Mellon University
*Bachelor of Science in Computer Science & Applied Mathematics* | *2011 – 2015*
- Summa Cum Laude (GPA: 3.98/4.00) • Andrew Carnegie Scholar
`,
  },
  {
    id: 'data-architect',
    roleName: 'Principal Data Architect',
    candidateName: 'Marcus Chen',
    badge: 'Lakehouse & Real-Time Analytics',
    description: 'Enterprise Apache Iceberg lakehouses, Kafka streaming pipelines, Snowflake to BigQuery migrations, and data mesh governance.',
    iconName: 'database',
    theme: 'modern',
    accentColor: '#059669', // Forest Emerald
    markdown: `# Marcus Chen
Principal Data Architect | Enterprise Lakehouse & Streaming Analytics

::: left
[icon:email marcus.chen@datacore.io](mailto:marcus.chen@datacore.io)
[icon:phone +1 (408) 555-0177](tel:+14085550177)
[icon:location San Jose, CA](https://maps.google.com)
:::

::: right
[icon:globe marcuschen.dev](https://marcuschen.dev)
[icon:github github.com/marcuschen-data](https://github.com)
[icon:linkedin linkedin.com/in/marcus-chen-data](https://linkedin.com)
:::

## Executive Summary
Principal Data Architect with 12+ years designing mission-critical data lakehouses, distributed streaming platforms, and multi-tenant analytical ecosystems processing 50+ petabytes. Proven track record unifying disparate transactional silos into unified open-table architectures (Apache Iceberg, Delta Lake) while reducing total infrastructure TCO by 40%+.

## Professional Experience

### Snowflake — Principal Cloud Data Architect
*San Mateo, CA* | *2021 – Present*

\`Apache Iceberg\` \`Snowflake\` \`dbt\` \`Kafka\` \`Apache Flink\` \`Terraform\`

- Architected enterprise Apache Iceberg migration framework replacing legacy Parquet catalogs, reducing analytical query scan costs by **$2.6M annually** across 18PB of warehouse data.
- Built real-time Change Data Capture (CDC) streaming fabric with Apache Kafka and Flink, slashing end-to-end event propagation latency from **45 minutes to sub-3 seconds**.
- Established decentralized Data Mesh governance model across 14 global product domains, enforcing strict dbt data contracts and zero-trust column-level security.
- Standardized data modeling standards across 160+ analytics engineers, reducing duplicate table lineages by **65%** and speeding time-to-insight for C-suite dashboards.

### Stripe — Lead Data Infrastructure Engineer
*San Francisco, CA* | *2017 – 2021*

\`Trino/Presto\` \`Apache Spark\` \`Airflow\` \`AWS EMR\` \`Python\` \`Scala\`

- Spearheaded Petabyte-scale migration of transaction ledger analytics from on-prem Hadoop clusters to AWS S3 lakehouse with Trino and Spark.
- Optimized query execution plans and dynamic partition pruning across 30,000 daily Airflow DAG jobs, improving cluster CPU utilization by **38%**.
- Designed fault-tolerant idempotency pipelines processing **$120B+ in annual transaction volume** with exactly-once settlement guarantees.

## Architecture & Technical Arsenal

::: left
- **Lakehouse & Warehouses:** Apache Iceberg, Delta Lake, Snowflake, BigQuery, Databricks, Redshift
- **Streaming & Messaging:** Apache Kafka, Apache Flink, Spark Streaming, RabbitMQ, Confluent
:::

::: right
- **Modeling & Orchestration:** dbt Core/Cloud, Airflow, Dagster, Prefect, Great Expectations
- **Languages & Storage:** SQL, Python, Scala, Go, AWS S3, Google Cloud Storage, PostgreSQL
:::

## Education & Certifications

### University of Waterloo
*Bachelor of Mathematics & Computer Science (Honours Co-op)* | *2009 – 2014*
- Dean's Honours List • President's Scholarship of Excellence
- **Certifications:** AWS Certified Data Analytics Specialty, Snowflake SnowPro Core Architect
`,
  },
  {
    id: 'engineering-director',
    roleName: 'Director of Engineering',
    candidateName: 'Priya Patel',
    badge: 'Org Scaling & Platform Eng',
    description: 'Leading 65+ engineers, multi-region cloud migration, 99.999% availability, developer productivity, and budget management.',
    iconName: 'users',
    theme: 'executive',
    accentColor: '#334155', // Slate Gray
    markdown: `# Priya Patel
Director of Engineering | Cloud Infrastructure & Platform Engineering

::: left
[icon:email priya.patel@cloudleaders.io](mailto:priya.patel@cloudleaders.io)
[icon:phone +1 (206) 555-0182](tel:+12065550182)
[icon:location Seattle, WA](https://maps.google.com)
:::

::: right
[icon:linkedin linkedin.com/in/priyapatel-eng](https://linkedin.com)
[icon:globe priyapatel.tech](https://priyapatel.tech)
[icon:github github.com/priyapatel-tech](https://github.com)
:::

## Executive Profile
Engineering leader with 14+ years of experience scaling high-performance engineering organizations from 15 to 80+ engineers across 4 international hubs. Deep technical roots in distributed infrastructure, site reliability, and modern DevOps culture. Championed multi-cloud modernization initiatives delivering $4.5M in annual cloud infrastructure savings while maintaining five-nines (99.999%) SLA.

## Leadership Experience

### Twilio — Director of Core Infrastructure Engineering
*Seattle, WA* | *2021 – Present*

\`Org Strategy\` \`Budgeting ($22M)\` \`Platform Engineering\` \`Kubernetes\` \`Service Mesh\` \`SOC2\`

- Direct 5 engineering managers, 2 principal architects, and 62 software/DevOps engineers across Platform, Compute, and Developer Experience squads.
- Orchestrated 18-month multi-region cloud migration across AWS and GCP, driving global messaging API availability to **99.999%** for 300,000+ enterprise customers.
- Cut annual cloud infrastructure spend by **$4.5M (24% reduction)** through reserved instance modeling, Graviton CPU adoption, and automated ephemeral environment lifecycles.
- Overhauled developer platform toolchains, slashing deployment cycle times from **4 hours to 14 minutes** and boosting internal engineering satisfaction (eNPS) from **+28 to +64**.
- Championed inclusive hiring initiatives, increasing female and underrepresented engineering representation across senior leadership from **18% to 41%**.

### DoorDash — Senior Engineering Manager, Core Logistics
*San Francisco, CA* | *2017 – 2021*

\`Distributed Systems\` \`Microservices\` \`Golang\` \`gRPC\` \`Kafka\` \`Incident Response\`

- Led 24 engineers across Dispatch Algorithms and Driver Allocation microservices handling 4M+ daily food delivery orders.
- Reduced p99 dispatch matchmaking latency by **62%**, increasing driver delivery throughput by **14%** during peak lunch and dinner order surges.
- Mentored and promoted 4 engineers to staff roles and 2 senior engineers into first-time engineering management positions.

## Core Competencies & Governance

::: left
- **Leadership & Org Design:** Team Scaling (15 to 80+), Budgeting ($20M+ P&L), OKRs, Technical Strategy
- **Platform Engineering:** Internal Developer Platforms (IDP), Service Mesh (Istio), CI/CD, FinOps
:::

::: right
- **Architecture & Quality:** Multi-Cloud (AWS/GCP), Chaos Engineering, SRE Incident Response, SOC2 / ISO27001
- **Developer Enablement:** Dora Metrics, Trunk-Based Development, Monorepo Architecture
:::

## Education

### University of Michigan, Ann Arbor
*Master of Science in Computer Science & Engineering* | *2011 – 2013*
*Bachelor of Science in Computer Engineering (Magna Cum Laude)* | *2007 – 2011*
`,
  },
  {
    id: 'sre-engineer',
    roleName: 'Senior Staff Site Reliability Engineer',
    candidateName: 'David Lindqvist',
    badge: 'Kubernetes & Resilience',
    description: 'Multi-cloud Kubernetes clusters, automated chaos testing, zero-downtime failover, OpenTelemetry, and Prometheus at scale.',
    iconName: 'server',
    theme: 'minimal',
    accentColor: '#d97706', // Sunset Amber
    markdown: `# David Lindqvist
Senior Staff Site Reliability Engineer | Cloud Resilience & Infrastructure

::: left
[icon:email david.lindqvist@srelabs.io](mailto:david.lindqvist@srelabs.io)
[icon:phone +1 (512) 555-0163](tel:+15125550163)
[icon:location Austin, TX](https://maps.google.com)
:::

::: right
[icon:globe davidlindqvist.dev](https://davidlindqvist.dev)
[icon:github github.com/dlindqvist-ops](https://github.com)
[icon:linkedin linkedin.com/in/david-lindqvist-sre](https://linkedin.com)
:::

## Professional Summary
Staff Site Reliability Engineer with 10+ years architecting self-healing distributed platforms across 12,000+ Kubernetes nodes. Pioneer in GitOps, automated incident mitigation, and distributed tracing. Reduced enterprise severity-1 production outage minutes by 78% while establishing sub-second telemetry across 450+ microservices.

## Experience

### Netflix — Senior Staff Site Reliability Engineer, Core Edge
*Remote / Los Gatos, CA* | *2021 – Present*

\`Kubernetes\` \`eBPF\` \`OpenTelemetry\` \`Envoy\` \`Golang\` \`Terraform\` \`Spinnaker\`

- Architected multi-region automated traffic shifting system with Envoy and eBPF, achieving **zero-downtime zonal evacuation within 90 seconds** of cloud provider degradation.
- Implemented global OpenTelemetry and Thanos metrics pipeline processing **120M metric samples per second**, cutting telemetry storage bills by **$1.8M/year**.
- Engineered automated canary analysis and rollback pipelines, preventing **42 potential sev-1 customer-facing regressions** across 6,000 weekly service deployments.
- Authored production reliability standards and error budget policies adopted by 350+ microservice engineering squads.

### HashiCorp — Staff Infrastructure Engineer
*San Francisco, CA* | *2018 – 2021*

\`Terraform\` \`Vault\` \`Consul\` \`Nomad\` \`AWS\` \`Python\` \`Prometheus\`

- Engineered multi-cloud Terraform modules managing 1,200+ AWS/GCP accounts, reducing infrastructure provisioning turnaround from **4 days to 6 minutes**.
- Hardened HashiCorp Cloud Platform (HCP) Vault clusters, achieving SOC2 Type II compliance and handling **150,000 cryptographic operations/sec**.
- Ran weekly game day chaos experiments (Chaos Mesh), discovering and eliminating 18 single points of failure prior to peak traffic events.

## Technical Skills & Infrastructure

::: left
- **Orchestration & Compute:** Kubernetes, Docker, Helm, ArgoCD, Terraform, AWS EKS, GCP GKE, Linux Kernel, eBPF
- **Observability & SRE:** OpenTelemetry, Prometheus, Thanos, Grafana, Datadog, Jaeger, SLO/SLI Management
:::

::: right
- **Networking & Security:** Envoy Proxy, Istio, Cloudflare, Calico CNI, HashiCorp Vault, mTLS, Zero-Trust Architecture
- **Programming & Scripting:** Go, Python, Bash, Rust, GitOps, GitHub Actions, Spinnaker
:::

## Education & Certifications

### KTH Royal Institute of Technology (Stockholm, Sweden)
*Bachelor of Science in Information & Communication Technology* | *2010 – 2014*
- **Certifications:** Certified Kubernetes Administrator (CKA), AWS Certified Solutions Architect Professional
`,
  },
  {
    id: 'academic-researcher',
    roleName: 'Postdoctoral Research Fellow',
    candidateName: 'Dr. Arthur Pendelton',
    badge: 'Genomics & Bioinformatics',
    description: 'Single-cell RNA sequencing, statistical genomics, peer-reviewed Nature publications, and NIH grant leadership.',
    iconName: 'book-open',
    theme: 'academic',
    accentColor: '#1e3a8a', // Oxford Navy
    markdown: `# Dr. Arthur Pendelton
Postdoctoral Research Fellow | Computational Biology & Statistical Genomics

::: left
[icon:email arthur.pendelton@broadinstitute.org](mailto:arthur.pendelton@broadinstitute.org)
[icon:phone +1 (617) 555-0158](tel:+16175550158)
[icon:location Cambridge, MA](https://maps.google.com)
:::

::: right
[icon:globe arthurpendelton.org](https://arthurpendelton.org)
[icon:github github.com/arthurpendelton](https://github.com)
[icon:linkedin linkedin.com/in/arthur-pendelton](https://linkedin.com)
:::

## Academic & Research Profile
Computational Biologist and Postdoctoral Fellow specializing in single-cell transcriptomics, Bayesian spatial statistics, and machine learning models for genomic regulation. Lead author on 7 peer-reviewed papers (Nature Genetics, Bioinformatics, Genome Biology) with over 1,400 citations (h-index: 12). Co-principal investigator on $1.2M NIH R01 genomic diversity research grant.

## Research Appointments

### Broad Institute of MIT and Harvard — Postdoctoral Research Fellow
*Cambridge, MA* | *2022 – Present*
*Advisors: Prof. Miriam Goldstein, Prof. David S. Clark*

\`R\` \`Python\` \`Nextflow\` \`PyTorch\` \`Seurat\` \`Scanpy\` \`HPC SLURM\`

- Developed novel variational autoencoder (VAE) architecture for spatial transcriptomics, resolving cellular neighborhood interactions across **1.8 million single cells**.
- Authored open-source statistical genomics R/Python package *CellSpace*, downloaded over **85,000 times** by biomedical researchers worldwide.
- Built reproducible bioinformatics pipelines with Nextflow and Docker on AWS cloud compute, reducing genomic sequence processing turnaround by **68%**.
- Mentored 4 Ph.D. students and co-directed wet-lab validation experiments for oncogenic mutation detection.

### Johns Hopkins University — Graduate Research Assistant
*Baltimore, MD* | *2017 – 2022*

\`Bioconductor\` \`C++\` \`Statistical Genetics\` \`GWAS\` \`Bash\`

- Led high-throughput genome-wide association studies (GWAS) identifying 14 novel susceptibility loci for autoimmune disorders.
- Published 4 primary research articles and delivered keynote presentations at Cold Spring Harbor Laboratories (CSHL) and ASHG.

## Selected Peer-Reviewed Publications

1. **Pendelton, A.**, Goldstein, M., & Clark, D. S. (2024). *Deep generative modeling of spatial gene expression at single-cell resolution*. **Nature Genetics**, 56(4), 612–624.
2. **Pendelton, A.**, & Henderson, R. T. (2022). *Bayesian trajectory inference in high-dimensional single-cell RNA-seq*. **Genome Biology**, 23(1), 89–103.
3. Alvarez, K., **Pendelton, A.**, & Wu, Q. (2021). *Scalable chromatin accessibility indexing via sparse tensor decomposition*. **Bioinformatics**, 37(12), 1701–1708.

## Grants & Fellowships

- **NIH National Research Service Award (F32 Postdoctoral Fellowship):** $184,000 (2023 – 2025)
- **National Science Foundation (NSF) Graduate Research Fellowship (GRFP):** $138,000 (2018 – 2021)
- **Chan Zuckerberg Initiative (CZI) Open Science Seed Grant:** $50,000 (2023)

## Education

### Johns Hopkins University School of Medicine
*Ph.D. in Human Genetics & Molecular Biology* | *2017 – 2022*
- Dissertation: *Statistical Methods for Deconvoluting Heterogeneous Cellular Microenvironments*

### Harvard University
*Bachelor of Arts in Biochemical Sciences & Applied Mathematics* | *2013 – 2017*
- Magna Cum Laude • Phi Beta Kappa • John Harvard Scholar
`,
  },
  {
    id: 'product-marketing',
    roleName: 'Lead Product Marketing Manager',
    candidateName: 'Chloe Martin',
    badge: 'Enterprise SaaS & GTM',
    description: 'Go-to-market product launches, ICP positioning, sales enablement, competitive battlecards, and ARR pipeline acceleration.',
    iconName: 'megaphone',
    theme: 'swiss',
    accentColor: '#c96442', // Terracotta
    markdown: `# Chloe Martin
Lead Product Marketing Manager | Enterprise SaaS & Go-To-Market

::: left
[icon:email chloe.martin@gtmleaders.com](mailto:chloe.martin@gtmleaders.com)
[icon:phone +1 (415) 555-0195](tel:+14155550195)
[icon:location San Francisco, CA](https://maps.google.com)
:::

::: right
[icon:linkedin linkedin.com/in/chloemartin-pmm](https://linkedin.com)
[icon:globe chloemartin.com](https://chloemartin.com)
[icon:twitter twitter.com/chloemartin](https://twitter.com)
:::

## Career Summary
Strategic Product Marketing Leader with 8+ years steering tier-1 enterprise SaaS go-to-market launches, competitive intelligence, and ICP packaging. Led 5 major tier-1 product launches generating over $34M in net-new pipeline ARR. Trusted partner to Product, Sales, and Executive leadership in translating complex technical features into compelling business value narratives.

## Professional Experience

### Datadog — Lead Product Marketing Manager, Cloud Security
*San Francisco, CA* | *2022 – Present*

\`GTM Strategy\` \`Positioning & Messaging\` \`Sales Enablement\` \`Pricing & Packaging\` \`Competitive Intelligence\`

- Directed global GTM launch for Cloud Security Management, driving **$18M in net-new ARR within 9 months** and exceeding annual quota targets by **138%**.
- Redesigned customer persona narratives and ICP segmentation across Enterprise Security and DevOps buyers, increasing win rates against legacy vendors by **27%**.
- Built sales enablement program and battlecard curriculum training 450+ global enterprise account executives and sales engineers.
- Overhauled tiered pricing and packaging structure, lifting average contract value (ACV) from **$48,000 to $74,000**.
- Co-produced annual customer keynote presentations attended by 14,000+ virtual and in-person attendees at Datadog DASH.

### Notion — Senior Product Marketing Manager, Enterprise & API
*San Francisco, CA* | *2019 – 2022*

\`Product Launches\` \`Developer Marketing\` \`Content Strategy\` \`Customer Advisory Boards\`

- Spearheaded the launch of Notion's public API and developer platform, onboarding **40,000+ active integrations** within the first quarter.
- Created enterprise sales collateral, ROI calculators, and security whitepapers contributing to **$16M in enterprise ARR expansion**.
- Formed and managed Notion's Executive Customer Advisory Board (CAB) with Fortune 500 CIOs and VP of Product stakeholders.

## Core Competencies & Tooling

::: left
- **Marketing Strategy:** Category Creation, Tier-1 Product Launches, Pricing & Packaging, Analyst Relations (Gartner/Forrester)
- **Field Enablement:** Sales Playbooks, Competitive Battlecards, Pitch Decks, Customer Case Studies
:::

::: right
- **Analytics & Research:** Win/Loss Analysis, User Interviews, Gong.io, Highspot, Salesforce CRM, Looker
- **Collaboration:** Cross-Functional Alignment (Product, Sales, RevOps, Demand Gen, Design)
:::

## Education

### Northwestern University
*Bachelor of Science in Journalism & Integrated Marketing Communications* | *2012 – 2016*
- Medill School of Journalism • Magna Cum Laude • Kappa Tau Alpha Honor Society
`,
  },
];
