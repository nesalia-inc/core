"use client";

import { motion } from "motion/react";
import { Shield, GitMerge, Sparkles, Feather } from "lucide-react";

const benefits = [
  {
    icon: Shield,
    title: "Type-Safe",
    description: "Errors are encoded in the type system — the compiler forces you to handle them",
    badge: null,
  },
  {
    icon: GitMerge,
    title: "Composable",
    description: "Chain, map, and combine operations without nested if/else spaghetti",
    badge: null,
  },
  {
    icon: Sparkles,
    title: "Ergonomic",
    description: "No more undefined/null checks everywhere — methods like .map(), .flatMap(), .unwrap()",
    badge: null,
  },
  {
    icon: Feather,
    title: "Lightweight",
    description: "Zero dependencies, tree-shakeable, ~2KB gzipped",
    badge: "2KB",
  },
];

export function ValuePropositionSection() {
  return (
    <section className="border-y border-[#222] bg-[#0a0a0a]">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              className="group rounded-xl border border-[#222] bg-[#0a0a0a] p-6 transition-colors hover:bg-[#111]"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="rounded-lg border border-[#222] bg-[#111] p-3">
                  <benefit.icon className="size-6 text-[#888]" />
                </div>
                {benefit.badge && (
                  <span className="rounded-full bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-500">
                    {benefit.badge}
                  </span>
                )}
              </div>
              <h3 className="mb-2 text-lg font-medium text-white">{benefit.title}</h3>
              <p className="text-sm text-[#666]">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}