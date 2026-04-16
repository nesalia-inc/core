"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

const packageManagers = [
  { name: "pnpm", command: "pnpm add @deessejs/fp" },
  { name: "npm", command: "npm install @deessejs/fp" },
  { name: "yarn", command: "yarn add @deessejs/fp" },
  { name: "bun", command: "bun add @deessejs/fp" },
];

export function InstallSection() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (command: string, name: string) => {
    await navigator.clipboard.writeText(command);
    setCopied(name);
    setTimeout(() => setCopied(null), 2000);
  };

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
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Install</h2>
          <p className="mt-4 text-[#888]">Add @deessejs/fp to your project using your preferred package manager.</p>
        </motion.div>

        <motion.div
          className="mx-auto max-w-2xl space-y-3"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        >
          {packageManagers.map((pm) => (
            <div
              key={pm.name}
              className="flex items-center justify-between rounded-lg border border-[#222] bg-[#0a0a0a] px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-[#888]">{pm.name}</span>
                <code className="font-mono text-sm text-white">$ {pm.command}</code>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyToClipboard(pm.command, pm.name)}
                className="size-8 rounded-lg hover:bg-[#222]"
              >
                {copied === pm.name ? (
                  <Check className="size-4 text-green-500" />
                ) : (
                  <Copy className="size-4 text-[#666]" />
                )}
              </Button>
            </div>
          ))}
        </motion.div>

        <motion.div
          className="mx-auto mt-8 max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
        >
          <p className="mb-3 text-sm font-medium text-[#666]">Import</p>
          <div className="rounded-xl border border-[#222] bg-[#0a0a0a] p-4">
            <code className="font-mono text-sm text-[#888]">
              import {"{"} Result, ok, err {"}"} from &apos;@deessejs/fp&apos;
            </code>
          </div>
        </motion.div>
      </div>
    </section>
  );
}