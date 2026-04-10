"use client";

import { motion } from "motion/react";
import { TreePine, Package, Type, Box, Zap, Shield } from "lucide-react";

const features = [
  { icon: TreePine, text: "Fully tree-shakeable" },
  { icon: Package, text: "Zero runtime dependencies" },
  { icon: Type, text: "TypeScript-first (strict mode compatible)" },
  { icon: Box, text: "ESM + CJS exports" },
  { icon: Zap, text: "Works with Zod, effect-ts, and other FP libraries" },
  { icon: Shield, text: "Comprehensive test coverage" },
];

export function FeaturesGridSection() {
  return (
    <section className="border-b border-[#222] bg-[#0a0a0a]">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Features</h2>
          <p className="mt-4 text-[#888]">Everything you need for production-ready error handling.</p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {features.map((feature, index) => (
            <motion.div
              key={feature.text}
              className="flex items-center gap-3 rounded-lg border border-[#222] bg-[#0a0a0a] p-4 transition-colors hover:bg-[#111]"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05, ease: "easeOut" }}
            >
              <feature.icon className="size-5 text-[#666]" />
              <span className="text-sm text-[#888]">{feature.text}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}