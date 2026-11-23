/**
 * Four-step tour of the editor. Shown once after the first resume exists; replayable from Help.
 * A non-modal card in the corner: it has no backdrop, so the editor stays usable underneath.
 * Dismissible at any step (Skip, Escape while focus is in the card, or Done). It takes focus only
 * when nothing else has it, so it never pulls focus away from a field someone is typing in.
 * Motion is removed for reduced motion.
 */

import React, { useEffect, useRef } from 'react';
import { useResumeStoreV2 } from '../../store/useResumeStoreV2';

export const TOUR_STEPS: { title: string; body: string }[] = [
  {
    title: 'Your resume is on the left',
    body: 'Edit it in the form. Each section opens into cards you can change, reorder and hide. Everything stays in this browser; nothing is uploaded.',
  },
  {
    title: 'The preview on the right is the page you will send',
    body: 'It updates as you type. Choose A4 or US Letter in Design, depending on where you are applying.',
  },
  {
    title: 'Check it in the inspector',
    body: 'Health scores the resume and explains each fix. Match compares it with a job posting. The ATS panel shows the text that applicant tracking software reads.',
  },
  {
    title: 'Download when you are ready',
    body: 'Download PDF makes a text-based PDF on this device. Print is the other option. You can replay this tour from Help at any time.',
  },
];

export const OnboardingTour: React.FC = () => {
  const { tourOpen, tourDone, currentResume, openTour, closeTour } = useResumeStoreV2();
  const [step, setStep] = React.useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Open once, for the first resume, unless the tour was already finished or dismissed
  useEffect(() => {
    if (currentResume && !tourDone && !tourOpen) openTour();
  }, [currentResume, tourDone, tourOpen, openTour]);

  // Each time it opens, start at the first step. Focus moves to the card only if nothing else has it.
  useEffect(() => {
    if (tourOpen) {
      setStep(0);
      const active = document.activeElement;
      if (!active || active === document.body) dialogRef.current?.focus();
    }
  }, [tourOpen]);

  if (!tourOpen) return null;

  const last = step === TOUR_STEPS.length - 1;
  const current = TOUR_STEPS[step];

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeTour();
      return;
    }
  };

  return (
    <div className="fixed bottom-16 right-4 z-[60] max-w-sm w-[calc(100vw-2rem)] no-print">
      <div
        ref={dialogRef}
        role="dialog"
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className="bg-card border border-border rounded-2xl shadow-lifted p-5 space-y-4 focus:outline-hidden motion-safe:transition-opacity motion-safe:duration-150"
      >
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Step {step + 1} of {TOUR_STEPS.length}</span>
          <button
            type="button"
            onClick={closeTour}
            className="px-2 py-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            Skip tour
          </button>
        </div>

        <div className="space-y-2">
          <h2 id="tour-title" className="text-base font-semibold text-foreground">{current.title}</h2>
          <p id="tour-body" className="text-sm text-muted-foreground leading-relaxed">{current.body}</p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {TOUR_STEPS.map((_, i) => (
              <span key={i} className={`h-1.5 w-4 rounded-full ${i === step ? 'bg-brand' : 'bg-muted-foreground/30'}`} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((n) => n - 1)}
                className="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-xs font-medium"
              >
                Back
              </button>
            )}
            {last ? (
              <button
                type="button"
                onClick={closeTour}
                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90"
              >
                Done
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep((n) => n + 1)}
                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
