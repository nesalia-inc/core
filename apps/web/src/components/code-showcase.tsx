"use client";

import { useState, useEffect } from "react";
import { codeToHtml } from "shiki";

const examples = [
  {
    title: "Result",
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

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-border">
        {examples.map((example, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              index === current
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {example.title}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto bg-background p-4 text-sm">
        <pre
          className="min-h-full bg-background [&_pre]:!bg-transparent"
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
        />
      </div>
    </div>
  );
}
