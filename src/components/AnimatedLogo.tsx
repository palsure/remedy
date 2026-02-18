"use client";

import { motion } from "framer-motion";

export default function AnimatedLogo({ size = 32 }: { size?: number }) {
  const r = size / 2;
  const center = r;
  const heartScale = size / 40;

  return (
    <motion.div
      className="relative flex items-center justify-center rounded-lg bg-teal-600"
      style={{ width: size, height: size }}
      whileHover={{ scale: 1.08 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
    >
      <svg
        width={size * 0.65}
        height={size * 0.65}
        viewBox="0 0 26 26"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Heartbeat line */}
        <motion.path
          d="M2 13 H7 L9 8 L13 18 L17 6 L19 13 H24"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0.5 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            pathLength: { duration: 1.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1.5 },
            opacity: { duration: 0.3 },
          }}
        />
        {/* Subtle pulse ring */}
        <motion.circle
          cx="13"
          cy="13"
          r="11"
          stroke="white"
          strokeWidth="1"
          fill="none"
          initial={{ opacity: 0.4, scale: 0.9 }}
          animate={{ opacity: [0.4, 0.1, 0.4], scale: [0.9, 1.05, 0.9] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "center" }}
        />
      </svg>
    </motion.div>
  );
}
