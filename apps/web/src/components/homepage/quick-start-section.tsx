"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

const installCode = `pnpm add @deessejs/fp`;

const usageCode = `import { Result, ok, err } from '@deessejs/fp';

const divide = (a: number, b: number): Result<number, Error> => {
  if (b === 0) return err(new Error('Division by zero'));
  return ok(a / b);
};

const result = divide(10, 2);
result.map(value => console.log(\`Result: \${value}\`));
result.mapErr(error => console.error(\`Error: \${error.message}\`));`;

interface CodeBlockProps {
  code: string;
  language?: string;
}

function CodeBlock({ code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative rounded-xl border border-[#222] bg-[#0a0a0a] p-6">
      <Button
        variant="ghost"
        size="icon"
        onClick={copyToClipboard}
        className="absolute right-4 top-4 size-8 rounded-lg hover:bg-[#222]"
      >
        {copied ? (
          <Check className="size-4 text-green-500" />
        ) : (
          <Copy className="size-4 text-[#666]" />
        )}
      </Button>
      <pre className="overflow-x-auto font-mono text-sm text-[#888]">{code}</pre>
    </div>
  );
}

export function QuickStartSection() {
  return (
    <section className="border-b border-[#222]">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Quick Start</h2>
          <p className="mt-4 text-[#888]">Get up and running in under 2 minutes.</p>
        </motion.div>

        <div className="mx-auto max-w-3xl space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          >
            <p className="mb-2 text-sm font-medium text-[#666]">Installation</p>
            <div className="rounded-xl border border-[#222] bg-[#0a0a0a] p-4">
              <code className="font-mono text-sm text-white">$ {installCode}</code>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          >
            <p className="mb-2 text-sm font-medium text-[#666]">Basic Usage</p>
            <CodeBlock code={usageCode} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}