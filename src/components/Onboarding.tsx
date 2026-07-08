"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight } from "lucide-react";

interface TourStep {
  targetId?: string;
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right" | "center";
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome to Rafif's Portfolio",
    description:
      "This is an interactive macOS replica built as a portfolio. Explore apps, drag icons, and interact with the desktop just like a real Mac. Let's take a quick tour!",
    position: "center",
  },
  {
    targetId: "tour-desktop-area",
    title: "Desktop Icons",
    description:
      "Your desktop contains icons like README.txt, CV, and study cases. You can drag them around freely. Tap once to open, hold and drag to move.",
    position: "bottom",
  },
  {
    targetId: "readme",
    title: "README.txt",
    description:
      "Open README.txt to learn more about Rafif, his background, and how to navigate this portfolio. It's a great place to start!",
    position: "right",
  },
  {
    targetId: "tour-dock",
    title: "The Dock",
    description:
      "The dock at the bottom holds your favorite apps. Click any icon to open it. Running apps show a small dot underneath. Hover for a fun bounce animation!",
    position: "top",
  },
  {
    targetId: "dock-apps",
    title: "Spotlight Search",
    description:
      "Click the Spotlight icon to quickly search and launch any app. It's the fastest way to find what you're looking for in this portfolio.",
    position: "top",
  },
  {
    targetId: "tour-theme-toggle",
    title: "Dark Mode",
    description:
      "Toggle between light and dark themes anytime using the sun/moon button. Your preference is saved automatically for next time.",
    position: "bottom",
  },
  {
    title: "You're All Set!",
    description:
      "Enjoy exploring the portfolio! Open windows, play music, read study cases, and don't forget — you can press Escape anytime to close a window. Have fun!",
    position: "center",
  },
];

function getElementRect(id: string): DOMRect | null {
  const el = document.getElementById(id);
  if (!el) return null;
  return el.getBoundingClientRect();
}

function getTooltipPosition(
  targetRect: DOMRect,
  position: "top" | "bottom" | "left" | "right",
  tooltipWidth: number,
  tooltipHeight: number
): { x: number; y: number; actualPosition: typeof position } {
  const padding = 18;
  const minEdgePadding = 16;
  let x = 0;
  let y = 0;
  let actualPosition = position;

  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;

  // Calculate preferred position
  switch (position) {
    case "bottom":
      x = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
      y = targetRect.bottom + padding;
      break;
    case "top":
      x = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
      y = targetRect.top - tooltipHeight - padding;
      break;
    case "left":
      x = targetRect.left - tooltipWidth - padding;
      y = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
      break;
    case "right":
      x = targetRect.right + padding;
      y = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
      break;
  }

  // Flip if out of viewport
  if (actualPosition === "bottom" && y + tooltipHeight > viewportH - minEdgePadding) {
    actualPosition = "top";
    y = targetRect.top - tooltipHeight - padding;
  } else if (actualPosition === "top" && y < minEdgePadding) {
    actualPosition = "bottom";
    y = targetRect.bottom + padding;
  }

  if (actualPosition === "right" && x + tooltipWidth > viewportW - minEdgePadding) {
    actualPosition = "left";
    x = targetRect.left - tooltipWidth - padding;
  } else if (actualPosition === "left" && x < minEdgePadding) {
    actualPosition = "right";
    x = targetRect.right + padding;
  }

  // Clamp to viewport
  x = Math.max(minEdgePadding, Math.min(x, viewportW - tooltipWidth - minEdgePadding));
  y = Math.max(minEdgePadding, Math.min(y, viewportH - tooltipHeight - minEdgePadding));

  return { x, y, actualPosition };
}

