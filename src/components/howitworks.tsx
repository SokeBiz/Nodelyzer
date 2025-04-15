"use client";
import Link from "next/link";
// import { Button } from "./ui/button";

const steps = [
  {
    number: "01",
    title: "Network Discovery",
    description: "Nodelyzer automatically maps your entire blockchain node infrastructure, discovering all nodes and connections without requiring manual configuration.",
  },
  {
    number: "02",
    title: "Vulnerability Assessment",
    description: "Our advanced scanning engine identifies security vulnerabilities, misconfigurations, and potential attack vectors in your node network.",
  },
  {
    number: "03",
    title: "Risk Prioritization",
    description: "Each detected issue is analyzed and assigned a risk score based on severity, exploitability, and potential impact on your blockchain.",
  },
  {
    number: "04",
    title: "Remediation Guidance",
    description: "Receive step-by-step instructions to fix vulnerabilities, with automated remediation options for common issues.",
  },
  {
    number: "05",
    title: "Continuous Monitoring",
    description: "Nodelyzer provides ongoing protection with real-time monitoring and alerts for new threats targeting your blockchain infrastructure.",
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 px-4 bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="container mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            How Nodelyzer Works
          </h2>
          <p className="mt-4 text-lg text-slate-300">
            Our platform uses advanced analysis techniques to secure your blockchain node network with minimal setup and maximum protection.
          </p>
        </div>

        <div className="relative">
          {/* Vertical line connecting steps */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500 to-cyan-400 hidden md:block"></div>

          <div className="space-y-16 relative">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                <div className={`flex flex-col md:flex-row items-center ${index % 2 === 0 ? 'md:justify-end' : ''} gap-8`}>
                  <div className={`md:w-1/2 ${index % 2 === 0 ? 'md:text-right md:order-1' : 'md:order-2'}`}>
                    <div className={`${index % 2 === 0 ? 'md:ml-auto' : 'md:mr-auto'} max-w-md`}>
                      <div className="flex items-center gap-4 mb-2">
                        <div className={`rounded-lg px-2 py-1 text-xs font-semibold bg-blue-500/10 text-blue-400 ${index % 2 === 0 ? 'md:order-2' : ''}`}>
                          {step.number}
                        </div>
                        <h3 className="text-2xl font-bold text-white">{step.title}</h3>
                      </div>
                      <p className="text-slate-300">{step.description}</p>
                    </div>
                  </div>

                  <div className={`relative md:w-16 md:mx-auto flex justify-center ${index % 2 === 0 ? 'md:order-2' : 'md:order-1'}`}>
                    <div className="h-16 w-16 rounded-full border-2 border-blue-500 bg-slate-900 flex items-center justify-center z-10">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"></div>
                    </div>
                  </div>

                  <div className={`md:w-1/2 ${index % 2 === 0 ? 'md:order-3 md:text-left' : 'md:order-3 md:text-right'}`}>
                    {/* Empty div for layout */}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 text-center">
          <Link
            href="#"
            className="inline-block bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white text-lg py-3 px-6 rounded-md transition-colors"
          >
            Get Started with Nodelyzer
          </Link>
          <p className="mt-4 text-slate-400">
            Start securing your blockchain nodes today.
          </p>
        </div>
      </div>
    </section>
  );
}
