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

/**
 * The accents a user can choose for a resume. Each one is checked at 4.5:1 or better on white
 * (the page is always white). The first is the default: ink navy, not a brand colour.
 */
export const ACCENT_COLORS: AccentColor[] = [
  { id: 'ink-navy', name: 'Ink navy', hex: '#1F3A5F', lightHex: '#e6ebf2' },
  { id: 'forest', name: 'Forest', hex: '#2F5D3A', lightHex: '#e8f0ea' },
  { id: 'oxblood', name: 'Oxblood', hex: '#7A2E2E', lightHex: '#f3e7e7' },
  { id: 'slate', name: 'Slate', hex: '#3F4A59', lightHex: '#e9ecf0' },
  { id: 'teal', name: 'Teal', hex: '#1F5F63', lightHex: '#e4eff0' },
  { id: 'plum', name: 'Plum', hex: '#5B3A6B', lightHex: '#eee8f1' },
  { id: 'graphite', name: 'Graphite', hex: '#3B3F45', lightHex: '#ebebed' },
  { id: 'ochre', name: 'Ochre', hex: '#7A5A16', lightHex: '#f4eedf' },
];
