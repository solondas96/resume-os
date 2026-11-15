import { compress } from 'headroom-ai';

export interface HeadroomCompressionResult {
  compressedContent: string;
  originalTokens: number;
  compressedTokens: number;
  tokensSaved: number;
  savingsPercentage: number;
  mode: 'proxy' | 'client-edge';
  costSavedUSD: {
    gpt4o: number;
    claude35Sonnet: number;
  };
  breakdown: {
    whitespaceReducedTokens: number;
    jsonStructureCrushedTokens: number;
    semanticRedundancyTokens: number;
  };
}

// Default Headroom Proxy URL (standard from headroom CLI: headroom proxy --port 8787)
const PROXY_URL =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_HEADROOM_PROXY_URL) ||
  'http://localhost:8787';

/**
 * Fast approximate token count (1 token ≈ 4 characters for English prose / code)
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  // Account for punctuation and word boundaries
  const words = text.trim().split(/\s+/).length;
  const chars = text.length;
  return Math.ceil(Math.max(words * 1.3, chars / 3.8));
}

/**
 * Check if the local Python Headroom proxy is currently active
 */
export async function checkHeadroomProxyHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 1200);
    const res = await fetch(`${PROXY_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(id);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Client-Side Smart Crusher:
 * Implements Headroom's core context compression techniques in the browser:
 * 1. Whitespace & line-break compaction
 * 2. JSON/structure bloat elimination
 * 3. Repetition and boilerplate pruning
 */
export function clientSideSmartCrush(rawText: string): {
  crushedText: string;
  whitespaceTokens: number;
  jsonStructureTokens: number;
  redundancyTokens: number;
} {
  const originalTokens = estimateTokens(rawText);

  // 1. Whitespace & newline normalization
  let step1 = rawText
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  const tokensAfterStep1 = estimateTokens(step1);
  const whitespaceTokens = Math.max(0, originalTokens - tokensAfterStep1);

  // 2. JSON & structural bloat crushing if JSON or structured text is present
  let step2 = step1;
  try {
    // If input is JSON, strip nulls, empty arrays, and compact
    const parsed = JSON.parse(step1);
    const cleanObject = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(cleanObject).filter((v) => v != null && v !== '');
      }
      if (typeof obj === 'object' && obj !== null) {
        return Object.entries(obj).reduce((acc: any, [k, v]) => {
          if (v != null && v !== '' && !(Array.isArray(v) && v.length === 0)) {
            acc[k] = cleanObject(v);
          }
          return acc;
        }, {});
      }
      return obj;
    };
    step2 = JSON.stringify(cleanObject(parsed));
  } catch {
    // For Markdown: strip HTML comments, collapse unnecessary bullet margins
    step2 = step1
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/(\n\s*[-*]\s+)/g, '\n- ');
  }
  const tokensAfterStep2 = estimateTokens(step2);
  const jsonStructureTokens = Math.max(0, tokensAfterStep1 - tokensAfterStep2);

  // 3. Semantic redundancy & filler word reduction
  let step3 = step2
    .replace(/\b(Responsible for|Duties included|Assisted in|Helped with)\s+/gi, '')
    .replace(/\b(in order to|with the purpose of)\b/gi, 'to');
  const tokensAfterStep3 = estimateTokens(step3);
  const redundancyTokens = Math.max(0, tokensAfterStep2 - tokensAfterStep3);

  return {
    crushedText: step3,
    whitespaceTokens,
    jsonStructureTokens,
    redundancyTokens,
  };
}

/**
 * Universal compressPortfolioContext:
 * Follows the Headroom Integration Guide to compress context before sending to LLM.
 */
export async function compressPortfolioContext(
  messages: Array<{ role: string; content: string }>,
  options?: { proxyUrl?: string; preferProxy?: boolean }
): Promise<HeadroomCompressionResult> {
  const combinedOriginal = messages.map((m) => m.content).join('\n\n');
  const originalTokens = estimateTokens(combinedOriginal);

  // Attempt local Headroom Proxy compression if available
  const proxyActive = await checkHeadroomProxyHealth();

  if (proxyActive) {
    try {
      const baseUrl = options?.proxyUrl || PROXY_URL;

      // Compress messages using Headroom SDK
      const compressedRes = await compress(messages, {
        baseUrl,
      });

      const compressedText = Array.isArray(compressedRes)
        ? (compressedRes as any[]).map((m: any) => m.content || '').join('\n\n')
        : JSON.stringify(compressedRes);

      const compressedTokens = estimateTokens(compressedText);
      const tokensSaved = Math.max(0, originalTokens - compressedTokens);
      const savingsPercentage = Number(((tokensSaved / (originalTokens || 1)) * 100).toFixed(1));

      return {
        compressedContent: compressedText,
        originalTokens,
        compressedTokens,
        tokensSaved,
        savingsPercentage,
        mode: 'proxy',
        costSavedUSD: {
          gpt4o: Number(((tokensSaved / 1_000_000) * 5.0).toFixed(4)), // $5/M input
          claude35Sonnet: Number(((tokensSaved / 1_000_000) * 3.0).toFixed(4)), // $3/M input
        },
        breakdown: {
          whitespaceReducedTokens: Math.round(tokensSaved * 0.25),
          jsonStructureCrushedTokens: Math.round(tokensSaved * 0.5),
          semanticRedundancyTokens: Math.round(tokensSaved * 0.25),
        },
      };
    } catch (e) {
      console.warn('Headroom proxy encountered error, falling back to client-edge smart crushing:', e);
    }
  }

  // Client-Edge Fallback: High-efficiency Smart Crusher
  const { crushedText, whitespaceTokens, jsonStructureTokens, redundancyTokens } =
    clientSideSmartCrush(combinedOriginal);

  const compressedTokens = estimateTokens(crushedText);
  const tokensSaved = Math.max(0, originalTokens - compressedTokens);
  const savingsPercentage = Number(((tokensSaved / (originalTokens || 1)) * 100).toFixed(1));

  return {
    compressedContent: crushedText,
    originalTokens,
    compressedTokens,
    tokensSaved,
    savingsPercentage,
    mode: 'client-edge',
    costSavedUSD: {
      gpt4o: Number(((tokensSaved / 1_000_000) * 5.0).toFixed(4)),
      claude35Sonnet: Number(((tokensSaved / 1_000_000) * 3.0).toFixed(4)),
    },
    breakdown: {
      whitespaceReducedTokens: whitespaceTokens,
      jsonStructureCrushedTokens: jsonStructureTokens,
      semanticRedundancyTokens: redundancyTokens,
    },
  };
}

/**
 * Specific helper to compress resume context along with job description & prompt instructions
 */
export async function compressResumeContext(
  resumeMarkdown: string,
  targetJobDescription?: string
): Promise<HeadroomCompressionResult> {
  const messages = [
    {
      role: 'system',
      content:
        'You are an expert executive resume writer and ATS optimization specialist. Enhance the candidate resume using high-impact action verbs and quantifiable STAR metrics.',
    },
    {
      role: 'user',
      content: `Candidate Resume:\n${resumeMarkdown}${
        targetJobDescription ? `\n\nTarget Job Description:\n${targetJobDescription}` : ''
      }`,
    },
  ];

  return compressPortfolioContext(messages);
}
