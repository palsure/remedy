"use client";

import { motion } from "framer-motion";

export default function ThinkingAnimation({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-teal-500"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      {label && <span>{label}</span>}
    </div>
  );
}
