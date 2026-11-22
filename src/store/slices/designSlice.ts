/**
 * Zustand store slice: Design settings
 * Template, accent color, typography, spacing
 */

import { TemplateId, FontSizeOption, MarginOption, LineHeightOption } from '../../types';
import { saveSetting } from '../../services/persistence';

export interface DesignSliceState {
  // Template & colors
  theme: TemplateId;
  setTheme: (theme: TemplateId) => Promise<void>;
  accentColor: string;
  setAccentColor: (color: string) => Promise<void>;

  // Typography
  fontSize: FontSizeOption;
  setFontSize: (size: FontSizeOption) => Promise<void>;
  lineHeight: LineHeightOption;
  setLineHeight: (height: LineHeightOption) => Promise<void>;

  // Spacing
  marginSize: MarginOption;
  setMarginSize: (margin: MarginOption) => Promise<void>;
  compactSpacing: boolean;
  setCompactSpacing: (compact: boolean) => Promise<void>;

  // Page layout
  onePageMode: boolean;
  setOnePageMode: (onePageMode: boolean) => Promise<void>;
  fitToOnePage: () => Promise<void>;
}

/**
 * Create design slice
 */
export function createDesignSlice(set: any, get: any): DesignSliceState {
  return {
    theme: 'modern',
    setTheme: async (theme: TemplateId) => {
      set({ theme });
      await saveSetting('theme', theme);
    },

    accentColor: '#c96442',
    setAccentColor: async (color: string) => {
      set({ accentColor: color });
      await saveSetting('accentColor', color);
    },

    fontSize: 'medium',
    setFontSize: async (size: FontSizeOption) => {
      set({ fontSize: size });
      await saveSetting('fontSize', size);
    },

    lineHeight: 'normal',
    setLineHeight: async (height: LineHeightOption) => {
      set({ lineHeight: height });
      await saveSetting('lineHeight', height);
    },

    marginSize: 'normal',
    setMarginSize: async (margin: MarginOption) => {
      set({ marginSize: margin });
      await saveSetting('marginSize', margin);
    },

    compactSpacing: false,
    setCompactSpacing: async (compact: boolean) => {
      set({ compactSpacing: compact });
      await saveSetting('compactSpacing', compact);
    },

    onePageMode: false,
    setOnePageMode: async (onePageMode: boolean) => {
      set({ onePageMode });
      await saveSetting('onePageMode', onePageMode);
    },

    /**
     * Auto-fit to one page by optimizing spacing
     */
    fitToOnePage: async () => {
      const { marginSize, lineHeight, fontSize, saveRevision } = get();

      // Save current state as a snapshot first
      await saveRevision?.('Pre-fit to 1 Page');

      // Progressively reduce spacing
      const nextMargin = marginSize === 'relaxed' ? 'normal' : 'narrow';
      const nextLineHeight = lineHeight === 'relaxed' ? 'normal' : 'tight';
      const nextFontSize = fontSize === 'large' ? 'medium' : fontSize === 'medium' ? 'small' : 'small';

      set({
        marginSize: nextMargin,
        lineHeight: nextLineHeight,
        fontSize: nextFontSize,
        compactSpacing: true,
        onePageMode: true,
      });

      // Save settings
      await Promise.all([
        saveSetting('marginSize', nextMargin),
        saveSetting('lineHeight', nextLineHeight),
        saveSetting('fontSize', nextFontSize),
        saveSetting('compactSpacing', true),
        saveSetting('onePageMode', true),
      ]);

      // Save final state
      await saveRevision?.('Auto-fitted to 1 Page');
    },
  };
}
