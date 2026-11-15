# ResumeLabs 🧪

[![Live Demo](https://img.shields.io/badge/Demo-Live%20on%20GitHub%20Pages-c96442?style=for-the-badge&logo=github)](https://solondas96.github.io/resume-os/)
[![Built With](https://img.shields.io/badge/Stack-React%2018%20•%20Vite%206%20•%20TypeScript%20•%20Tailwind-141413?style=for-the-badge)](https://github.com/solondas96/resume-os)
[![Tests](https://img.shields.io/badge/Tests-Vitest%20Passing%20(10%2F10)-059669?style=for-the-badge)](https://github.com/solondas96/resume-os)
[![License](https://img.shields.io/badge/License-MIT-3a3a37?style=for-the-badge)](LICENSE)

> **Precision Markdown resume builder with a calm, Claude-inspired warm minimalist aesthetic.**  
> 100% Client-Side • Zero Backend Telemetry • In-Browser Privacy • Pixel-Perfect Vector PDF Export • Instant GitHub Pages Hosting.

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

## 🛠️ Intelligent Resume Parser Service

ResumeLabs includes a tested, modular resume parser (`src/services/parsing.ts`) verified by a Vitest unit test suite:
- **Bullet & Line Break Preservation**: Normalizes lines without collapsing bullet points into run-on strings.
- **Broad Skills Taxonomy**: Automatically identifies 50+ data, cloud, engineering, and product skills (`PySpark`, `Databricks`, `Snowflake`, `Kafka`, `Delta Lake`, `Airflow`, `dbt`, `RAG`, `LLM`, `Figma`, etc.).
- **Smart Experience Extraction**: Parses explicit phrases (`"7+ years of experience"`, `"10+ years of total experience"`) and extracts the maximum tenure.
- **Canonical Heading Aliases**: Normalizes `"Work Experience"` and `"Professional Experience"` to `"Experience"`, and merges duplicate sections.
- **Fail-Safe & Tested**: Gracefully handles blank or partial inputs without throwing errors.

---

## ✨ Key Features

- **🎯 Live In-Browser ATS Matcher**: Paste any job description to instantly compute keyword overlap, match percentage, and inject missing keywords with 1 click.
- **⚡ 1-Click Direct Vector PDF Export**: Zero-backend vector PDF download via `html2pdf.js` with progress feedback.
- **🏛️ 4 Curated English Templates**:
  - **Modern Minimalist**: Crisp Silicon Valley sans-serif typography with tag badges.
  - **Classic Ivy**: Traditional Harvard/Wall Street serif typography with centered headers.
  - **Executive Two-Tone**: Two-tone shaded section badges for senior leaders.
  - **Mono Compact**: High-density engineering layout for 1-page resumes.
- **📂 Starter Role Presets**: Ready-to-use professional blueprints for Staff Software Engineer, Senior Product Designer, Lead Technical PM, and New Graduate.
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
