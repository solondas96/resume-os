# ResumeLabs 🧪

[![Live Demo](https://img.shields.io/badge/Demo-Live%20on%20GitHub%20Pages-c96442?style=for-the-badge&logo=github)](https://solondas96.github.io/resume-os/)
[![Built With](https://img.shields.io/badge/Stack-React%2018%20•%20Vite%206%20•%20TypeScript%20•%20Tailwind-141413?style=for-the-badge)](https://github.com/solondas96/resume-os)
[![Tests](https://img.shields.io/badge/Tests-Vitest%20Passing%20(18%2F18)-059669?style=for-the-badge)](https://github.com/solondas96/resume-os)
[![License](https://img.shields.io/badge/License-MIT-3a3a37?style=for-the-badge)](LICENSE)

> **Precision Markdown resume builder with a calm, Claude-inspired warm minimalist aesthetic.**  
> 100% Client-Side • Zero Backend Telemetry • In-Browser Privacy • Text-Based PDF Export • Instant GitHub Pages Hosting.

---

### 🌐 Live Application

👉 **Try it live right now:** **[https://solondas96.github.io/resume-os/](https://solondas96.github.io/resume-os/)**

---

## 🎨 Claude-Inspired Warm Minimalist Aesthetic

ResumeLabs is engineered to feel calm, focused, and distraction-free:
- **Warm Neutral Color Tokens**: Restful ivory light theme (`#faf9f5` background, `#141413` charcoal text) paired with a warm charcoal dark theme (`#262624` background, `#f5f4ee` text).
- **Restrained Terracotta Brand Accent**: Signature `#c96442` brand accent (and dark `#d97757`) with subtle `#f5e9e2` tint surfaces.
- **Quiet Typography**: Geist & Geist Mono fonts with clean tracking, balanced heading wraps (`[text-wrap:balance]`), and optimal reading line-height.
- **Two Soft Shadows**: Pure CSS elevation tokens for resting cards and lifted popover drawers without artificial blur or gradient noise.
- **Single Brand Call to Action**: Clear visual hierarchy with at most one primary brand-focused action per screen.

---

## 🚀 Advanced Engineering & Job Hunt Features

### 1. 📁 Multi-Resume Library & Targeted Versions
Maintain customized resumes for different target companies and roles (*"Stripe — Staff Backend"*, *"Google — Distributed Systems"*, *"Startup — Lead Architect"*). Clone existing resumes in 1 click, rename, delete, and backup or restore your entire library as JSON.

### 2. 📏 Smart "Fit to 1 Page" Assistant & Page-Budget Gauge
Never struggle with trailing 3-line spills onto page 2. The real-time status bar monitors A4 sheet height and offers a 1-click **Auto-Fit 1 Page** optimization that conservatively tunes line-height, margins, and font scale to lock your content cleanly onto a single page.

### 3. ✍️ Bullet Point Linter & XYZ Impact Scorer
Evaluates every achievement bullet against Google’s **XYZ Formula** (*"Accomplished [X] as measured by [Y], by doing [Z]"*):
- Identifies 50+ strong action verbs (`Architected`, `Spearheaded`, `Orchestrated`, `Overhauled`, `Scaled`).
- Flags passive phrases (`worked on`, `helped with`, `responsible for`) with 1-click strong verb replacements.
- Checks for quantifiable metrics (`$12B+`, `42%`, `180k req/s`, `99.999% SLA`) and conciseness.

### 4. 🎯 Side-by-Side Job Match Tailor
Dock your target job description in a dedicated side-by-side inspector panel. Track keyword overlap and missing qualifications live as you edit your resume without leaving the workspace.

### 5. ✉️ Matching Cover Letter Companion
Seamlessly switch between your Resume and a matching Cover Letter companion. Shares your candidate header details, accent colors, and typography to export a unified, professional 2-document packet.

### 6. 🎨 6 Curated Professional Templates
- **Modern Minimalist**: Clean Silicon Valley aesthetic with crisp sans-serif typography and pill skill tags.
- **Classic Ivy**: Traditional Harvard & Wall Street style with elegant serif headings and formal rules.
- **Executive Two-Tone**: Distinguished executive layout featuring a shaded sidebar for skills & leadership.
- **Mono Compact**: High-density technical aesthetic for dense 1-page engineering resumes.
- **Swiss Editorial**: International typographic style with bold grotesque headers and hairline dividers.
- **Academic CV**: Scholarly curriculum vitae layout with traditional serifs and publication numbering.

### 7. 🔗 1-Click Shareable Web Resume Link (Recruiter View)
Encode your resume into a private, client-side URL hash link. Send `/#view=...` directly to hiring managers or recruiters to present a clean, responsive web view with an instant "Download PDF" button.

---

## 🧠 Intelligence Engine (no AI)

All guidance is deterministic: rules, curated lexicons and a skills dictionary with synonyms, in `src/intelligence/`. There are no models and no network calls.
- **Health score**: Impact, Clarity, ATS readiness, Consistency and Length, each explained.
- **Job match**: requirements from a posting, normalised through the skills dictionary, with evidence bullets and a gap list.
- **ATS preview**: the plain text an applicant tracking system would read, in reading order, with problems flagged.
- **Bullet builder**: composes an XYZ-style bullet and asks for a missing metric.
- **Seniority check**: scope, ownership and leadership signals against a target level.


## ✨ Key Features

- **🎯 Live In-Browser ATS Matcher**: Paste any job description to instantly compute keyword overlap, match percentage, and inject missing keywords with 1 click.
- **⚡ Text-Based PDF Export**: Browser print dialog generates selectable, ATS-parseable PDFs with no rasterization.
- **🏛️ 6 Curated Professional Templates**:
  - **Modern Minimalist**: Clean Silicon Valley aesthetic with crisp sans-serif and pill skill tags.
  - **Classic Ivy**: Traditional Harvard/Wall Street style with elegant serif headings.
  - **Executive Two-Tone**: Distinguished executive layout with shaded sidebar for skills.
  - **Mono Compact**: High-density technical aesthetic for dense 1-page resumes.
  - **Swiss Editorial**: International typographic style with bold grotesque headers.
  - **Academic CV**: Scholarly curriculum vitae layout with traditional serifs.
- **📂 Starter Role Presets (10 Curated Industry Blueprints)**: Pre-configured, high-impact resumes with STAR/Google XYZ metrics, tech skill tags, and custom themes: Staff Software Engineer, Senior Product Designer, Lead Technical PM, New Graduate, Staff AI/ML Research Engineer, Principal Data Architect, Director of Engineering, Senior Staff SRE, Postdoctoral Fellow (Academic CV), and Lead Product Marketing Manager.
- **📝 Dual Editor Modes**: Switch seamlessly between CodeMirror 6 markdown editor (with slash `/` shortcuts) and drag-to-reorder section cards.
- **📏 Fine-Grained Layout Controls**: Dynamic font sizes (`small`, `medium`, `large`), page margins (`narrow`, `normal`, `relaxed`), and line-height controls.
- **📐 Multi-Page A4 Sheet Canvas**: Visual page-break guides and manual `::: page-break :::` container support.
- **💾 Auto-Save & Revision Rollback**: Persists changes to local storage with a 20-snapshot revision history.
- **⌨️ Command Palette (`Cmd+K` / `Ctrl+K`)**: Rapid keyboard navigation across every tool, preset, template, and export format.

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js 18+ or 20+
- npm 9+

### Installation & Development
```bash
# Clone the repository
git clone https://github.com/solondas96/resume-os.git
cd resume-os

# Install dependencies
npm install

# Start local development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Run Tests & Type Checks
```bash
# Run Vitest unit tests
npm run test

# Run TypeScript type check
npm run lint
```

### Production Build
```bash
npm run build
npm run preview
```

---

## 🚢 GitHub Pages Deployment

The repository is configured for automated deployments via GitHub Actions (`.github/workflows/deploy.yml`):

1. Fork or push changes to your repository's `main` branch:
   ```bash
   git add .
   git commit -m "feat: custom updates"
   git push origin main
   ```
2. In GitHub, navigate to **Settings** > **Pages**.
3. Under **Build and deployment** > **Source**, choose **GitHub Actions**.
4. The workflow will automatically compile and publish your site at:  
   **`https://<your-username>.github.io/resume-os/`**

---

## 📚 Resources & Links

- **Live Site**: [https://solondas96.github.io/resume-os/](https://solondas96.github.io/resume-os/)
- **GitHub Repository**: [https://github.com/solondas96/resume-os](https://github.com/solondas96/resume-os)

---

## 📄 License
MIT License. Open source and private by design.
