import { baseUrl, createMetadata } from "@/lib/metadata";
import { RootProvider } from 'fumadocs-ui/provider/next';
import { TooltipProvider } from "@/components/ui/tooltip";
import './global.css';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';

export const metadata = createMetadata({
  title: {
    template: "%s | Deesse FP",
    default: "@deessejs/fp - Type-Safe Error Handling for TypeScript",
  },
  metadataBase: baseUrl,
});

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen bg-black text-white antialiased">
        <TooltipProvider>
          <RootProvider>{children}</RootProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
