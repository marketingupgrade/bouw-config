"use client";

import Link from "next/link";
import { motion, MotionConfig, type Variants } from "motion/react";

export interface Tool {
  href: string;
  title: string;
  tagline: string;
  accent: string;
  badge?: string;
}

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const card: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 26 } },
};

function ToolCard({ tool, large = false }: { tool: Tool; large?: boolean }) {
  return (
    <motion.div
      variants={card}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={large ? "sm:col-span-2" : ""}
    >
      <Link
        href={tool.href}
        className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-line bg-surface p-6 shadow-sm transition-shadow hover:shadow-lg"
      >
        <span className="absolute inset-x-0 top-0 h-1.5" style={{ background: tool.accent }} aria-hidden />
        <div>
          <div className="flex items-start justify-between gap-3">
            <h2 className={`font-bold text-ink ${large ? "text-xl" : "text-lg"}`}>{tool.title}</h2>
            {tool.badge && (
              <span className="shrink-0 rounded-full bg-accent-50 px-2.5 py-1 text-xs font-semibold text-accent">
                {tool.badge}
              </span>
            )}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted">{tool.tagline}</p>
        </div>
        <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-accent">
          Bereken richtprijs
          <span className="transition group-hover:translate-x-0.5">→</span>
        </span>
      </Link>
    </motion.div>
  );
}

export default function HubGrid({ featured, tools }: { featured: Tool; tools: Tool[] }) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <ToolCard tool={featured} large />
        {tools.map((t) => (
          <ToolCard key={t.href} tool={t} />
        ))}
      </motion.div>
    </MotionConfig>
  );
}
