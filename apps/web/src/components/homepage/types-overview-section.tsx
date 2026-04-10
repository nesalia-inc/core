"use client";

import { motion } from "motion/react";
import { CheckCircle, HelpCircle, AlertTriangle, Loader } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const types = [
  {
    icon: CheckCircle,
    name: "Result",
    purpose: "Represents success or failure with error",
    analogy: "try/catch as a type",
    code: `Result<number, Error>`,
  },
  {
    icon: HelpCircle,
    name: "Maybe",
    purpose: "Represents optional values (something/nothing)",
    analogy: "Type-safe undefined",
    code: `Maybe<User>`,
  },
  {
    icon: AlertTriangle,
    name: "Try",
    purpose: "Lazy evaluation of code that might throw",
    analogy: "() => try {} wrapped",
    code: `Try<ParseResult>`,
  },
  {
    icon: Loader,
    name: "AsyncResult",
    purpose: "Async operations that might fail",
    analogy: "Promise<Result>",
    code: `AsyncResult<User, Error>`,
  },
];

export function TypesOverviewSection() {
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
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Core Types</h2>
          <p className="mt-4 text-[#888]">The four building blocks of type-safe error handling.</p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {types.map((type, index) => (
            <motion.div
              key={type.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
            >
              <Card className="h-full border-[#222] bg-[#0a0a0a] transition-colors hover:bg-[#111]">
                <CardHeader>
                  <div className="mb-3 flex size-10 items-center justify-center rounded-lg border border-[#222] bg-[#111]">
                    <type.icon className="size-5 text-[#888]" />
                  </div>
                  <CardTitle className="text-lg font-medium text-white">{type.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-3 text-sm text-[#666]">{type.purpose}</p>
                  <p className="mb-3 text-xs text-[#888]">{type.analogy}</p>
                  <code className="rounded bg-[#111] px-2 py-1 text-xs text-blue-400">{type.code}</code>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}