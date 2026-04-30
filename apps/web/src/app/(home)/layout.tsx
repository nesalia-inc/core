import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-[#222] bg-black/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-lg font-medium text-white">
            @deessejs/fp
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/docs"
              className="text-sm text-[#666] hover:text-white transition-colors"
            >
              Documentation
            </Link>
            <Link
              href="https://github.com/nesalia-inc/fp"
              target="_blank"
              rel="noreferrer"
              className="text-sm text-[#666] hover:text-white transition-colors"
            >
              GitHub
            </Link>
            <Button asChild className="rounded-full bg-white text-black hover:bg-gray-200 px-4 py-2 h-8">
              <Link href="/docs">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}