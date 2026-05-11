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
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

// Create a custom style that only keeps text colors, no backgrounds
const codeStyle = Object.fromEntries(
  Object.entries(oneDark).map(([key, value]) => [
    key,
    typeof value === "object" && value !== null
      ? Object.fromEntries(
          Object.entries(value).filter(([k]) => !k.toLowerCase().includes("background"))
        )
      : value,
  ])
);

// --- Components ---

const CodeBlock = ({ code, label, lang = "typescript", showLineNumbers = false }: { code: string; label?: string; lang?: string; showLineNumbers?: boolean }) => {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative border border-border bg-muted/20 p-2 text-sm leading-relaxed h-full">
      <div className="flex justify-between items-center gap-4">
        <div className="flex-1 min-w-0">
          {label && <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>}
          <SyntaxHighlighter
            language={lang}
            style={codeStyle}
            customStyle={{
              margin: 0,
              padding: "0.25rem",
              background: "transparent",
              fontSize: "0.875rem",
              fontFamily: "var(--font-geist-mono)",
            }}
            wrapLongLines
            showLineNumbers={showLineNumbers}
          >
            {code}
          </SyntaxHighlighter>
        </div>
        <button
          onClick={copy}
          className="border border-border bg-background p-1.5 hover:bg-accent transition-colors shrink-0"
        >
          {copied ? <Check size={12} className="text-accent-foreground" /> : <Copy size={12} />}
        </button>
      </div>
    </div>
  );
};

// --- Page Content ---

