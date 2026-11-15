import { AccentColor, TemplateConfig } from '../types';

export const TEMPLATES: TemplateConfig[] = [
  {
    id: 'modern',
    name: 'Modern Minimalist',
    description: 'Clean Silicon Valley aesthetic with crisp sans-serif typography, pill skill tags, and accent divider lines.',
    fontFamily: 'Inter, system-ui, sans-serif',
    author: 'ResumeOS Team',
  },
  {
    id: 'classic',
    name: 'Classic Ivy',
    description: 'Traditional Harvard & Wall Street style with elegant serif headings, centered headers, and formal horizontal rules.',
    fontFamily: 'Newsreader, Merriweather, Georgia, serif',
    author: 'ResumeOS Team',
  },
  {
    id: 'executive',
    name: 'Executive Two-Tone',
    description: 'Distinguished executive layout featuring a shaded sidebar for skills & credentials alongside leadership accomplishments.',
    fontFamily: 'Inter, system-ui, sans-serif',
    author: 'ResumeOS Team',
  },
  {
    id: 'minimal',
    name: 'Mono Compact',
    description: 'High-density, technical aesthetic using monospaced accents. Engineered for dense 1-page engineering resumes.',
    fontFamily: 'Inter, JetBrains Mono, monospace',
    author: 'ResumeOS Team',
  },
  {
    id: 'swiss',
    name: 'Swiss Editorial',
    description: 'International typographic style with bold grotesque headers, hairline dividers, and crisp asymmetrical dates.',
    fontFamily: 'Geist, Inter, system-ui, sans-serif',
    author: 'ResumeLabs Team',
  },
  {
    id: 'academic',
    name: 'Academic CV',
    description: 'Scholarly curriculum vitae layout with traditional Newsreader serifs, formal honorifics, and publication numbering.',
    fontFamily: 'Newsreader, Georgia, serif',
    author: 'ResumeLabs Team',
  },
];

export const ACCENT_COLORS: AccentColor[] = [
  { id: 'terracotta', name: 'Terracotta (Warm)', hex: '#c96442', lightHex: '#f5e9e2' },
  { id: 'slate', name: 'Slate Gray', hex: '#334155', lightHex: '#f1f5f9' },
  { id: 'blue', name: 'Pacific Blue', hex: '#2563eb', lightHex: '#eff6ff' },
  { id: 'navy', name: 'Oxford Navy', hex: '#1e3a8a', lightHex: '#eff6ff' },
  { id: 'emerald', name: 'Forest Emerald', hex: '#059669', lightHex: '#ecfdf5' },
  { id: 'burgundy', name: 'Royal Burgundy', hex: '#991b1b', lightHex: '#fef2f2' },
  { id: 'purple', name: 'Imperial Violet', hex: '#7c3aed', lightHex: '#f5f3ff' },
  { id: 'amber', name: 'Sunset Amber', hex: '#d97706', lightHex: '#fffbeb' },
  { id: 'charcoal', name: 'True Charcoal', hex: '#18181b', lightHex: '#f4f4f5' },
];
