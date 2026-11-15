export type TemplateId = 'modern' | 'classic' | 'executive' | 'minimal';
export type UiTheme = 'dark' | 'light';
export type EditorViewMode = 'markdown' | 'cards';

export type FontSizeOption = 'small' | 'medium' | 'large';
export type MarginOption = 'narrow' | 'normal' | 'relaxed';
export type LineHeightOption = 'tight' | 'normal' | 'relaxed';
export type MobileViewTab = 'editor' | 'preview';

export interface AccentColor {
  id: string;
  name: string;
  hex: string;
  lightHex: string;
}

export interface ResumeRevision {
  id: string;
  timestamp: number;
  title: string;
  markdown: string;
  theme: TemplateId;
  accentColor: string;
}

export interface TemplateConfig {
  id: TemplateId;
  name: string;
  description: string;
  fontFamily: string;
  author: string;
}

export interface RolePreset {
  id: string;
  roleName: string;
  candidateName: string;
  badge: string;
  description: string;
  iconName: string;
  theme: TemplateId;
  accentColor: string;
  markdown: string;
}

declare module 'html2pdf.js';