export default function Homepage() {
  const [installTab, setInstallTab] = useState<"npm" | "agents">("npm");
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-accent selection:text-accent-foreground">

      {/* Structure Principale centrée avec bordures latérales */}
      <div className="max-w-7xl mx-auto border-x border-border min-h-screen flex flex-col">

        <main className="flex-1 px-6 md:px-12 py-20 space-y-32">

          {/* Hero Section */}
          <section className="space-y-10 max-w-4xl mx-auto text-center">
            <div className="space-y-4">
               <h1 className="text-5xl md:text-7xl tracking-tighter leading-none font-semibold text-center">
                Handle errors with confidence and resilience everywhere.
              </h1>
            </div>

            <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed mx-auto">
              Functional programming for pragmatists. No Category Theory degree required.
              The framework-agnostic TypeScript library designed for production safety.
            </p>

            {/* Installation Tab */}
            <div className="pt-4 max-w-md mx-auto">
              <div className="border border-border">
                <div className="flex">
                  <button
                    onClick={() => setInstallTab("npm")}
                    className={`flex-1 px-6 py-3 uppercase text-[10px] tracking-widest font-normal border-r border-border transition-colors ${installTab === "npm" ? "bg-background text-accent" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"}`}
                  >
                    npm
                  </button>
                  <button
                    onClick={() => setInstallTab("agents")}
                    className={`flex-1 px-6 py-3 uppercase text-[10px] tracking-widest font-normal transition-colors ${installTab === "agents" ? "bg-background text-accent" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"}`}
                  >
                    agents
                  </button>
                </div>
                <div className="p-2">
                  {installTab === "npm" ? (
                    <CodeBlock code="npm install @deessejs/fp" />
                  ) : (
                    <CodeBlock code="npx skills add deessejs/fp" />
                  )}
                </div>
              </div>
              <p className="mt-4 text-[10px] text-muted-foreground font-mono tracking-widest">
                Or <a href="https://github.com/nesalia-inc/fp/starter" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-foreground">git clone</a> the starter template
              </p>
            </div>
          </section>

          {/* Feature Examples (Before/After) */}
          <section className="space-y-8">
            <h2 className="text-2xl uppercase tracking-tighter">Simplified Flow</h2>
            <div className="flex justify-center">
              <Tabs defaultValue="result" className="border border-border w-full gap-0">
                <TabsList className="flex-col bg-muted/30 border-b border-r border-border p-0 rounded-none h-auto">
                  {['result', 'maybe', 'async', 'retry'].map((tab) => (
                    <TabsTrigger
                      key={tab}
                      value={tab}
                      className="px-6 md:px-10 rounded-none border-b border-border data-[state=active]:bg-background uppercase text-[10px] tracking-[0.2em] font-normal w-full"
                    >
                      {tab}
                    </TabsTrigger>
                  ))}
                </TabsList>

              {/* min-h to prevent layout shift */}
              <div className="min-h-[320px] h-full flex-1">
                <TabsContent value="result" className="m-0 h-full">
                  <div className="flex flex-col h-full">
                    <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                      <div className="px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground border-b border-border bg-muted/10 flex justify-between items-center">
                        <div className="flex gap-2">
                          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                        </div>
                        <span>Before</span>
                      </div>
                      <div className="px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground border-b border-border bg-muted/10 flex justify-between items-center">
                        <div className="flex gap-2">
                          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                        </div>
                        <span>After</span>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border flex-1" style={{ height: "100%" }}>
                      <CodeBlock label="Traditional JS" showLineNumbers code={`try {\n  const user = getUser(id);\n  return process(user);\n} catch (e) {\n  handleError(e);\n}`} />
                      <CodeBlock label="@deessejs/fp" showLineNumbers code={`getUser(id)\n  .map(user => process(user))\n  .tapError(err => handleError(err));`} />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="async" className="m-0 h-full">
                  <div className="flex flex-col h-full">
                    <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                      <div className="px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground border-b border-border bg-muted/10 flex justify-between items-center">
                        <div className="flex gap-2">
                          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                        </div>
                        <span>Before</span>
                      </div>
                      <div className="px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground border-b border-border bg-muted/10 flex justify-between items-center">
                        <div className="flex gap-2">
                          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                        </div>
                        <span>After</span>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border flex-1" style={{ height: "100%" }}>
                      <CodeBlock label="Nested Await" showLineNumbers code={`try {\n  const res = await fetch(url);\n  const data = await res.json();\n  return data;\n} catch (e) {\n  return null;\n}`} />
                      <CodeBlock label="AsyncResult" showLineNumbers code={`AsyncResult.fromPromise(fetch(url))\n  .flatMap(res => res.json())\n  .getOrElse(null);`} />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="maybe" className="m-0 h-full">
                  <div className="flex flex-col h-full">
                    <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                      <div className="px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground border-b border-border bg-muted/10 flex justify-between items-center">
                        <div className="flex gap-2">
                          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                        </div>
                        <span>Before</span>
                      </div>
                      <div className="px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground border-b border-border bg-muted/10 flex justify-between items-center">
                        <div className="flex gap-2">
                          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                        </div>
                        <span>After</span>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border flex-1" style={{ height: "100%" }}>
                      <CodeBlock label="Null Checks" showLineNumbers code={`const val = getOptional();\nif (val !== null && val !== undefined) {\n  return doSomething(val);\n}\nreturn defaultValue;`} />
                      <CodeBlock label="Maybe Type" showLineNumbers code={`Maybe.fromNullable(getOptional())\n  .map(val => doSomething(val))\n  .getOrElse(defaultValue);`} />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="retry" className="m-0 h-full">
                  <div className="flex flex-col h-full">
                    <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                      <div className="px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground border-b border-border bg-muted/10 flex justify-between items-center">
                        <div className="flex gap-2">
                          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                        </div>
                        <span>Before</span>
                      </div>
                      <div className="px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground border-b border-border bg-muted/10 flex justify-between items-center">
                        <div className="flex gap-2">
                          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                        </div>
                        <span>After</span>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border flex-1" style={{ height: "100%" }}>
                      <CodeBlock label="Manual Loop" showLineNumbers code={`let attempts = 0;\nwhile (attempts < 3) {\n  try { return await task(); }\n  catch { attempts++; }\n}\nthrow Error("Failed");`} />
                      <CodeBlock label="Retry Policy" showLineNumbers code={`retry(task, {\n  attempts: 3,\n  backoff: 'exponential'\n});`} />
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
            </div>
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
          <section className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-2xl uppercase tracking-tighter text-center">Details</h2>
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
              <a href="/docs" className="inline-flex items-center justify-center rounded-none bg-foreground text-background hover:bg-muted-foreground h-14 px-10 uppercase tracking-widest text-xs font-bold">
                Get Started
              </a>
              <a href="https://github.com/nesalia-inc/fp" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-none border border-border bg-background hover:bg-accent h-14 px-10 uppercase tracking-widest text-xs font-bold">
                GitHub
              </a>
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
    <div className={`bg-background p-10 space-y-6 border border-transparent hover:border-accent/30 transition-colors ${className}`}>
      <div className="text-muted-foreground group-hover:text-accent transition-colors">{icon}</div>
      <div className="space-y-3">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono">{category}</span>
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