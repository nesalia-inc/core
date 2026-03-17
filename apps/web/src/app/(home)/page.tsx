import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NpmInstall } from '@/components/home/npm-install';

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
            <h1 className="text-4xl font-bold mb-4">Type-safe error handling for TypeScript</h1>
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
          <div className="grid grid-cols-3 divide-x">
            <div className="aspect-square"></div>
            <div className="aspect-square"></div>
            <div className="aspect-square"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
