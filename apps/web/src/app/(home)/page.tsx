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
import { Badge } from "@/components/ui/badge";

// --- Components ---

const CodeBlock = ({ code, label }: { code: string; label?: string }) => {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative border border-border bg-muted/20 p-6 font-mono text-sm leading-relaxed h-full">
      {label && <div className="mb-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>}
      <pre className="overflow-x-auto text-foreground whitespace-pre-wrap">{code}</pre>
      <button
        onClick={copy}
        className="absolute right-4 top-4 border border-border bg-background p-2 hover:bg-accent transition-colors"
      >
        {copied ? <Check size={14} className="text-accent-foreground" /> : <Copy size={14} />}
      </button>
    </div>
  );
};

// --- Page Content ---

export default function Homepage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-accent selection:text-accent-foreground">

      {/* Structure Principale centrée avec bordures latérales */}
      <div className="max-w-7xl mx-auto border-x border-border min-h-screen flex flex-col">

        <main className="flex-1 px-6 md:px-12 py-20 space-y-32">

          {/* Hero Section */}
          <section className="space-y-10 max-w-4xl">
            <div className="space-y-4">
               <Badge variant="outline" className="font-mono uppercase tracking-[0.3em] text-accent">Version 0.1.0-alpha</Badge>
               <h1 className="text-5xl md:text-7xl tracking-tighter leading-none uppercase">
                Handle errors with confidence — and resilience — everywhere.
              </h1>
            </div>

            <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Functional programming for pragmatists. No Category Theory degree required.
              The framework-agnostic TypeScript library designed for production safety.
            </p>

            {/* Installation Tab */}
            <div className="pt-4 max-w-md">
              <Tabs defaultValue="npm" className="w-full">
                <TabsList className="w-full bg-transparent border border-border h-12 p-0 rounded-none">
                  <TabsTrigger value="npm" className="flex-1 rounded-none data-[state=active]:bg-accent data-[state=active]:text-accent-foreground border-r border-border last:border-r-0 h-full uppercase text-xs tracking-widest font-normal">npm</TabsTrigger>
                  <TabsTrigger value="agents" className="flex-1 rounded-none data-[state=active]:bg-accent data-[state=active]:text-accent-foreground h-full uppercase text-xs tracking-widest font-normal">agents</TabsTrigger>
                </TabsList>
                <TabsContent value="npm" className="mt-0">
                  <CodeBlock code="npm install @deessejs/fp" />
                </TabsContent>
                <TabsContent value="agents" className="mt-0">
                  <CodeBlock code="npx skills add deessejs/fp" />
                </TabsContent>
              </Tabs>
              <p className="mt-4 text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
                Or <a href="#" className="underline underline-offset-4 hover:text-foreground">git clone</a> the starter template
              </p>
            </div>
          </section>

          {/* Feature Examples (Before/After) */}
          <section className="space-y-8">
            <h2 className="text-2xl uppercase tracking-tighter">Simplified Flow</h2>
            <Tabs defaultValue="result" className="border border-border">
              <TabsList className="flex bg-muted/30 border-b border-border h-14 p-0 rounded-none">
                {['result', 'maybe', 'async', 'retry'].map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="px-6 md:px-10 rounded-none border-r border-border data-[state=active]:bg-background uppercase text-[10px] tracking-[0.2em] h-full font-normal"
                  >
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* min-h to prevent layout shift */}
              <div className="min-h-[320px]">
                <TabsContent value="result" className="m-0 h-full">
                  <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border h-full">
                    <CodeBlock label="Before: Traditional JS" code={`try {\n  const user = getUser(id);\n  return process(user);\n} catch (e) {\n  handleError(e);\n}`} />
                    <CodeBlock label="After: @deessejs/fp" code={`getUser(id)\n  .map(user => process(user))\n  .tapError(err => handleError(err));`} />
                  </div>
                </TabsContent>

                <TabsContent value="async" className="m-0 h-full">
                  <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border h-full">
                    <CodeBlock label="Before: Nested Await" code={`try {\n  const res = await fetch(url);\n  const data = await res.json();\n  return data;\n} catch (e) {\n  return null;\n}`} />
                    <CodeBlock label="After: AsyncResult" code={`AsyncResult.fromPromise(fetch(url))\n  .flatMap(res => res.json())\n  .getOrElse(null);`} />
                  </div>
                </TabsContent>

                <TabsContent value="maybe" className="m-0 h-full">
                  <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border h-full">
                    <CodeBlock label="Before: Null Checks" code={`const val = getOptional();\nif (val !== null && val !== undefined) {\n  return doSomething(val);\n}\nreturn defaultValue;`} />
                    <CodeBlock label="After: Maybe Type" code={`Maybe.fromNullable(getOptional())\n  .map(val => doSomething(val))\n  .getOrElse(defaultValue);`} />
                  </div>
                </TabsContent>

                <TabsContent value="retry" className="m-0 h-full">
                  <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border h-full">
                    <CodeBlock label="Before: Manual Loop" code={`let attempts = 0;\nwhile (attempts < 3) {\n  try { return await task(); }\n  catch { attempts++; }\n}\nthrow Error("Failed");`} />
                    <CodeBlock label="After: Retry Policy" code={`retry(task, {\n  attempts: 3,\n  backoff: 'exponential'\n});`} />
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </section>

          {/* Bento Grid */}
          <section className="space-y-8">
            <h2 className="text-2xl uppercase tracking-tighter">Capabilities</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border border border-border">
              <FeatureCard
                icon={<Zap size={20} />}
                title="Never try & catch again"
                desc="Errors become typed values you can map, flatMap, and chain — without breaking your flow."
                category="Core"
              />
              <FeatureCard
                icon={<Layers size={20} />}
                title="Async without boilerplate"
                desc="Fluent chaining for Promises. Same API as sync code. No more nested pyramids."
                category="Core"
              />
               <FeatureCard
                icon={<Code2 size={20} />}
                title="One API everywhere"
                desc="Sync or Async, it doesn't matter. One set of functions to learn for everything."
                category="Core"
              />
              <FeatureCard
                icon={<ShieldCheck size={20} />}
                title="Errors that tell a story"
                desc="Structured domain errors with context and Zod validation. Built for debugging."
                category="Reliability"
                className="md:col-span-2"
              />
              <FeatureCard
                icon={<Cpu size={20} />}
                title="Production-ready"
                desc="Debounce, throttle, memoize, and timeouts out of the box."
                category="Reliability"
              />
              <FeatureCard
                icon={<Search size={20} />}
                title="Make absence explicit"
                desc="No more null checks — absence is visible in the type system from the start."
                category="DX"
              />
              <FeatureCard
                icon={<RefreshCw size={20} />}
                title="Retry without the mess"
                desc="Exponential backoff, jitter, and predicates handled elegantly."
                category="DX"
              />
              <FeatureCard
                icon={<Terminal size={20} />}
                title="Composable by design"
                desc="Pipe and flow let you build readable transformation pipelines."
                category="DX"
              />
            </div>
          </section>

          {/* FAQ */}
          <section className="max-w-3xl space-y-8">
            <h2 className="text-2xl uppercase tracking-tighter">Details</h2>
            <Accordion type="single" collapsible className="w-full border-t border-border">
              <FaqItem
                q="How does it differ from fp-ts or neverthrow?"
                a="Unlike fp-ts, there is no steep learning curve. Unlike neverthrow, sync and async paths are unified. Results execute directly with no .unwrap() calls needed."
              />
              <FaqItem
                q="Is it a replacement for try/catch?"
                a="Yes. Replace try/catch with ok/err to turn silent exceptions into explicit domain values."
              />
              <FaqItem
                q="What is the bundle size?"
                a="Approximately 2KB gzipped. Zero runtime dependencies. Fully tree-shakable."
              />
            </Accordion>
          </section>

          {/* CTA - Honest & Minimal */}
          <section className="border border-border bg-muted/10 p-12 text-center space-y-10">
            <div className="space-y-4">
              <h2 className="text-4xl tracking-tight uppercase">Write more resilient code.</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Deesse is currently in early development. Join us in building the most pragmatic error handling library for TypeScript.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="rounded-none bg-foreground text-background hover:bg-muted-foreground h-14 px-10 uppercase tracking-widest text-xs font-bold">
                Get Started
              </Button>
              <Button size="lg" variant="outline" className="rounded-none border-border h-14 px-10 uppercase tracking-widest text-xs font-bold">
                GitHub
              </Button>
            </div>
          </section>

        </main>

        <footer className="border-t border-border py-12 px-12 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          <span>© 2026 @deessejs/fp</span>
          <div className="flex gap-8">
            <a href="#" className="hover:text-foreground">Documentation</a>
            <a href="#" className="hover:text-foreground">Changelog</a>
            <a href="#" className="hover:text-foreground">Twitter</a>
          </div>
        </footer>
      </div>
    </div>
  );
}

// --- Helper Components ---

function FeatureCard({ icon, title, desc, category, className }: { icon: React.ReactNode, title: string, desc: string, category: string, className?: string }) {
  return (
    <div className={`bg-background p-10 space-y-6 group hover:bg-muted/30 transition-colors ${className}`}>
      <div className="text-muted-foreground group-hover:text-accent transition-colors">{icon}</div>
      <div className="space-y-3">
        <span className="text-[10px] uppercase tracking-[0.2em] text-accent font-mono">{category}</span>
        <h3 className="text-lg uppercase tracking-tight">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string, a: string }) {
  return (
    <AccordionItem value={q} className="border-b border-border py-2 px-0">
      <AccordionTrigger className="uppercase text-xs tracking-widest font-normal hover:no-underline text-left py-6">
        {q}
      </AccordionTrigger>
      <AccordionContent className="text-muted-foreground leading-relaxed pb-6">
        {a}
      </AccordionContent>
    </AccordionItem>
  );
}