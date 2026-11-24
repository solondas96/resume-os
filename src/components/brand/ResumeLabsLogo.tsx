import React from 'react';

interface ResumeLabsLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  textClassName?: string;
}

export const ResumeLabsLogo: React.FC<ResumeLabsLogoProps> = ({
  size = 30,
  className = '',
  showText = false,
  textClassName = '',
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Calm, refined geometric monogram */}
      <div
        style={{ width: size, height: size }}
        className="relative flex-shrink-0 flex items-center justify-center rounded-xl bg-brand-button text-on-pencil shadow-card transition-transform duration-200"
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-[72%] h-[72%]"
        >
          {/* Document Sheet outline */}
          <rect
            x="6"
            y="4"
            width="20"
            height="24"
            rx="3.5"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Document fold corner accent */}
          <path
            d="M19 4V9C19 9.55228 19.4477 10 20 10H25"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Structural Content Rules */}
          <path
            d="M10 9H15"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M10 13.5H22"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Precision Cross / Synthesis Mark */}
          <path
            d="M10 22H14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="18.5" cy="22" r="1.5" fill="currentColor" />
          <path
            d="M21.5 22H22"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Brand Wordmark */}
      {showText && (
        <div className={`hidden sm:flex flex-col select-none leading-none ${textClassName}`}>
          <div className="flex items-center gap-1 tracking-tight">
            <span className="font-bold text-[15px] text-ink">
              Resume
            </span>
            <span className="font-bold text-[15px] text-pencil">
              Labs
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
