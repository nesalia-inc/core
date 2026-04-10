"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";

const heroCode = `import { Result, ok, err } from '@deessejs/fp';

const divide = (a: number, b: number): Result<number, Error> => {
  if (b === 0) return err(new Error('Division by zero'));
  return ok(a / b);
};

const result = divide(10, 2);
result.map(value => console.log(\`Result: \${value}\`));
// Result: 5`;

export function HeroSection() {
  return (
    <section className="relative flex min-h-[70vh] flex-col items-center justify-center px-6 py-24">
      {/* Background grid */}
      <div className="absolute inset-0 overflow-hidden">
        <svg className="absolute left-1/2 top-0 h-full w-full -translate-x-1/2 opacity-[0.03]" preserveAspectRatio="none" viewBox="0 0 100 100">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Badge variant="outline" className="mb-6 gap-2 rounded-full border-[#222] bg-[#0a0a0a]">
            <span className="size-2 rounded-full bg-green-500" />
            v3.0.0 released
          </Badge>
        </motion.div>

        <motion.h1
          className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        >
          <span className="bg-gradient-to-b from-white to-[#888] bg-clip-text text-transparent">
            Type-Safe Error Handling
          </span>
          <br />
          <span className="text-white">for TypeScript</span>
        </motion.h1>

        <motion.p
          className="mx-auto mt-6 max-w-2xl text-lg text-[#888] sm:text-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
        >
          Result, Maybe, Try, and AsyncResult — composable types that make errors a first-class citizen.
        </motion.p>

        <motion.div
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
        >
          <Button asChild className="rounded-full bg-white text-black hover:bg-gray-200 px-6">
            <Link href="/docs">
              Get Started <ChevronRight className="ml-1 size-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild className="rounded-full border-[#222] bg-[#0a0a0a] hover:bg-[#111] px-6">
            <Link href="https://github.com/nesalia-inc/fp" target="_blank" rel="noreferrer">
              View on GitHub
            </Link>
          </Button>
        </motion.div>

        <motion.div
          className="mt-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
        >
          <div className="rounded-xl border border-[#222] bg-[#0a0a0a] p-6 font-mono text-sm">
            <pre className="overflow-x-auto text-[#888]">{heroCode}</pre>
          </div>
        </motion.div>
      </div>
    </section>
  );
}