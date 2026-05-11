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
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

// --- Components ---

const CodeBlock = ({ code, label }: { code: string; label?: string }) => {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative border border-border bg-muted/30 p-4 font-mono text-sm leading-relaxed">
      {label && (
        <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
          {label}
        </div>
      )}
      <pre className="overflow-x-auto text-foreground">{code}</pre>
      <button
        onClick={copy}
        className="absolute right-4 top-4 border border-border bg-background p-1.5 hover:bg-accent transition-colors"
      >
        {copied ? (
          <Check size={14} className="text-accent-foreground" />
        ) : (
          <Copy size={14} />
        )}
      </button>
    </div>
  );
};

const SectionHeader = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) => (
  <div className="mb-12 space-y-2">
    <h2 className="text-3xl font-light tracking-tighter uppercase">{title}</h2>
    {subtitle && (
      <p className="text-muted-foreground max-w-2xl">{subtitle}</p>
    )}
  </div>
);

// --- Page Content ---

export default function Homepage() {
  const fadeInUp = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: "easeOut" },
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-accent selection:text-accent-foreground">
      {/* Navigation */}
      <nav className="border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <div className="max-w-5xl lg:max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-mono font-bold tracking-tighter text-xl">
            @deessejs<span className="text-muted-foreground">/fp</span>
          </div>
          <div className="flex gap-8 text-sm uppercase tracking-widest font-medium">
            <a
              href="#"
              className="hover:text-muted-foreground transition-colors"
            >
              Documentation
            </a>
            <a
              href="#"
              className="hover:text-muted-foreground transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl lg:max-w-7xl mx-auto px-6 py-20 space-y-32">
        {/* Hero Section */}
        <motion.section
          {...fadeInUp}
          className="space-y-8 max-w-4xl"
        >
          <h1 className="text-5xl md:text-7xl font-light tracking-tight leading-[1.1]">
            Handle errors with{" "}
            <span className="italic">confidence</span> — and resilience —
            everywhere.
          </h1>
          <p className="text-xl text-muted-foreground font-light max-w-2xl">
            Functional programming for pragmatists. No Category Theory degree
            required. Framework-agnostic TypeScript at its finest.
          </p>

          {/* Installation Tab */}
          <div className="pt-8 max-w-md">
            <Tabs defaultValue="npm" className="w-full">
              <TabsList className="w-full bg-transparent border border-border h-12 p-0 rounded-none">
                <TabsTrigger
                  value="npm"
                  className="flex-1 rounded-none data-[state=active]:bg-accent data-[state=active]:text-accent-foreground border-r border-border last:border-r-0 h-full uppercase text-xs tracking-widest"
                >
                  npm
                </TabsTrigger>
                <TabsTrigger
                  value="agents"
                  className="flex-1 rounded-none data-[state=active]:bg-accent data-[state=active]:text-accent-foreground h-full uppercase text-xs tracking-widest"
                >
                  agents
                </TabsTrigger>
              </TabsList>
              <TabsContent value="npm" className="mt-0">
                <CodeBlock code="npm install @deessejs/fp" />
              </TabsContent>
              <TabsContent value="agents" className="mt-0">
                <CodeBlock code="npx skills add deessejs/fp" />
              </TabsContent>
            </Tabs>
            <p className="mt-4 text-xs text-muted-foreground font-mono">
              Or{" "}
              <a
                href="#"
                className="underline underline-offset-4 hover:text-foreground"
              >
                git clone
              </a>{" "}
              the starter template
            </p>
          </div>
        </motion.section>

        {/* Feature Examples (Before/After) */}
        <section>
          <SectionHeader
            title="Simplified Flow"
            subtitle="Compare traditional try/catch patterns with the deessejs approach."
          />
          <Tabs defaultValue="result" className="border border-border">
            <TabsList className="flex bg-muted/50 border-b border-border h-14 p-0 rounded-none overflow-x-auto overflow-y-hidden">
              {["result", "maybe", "async", "retry"].map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="px-8 rounded-none border-r border-border data-[state=active]:bg-background uppercase text-[10px] tracking-[0.2em] h-full"
                >
                  {tab.toUpperCase()}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="p-0">
              <TabsContent value="result" className="m-0">
                <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                  <CodeBlock
                    label="Before: Traditional JS"
                    code={`try {
  const user = getUser(id);
  return process(user);
} catch (e) {
  handleError(e);
}`}
                  />
                  <CodeBlock
                    label="After: @deessejs/fp"
                    code={`getUser(id)
  .map(user => process(user))
  .tapError(err => handleError(err));`}
                  />
                </div>
              </TabsContent>
              <TabsContent value="maybe" className="m-0">
                <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                  <CodeBlock
                    label="Before: Null Checks"
                    code={`const user = getUser(id);
if (user !== null && user !== undefined) {
  return user.address?.city ?? "Unknown";
}
return "Unknown";`}
                  />
                  <CodeBlock
                    label="After: Maybe"
                    code={`getUser(id)
  .flatMap(user => user.address)
  .map(address => address.city)
  .getOrElse("Unknown");`}
                  />
                </div>
              </TabsContent>
              <TabsContent value="async" className="m-0">
                <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                  <CodeBlock
                    label="Before: Nested Await"
                    code={`try {
  const res = await fetch(url);
  const data = await res.json();
  return data;
} catch (e) {
  return null;
}`}
                  />
                  <CodeBlock
                    label="After: AsyncResult"
                    code={`AsyncResult.fromPromise(fetch(url))
  .flatMap(res => res.json())
  .getOrElse(null);`}
                  />
                </div>
              </TabsContent>
              <TabsContent value="retry" className="m-0">
                <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                  <CodeBlock
                    label="Before: Manual Retry Loop"
                    code={`let attempt = 0;
while (attempt < maxRetries) {
  try {
    return await fetchData(url);
  } catch (e) {
    attempt++;
    if (attempt >= maxRetries) throw e;
    await sleep(delay * 2 ** attempt);
  }
}`}
                  />
                  <CodeBlock
                    label="After: Retry Policy"
                    code={`fetchData(url)
  .pipe(
    retry({
      schedule: Schedule.exponential(1000),
      times: 3
    })
  );`}
                  />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </section>

        {/* Bento Grid */}
        <section>
          <SectionHeader title="Capabilities" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border border border-border">
            {/* Core */}
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

            {/* Reliability */}
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

            {/* DX */}
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
        <section className="max-w-3xl">
          <SectionHeader title="F.A.Q" />
          <Accordion
            type="single"
            collapsible
            className="w-full border-t border-border"
          >
            <FaqItem
              q="How does it differ from fp-ts or neverthrow?"
              a="Unlike fp-ts, there is no steep learning curve. Unlike neverthrow, sync and async paths are unified. Results execute directly with no .unwrap() calls needed."
            />
            <FaqItem
              q="Is it a replacement for try/catch?"
              a="Yes. Replace try/catch with ok/err to turn silent exceptions into explicit domain values."
            />
            <FaqItem
              q="Does it work with React or Next.js?"
              a="Yes. Framework-agnostic — works anywhere TypeScript runs. Perfect for API routes, server components, and client-side error boundaries."
            />
            <FaqItem
              q="What is the bundle size?"
              a="Approximately 2KB gzipped. Zero runtime dependencies. Fully tree-shakable."
            />
            <FaqItem
              q="What's the performance overhead?"
              a="Minimal. @deessejs/fp is optimized for tree-shaking and has zero runtime dependencies."
            />
          </Accordion>
        </section>

        {/* CTA */}
        <motion.section
          {...fadeInUp}
          className="border border-border bg-muted/20 p-12 text-center space-y-8"
        >
          <div className="space-y-4">
            <h2 className="text-4xl font-light tracking-tight uppercase">
              Ready to handle errors with confidence?
            </h2>
            <p className="text-muted-foreground italic font-light">
              Join developers who write resilient TypeScript without the
              complexity.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="rounded-none bg-foreground text-background hover:bg-muted-foreground h-14 px-8 uppercase tracking-widest text-xs font-bold"
            >
              npm install @deessejs/fp
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-none border-border h-14 px-8 uppercase tracking-widest text-xs font-bold"
            >
              Read the docs
            </Button>
          </div>

          <div className="pt-8 border-t border-border/50 flex flex-col items-center gap-4">
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Trusted in Production
            </span>
            <div className="flex gap-8 grayscale opacity-50">
              {/* Replace with actual SVGs/logos */}
              <div className="font-bold text-xl tracking-tighter">VERCEL</div>
              <div className="font-bold text-xl tracking-tighter">STRIPE</div>
              <div className="font-bold text-xl tracking-tighter">LINEAR</div>
            </div>
          </div>
        </motion.section>
      </main>

      <footer className="border-t border-border py-12 text-center text-xs text-muted-foreground uppercase tracking-widest">
        © 2026 Deesse JS — Built for the future of TypeScript.
      </footer>
    </div>
  );
}

// --- Helper Components ---

function FeatureCard({
  icon,
  title,
  desc,
  category,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  category: string;
  className?: string;
}) {
  return (
    <div
      className={`bg-background p-8 space-y-4 group hover:bg-muted/30 transition-colors ${className}`}
    >
      <div className="text-muted-foreground group-hover:text-accent transition-colors">
        {icon}
      </div>
      <div className="space-y-2">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono">
          {category}
        </span>
        <h3 className="text-lg font-medium tracking-tight uppercase">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed font-light">
          {desc}
        </p>
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <AccordionItem value={q} className="border-b border-border px-2">
      <AccordionTrigger className="uppercase text-xs tracking-widest font-medium hover:no-underline text-left">
        {q}
      </AccordionTrigger>
      <AccordionContent className="text-muted-foreground font-light leading-relaxed">
        {a}
      </AccordionContent>
    </AccordionItem>
  );
}
