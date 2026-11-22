export type TemplateId = 'modern' | 'classic' | 'executive' | 'minimal' | 'swiss' | 'academic';
export type UiTheme = 'dark' | 'light';
export type EditorViewMode = 'markdown' | 'cards';
export type WorkspaceMode = 'resume' | 'cover-letter';
export type ActiveSidePanel = 'none' | 'tailor' | 'linter';

export type FontSizeOption = 'small' | 'medium' | 'large';
export type MarginOption = 'narrow' | 'normal' | 'relaxed';
export type LineHeightOption = 'tight' | 'normal' | 'relaxed';
export type MobileViewTab = 'editor' | 'preview';

export interface ResumeProfile {
  id: string;
  title: string;
  targetRole?: string;
  markdown: string;
  theme: TemplateId;
  accentColor: string;
  fontSize: FontSizeOption;
  marginSize: MarginOption;
  lineHeight: LineHeightOption;
  updatedAt: number;
}

export interface BulletAnalysis {
  raw: string;
  cleanText: string;
  hasActionVerb: boolean;
  actionVerb?: string;
  weakVerb?: string;
  suggestedVerb?: string;
  hasMetric: boolean;
  metrics: string[];
  wordCount: number;
  score: number; // 0 - 100
  status: 'strong' | 'needs-metric' | 'passive';
}

export interface BulletLinterResult {
  overallScore: number;
  totalBullets: number;
  strongBullets: number;
  metricsBullets: number;
  weakVerbBullets: number;
  bullets: BulletAnalysis[];
}

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
