import FeaturesSection from "@/components/featuresSection";
import Footer from "@/components/footer";
import Header from "@/components/header";
import HeroSection from "@/components/herosection";
import HowItWorksSection from "@/components/howitworks";
import Image from "next/image";

export default function Home() {
  return (
    <main className="bg-slate-950 text-white min-h-screen">
        <Header />
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <Footer />
    </main>
  );
}
