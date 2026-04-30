import { baseUrl, createMetadata } from "@/lib/metadata";
import { RootProvider } from 'fumadocs-ui/provider/next';
import { TooltipProvider } from "@/components/ui/tooltip";
import './global.css';
import { Space_Grotesk, Space_Mono } from 'next/font/google';

export const metadata = createMetadata({
  title: {
    template: "%s | Deesse FP",
    default: "@deessejs/fp - Type-Safe Error Handling for TypeScript",
  },
  metadataBase: baseUrl,
});


const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
});

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-mono',
});

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${spaceMono.variable}`} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen bg-black text-white antialiased">
        <TooltipProvider>
          <RootProvider>{children}</RootProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
