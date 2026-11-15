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
    accentColor: '#2563eb', // Pacific Blue
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
];
