import {
  HeroSection,
  ValuePropositionSection,
  QuickStartSection,
  TypesOverviewSection,
  CodeExamplesSection,
  FeaturesGridSection,
  InstallSection,
  FooterSection,
} from "@/components/homepage";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl border-x mx-auto">
        <main>
          <HeroSection />
          <ValuePropositionSection />
          <QuickStartSection />
          <TypesOverviewSection />
          <CodeExamplesSection />
          <FeaturesGridSection />
          <InstallSection />
        </main>
        <FooterSection />
      </div>
    </div>
  );
}