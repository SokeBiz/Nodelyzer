"use client";

// import { Button } from "./ui/button";
// import NodeMap from "./NodeMap";
import Link from "next/link";
import RenderMap from "./renderMap";

export default function HeroSection() {
  return (
    <section className="pt-28 pb-16 px-4 bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Secure Your <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-cyan-400">Blockchain</span> Network Infrastructure
            </h1>
            <p className="mt-6 text-xl text-slate-300 max-w-xl">
              Nodelyzer helps you identify and mitigate vulnerabilities in blockchain node networks with advanced visualization and real-time monitoring.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center justify-center lg:justify-start">
              <Link href="#" className="bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white text-lg py-3 px-6 rounded-md transition-colors duration-200 text-center w-full sm:w-auto">
                Start Free Trial
              </Link>
              <Link href="#" className="border border-slate-700 hover:bg-slate-800 text-white text-lg py-3 px-6 rounded-md transition-colors duration-200 text-center w-full sm:w-auto">
                Learn
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-6">
              <div className="flex -space-x-2">
                <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center">
                  <span className="text-white text-xs">KM</span>
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center">
                  <span className="text-white text-xs">JP</span>
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center">
                  <span className="text-white text-xs">SL</span>
                </div>
              </div>
              <div className="text-slate-400 text-sm">
                Trusted by <span className="text-white">500+</span> blockchain companies
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <div className="relative h-[400px] flex items-center justify-center">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-xl blur-xl opacity-20"></div>
              <div className="relative bg-slate-800/50 backdrop-blur-sm rounded-xl p-0 h-full w-full border border-slate-700 flex items-center justify-center overflow-hidden">
                <RenderMap className="w-full h-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
