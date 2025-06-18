"use client";

import { useEffect, useState, ChangeEvent, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import Header from "@/components/header";
import Highcharts from "highcharts/highmaps";
import HighchartsReact from "highcharts-react-official";
import worldMapData from "@highcharts/map-collection/custom/world.geo.json" assert { type: "json" };
import { countryNameToCode } from '@/lib/countryNameToCode'
import { parseEthereumDump } from '@/lib/parseEthereum';
import { parseBitcoinDump } from '@/lib/parseBitcoin';
import { parseSolanaDump } from '@/lib/parseSolana';

export default function Analyze() {
    const { user, loading } = useAuth();
    const router = useRouter();

    // Scenario selection state
    const [scenario, setScenario] = useState("region");
    const [network, setNetwork] = useState("bitcoin");
    const [analyzing, setAnalyzing] = useState(false);
    const [results, setResults] = useState<any>(null);
    // Data input state
    const [nodeData, setNodeData] = useState<string>("");
    const [fileName, setFileName] = useState<string>("");
    // User-defined analysis name (shown only after data is provided)
    const [analysisName, setAnalysisName] = useState<string>("");
    // Ref for resetting native file input
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Parsed node points and per-country counts (for Highcharts)
    interface NodePoint { name?: string; lat: number; lon: number; country?: string; }
    interface CountryCount { code: string; value: number; }

    const [points, setPoints] = useState<NodePoint[]>([]);
    const [countryCounts, setCountryCounts] = useState<CountryCount[]>([]);
    const [torCount, setTorCount] = useState(0);

    const countryToCode = (name?: string): string | undefined => {
        if (!name) return undefined;
        return countryNameToCode[name.trim().toLowerCase()];
    };

    // Load saved analysis state on mount
    useEffect(() => {
        if (typeof window === "undefined") return;
        const saved = localStorage.getItem("analysisState");
        if (!saved) return;
        try {
            const parsed = JSON.parse(saved);
            if (parsed.nodeData) setNodeData(parsed.nodeData);
            if (parsed.analysisName) setAnalysisName(parsed.analysisName);
            if (parsed.network) setNetwork(parsed.network);
        } catch (_) {
            // ignore parse errors
        }
    }, []);

    // Persist analysis state whenever any key value changes
    useEffect(() => {
        if (typeof window === "undefined") return;
        if (!nodeData.trim() && !analysisName.trim()) {
            localStorage.removeItem("analysisState");
            return;
        }
        const payload = JSON.stringify({
            nodeData,
            analysisName,
            network,
        });
        localStorage.setItem("analysisState", payload);
    }, [nodeData, analysisName, network]);

    useEffect(() => {
        if (!nodeData.trim()) {
            // No input yet – clear previous results
            setPoints([]);
            setCountryCounts([]);
            setTorCount(0);
            return;
        }

        const parserMap: Record<string, (raw: string) => { points: NodePoint[]; counts: CountryCount[]; tor?: number }> = {
            ethereum: parseEthereumDump,
            bitcoin: parseBitcoinDump,
            solana: parseSolanaDump,
        };

        const selectedParser = parserMap[network] ?? parseEthereumDump;
        const { points: pts, counts, tor } = (selectedParser as any)(nodeData);

        setPoints(pts);
        setCountryCounts(counts);
        setTorCount(typeof tor === "number" ? tor : 0);
    }, [nodeData, network]);

    useEffect(() => {
        // Dynamically import the map module only on the client
        import("highcharts/modules/map").then((mod) => {
            if (mod && typeof mod.default === "function") {
                mod.default(Highcharts);
            }
        });
    }, []);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    const isPendingAuth = loading || !user;

    // Handle file upload
    const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            // Basic heuristic to auto-select network based on content (only adjust if not already user-selected)
            const lower = text ?? "";
            let detected: string | null = null;
            if (lower.includes("\"protocol_version\"") || (lower.trim().startsWith("{") && lower.includes("\"nodes\""))) {
                detected = "bitcoin";
            } else if (lower.includes("\"epoch\"") || lower.includes("\"activated_stake\"")) {
                detected = "solana";
            } else {
                detected = "ethereum";
            }
            // Only update if detection differs and the user hasn't already set another network after choosing the file
            setNetwork(prev => prev === detected ? prev : detected);
            setNodeData(text);
        };
        reader.readAsText(file);
    };

    // Placeholder: handle analysis
    const handleAnalyze = () => {
        setAnalyzing(true);
        setTimeout(() => {
            setResults({
                gini: 0.42,
                nakamoto: 7,
                suggestion: "Add 3 nodes in South America to improve decentralization.",
                connectivityLoss: "12% nodes offline in scenario."
                // calculate gini
                // calculate nakamoto
            });
            setAnalyzing(false);
        }, 1200);
    };

    // Clear uploaded/pasted node data and reset related state
    const handleClearData = () => {
        setNodeData("");
        setFileName("");
        setAnalysisName("");
        setPoints([]);
        setCountryCounts([]);
        setTorCount(0);
        if (typeof window !== "undefined") {
            localStorage.removeItem("analysisState");
        }
        // reset file input element value so same file can be re-selected if needed
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // Highcharts map options derived from current points / countryCounts
    const mapOptions = useMemo(() => ({
        chart: {
            map: worldMapData as any,
            height: 400,
            backgroundColor: "rgba(0,0,0,0)"
        },
        title: { text: null },
        tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            borderWidth: 0,
            style: { color: '#F0F0F0' },
            formatter: function (this: any): string {
                if (this.point.value != null) {
                    return `<b>${this.point.name}</b><br/>Nodes: <b>${this.point.value}</b>`;
                }
                return `<b>${this.point.name}</b>`;
            }
        },
        colorAxis: { min: 1, minColor: '#475569', maxColor: '#38bdf8' },
        mapNavigation: { enabled: true, buttonOptions: { verticalAlign: 'bottom' } },
        series: [
            {
                name: "Nodes per region",
                mapData: worldMapData,
                data: countryCounts,
                joinBy: ['hc-key', 'code'],
                states: { hover: { color: '#67e8f9', borderColor: '#fff' } },
                borderColor: "#888",
                nullColor: "#222E3A",
                showInLegend: false,
            },
            {
                type: "mappoint" as const,
                name: "Nodes",
                color: "#38bdf8",
                data: points.filter(p => !isNaN(p.lat) && !isNaN(p.lon)).map(p => ({ name: p.name, lat: p.lat, lon: p.lon })),
                marker: { radius: 8, fillColor: "#38bdf8", lineWidth: 2, lineColor: "#fff" },
                dataLabels: { enabled: false }
            }
        ],
        credits: { enabled: false },
    }), [points, countryCounts]);

    if (isPendingAuth) {
        return null; // or a loading spinner
    }

    return (
        <>
            <Header />
            <main className="bg-gradient-to-b from-slate-950 to-slate-900 min-h-screen w-full flex flex-col items-stretch justify-stretch p-0 m-0 overflow-x-hidden pt-8">
                <Card className="flex flex-col flex-1 h-[calc(100vh-5rem)] w-full rounded-none border-none shadow-none bg-transparent">
                    <CardHeader className="px-12 pt-8 pb-4">
                        <CardTitle className="text-3xl text-white">Network Failure Analysis</CardTitle>
                        <CardDescription className="max-w-2xl text-lg mt-2">
                            Simulate node failures and analyze network resilience. Select a scenario and run analysis to see the impact and get optimization suggestions.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col md:flex-row gap-8 px-4 md:px-12 pb-0 overflow-hidden">
                        {/* Data Input Module */}
                        <div className="flex flex-col gap-6 flex-shrink-0 w-full md:w-80 bg-white/5 rounded-xl border border-white/10 p-6 h-fit md:h-auto mb-4 md:mb-0">
                            <div>
                                <label className="block text-base font-medium text-gray-300 mb-2">Node Data Input</label>
                                {/* File chooser + clear data inline */}
                                <div className="flex items-center gap-3 mb-2">
                                    <label htmlFor="file-upload" className="text-sm font-semibold bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 cursor-pointer">Choose File</label>
                                    {nodeData.trim() && (
                                        <button
                                            onClick={handleClearData}
                                            className="text-red-400 text-sm hover:underline"
                                        >
                                            Clear Data
                                        </button>
                                    )}
                                </div>
                                <input
                                    id="file-upload"
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".json,.csv,.txt"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                                <span className="text-xs text-gray-400">{fileName ? `Loaded: ${fileName}` : "Upload a node data file (JSON, CSV, or TXT)"}</span>
                                <textarea
                                    className="w-full mt-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                                    placeholder="Or paste node data here..."
                                    value={nodeData}
                                    onChange={e => setNodeData(e.target.value)}
                                />
                                {/* Analysis name – shown only after data is present */}
                                {nodeData.trim() && (
                                    <input
                                        type="text"
                                        className="w-full mt-3 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Analysis name"
                                        value={analysisName}
                                        onChange={e => setAnalysisName(e.target.value)}
                                    />
                                )}
                            </div>
                            {/* Scenario Selection */}
                            <div>
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
                                <label className="block text-base font-medium text-gray-300 mb-2">Network</label>
                                <select
                                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                                    value={network}
                                    onChange={e => setNetwork(e.target.value)}
                                >
                                    <option value="bitcoin">Bitcoin</option>
                                    <option value="ethereum">Ethereum</option>
                                    <option value="solana">Solana</option>
                                </select>
                                <button
                                    onClick={handleAnalyze}
                                    disabled={analyzing}
                                    className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                                >
                                    {analyzing ? "Analyzing..." : "Run Analysis"}
                                </button>
                            </div>
                        </div>
                        {/* Map Visualization with Highcharts */}
                        <div className="w-full flex items-center bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                            <HighchartsReact
                                highcharts={Highcharts}
                                constructorType={"mapChart"}
                                options={mapOptions}
                                containerProps={{ style: { width: '100%', minWidth: '300px' } }}
                            />
                        
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col md:flex-row gap-8 items-stretch md:items-start px-12 pb-8 pt-6">
                        {/* Metrics */}
                        <div className="flex-1 bg-white/5 rounded-xl border border-white/10 p-6 min-w-[220px]">
                            <div className="text-xl font-bold mb-2 text-white">Metrics</div>
                            <div className="text-gray-300 text-base space-y-1">
                                <div>Gini Coefficient: <span className="font-mono">{results ? results.gini : "-"}</span></div>
                                <div>Nakamoto Coefficient: <span className="font-mono">{results ? results.nakamoto : "-"}</span></div>
                                <div>Connectivity Loss: <span className="font-mono">{results ? results.connectivityLoss : "-"}</span></div>
                                <div>Countries Represented: <span className="font-mono">{countryCounts.length}</span></div>
                                <div>Nodes via TOR: <span className="font-mono">{torCount}</span></div>
                            </div>
                        </div>
                        {/* Optimization Suggestion */}
                        <div className="flex-1 bg-white/5 rounded-xl border border-white/10 p-6 min-w-[220px]">
                            <div className="text-xl font-bold mb-2 text-white">Optimization Suggestion</div>
                            <div className="text-gray-300 text-base">
                                {results ? results.suggestion : "Run an analysis to get suggestions."}
                            </div>
                        </div>
                    </CardFooter>
                </Card>
            </main>
        </>
    );
}