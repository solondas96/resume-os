# ResumeLabs 🧪 + Headroom ⚡

> **Calm, minimal, precision Markdown resume builder with Headroom context compression.**  
> 100% Client-Side • Zero Backend • Warm Claude-Inspired Design System • Vitest Tested • Pixel-Perfect A4 Vector PDF Export • Headroom AI Context Compression.

---

## 🎨 Claude-Inspired Warm Minimalist Design System

ResumeLabs features a refined, calm, and distraction-free design aesthetic inspired by Claude:
- **Warm Neutral Palette**: Ivory light theme (`#faf9f5` background, `#141413` charcoal text) and warm charcoal dark theme (`#262624` background, `#f5f4ee` text).
- **Restrained Terracotta Accent**: Signature `#c96442` brand color and `#f5e9e2` subtle accent tints.
- **Quiet Typography**: Geist & Geist Mono with clean tracking, balanced heading wraps, and optimal reading line-height.
- **Two Soft Shadows**: Tailored elevation tokens for resting cards and lifted drawers without visual clutter or heavy blur.
- **Accessible & Tested**: Full keyboard navigation, visible brand focus rings, reduced motion support, and 100% passing Vitest test suite.

---

## ⚡ Headroom AI Integration

ResumeLabs demonstrates production-grade integration of **[Headroom](https://github.com/headroomlabs-ai/headroom)** — the context compression layer for AI agents that slashes LLM token usage by **60–95% for structured data** and **15–20% for coding and text agents**.

### Why Headroom in ResumeLabs?

When using AI agents to tailor resumes to job descriptions, score ATS keyword alignment, or rewrite bullet points with the STAR method, raw prompt contexts rapidly explode into thousands of redundant tokens. 

ResumeLabs dogfoods Headroom to:
- **Compress Resume & Job Contexts**: Removes structural JSON bloat, repeated keys, and formatting noise before hitting LLMs.
- **Save 60–85% on Token Costs**: Delivers massive cost reductions across GPT-4o, Claude 3.5 Sonnet, and Gemini 1.5.
- **Live In-Browser Telemetry**: Inspect real-time token savings, cost analytics, and compression breakdown cards directly in the **Headroom Studio**.
- **Edge & Proxy Support**: Connects seamlessly to a local Headroom proxy (`http://localhost:8787`) or operates in high-performance Client-Edge Smart Crushing mode in pure browser environments.

### Key Headroom Capabilities in ResumeLabs

| Feature | ResumeLabs Implementation |
| :--- | :--- |
| **Smart Crushing** | Eliminates schema overhead and redundant formatting from resume models. |
| **Message Compression** | Prunes system directives down to high-density semantic instructions. |
| **STAR Method Optimizer** | Compresses prompt contexts to generate quantified achievement bullets. |
| **Cost & Token Analytics** | Real-time dollar and token counter estimating savings on high-volume queries. |

### Optional: Running the Local Headroom Proxy

To route AI requests through the local Headroom Python compression proxy:

```bash
# 1. Install the Python CLI proxy
pip install "headroom-ai[proxy]"

# 2. Run the proxy locally
headroom proxy --port 8787

# 3. ResumeLabs will automatically detect the active proxy at http://localhost:8787!
```

---

## 🛠️ Intelligent Resume Parser Service

Includes a modular, zero-dependency resume parsing engine (`src/services/parsing.ts`) verified by a Vitest test suite (`npm run test`):
- **Line Break & Bullet Preservation**: Normalizes lines without collapsing bullet items.
- **Broad Skills Taxonomy**: Detects 50+ modern data, engineering, and product terms (`PySpark`, `Databricks`, `Snowflake`, `Kafka`, `Delta Lake`, `Airflow`, `dbt`, `RAG`, `LLM`, `Figma`, etc.).
- **Smart Experience Extraction**: Parses explicit phrases (`"7+ years of experience"`, `"10+ years of total experience"`) and extracts maximum tenure.
- **Heading Alias Normalization**: Maps `"Work Experience"` and `"Professional Experience"` to canonical sections and merges duplicates.
- **Safe Empty State Handling**: Gracefully handles blank or partial inputs without throwing.

---

## ✨ Core Features

- **🧪 Modern ResumeLabs Brand & Logo**: Custom geometric document monogram in warm terracotta `#c96442`.
- **🌓 Cohesive Dark & Light Mode**: Complete, seamless dark and light theme integration across all navigation, editor toolbars, modals, and drawing canvases.
- **🎯 Live ATS Job Description Matcher**: Real-time keyword scanner comparing job postings against your resume, calculating instant match percentages, and offering 1-click missing keyword injection.
- **⚡ 1-Click Direct Download PDF**: Native client-side PDF export powered by `html2pdf.js` with progress animations and celebratory confetti.
- **📂 Starter Role Presets**: Ready-to-use blueprints for Staff Software Engineer, Senior Product Designer, Lead Technical PM, and New Graduate.
- **📝 Markdown-First & Section Cards**: Switch seamlessly between raw CodeMirror 6 markdown and card view with drag/move reordering.
- **📏 Fine-Grained Typography & Margin Controls**: Dynamic font size (`small`, `medium`, `large`), page margins (`narrow`, `normal`, `relaxed`), and line-height controls.
- **⚡ 100% Client-Side**: Zero telemetry, no external database or serverless dependencies. Your resume data stays strictly in your browser.
- **📐 Multi-Sheet A4 Canvas & Manual Breaks**: Physical page break indicators and `::: page-break` directive support.
- **🏛️ 4 Curated English Templates**:
  - **Modern Minimalist**: Crisp Silicon Valley sans-serif typography with tag badges.
  - **Classic Ivy**: Traditional Harvard/Wall Street serif typography with centered headers.
  - **Executive Two-Tone**: Two-tone shaded section badges for senior leaders.
  - **Mono Compact**: High-density engineering layout for 1-page resumes.
- **💾 Autosave & Revisions**: Automatically persists to `localStorage` with a 20-revision history rollback buffer.
- **🚀 One-Click GitHub Pages Deployment**: Fully automated via GitHub Actions workflow.

---

## 🚀 Quick Start

### Development
```bash
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

### Run Tests & Lint
```bash
npm run test
npm run lint
```

### Production Build
```bash
npm run build
npm run preview
```

---

## 🚢 Deploying to GitHub Pages

1. Push this repository to GitHub:
   ```bash
   git add .
   git commit -m "feat: redesign ResumeLabs with Claude-inspired warm minimalism and tested parser"
   git push origin main
   ```
2. In your GitHub repository:
   - Go to **Settings** > **Pages**.
   - Under **Build and deployment** > **Source**, select **GitHub Actions**.
3. Every push to `main` will automatically build and publish your site at:  
   `https://<your-username>.github.io/resume-os/`

---

## 📚 Headroom Resources

- **GitHub**: [https://github.com/headroomlabs-ai/headroom](https://github.com/headroomlabs-ai/headroom)
- **Documentation**: [https://headroom-docs.vercel.app/docs](https://headroom-docs.vercel.app/docs)
- **Model Card**: [https://huggingface.co/chopratejas/kompress-v2-base](https://huggingface.co/chopratejas/kompress-v2-base)
- **Discord Community**: [https://discord.gg/yRmaUNpsPJ](https://discord.gg/yRmaUNpsPJ)

---

## 💡 Philosophy

> *"Use limits wisely" — Token budgets are real constraints in production AI systems. Headroom makes it practical to build cost-effective, scalable AI features without sacrificing quality.*

This reflects our approach: **build intelligent systems that are efficient, observable, and economically sustainable.**

---

## 📄 License
MIT License.
