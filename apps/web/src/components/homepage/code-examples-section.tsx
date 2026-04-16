"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { codeToHtml } from "shiki";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const examples = [
  {
    title: "Chained Operations",
    code: `const result = await fetchUser(id)
  .andThen(validateUser)
  .andThen(checkPermissions)
  .map(user => user.name);`,
  },
  {
    title: "Error Aggregation",
    code: `const results = await Promise.all([
  fetchConfig(),
  fetchTranslations(),
  fetchTheme(),
]).mapErr(errors => new AggregateError(errors));`,
  },
  {
    title: "Railway-Oriented",
    code: `validate(input)
  .pipe(validateSchema)
  .pipe(transformData)
  .pipe(saveToDatabase)
  .unwrapOr(fallback);`,
  },
];

export function CodeExamplesSection() {
  const [activeTab, setActiveTab] = useState(examples[0].title);
  const [highlightedCode, setHighlightedCode] = useState<string>("");

  useEffect(() => {
    const current = examples.find((e) => e.title === activeTab);
    if (current) {
      codeToHtml(current.code, {
        lang: "typescript",
        theme: "github-dark",
      }).then(setHighlightedCode);
    }
  }, [activeTab]);

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
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Code Examples</h2>
          <p className="mt-4 text-[#888]">Real-world usage patterns for common scenarios.</p>
        </motion.div>

        <motion.div
          className="mx-auto max-w-3xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4 flex h-auto w-full justify-start gap-2 rounded-full bg-transparent p-0">
              {examples.map((example) => (
                <TabsTrigger
                  key={example.title}
                  value={example.title}
                  className="rounded-full border border-[#222] bg-[#0a0a0a] px-4 py-2 text-sm text-[#888] data-[state=active]:border-[#00173C] data-[state=active]:bg-[#00173C] data-[state=active]:text-white"
                >
                  {example.title}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value={activeTab} className="mt-0">
              <div
                className="rounded-xl border border-[#222] bg-[#0a0a0a] p-6 [&_pre]:!bg-transparent"
                dangerouslySetInnerHTML={{ __html: highlightedCode }}
              />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </section>
  );
}