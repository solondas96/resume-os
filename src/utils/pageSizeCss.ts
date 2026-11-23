/**
 * Keep the print page size in step with the chosen paper (A4 or US Letter).
 * CSS cannot pick an @page size from a class, so the rule is set at runtime.
 */
import type { PageSize } from '../pdf/layout';

const STYLE_ID = 'page-size-style';

export function applyPrintPageSize(size: PageSize): void {
  if (typeof document === 'undefined') return;
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement('style');
    el.id = STYLE_ID;
    document.head.appendChild(el);
  }
  el.textContent = `@page { size: ${size === 'Letter' ? 'letter' : 'A4'} portrait; margin: 0; }`;
}