export default function Onboarding() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipSize, setTooltipSize] = useState({ width: 320, height: 200 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const currentStep = TOUR_STEPS[step];
  const isLastStep = step === TOUR_STEPS.length - 1;

  // First-time check
  useEffect(() => {
    const completed = localStorage.getItem("portfolio-onboarding-completed");
    if (!completed) {
      const timer = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Measure target element
  useEffect(() => {
    if (!isOpen) return;
    if (currentStep.position === "center" || !currentStep.targetId) {
      setTargetRect(null);
      return;
    }
    const measure = () => {
      const rect = getElementRect(currentStep.targetId!);
      if (rect) setTargetRect(rect);
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    const interval = setInterval(measure, 300); // catch layout shifts
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
      clearInterval(interval);
    };
  }, [isOpen, step, currentStep]);

  // Measure tooltip size after render
  useEffect(() => {
    if (!isOpen) return;
    const measure = () => {
      if (tooltipRef.current) {
        const rect = tooltipRef.current.getBoundingClientRect();
        setTooltipSize({ width: rect.width, height: rect.height });
      }
    };
    // Delay to let animation start
    const id = setTimeout(measure, 50);
    return () => clearTimeout(id);
  }, [isOpen, step]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        finishTour();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen]);

  // Global restart function for Help button
  useEffect(() => {
    const restart = () => {
      setStep(0);
      setIsOpen(true);
      localStorage.removeItem("portfolio-onboarding-completed");
    };
    (window as any).__restartTour = restart;
    return () => {
      delete (window as any).__restartTour;
    };
  }, []);

  const finishTour = useCallback(() => {
    setIsOpen(false);
    localStorage.setItem("portfolio-onboarding-completed", "true");
  }, []);

  const nextStep = useCallback(() => {
    if (isLastStep) {
      finishTour();
    } else {
      setStep((s) => s + 1);
    }
  }, [isLastStep, finishTour]);

  const skipTour = useCallback(() => {
    finishTour();
  }, [finishTour]);

  if (!isOpen) return null;

  const isCenter = currentStep.position === "center" || !currentStep.targetId;

  const tooltipPos =
    !isCenter && targetRect
      ? getTooltipPosition(
          targetRect,
          (currentStep.position as "top" | "bottom" | "left" | "right") || "bottom",
          tooltipSize.width || 320,
          tooltipSize.height || 200
        )
      : {
          x: Math.max(16, window.innerWidth / 2 - (tooltipSize.width || 320) / 2),
          y: Math.max(16, window.innerHeight / 2 - (tooltipSize.height || 200) / 2),
        };

  return (
    <div className="fixed inset-0 z-[9998]" style={{ pointerEvents: "none" }}>
      {/* Overlay pieces with hole */}
      {!isCenter && targetRect ? (
        <>
          {/* Top */}
          <div
            className="absolute bg-black/60 transition-all duration-500 ease-out"
            style={{
              top: 0,
              left: 0,
              right: 0,
              height: targetRect.top,
              pointerEvents: "auto",
            }}
          />
          {/* Left */}
          <div
            className="absolute bg-black/60 transition-all duration-500 ease-out"
            style={{
              top: targetRect.top,
              left: 0,
              width: targetRect.left,
              height: targetRect.height,
              pointerEvents: "auto",
            }}
          />
          {/* Right */}
          <div
            className="absolute bg-black/60 transition-all duration-500 ease-out"
            style={{
              top: targetRect.top,
              right: 0,
              width: `calc(100% - ${targetRect.right}px)`,
              height: targetRect.height,
              pointerEvents: "auto",
            }}
          />
          {/* Bottom */}
          <div
            className="absolute bg-black/60 transition-all duration-500 ease-out"
            style={{
              top: targetRect.bottom,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: "auto",
            }}
          />
          {/* Target highlight */}
          {(() => {
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const isLarge = targetRect.width > vw * 0.7 || targetRect.height > vh * 0.7;
            if (isLarge) {
              return (
                <div
                  className="absolute pointer-events-none transition-all duration-500 ease-out"
                  style={{
                    top: targetRect.top + 4,
                    left: targetRect.left + 4,
                    width: targetRect.width - 8,
                    height: targetRect.height - 8,
                    borderRadius: 8,
                    border: "3px solid rgba(59, 130, 246, 0.7)",
                    boxShadow: "inset 0 0 30px rgba(59, 130, 246, 0.12), 0 0 40px rgba(59, 130, 246, 0.15)",
                  }}
                />
              );
            }
            return (
              <div
                className="absolute pointer-events-none transition-all duration-500 ease-out"
                style={{
                  top: targetRect.top - 6,
                  left: targetRect.left - 6,
                  width: targetRect.width + 12,
                  height: targetRect.height + 12,
                  borderRadius: 12,
                  boxShadow:
                    "0 0 0 3px rgba(59, 130, 246, 0.6), 0 0 0 6px rgba(59, 130, 246, 0.15), 0 0 40px rgba(59, 130, 246, 0.2)",
                }}
              />
            );
          })()}
        </>
      ) : (
        <div
          className="absolute inset-0 bg-black/55 transition-all duration-500"
          style={{ pointerEvents: "auto" }}
        />
      )}

      {/* Tooltip Card */}
      <AnimatePresence mode="wait">
        <motion.div
          ref={tooltipRef}
          key={step}
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -4 }}
          transition={{ type: "spring", stiffness: 450, damping: 28, mass: 0.85 }}
          className="absolute z-[9999] w-[calc(100vw-2rem)] max-w-80 rounded-2xl p-5"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y,
            background: "var(--bg-window)",
            backdropFilter: "blur(40px) saturate(180%)",
            WebkitBackdropFilter: "blur(40px) saturate(180%)",
            border: "0.5px solid var(--border-hover)",
            boxShadow: "var(--dropdown-shadow)",
            pointerEvents: "auto",
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <h3
              className="text-sm font-semibold pr-4"
              style={{ color: "var(--text-primary)" }}
            >
              {currentStep.title}
            </h3>
            <button
              onClick={skipTour}
              className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex-shrink-0 mt-[-2px]"
              style={{ color: "var(--text-tertiary)" }}
              title="Skip tour"
            >
              <X size={14} />
            </button>
          </div>

          {/* Description */}
          <p
            className="text-[13px] leading-relaxed mb-5"
            style={{ color: "var(--text-secondary)" }}
          >
            {currentStep.description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <span
              className="text-[11px] font-medium tabular-nums"
              style={{ color: "var(--text-tertiary)" }}
            >
              Step {step + 1} of {TOUR_STEPS.length}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={skipTour}
                className="text-[11px] font-medium px-2 py-1 rounded-md transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                style={{ color: "var(--text-tertiary)" }}
              >
                Skip Tour
              </button>
              <button
                onClick={nextStep}
                className="text-[11px] font-semibold px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                style={{
                  background: "#0066FF",
                  color: "#ffffff",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#0052CC";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#0066FF";
                }}
              >
                {isLastStep ? "Finish" : "Next"}
                {!isLastStep && <ChevronRight size={12} />}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
