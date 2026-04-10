"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function FooterSection() {
  return (
    <footer className="border-t border-[#2E3033]">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex flex-col items-center gap-2 md:items-start">
            <span className="text-lg font-medium text-white">@deessejs/fp</span>
            <p className="text-sm text-[#52525b]">Type-safe error handling for TypeScript</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button variant="link" asChild className="text-[#52525b] hover:text-white">
              <Link href="https://github.com/nesalia-inc/fp" target="_blank" rel="noreferrer">
                GitHub
              </Link>
            </Button>
            <Button variant="link" asChild className="text-[#52525b] hover:text-white">
              <Link href="https://www.npmjs.com/package/@deessejs/fp" target="_blank" rel="noreferrer">
                npm
              </Link>
            </Button>
            <Button variant="link" asChild className="text-[#52525b] hover:text-white">
              <Link href="/docs">Documentation</Link>
            </Button>
            <span className="text-sm text-[#52525b]">MIT License</span>
          </div>
        </div>
      </div>
    </footer>
  );
}