export type TemplateId = 'modern' | 'classic' | 'executive' | 'minimal';
export type UiTheme = 'dark' | 'light';
export type EditorViewMode = 'markdown' | 'cards';

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
