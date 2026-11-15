import { TemplateId, FontSizeOption, MarginOption, LineHeightOption } from '../types';

export interface SharePayload {
  t: string; // title
  m: string; // markdown
  th: TemplateId; // theme
  c: string; // accentColor
  fs: FontSizeOption;
  ms: MarginOption;
  lh: LineHeightOption;
}

function utf8ToBase64(str: string): string {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    )
  );
}

function base64ToUtf8(str: string): string {
  return decodeURIComponent(
    Array.prototype.map
      .call(atob(str), (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
}

/**
 * Encodes a resume state into a compact URL-safe string.
 */
export function encodeResumeForShare(resume: {
  title: string;
  markdown: string;
  theme: TemplateId;
  accentColor: string;
  fontSize: FontSizeOption;
  marginSize: MarginOption;
  lineHeight: LineHeightOption;
}): string {
  const payload: SharePayload = {
    t: resume.title,
    m: resume.markdown,
    th: resume.theme,
    c: resume.accentColor,
    fs: resume.fontSize,
    ms: resume.marginSize,
    lh: resume.lineHeight,
  };
  const json = JSON.stringify(payload);
  return encodeURIComponent(utf8ToBase64(json));
}

/**
 * Decodes a share string back into resume properties.
 */
export function decodeSharedResume(encoded: string): {
  title: string;
  markdown: string;
  theme: TemplateId;
  accentColor: string;
  fontSize: FontSizeOption;
  marginSize: MarginOption;
  lineHeight: LineHeightOption;
} | null {
  try {
    const rawB64 = decodeURIComponent(encoded);
    const json = base64ToUtf8(rawB64);
    const parsed: SharePayload = JSON.parse(json);
    return {
      title: parsed.t || 'Shared Resume',
      markdown: parsed.m || '',
      theme: parsed.th || 'modern',
      accentColor: parsed.c || '#c96442',
      fontSize: parsed.fs || 'medium',
      marginSize: parsed.ms || 'normal',
      lineHeight: parsed.lh || 'normal',
    };
  } catch (e) {
    console.error('Failed to decode shared resume hash:', e);
    return null;
  }
}

/**
 * Builds the full shareable URL link for the current page.
 */
export function getShareableUrl(resume: {
  title: string;
  markdown: string;
  theme: TemplateId;
  accentColor: string;
  fontSize: FontSizeOption;
  marginSize: MarginOption;
  lineHeight: LineHeightOption;
}): string {
  const code = encodeResumeForShare(resume);
  const base = window.location.origin + window.location.pathname;
  return `${base}#view=${code}`;
}
