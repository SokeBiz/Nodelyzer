"use client";

import { useEffect, useState, ChangeEvent, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import Header from "@/components/header";
import Highcharts from "highcharts/highmaps";
import HighchartsReact from "highcharts-react-official";
import worldMapData from "@highcharts/map-collection/custom/world.geo.json" assert { type: "json" };
import { countryNameToCode } from '@/lib/countryNameToCode'

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

    // Parsed node points and per-country counts (for Highcharts)
    interface NodePoint { name?: string; lat: number; lon: number; country?: string; }
    interface CountryCount { code: string; value: number; }

    const [points, setPoints] = useState<NodePoint[]>([]);
    const [countryCounts, setCountryCounts] = useState<CountryCount[]>([]);

    const countryToCode = (name?: string): string | undefined => {
        if (!name) return undefined;
        return countryNameToCode[name.trim().toLowerCase()];
    };

    // Try to parse nodeData whenever it changes (supports JSON array or CSV with headers)
    useEffect(() => {
        if (!nodeData.trim()) {
            // No input yet – clear previous results
            setPoints([]);
            setCountryCounts([]);
            return;
        }

        const trim = nodeData.trim();
        const pointsOut: NodePoint[] = [];
        const counts: Record<string, number> = {};

        // Helper: CSV parser capable of eth dump headers
        const parseCSV = (raw: string) => {
            const lines = raw.split(/\r?\n/).filter(l => l.trim());
            if (lines.length < 2) return;
            const header = lines[0]
                .split(/,|;|\t/)
                .map(h => h.trim().replace(/^"|"$/g, "").toLowerCase());
            const latIdx = header.findIndex(h => h === "lat" || h === "latitude");
            const lonIdx = header.findIndex(h => h === "lon" || h === "longitude" || h === "lng");
            const countryIdx = header.findIndex(h => h === "country");
            const nameIdx = header.findIndex(h => h === "name" || h === "node id");
            for (let i = 1; i < lines.length; i++) {
                const parts = lines[i].split(/,|;|\t/).map(p => p.replace(/^"|"$/g, ""));
                const countryRaw = countryIdx !== -1 ? parts[countryIdx] : undefined;
                const code = countryToCode(countryRaw?.toLowerCase());
                if (code) counts[code] = (counts[code] || 0) + 1;

                if (latIdx !== -1 && lonIdx !== -1) {
                    const lat = parseFloat(parts[latIdx]);
                    const lon = parseFloat(parts[lonIdx]);
                    if (!isNaN(lat) && !isNaN(lon)) {
                        pointsOut.push({
                            lat,
                            lon,
                            name: nameIdx !== -1 ? parts[nameIdx] : `Node ${i}`,
                            country: countryRaw?.toLowerCase(),
                        });
                    }
                }
            }
        };

        try {
            if (trim.startsWith("[")) {
                const arr = JSON.parse(trim);
                if (Array.isArray(arr)) {
                    arr.forEach((item: any, idx: number) => {
                        const countryRaw = item.country ?? item.Country;
                        const code = countryToCode(typeof countryRaw === "string" ? countryRaw.toLowerCase() : undefined);
                        if (code) counts[code] = (counts[code] || 0) + 1;

                        const lat = parseFloat(item.lat ?? item.latitude);
                        const lon = parseFloat(item.lon ?? item.longitude);
                        if (!isNaN(lat) && !isNaN(lon)) {
                            pointsOut.push({
                                lat,
                                lon,
                                name: item.name ?? item["Node Id"] ?? `Node ${idx + 1}`,
                                country: typeof countryRaw === "string" ? countryRaw.toLowerCase() : undefined,
                            });
                        }
                    });
                }
            } else {
                parseCSV(trim);
            }
        } catch (err) {
            console.error("Failed to parse node data", err);
        }

        setPoints(pointsOut);
        setCountryCounts(Object.entries(counts).map(([code, value]) => ({ code, value })));
    }, [nodeData]);

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
            setNodeData(event.target?.result as string);
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
                                <input
                                    type="file"
                                    accept=".json,.csv,.txt"
                                    className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 mb-2"
                                    onChange={handleFileUpload}
                                />
                                <span className="text-xs text-gray-400">{fileName ? `Loaded: ${fileName}` : "Upload a node data file (JSON, CSV, or TXT)"}</span>
                                <textarea
                                    className="w-full mt-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                                    placeholder="Or paste node data here..."
                                    value={nodeData}
                                    onChange={e => setNodeData(e.target.value)}
                                />
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