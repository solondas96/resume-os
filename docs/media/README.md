# Media for the README

- `desktop-light.png`, `desktop-dark.png`, `phone-light.png`, `phone-dark.png`: copies of the screenshots from `tests/e2e/screenshots.spec.ts` (1440 and 360 px wide, both themes). Regenerate with `npx playwright test tests/e2e/screenshots.spec.ts` and copy from `test-results/screenshots/`.
- `demo.gif`: six frames from the first screen to the inspector's Design tab, built by `scripts/make-demo-gif.py`:

  ```sh
  python3 -m pip install pillow
  python3 scripts/make-demo-gif.py <frames-dir> docs/media/demo.gif
  ```

  The frames were captured with Playwright at 1280 × 800 from the running app: the welcome screen, the review, the editor with the reminder dismissed, the inspector's Health tab, a job match in the Match tab, and the Design tab.
