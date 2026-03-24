'use client';
// Homepage with hero section, badge, npm install, and links

import { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Layers, Zap } from 'lucide-react';
import { CodeShowcase } from '@/components/code-showcase';

export default function HomePage() {
  return (
    <div>
      <div className="border-b border-border">
        <div className="w-full max-w-5xl border border-b-0 border-border mx-auto flex flex-col justify-start text-center flex-1">
          <div className="h-8 flex items-center">
            <svg className="flex-1 h-full" preserveAspectRatio="none" viewBox="0 0 100 32">
              <defs>
                <pattern id="grid" width="1.25" height="32" patternUnits="userSpaceOnUse">
                  <line
                    x1="1.25"
                    y1="0"
                    x2="0"
                    y2="32"
                    stroke="var(--muted)"
                    strokeWidth="0.15"
                    fill="none"
                  />
                </pattern>
              </defs>
              <rect width="100" height="32" fill="url(#grid)" />
            </svg>
          </div>
        </div>
      </div>
      <div className="border-b border-border">
        <div className="w-full max-w-5xl border border-b-0 border-border mx-auto flex flex-col justify-start text-center flex-1">
          <div className="max-w-3xl mx-auto my-24">
            <Link href="https://github.com/nesalia-inc/core" target="_blank" rel="noreferrer">
              <Badge variant="outline" className="gap-2 rounded-md">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                v0.1.7 released
              </Badge>
            </Link>
            <h1 className="text-4xl font-bold mb-4 mt-4">
              Type-safe error handling for TypeScript
            </h1>
            <p className="text-muted-foreground mb-6">
              Functional programming patterns - Result, Maybe, Try, and AsyncResult monads with zero
              runtime dependencies
            </p>
            <div className="flex justify-center mb-6">
              <NpmInstall />
            </div>
            <div className="flex gap-2 justify-center">
              <Button asChild>
                <Link href="/docs">Get Started</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="https://github.com/nesalia-inc/core" target="_blank" rel="noreferrer">
                  GitHub
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="border-b border-border">
        <div className="w-full max-w-5xl border border-b-0 border-border mx-auto flex flex-col justify-start text-center flex-1">
          <div className="h-8 flex items-center">
            <svg className="flex-1 h-full" preserveAspectRatio="none" viewBox="0 0 100 32">
              <defs>
                <pattern id="grid2" width="1.25" height="32" patternUnits="userSpaceOnUse">
                  <line
                    x1="1.25"
                    y1="0"
                    x2="0"
                    y2="32"
                    stroke="var(--muted)"
                    strokeWidth="0.15"
                    fill="none"
                  />
                </pattern>
              </defs>
              <rect width="100" height="32" fill="url(#grid2)" />
            </svg>
          </div>
        </div>
      </div>
      <div className="border-b border-border">
        <div className="w-full max-w-5xl border border-b-0 border-border mx-auto flex flex-col justify-start text-left flex-1">
          <div className="grid grid-cols-3 divide-x">
            <Card className="border-0 py-0 pb-6 rounded-none bg-transparent">
              <CardHeader className="pl-0">
                <div className="flex items-center justify-between">
                  <div className="border-b border-r border-border p-3">
                    <Shield className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <Badge
                    variant="outline"
                    className="rounded-sm bg-blue-500/10 border-blue-500/20 text-blue-500"
                  >
                    v0.1.7
                  </Badge>
                </div>
                <CardTitle className="mt-4 pl-4">Type-safe</CardTitle>
              </CardHeader>
              <CardContent className="pl-4">
                <p className="text-muted-foreground">
                  Full TypeScript support with comprehensive type inference and strict typing
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 py-0 pb-6 rounded-none bg-transparent">
              <CardHeader className="pl-0">
                <div className="flex items-center justify-between">
                  <div className="border-b border-r border-border p-3">
                    <Layers className="size-6 text-muted-foreground" />
                  </div>
                  <Badge
                    variant="outline"
                    className="rounded-sm bg-green-500/10 border-green-500/20 text-green-500"
                  >
                    0 deps
                  </Badge>
                </div>
                <CardTitle className="mt-4 pl-4">Zero Dependencies</CardTitle>
              </CardHeader>
              <CardContent className="pl-4">
                <p className="text-muted-foreground">
                  Lightweight with no runtime dependencies, perfect for any project size
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 py-0 pb-6 rounded-none bg-transparent">
              <CardHeader className="pl-0">
                <div className="flex items-center justify-between">
                  <div className="border-b border-r border-border p-3">
                    <Zap className="size-6 text-muted-foreground" />
                  </div>
                  <Badge
                    variant="outline"
                    className="rounded-sm bg-purple-500/10 border-purple-500/20 text-purple-500"
                  >
                    FP
                  </Badge>
                </div>
                <CardTitle className="mt-4 pl-4">Functional</CardTitle>
              </CardHeader>
              <CardContent className="pl-4">
                <p className="text-muted-foreground">
                  Pure functional patterns with Result, Maybe, Try, and AsyncResult monads
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="border-y border-border">
          <div className="w-full max-w-5xl border-x h-4  border-border mx-auto flex flex-col justify-start text-center flex-1"></div>
        </div>
        <div className="border-b border-border">
          <div className="w-full max-w-5xl border border-b-0 border-border mx-auto flex flex-col justify-start flex-1">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Examples</h2>
              <p className="text-muted-foreground mb-6">
                Discover how @deessejs/core makes error handling simple and type-safe.
              </p>
              <CodeShowcase />
            </div>
          </div>
        </div>
        <div className="border-b border-border">
          <div className="w-full max-w-5xl border border-b-0 border-border mx-auto flex flex-col justify-start text-center flex-1">
            <div className="h-8 flex items-center">
              <svg className="flex-1 h-full" preserveAspectRatio="none" viewBox="0 0 100 32">
                <defs>
                  <pattern id="grid2" width="1.25" height="32" patternUnits="userSpaceOnUse">
                    <line
                      x1="1.25"
                      y1="0"
                      x2="0"
                      y2="32"
                      stroke="var(--muted)"
                      strokeWidth="0.15"
                      fill="none"
                    />
                  </pattern>
                </defs>
                <rect width="100" height="32" fill="url(#grid2)" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <footer className="">
        <div className="w-full max-w-5xl border-x mx-auto py-8 px-6">
          <div className=></div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">© 2026 @deessejs/core</span>
              <span className="text-sm text-muted-foreground">MIT License</span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="link" asChild>
                <Link href="https://nesalia.com" target="_blank" rel="noreferrer">
                  <span className="text-muted-foreground lowercase">nesalia</span>
                </Link>
              </Button>
              <Button variant="link" asChild>
                <Link href="https://deessejs.com" target="_blank" rel="noreferrer">
                  <span className="text-muted-foreground lowercase">deessejs</span>
                </Link>
              </Button>
              <Button variant="link" asChild>
                <Link href="https://github.com/nesalia-inc" target="_blank" rel="noreferrer">
                  <span className="text-muted-foreground lowercase">github</span>
                </Link>
              </Button>
              <Button variant="link" asChild>
                <Link href="/docs">
                  <span className="text-muted-foreground lowercase">documentation</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </footer>
      <div className="border-y border-border">
        <div className="w-full max-w-5xl border-x h-4  border-border mx-auto flex flex-col justify-start text-center flex-1"></div>
      </div>
    </div>
  );
}

function NpmInstall() {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText('npm install @deessejs/core');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="outline" className="font-mono" onClick={copyToClipboard}>
      <span>npm install @deessejs/core</span>
      {copied ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      )}
    </Button>
  );
}
