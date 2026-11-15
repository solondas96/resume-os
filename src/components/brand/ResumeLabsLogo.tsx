import React from 'react';

interface ResumeLabsLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  textClassName?: string;
}

export const ResumeLabsLogo: React.FC<ResumeLabsLogoProps> = ({
  size = 32,
  className = '',
  showText = false,
  textClassName = '',
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Dynamic Vector Icon */}
      <div
        style={{ width: size, height: size }}
        className="relative flex-shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 shadow-md shadow-blue-500/25 ring-1 ring-white/20 select-none group-hover:scale-105 transition-transform duration-200"
      >
        <svg
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-[78%] h-[78%] drop-shadow-sm"
        >
          {/* Subtle grid pattern inside */}
          <rect
            x="7"
            y="5"
            width="22"
            height="26"
            rx="4.5"
            fill="white"
            fillOpacity="0.12"
            stroke="white"
            strokeWidth="1.6"
          />

          {/* Document Fold Corner Accent */}
          <path
            d="M21 5V10.5C21 11.3284 21.6716 12 22.5 12H29"
            stroke="white"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Resume Content Lines (Representing structure) */}
          <path
            d="M11 10H16"
            stroke="white"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M11 14.5H23"
            stroke="white"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeOpacity="0.8"
          />

          {/* Lab Flask / Beaker Synthesis Glyph (Intersecting precision bottom) */}
          <path
            d="M13 26H23L21.2 21.5C20.9 20.8 20.5 19 20.5 19H15.5C15.5 19 15.1 20.8 14.8 21.5L13 26Z"
            fill="url(#flask-gradient)"
            stroke="#93c5fd"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />

          {/* Lab Liquid / Reaction Wave */}
          <path
            d="M14 24.5C15 24 16.5 24.8 18 24.3C19.5 23.8 21 24.5 22 24.5"
            stroke="white"
            strokeWidth="1.2"
            strokeLinecap="round"
          />

          {/* Bubbles / Energy Spark */}
          <circle cx="16.5" cy="21.5" r="0.9" fill="#67e8f9" />
          <circle cx="19.2" cy="22.5" r="0.7" fill="#67e8f9" />

          {/* Defs for rich gradients */}
          <defs>
            <linearGradient id="flask-gradient" x1="13" y1="19" x2="23" y2="26" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38bdf8" stopOpacity="0.7" />
              <stop offset="1" stopColor="#818cf8" stopOpacity="0.9" />
            </linearGradient>
          </defs>
        </svg>

        {/* Ambient Corner Specular Dot */}
        <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-xs shadow-cyan-300 animate-pulse" />
      </div>

      {/* Brand Wordmark */}
      {showText && (
        <div className={`flex flex-col select-none leading-none ${textClassName}`}>
          <div className="flex items-center tracking-tight">
            <span className="font-extrabold text-[15px] text-slate-900 dark:text-white">
              Resume
            </span>
            <span className="font-extrabold text-[15px] bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              Labs
            </span>
            <span className="ml-1.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 font-mono">
              v2.0
            </span>
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-normal mt-0.5">
            Precision Resume Engineering
          </span>
        </div>
      )}
    </div>
  );
};
