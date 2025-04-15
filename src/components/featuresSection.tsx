"use client";

import {
  Shield,
  LineChart,
  EyeOff,
  Network,
  AlertCircle,
  Zap
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// Feature data
const features = [
  {
    title: "Vulnerability Scanning",
    description: "Automatically detect potential security vulnerabilities in your blockchain node infrastructure with our advanced scanning engine.",
    icon: Shield,
  },
  {
    title: "Network Visualization",
    description: "View your entire blockchain node network in a comprehensive geographic map with real-time connection status.",
    icon: Network,
  },
  {
    title: "Privacy Analysis",
    description: "Identify privacy leaks and information exposure risks in your node configuration and network communications.",
    icon: EyeOff,
  },
  {
    title: "Performance Monitoring",
    description: "Track node performance metrics to identify bottlenecks and optimize your blockchain network for maximum efficiency.",
    icon: LineChart,
  },
  {
    title: "Threat Intelligence",
    description: "Receive real-time alerts about emerging threats and vulnerabilities specifically targeting your blockchain technology.",
    icon: AlertCircle,
  },
  {
    title: "Rapid Mitigation",
    description: "Deploy automated countermeasures to protect your nodes from detected threats with one-click remediation actions.",
    icon: Zap,
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 px-4 bg-slate-950">
      <div className="container mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Comprehensive Blockchain Security Analysis
          </h2>
          <p className="mt-4 text-lg text-slate-300">
            Nodelyzer provides a complete security toolkit for blockchain node operators, developers, and security teams.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="bg-slate-900 border-slate-800 hover:border-blue-500/50 transition-colors group"
            >
              <CardHeader className="">
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-blue-400" />
                </div>
                <CardTitle className="text-xl font-semibold text-white">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
