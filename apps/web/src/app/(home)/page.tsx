"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Copy,
  Terminal,
  Zap,
  ShieldCheck,
  Layers,
  RefreshCw,
  Search,
  Code2,
  Cpu,
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

// --- Components ---

const CodeBlock = ({ code, label, minHeight = "160px" }: { code: string; label?: string, minHeight?: string }) => {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="group relative border border-border bg-muted/20 p-6 font-mono text-sm leading-relaxed"
      style={{ minHeight }}
    >
      {label && <div className="mb-3 text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">{label}</div>}
      <pre className="overflow-x-auto text-foreground font-medium">{code}</pre>
      <button
        onClick={copy}
        className="absolute right-4 top-4 border border-border bg-background p-2 hover:bg-accent transition-colors"
      >
        {copied ? <Check size={14} className="text-accent-foreground" /> : <Copy size={14} />}
      </button>
    </div>
  );
};

const SectionHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="mb-12 space-y-3">
    <h2 className="text-4xl font-bold tracking-tighter uppercase">{title}</h2>
    {subtitle && <p className="text-muted-foreground text-lg max-w-2xl font-medium">{subtitle}</p>}
  </div>
);

// --- Page Content ---

export default function Homepage() {
  return (
    /* Main Container: Centered with side borders to respect the 7xl max-width philosophy */
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-accent selection:text-accent-foreground">
      <div className="max-w-7xl mx-auto border-x border-border">

        <main className="px-8 md:px-16 py-24 space-y-32">

          {/* Hero Section */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 max-w-5xl"
          >
            <div className="inline-block border border-accent px-3 py-1 text-[10px] uppercase tracking-[0.3em] font-bold text-accent mb-4">
              v0.1.0-alpha
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[0.9] uppercase">
              Handle errors with <br />
              <span className="text-accent">confidence.</span>
            </h1>
            <p className="text-2xl text-muted-foreground font-semibold max-w-3xl leading-snug">
              The framework-agnostic TypeScript library for pragmatists. <br className="hidden md:block" />
              Build resilient systems without the category theory.
            </p>

            {/* Installation Tab */}
            <div className="pt-8 max-w-md">
              <Tabs defaultValue="npm" className="w-full">
                <TabsList className="w-full bg-transparent border border-border h-14 p-0 rounded-none">
                  <TabsTrigger value="npm" className="flex-1 rounded-none data-[state=active]:bg-accent data-[state=active]:text-accent-foreground border-r border-border last:border-r-0 h-full uppercase text-xs font-bold tracking-widest">npm</TabsTrigger>
                  <TabsTrigger value="agents" className="flex-1 rounded-none data-[state=active]:bg-accent data-[state=active]:text-accent-foreground h-full uppercase text-xs font-bold tracking-widest">agents</TabsTrigger>
                </TabsList>
                <TabsContent value="npm" className="mt-0">
                  <CodeBlock code="npm install @deessejs/fp" minHeight="80px" />
                </TabsContent>
                <TabsContent value="agents" className="mt-0">
                  <CodeBlock code="npx skills add deessejs/fp" minHeight="80px" />
                </TabsContent>
              </Tabs>
            </div>
          </motion.section>

          {/* Feature Examples (Before/After) */}
          <section>
            <SectionHeader
              title="Less Noise, More Logic"
              subtitle="Stop nesting. Start chaining. A unified API for sync and async flows."
            />
            {/* Fixed height container to prevent layout shifts */}
            <Tabs defaultValue="result" className="border border-border overflow-hidden">
              <TabsList className="flex bg-muted/30 border-b border-border h-16 p-0 rounded-none overflow-x-auto">
                {['result', 'maybe', 'async', 'retry'].map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="px-10 rounded-none border-r border-border data-[state=active]:bg-background uppercase text-xs font-black tracking-widest h-full"
                  >
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="min-h-[300px]"> {/* Prevents layout shift */}
                <TabsContent value="result" className="m-0">
                  <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                    <CodeBlock label="Traditional JS" code={`try {\n  const user = getUser(id);\n  return process(user);\n} catch (e) {\n  handleError(e);\n}`} />
                    <CodeBlock label="@deessejs/fp" code={`getUser(id)\n  .map(process)\n  .tapError(handleError);`} />
                  </div>
                </TabsContent>
                <TabsContent value="async" className="m-0">
                  <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                    <CodeBlock label="Promise Hell" code={`try {\n  const res = await fetch(url);\n  const data = await res.json();\n  return data;\n} catch (e) {\n  return null;\n}`} />
                    <CodeBlock label="AsyncResult" code={`AsyncResult.fromPromise(fetch(url))\n  .flatMap(res => res.json())\n  .getOrElse(null);`} />
                  </div>
                </TabsContent>
                {/* Fallbacks for other tabs to keep height consistent */}
                <TabsContent value="maybe" className="m-0">
                   <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                    <CodeBlock label="Null Checks" code={`if (val !== null && val !== undefined) {\n  return doSomething(val);\n}\nreturn defaultValue;`} />
                    <CodeBlock label="Maybe" code={`fromNullable(val)\n  .map(doSomething)\n  .getOrElse(defaultValue);`} />
                  </div>
                </TabsContent>
                <TabsContent value="retry" className="m-0">
                   <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                    <CodeBlock label="Manual Retry" code={`let attempts = 0;\nwhile (attempts < 3) {\n  try { return await task(); }\n  catch { attempts++; }\n}`} />
                    <CodeBlock label="Retry Policy" code={`retry(task, {\n  limit: 3,\n  backoff: 'exponential'\n});`} />
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </section>

          {/* Bento Grid */}
          <section>
            <SectionHeader title="System Capabilities" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border border border-border">
              <FeatureCard
                icon={<Zap size={24} strokeWidth={2.5} />}
                title="Explicit Control"
                desc="Errors become typed values. No more silent exceptions or broken execution flows."
                category="Core"
              />
              <FeatureCard
                icon={<Layers size={24} strokeWidth={2.5} />}
                title="Unified API"
                desc="One API for sync and async. map, flatMap, tap — they work the same everywhere."
                category="Architecture"
              />
              <FeatureCard
                icon={<ShieldCheck size={24} strokeWidth={2.5} />}
                title="Domain Safety"
                desc="Structured errors with context and Zod validation. Built for production debugging."
                category="Reliability"
              />
              <FeatureCard
                icon={<RefreshCw size={24} strokeWidth={2.5} />}
                title="Resilient Utilities"
                desc="Exponential backoff, jitter, debounce, and timeouts. Hardened by default."
                category="Production"
                className="md:col-span-2"
              />
              <FeatureCard
                icon={<Search size={24} strokeWidth={2.5} />}
                title="No Nulls"
                desc="Optional values are visible in the type system. Make absence an explicit state."
                category="DX"
              />
            </div>
          </section>

          {/* FAQ */}
          <section className="max-w-4xl">
            <SectionHeader title="Details" />
            <Accordion type="single" collapsible className="w-full border-t border-border">
              <FaqItem
                q="How does it differ from fp-ts or neverthrow?"
                a="We eliminate the 'function color' fatigue. Sync and Async paths share the same interface. No .unwrap() calls, no academic jargon. It's built for engineers, not mathematicians."
              />
              <FaqItem
                q="Is it a replacement for try/catch?"
                a="Yes. By moving errors into the type system, you force your team to handle them, making your application crash-proof by design."
              />
              <FaqItem
                q="Bundle size & Performance?"
                a="Under 2KB gzipped. Zero dependencies. Tree-shakable. Optimized for edge runtimes and high-throughput backends."
              />
            </Accordion>
          </section>

          {/* CTA - Realistic Version */}
          <motion.section
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="border-2 border-foreground bg-foreground text-background p-16 text-center space-y-10"
          >
            <div className="space-y-4">
              <h2 className="text-5xl font-black tracking-tighter uppercase leading-none">Standardize your <br />error handling.</h2>
              <p className="text-xl font-bold opacity-80 uppercase tracking-tight">Open Source. Early Access. PRs welcome.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="rounded-none bg-background text-foreground hover:bg-muted h-16 px-10 uppercase tracking-widest text-sm font-black">
                View on GitHub
              </Button>
              <Button size="lg" variant="outline" className="rounded-none border-background bg-transparent hover:bg-background hover:text-foreground h-16 px-10 uppercase tracking-widest text-sm font-black transition-all">
                Documentation
              </Button>
            </div>

            <div className="pt-8 border-t border-background/20 flex flex-col items-center gap-6">
              <span className="text-[10px] uppercase tracking-[0.4em] font-black">Upcoming Ecosystem</span>
              <div className="flex flex-wrap justify-center gap-12 opacity-40 font-black text-2xl tracking-tighter grayscale">
                <span>NEXT.JS</span>
                <span>HONO</span>
                <span>BUN</span>
                <span>NODE</span>
              </div>
            </div>
          </motion.section>

        </main>

        <footer className="border-t border-border p-12 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
          <div>© 2026 @deessejs — All Rights Reserved.</div>
          <div className="flex gap-8">
            <a href="#" className="hover:text-foreground transition-colors">Twitter</a>
            <a href="#" className="hover:text-foreground transition-colors">GitHub</a>
            <a href="#" className="hover:text-foreground transition-colors">Discord</a>
          </div>
        </footer>
      </div>
    </div>
  );
}

// --- Helper Components ---

function FeatureCard({ icon, title, desc, category, className }: { icon: React.ReactNode, title: string, desc: string, category: string, className?: string }) {
  return (
    <div className={`bg-background p-10 space-y-6 group hover:bg-muted/10 transition-colors ${className}`}>
      <div className="text-foreground group-hover:text-accent transition-colors">{icon}</div>
      <div className="space-y-3">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-black">{category}</span>
        <h3 className="text-xl font-black tracking-tight uppercase leading-tight">{title}</h3>
        <p className="text-base text-muted-foreground leading-snug font-semibold">{desc}</p>
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string, a: string }) {
  return (
    <AccordionItem value={q} className="border-b border-border px-4 py-2">
      <AccordionTrigger className="uppercase text-sm tracking-widest font-black hover:no-underline text-left py-6">
        {q}
      </AccordionTrigger>
      <AccordionContent className="text-muted-foreground font-semibold text-lg pb-8 leading-relaxed">
        {a}
      </AccordionContent>
    </AccordionItem>
  );
}