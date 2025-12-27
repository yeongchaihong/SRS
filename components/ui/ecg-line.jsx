"use client";

import { motion } from "framer-motion";

export function ECGLine({ className = "" }) {
  // Path: 0-1200 width. 
  // Center of complex is roughly at 500-550.
  const pathData = `
    M 0 50 
    L 450 50 
    L 460 50 L 470 45 L 480 50 L 490 50   
    L 500 50 L 505 52 L 510 20 L 515 90 L 520 50 L 530 50 
    L 540 50 L 550 42 L 570 55 L 590 50
    L 1200 50
  `;

  return (
    // 1. Reduced height for mobile (h-24) vs desktop (h-40)
    <div className={`w-full h-24 md:h-40 relative flex items-center justify-center overflow-hidden ${className}`}>
      
      <svg
        // 2. Force a minimum width. 
        // This ensures that on a phone (300px wide), the SVG thinks it has 900px of space.
        // The container centers this 900px slice, keeping the "Heartbeat" (middle of path) visible 
        // and proportional, preventing it from looking like a squashed vertical line.
        className="w-full min-w-[900px] h-full overflow-visible"
        viewBox="0 0 1200 100"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background Track (Faint) */}
        <path
          d={pathData}
          stroke="currentColor"
          strokeWidth="2"
          className="text-gray-300 opacity-20"
        />

        {/* Traveling Pulse */}
        <motion.path
          d={pathData}
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-gray-600 drop-shadow-md"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{
            pathLength: 0.15, // Length of the traveling segment
            pathOffset: [0, 1], // Move from start to end
            opacity: [0, 1, 1, 0] 
          }}
          transition={{
            duration: 3, // Slightly faster to account for mobile attention spans
            ease: "linear",
            repeat: Infinity,
            repeatDelay: 0.5 
          }}
        />
      </svg>

      {/* Vignette - adjusted gradient stops for better mobile blending */}
      <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-white opacity-90 pointer-events-none" />
    </div>
  );
}