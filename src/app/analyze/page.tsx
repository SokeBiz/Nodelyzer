"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
// Placeholder for Highcharts React wrapper
// import HighchartsReact from 'highcharts-react-official';
// import Highcharts from 'highcharts/highmaps';

export default function Analyze() {
    const { user, loading } = useAuth();
    const router = useRouter();

    // Scenario selection state
    const [scenario, setScenario] = useState("region");
    const [analyzing, setAnalyzing] = useState(false);
    const [results, setResults] = useState<any>(null);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    if (loading || !user) {
        return null; // or a loading spinner
    }

    // Placeholder: handle analysis
    const handleAnalyze = () => {
        setAnalyzing(true);
        setTimeout(() => {
            setResults({
                gini: 0.42,
                nakamoto: 7,
                suggestion: "Add 3 nodes in South America to improve decentralization.",
                connectivityLoss: "12% nodes offline in scenario."
            });
            setAnalyzing(false);
        }, 1200);
    };

    return (
        <main className="bg-gradient-to-b from-slate-950 to-slate-900 min-h-screen w-screen flex flex-col items-stretch justify-stretch p-0 m-0 overflow-hidden">
            <Card className="flex flex-col flex-1 h-screen w-screen rounded-none border-none shadow-none bg-transparent">
                <CardHeader className="px-12 pt-8 pb-4">
                    <CardTitle className="text-3xl text-white">Network Failure Analysis</CardTitle>
                    <CardDescription className="max-w-2xl text-lg mt-2">
                        Simulate node failures and analyze network resilience. Select a scenario and run analysis to see the impact and get optimization suggestions.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col md:flex-row gap-8 px-12 pb-0">
                    {/* Scenario Selection */}
                    <div className="flex flex-col gap-4 flex-shrink-0 w-full md:w-80 bg-white/5 rounded-xl border border-white/10 p-6 h-fit md:h-auto">
                        <label className="block text-base font-medium text-gray-300 mb-2">Failure Scenario</label>
                        <select
                            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                            value={scenario}
                            onChange={e => setScenario(e.target.value)}
                        >
                            <option value="region">Regional Outage</option>
                            <option value="cloud">Cloud Provider Failure</option>
                            <option value="attack">Targeted Attack</option>
                        </select>
                        <button
                            onClick={handleAnalyze}
                            disabled={analyzing}
                            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                        >
                            {analyzing ? "Analyzing..." : "Run Analysis"}
                        </button>
                    </div>
                    {/* Map Visualization Placeholder */}
                    <div className="flex-1 min-h-[400px] flex items-center justify-center bg-white/5 rounded-xl border border-white/10">
                        {/* Replace this with HighchartsReact when ready */}
                        <span className="text-gray-400 text-xl">[Map Visualization Here]</span>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col md:flex-row gap-8 items-stretch md:items-start px-12 pb-8 pt-6">
                    {/* Metrics */}
                    <div className="flex-1 bg-white/5 rounded-xl border border-white/10 p-6 min-w-[220px]">
                        <div className="text-xl font-semibold mb-2">Metrics</div>
                        <div className="text-gray-300 text-base space-y-1">
                            <div>Gini Coefficient: <span className="font-mono">{results ? results.gini : "-"}</span></div>
                            <div>Nakamoto Coefficient: <span className="font-mono">{results ? results.nakamoto : "-"}</span></div>
                            <div>Connectivity Loss: <span className="font-mono">{results ? results.connectivityLoss : "-"}</span></div>
                        </div>
                    </div>
                    {/* Optimization Suggestion */}
                    <div className="flex-1 bg-white/5 rounded-xl border border-white/10 p-6 min-w-[220px]">
                        <div className="text-xl font-semibold mb-2">Optimization Suggestion</div>
                        <div className="text-gray-300 text-base">
                            {results ? results.suggestion : "Run an analysis to get suggestions."}
                        </div>
                    </div>
                </CardFooter>
            </Card>
        </main>
    );
}