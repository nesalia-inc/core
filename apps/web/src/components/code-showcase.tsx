"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { codeToHtml } from "shiki";

const examples = [
  {
    title: "Result",
    description: "Type-safe error handling",
    href: "/docs/result",
    code: `import { Result, Ok, Err } from '@deessejs/core';

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) return Err('Division by zero');
  return Ok(a / b);
}

const result = divide(10, 2);
if (result.isOk()) {
  console.log(result.value); // 5
}`,
  },
  {
    title: "Maybe",
    description: "Handle optional values safely",
    href: "/docs/maybe",
    code: `import { Maybe, Some, None } from '@deessejs/core';

function findUser(id: string): Maybe<User> {
  const user = db.find(id);
  return user ? Some(user) : None;
}

const user = findUser('123');
const name = user.map(u => u.name).unwrapOr('Unknown');`,
  },
  {
    title: "Try",
    description: "Capture synchronous exceptions",
    href: "/docs/try",
    code: `import { Try } from '@deessejs/core';

const result = Try(() => JSON.parse(userInput));
if (result.isOk()) {
  const data = result.value;
} else {
  console.error(result.error); // SyntaxError
}`,
  },
  {
    title: "AsyncResult",
    description: "Async operations with error handling",
    href: "/docs/async-result",
    code: `import { AsyncResult } from '@deessejs/core';

async function fetchUser(id: string): AsyncResult<User, Error> {
  const response = await fetch(\`/api/\${id}\`);
  if (!response.ok) {
    return Err(new Error('Failed to fetch'));
  }
  return Ok(await response.json());
}`,
  },
  {
    title: "Retry",
    description: "Automatic retry with backoff",
    href: "/docs/retry",
    code: `import { retry, linearBackoff } from '@deessejs/core';

const result = await retry(
  () => fetchFlakyAPI(),
  linearBackoff(100).take(3)
);

if (result.isOk()) {
  console.log('Success after retries!');
}`,
  },
];

export function CodeShowcase() {
  const [current, setCurrent] = useState(0);
  const [highlightedCode, setHighlightedCode] = useState<string>("");
  const [isAnimating, setIsAnimating] = useState(false);

  const changeExample = (newIndex: number) => {
    if (newIndex !== current) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrent(newIndex);
        setIsAnimating(false);
      }, 300);
    }
  };

  useEffect(() => {
    const highlight = async () => {
      const html = await codeToHtml(examples[current].code, {
        lang: "typescript",
        theme: "github-dark",
      });
      setHighlightedCode(html);
    };
    highlight();
  }, [current]);

  useEffect(() => {
    const interval = setInterval(() => {
      changeExample(current === examples.length - 1 ? 0 : current + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, [current]);

  const prev = () => changeExample(current === 0 ? examples.length - 1 : current - 1);
  const next = () => changeExample(current === examples.length - 1 ? 0 : current + 1);

  return (
    <div className="flex h-full flex-col">
      <div className={`border-b border-border/25 px-6 py-8 transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
        <h3 className="text-3xl font-bold text-foreground">
          {examples[current].title}
        </h3>
        <p className="mt-2 text-base text-muted-foreground">
          {examples[current].description}
        </p>
      </div>

      <div className={`flex-1 overflow-auto bg-background p-4 text-sm transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
        <pre
          className="min-h-full bg-background [&_pre]:!bg-transparent"
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
        />
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border/25 px-4 py-2">
        <Button variant="outline" asChild>
          <Link href={examples[current].href}>
            See more
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={prev} className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Previous example</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={next} className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Next example</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
