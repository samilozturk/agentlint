import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";

import { TooltipProvider } from "@/components/ui/tooltip";
import { useTheme } from "@/hooks/use-theme";
import { Navbar } from "@/components/navbar";
import { HeroSection } from "@/components/sections/hero";
import { ComparisonSection } from "@/components/sections/comparison";
import { FeaturesSection } from "@/components/sections/features";
import { DemoSection } from "@/components/sections/demo";
import { WorkflowSection } from "@/components/sections/workflow";
import { ClientsSection } from "@/components/sections/clients";
import { GuaranteesSection } from "@/components/sections/guarantees";
import { QuickstartSection } from "@/components/sections/quickstart";
import { Footer } from "@/components/footer";
import { SectionDivider } from "@/components/section-divider";
import { StudioBackground } from "@/components/studio-background";

export default function App() {
  const { theme, toggleTheme } = useTheme();

  return (
    <TooltipProvider>
      <div className="min-h-screen">
        <StudioBackground />
        <Navbar theme={theme} onToggleTheme={toggleTheme} />
        <main>
          <HeroSection />
          <SectionDivider />
          <ComparisonSection />
          <SectionDivider />
          <FeaturesSection />
          <SectionDivider />
          <DemoSection />
          <SectionDivider />
          <WorkflowSection />
          <SectionDivider />
          <ClientsSection />
          <SectionDivider />
          <GuaranteesSection />
          <SectionDivider />
          <QuickstartSection />
        </main>
        <Footer />
      </div>
    </TooltipProvider>
  );
}
