# ResumeOS 📄

> **Modern, English-first, in-browser Markdown resume builder.**  
> 100% Client-Side • Zero Backend • Privacy-First • Pixel-Perfect A4 Vector PDF Export • GitHub Pages Ready.

![ResumeOS Preview](https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/file-text.svg)

---

## ✨ Features

- **📝 Markdown-First**: Write clean, structured content without worrying about layout breaking.
- **⚡ 100% Client-Side**: Zero telemetry, no external database or serverless dependencies. Your resume data stays strictly in your browser.
- **🎯 Pixel-Perfect A4 Vector PDF**: Uses browser-native `@page` vector printing (`window.print()`). Crisp text, selectable copy-paste, clickable contact links, zero server cost.
- **📐 Visual Page Break & 1-Page Guard**: Real-time dashed markers indicate where Page 1 ends and Page 2 begins. A 1-page fit alert warns you before you overflow.
- **🏛️ 4 Curated English Templates**:
  - **Modern Minimalist**: Crisp Silicon Valley sans-serif typography with tag badges.
  - **Classic Ivy**: Traditional Harvard/Wall Street serif typography with centered headers.
  - **Executive**: Two-tone shaded section badges for senior leaders.
  - **Mono Compact**: High-density engineering layout for 1-page resumes.
- **🎨 Live Color Theming**: Switch between Slate, Pacific Blue, Forest Emerald, Oxford Navy, Burgundy, and custom hex accents.
- **🔗 Extended Markdown Primitives**:
  - `::: left` and `::: right` for two-column contact headers and skill grids.
  - `[icon:email user@domain.com](mailto:...)` or `[icon:linkedin ...]` with inline SVG icons.
  - Backtick tags `` `React` `TypeScript` `` rendered as clean pill badges.
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

### Production Build
```bash
npm run build
npm run preview
```

---

## 🚢 Deploying to GitHub Pages

1. Push this repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: initial commit of ResumeOS"
   git remote add origin https://github.com/<your-username>/ResumeOS.git
   git branch -M main
   git push -u origin main
   ```
2. In your GitHub repository:
   - Go to **Settings** > **Pages**.
   - Under **Build and deployment** > **Source**, select **GitHub Actions**.
3. Every push to `main` will automatically build and publish your site at:  
   `https://<your-username>.github.io/ResumeOS/`

---

## 📄 License
MIT License.
