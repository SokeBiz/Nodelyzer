'use client'

import FeaturesSection from "@/components/featuresSection";
import Footer from "@/components/footer";
import Header from "@/components/header";
import HeroSection from "@/components/herosection";
import HowItWorksSection from "@/components/howitworks";
import Image from "next/image";
import {useAuthState} from "react-firebase-hooks/auth"
import {auth} from "@/lib/firebase"
import { useRouter } from "next/navigation";


export default function Home() {

  const router = useRouter()

  const [user] = useAuthState(auth)
  if (!user) {
    // router.push('/login')
    console.log('no user')
  }

  
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
