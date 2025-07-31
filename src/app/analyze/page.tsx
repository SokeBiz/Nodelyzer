"use client";

import { useEffect, useState, ChangeEvent, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import Header from "@/components/header";
import Highcharts from "highcharts/highmaps";
import HighchartsReact from "highcharts-react-official";
import worldMapData from "@highcharts/map-collection/custom/world.geo.json" assert { type: "json" };
import { countryNameToCode } from '@/lib/countryNameToCode'
import { codeToCountryName } from '@/lib/countryNameToCode';
import { parseEthereumDump } from '@/lib/parseEthereum';
import { parseBitcoinDump } from '@/lib/parseBitcoin';
import { parseSolanaDump } from '@/lib/parseSolana';
import { giniCoefficient } from '@/lib/utils';
import { useAnalysisDialog } from '@/context/AnalysisDialogContext';
import { saveAnalysis, getAnalysisById, updateAnalysis } from '@/lib/analysisService';
import { toast } from 'sonner';
import Highcharts3d from 'highcharts/highcharts-3d';
import { generateAnalysisPDF } from '@/lib/pdfGenerator';

export default function Analyze() {
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

    const { user, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const analysisIdParam = searchParams.get('id');
    const [analysisId, setAnalysisId] = useState<string | null>(analysisIdParam);

    // Scenario selection state
    const [scenario, setScenario] = useState("");  // Default to empty for Overview
    const [network, setNetwork] = useState("bitcoin");
    const [analyzing, setAnalyzing] = useState(false);
    const [results, setResults] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    // Data input state
    const [nodeData, setNodeData] = useState<string>("");
    const [fileName, setFileName] = useState<string>("");
    // User-defined analysis name (shown only after data is provided)
    const [analysisName, setAnalysisName] = useState<string>("");
    // Ref for resetting native file input
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Parsed node points and per-country counts (for Highcharts)
    interface NodePoint { name?: string; lat: number; lon: number; country?: string; stake?: number; provider?: string; }
    interface CountryCount { code: string; value: number; }

    const [points, setPoints] = useState<NodePoint[]>([]);
    const [countryCounts, setCountryCounts] = useState<CountryCount[]>([]);
    const [torCount, setTorCount] = useState(0);

    // Near your other states (e.g., after const [results, setResults] = useState<any>(null);)
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [optimizing, setOptimizing] = useState(false);

    const [targets, setTargets] = useState<string[]>(['']);
    const [providerTargets, setProviderTargets] = useState<string[]>([]);
    const chartComponentRef = useRef<HighchartsReact.RefObject>(null);

    // ADD REFS FOR BAR AND PIE
    const barChartRef = useRef<HighchartsReact.RefObject>(null);
    const pieChartRef = useRef<HighchartsReact.RefObject>(null);

    const [remainingCountries, setRemainingCountries] = useState(0);
    const [viewMode, setViewMode] = useState<'map' | 'bar'>('map');

    const countryToCode = (name?: string): string | undefined => {
        if (!name) return undefined;
        return countryNameToCode[name.trim().toLowerCase()];
    };

    // Open the start-analysis dialog when page loads
    const { openDialog, closeDialog } = useAnalysisDialog();

    // Show dialog only when there is no node data
    useEffect(() => {
        if (nodeData.trim()) {
            closeDialog();
        } else {
            openDialog();
        }
    }, [nodeData]);

    // Load saved analysis state on mount
    useEffect(() => {
        if (typeof window === "undefined") return;
        // If analysisId query param is present, attempt to load from Firestore first
        if (analysisIdParam) {
            (async () => {
                const rec = await getAnalysisById(analysisIdParam);
                if (rec) {
                    setAnalysisId(rec.id || analysisIdParam);
                    setNodeData(rec.nodeData || "");
                    setAnalysisName(rec.name || "");
                    setNetwork(rec.network || "bitcoin");
                    if (rec.metrics) {
                        setResults({
                            gini: rec.metrics.gini ?? null,
                            nakamoto: rec.metrics.nakamoto ?? null,
                            connectivityLoss: rec.metrics.connectivityLoss ?? "-",
                            suggestion: "Run full analysis to get optimization suggestions."
                        });
                    }
                }
            })();
        }

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
    }, [analysisIdParam]);

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
        import('highcharts/highcharts-3d').then((mod) => {
            if (mod && typeof mod.default === 'function') {
                mod.default(Highcharts);
            }
        });
    }, []);

    useEffect(() => {
        import('highcharts/modules/exporting').then((exportingMod) => {
            if (exportingMod && typeof exportingMod.default === 'function') {
                exportingMod.default(Highcharts);
            }
        });
    }, []);

    useEffect(() => {
        import('highcharts/modules/offline-exporting').then((mod) => {
            if (mod && typeof mod.default === 'function') {
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
            const lowerText = text.toLowerCase();
            const lowerName = file.name.toLowerCase();
            let detected: string | null = null;
            if (lowerName.includes('solana') || lowerName.includes('validator')) {
                detected = 'solana';
            } else if (lowerText.includes('protocol_version') || (lowerText.trim().startsWith('{') && lowerText.includes('nodes'))) {
                detected = 'bitcoin';
            } else if (lowerText.includes('epoch') || lowerText.includes('activatedstake') || lowerText.includes('nodepubkey')) {
                detected = 'solana';
            } else {
                detected = 'ethereum';
            }
            setNetwork(prev => prev === detected ? prev : detected);
            setNodeData(text);
        };
        reader.readAsText(file);
    };

    // Run the analysis for the selected scenario/network
    const handleAnalyze = async () => {  // Make it async
        if (!nodeData.trim()) return;  // Optional: Skip if no data
        
        setAnalyzing(true);
        
        try {
            // Prepare data in the format backend expects (adapt your points to include country, etc.)
            let nodeList = points.map(p => ({ lat: p.lat, lon: p.lon, country: p.country || 'Unknown', stake: p.stake, provider: p.provider }));
            if (nodeList.length === 0) {
                console.warn('Points is empty; attempting to re-parse nodeData');
                // Fallback: Re-parse if points not set (timing issue)
                const parserMap: Record<string, (raw: string) => { points: NodePoint[]; counts: CountryCount[]; tor?: number }> = { ethereum: parseEthereumDump, bitcoin: parseBitcoinDump, solana: parseSolanaDump };
                const selectedParser = parserMap[network] ?? parseEthereumDump;
                const { points: fallbackPoints } = (selectedParser as any)(nodeData);
                nodeList = fallbackPoints.map((p: NodePoint) => ({ lat: p.lat, lon: p.lon, country: p.country || 'Unknown', stake: p.stake, provider: p.provider }));
            }
            
            const normalizedTargets = (scenario === 'cloud' ? providerTargets : targets).map(code => code.toLowerCase());
            
            console.log('Preparing to send', nodeList.length, 'nodes to backend');
            console.log('Sample node:', nodeList[0]);
            const requestBody = JSON.stringify({
                nodes: nodeList,
                scenario: scenario,
                targets: normalizedTargets
            });
            console.log('Request body size:', requestBody.length);
            
            const response = await fetch(`${BACKEND_URL}/simulate-failure`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: requestBody
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Backend error');
            }
            
            const result = await response.json();
            setResults({
                gini: result.gini,
                nakamoto: result.nakamoto,
                connectivityLoss: result.connectivity_loss,
                failed_nodes: result.failed_nodes,  // Add this for display
                total_nodes: result.total_nodes,
                suggestion: "Run full analysis to get optimization suggestions."
            });
            setRemainingCountries(result.remaining_countries || 0);
            
            // Automatically run optimization
            await handleOptimize();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to run analysis");
        } finally {
            setAnalyzing(false);
        }
    };

    // Explicit save handler (when user clicks "Save Analysis")
    const handleSave = async () => {
        if (!user || !nodeData.trim()) return;
        setSaving(true);
        try {
            if (analysisId) {
                // update existing
                await updateAnalysis(analysisId, {
                    name: analysisName || "Untitled Analysis",
                    network,
                    nodeData,
                    metrics: results ? {
                        gini: results.gini,
                        nakamoto: results.nakamoto,
                        connectivityLoss: results.connectivityLoss
                    } : undefined,
                });
                toast.success("Analysis updated");
            } else {
                const newId = await saveAnalysis({
                    userId: user.uid,
                    name: analysisName || "Untitled Analysis",
                    network,
                    nodeData,
                    metrics: results ? {
                        gini: results.gini,
                        nakamoto: results.nakamoto,
                        connectivityLoss: results.connectivityLoss
                    } : undefined,
                });
                setAnalysisId(newId);
                // update url so subsequent saves update same doc
                router.replace(`/analyze?id=${newId}`);
                toast.success("Analysis saved successfully");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to save analysis");
        } finally {
            setSaving(false);
        }
    };

    // Clear uploaded/pasted node data and reset related state
    const handleClearData = () => {
        setNodeData("");
        setFileName("");
        setAnalysisName("");
        setPoints([]);
        setCountryCounts([]);
        setTorCount(0);
        setResults(null);
        setTargets([]);
        setProviderTargets([]);
        setRemainingCountries(0);
        setSuggestions([]);
        setViewMode('map');
        if (typeof window !== "undefined") {
            localStorage.removeItem("analysisState");
        }
        // reset file input element value so same file can be re-selected if needed
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // Add a new `handleOptimize` function (below `handleAnalyze`):
    const handleOptimize = async () => {
        setOptimizing(true);
        
        try {
            let nodeList = points.map(p => ({ lat: p.lat, lon: p.lon, country: p.country || 'Unknown', stake: p.stake, provider: p.provider }));
            if (nodeList.length === 0) {
                console.warn('Points is empty; attempting to re-parse nodeData');
                const parserMap: Record<string, (raw: string) => { points: NodePoint[]; counts: CountryCount[]; tor?: number }> = { ethereum: parseEthereumDump, bitcoin: parseBitcoinDump, solana: parseSolanaDump };
                const selectedParser = parserMap[network] ?? parseEthereumDump;
                const { points: fallbackPoints } = selectedParser(nodeData);
                nodeList = fallbackPoints.map((p: NodePoint) => ({ lat: p.lat, lon: p.lon, country: p.country || 'Unknown', stake: p.stake, provider: p.provider }));
            }
            
            const normalizedTargets = (scenario === 'cloud' ? providerTargets : targets).map(code => code.toLowerCase());
            
            const response = await fetch(`${BACKEND_URL}/optimize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nodes: nodeList, scenario, targets: normalizedTargets, network })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Backend error');
            }
            
            const result = await response.json();
            setSuggestions(result.suggestions);  // Update state
            setRemainingCountries(result.remaining_countries || 0);
            setResults({
                gini: result.gini,
                nakamoto: result.nakamoto,
                connectivityLoss: result.connectivity_loss,
                failed_nodes: result.failed_nodes,
                total_nodes: result.total_nodes,
                suggestion: result.suggestions.join(' ')
            });
            toast.success("Optimization suggestions generated");
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to optimize");
        } finally {
            setOptimizing(false);
        }
    };

    // Attach click handlers for region selection
    useEffect(() => {
        if (scenario !== "region" || !chartComponentRef.current) return;

        const chart = chartComponentRef.current.chart;

        const handlePointClick = (point: any) => {
            // @ts-ignore - 'hc-key' is map-specific
            const code = point['hc-key'];
            const name = point.name;
            const value = point.value || 0;

            if (value > 0) {
                setTargets(prev => 
                    prev.includes(code) 
                    ? prev.filter(c => c !== code) 
                    : [...prev, code]
                );
                toast.success(`Toggled selection for ${name}`);
            } else {
                toast.error(`Cannot select ${name}: No nodes present`);
            }
        };

        const points = chart.series[0]?.points || [];
        points.forEach(point => {
            if (point.graphic && point.graphic.element) {
                point.graphic.element.onclick = () => handlePointClick(point);
            }
        });

        return () => {
            points.forEach(point => {
                if (point.graphic && point.graphic.element) {
                    point.graphic.element.onclick = null;
                }
            });
        };
    }, [scenario, countryCounts, toast]);

    // Update visual highlighting for selected regions
    useEffect(() => {
        if (!chartComponentRef.current) return;

        const chart = chartComponentRef.current.chart;
        const points = chart.series[0]?.points || [];
        points.forEach(point => {
            // @ts-ignore - 'hc-key' is map-specific
            const isSelected = targets.includes(point['hc-key']);
            point.update({
                color: isSelected ? '#FF0000' : undefined,  // Red for selected, reset to default otherwise
            }, false);
        });
        chart.redraw();
    }, [targets, countryCounts]);

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

    const barOptions = useMemo(() => ({
        chart: {
            type: 'column',
            height: 400,
            backgroundColor: 'transparent',
            options3d: {
                enabled: true,
                alpha: 0,
                beta: 350,
                depth: 40,
                viewDistance: 25
            }
        },
        title: { text: null },
        xAxis: {
            categories: countryCounts.map(c => codeToCountryName[c.code.toUpperCase()] || c.code.toUpperCase()),
            title: { text: 'Countries', style: { color: '#fff' } },
            labels: { style: { color: '#fff' } }
        },
        yAxis: {
            title: { text: 'Nodes', style: { color: '#fff' } },
            labels: { style: { color: '#fff' } }
        },
        plotOptions: {
            column: {
                depth: 25
            }
        },
        series: [{
            name: 'Nodes',
            data: countryCounts.map(c => c.value),
            colorByPoint: true
        }],
        credits: { enabled: false }
    }), [countryCounts]);

    const uniqueProviders = useMemo(() => [...new Set(points.map(p => p.provider).filter((p): p is string => Boolean(p)))], [points]);
    const providerCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        points.forEach(p => {
            if (p.provider) {
                counts[p.provider] = (counts[p.provider] || 0) + (p.stake || 1);
            }
        });
        return Object.entries(counts).map(([name, y]) => ({ name, y }));
    }, [points]);

    const pieOptions = useMemo(() => ({
        chart: { type: 'pie', height: 300, backgroundColor: 'transparent' },
        title: { text: 'Cloud Provider Distribution', style: { color: '#fff' } },
        tooltip: { pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>' },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: { enabled: true, format: '<b>{point.name}</b>: {point.percentage:.1f} %', style: { color: '#fff' } },
                animation: { duration: 1000, easing: 'easeOutBounce' }
            }
        },
        series: [{ name: 'Providers', colorByPoint: true, data: providerCounts }],
        credits: { enabled: false }
    }), [providerCounts]);

    if (isPendingAuth) {
        return null; // or a loading spinner
    }

    return (
        <>
            <Header />
            <main className="bg-gradient-to-b from-slate-950 to-slate-900 min-h-screen w-full flex flex-col items-stretch justify-stretch p-0 m-0 overflow-x-hidden pt-8">
                <Card className="flex flex-col flex-1 h-[calc(100vh-5rem)] w-full rounded-none border-none shadow-none bg-transparent">
                    <CardHeader className="px-12 pt-8">
                        <CardTitle className="text-3xl text-white">Network Failure Analysis</CardTitle>
                        <CardDescription className="max-w-2xl text-lg mt-1">
                            Analyze node failures and network resilience. Select a scenario and run analysis to see the impact and get optimization suggestions.
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
                                    multiple={false}
                                    onChange={e => {
                                        const file = e.target.files?.[0];
                                        // if (file && file.size > 1024 * 1024) { // 1MB = 1024*1024 bytes
                                        //     alert("File size exceeds 1MB. Please select a smaller file.");
                                        //     e.target.value = ""; // reset file input
                                        //     return;
                                        // }
                                        handleFileUpload(e);
                                    }}
                                />
                                <span className="text-xs text-gray-400">{fileName ? `Loaded: ${fileName}` : "Upload a node data file (JSON, CSV, or TXT)"}</span>
                                <textarea
                                    className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[50px]"
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
                                    <option value="">Overview (No Failure)</option>
                                    <option value="region">Regional Outage</option>
                                    <option value="cloud">Cloud Provider Failure</option>
                                    {/* <option value="attack">Targeted Attack</option> */}
                                    <option value="51">51% Attack</option>
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
                                {scenario && scenario !== "region" && (  // Conditionally show target input if scenario is selected and not region
                                    <input
                                        type="text"
                                        className="w-full mt-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder={`Target (e.g., ${scenario === 'region' ? 'US' : scenario === 'cloud' ? 'AWS' : 'Entity'})`}
                                        value={scenario === 'cloud' ? providerTargets.join(', ') : targets[0] || ''}
                                        onChange={scenario !== 'cloud' ? e => setTargets([e.target.value]) : undefined}
                                        readOnly={scenario === 'cloud'}
                                    />
                                )}
                                {scenario === "cloud" && network === "solana" && (
                                    <div className="w-full max-h-32 overflow-y-auto px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white mb-2">
                                        {uniqueProviders.map((prov: string) => (
                                            <div key={prov} className="flex items-center gap-2 py-1">
                                                <input
                                                    type="checkbox"
                                                    id={prov}
                                                    checked={providerTargets.includes(prov)}
                                                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                                        const checked = e.target.checked;
                                                        setProviderTargets(prev =>
                                                            checked ? [...prev, prov] : prev.filter(p => p !== prov)
                                                        );
                                                    }}
                                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <label htmlFor={prov} className="text-sm">{prov}</label>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {scenario === "region" && (
                                    <>
                                        <p className="text-gray-300 mt-2">Click on the map to select regions for outage. Only regions with nodes can be selected.</p>
                                        <div className="text-gray-300 mt-1">Selected: {targets.map(code => codeToCountryName[code] || code.toUpperCase()).join(', ') || 'None'}</div>
                                    </>
                                )}
                                <button
                                    onClick={handleAnalyze}
                                    disabled={analyzing}
                                    className="w-full bg-blue-600 text-white py-1 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                                >
                                    {analyzing ? "Analyzing..." : "Run Analysis"}
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving || !nodeData.trim()}
                                    className="w-full bg-green-600 text-white py-1 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                                >
                                    {saving ? "Saving..." : "Save Analysis"}
                                </button>

                            </div>
                        </div>
                        <div className="flex-1 flex flex-col gap-4">
                            {/* Map Visualization with Highcharts */}
                            <div className="flex justify-end mt-2">
                                <select
                                    className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={viewMode}
                                    onChange={e => setViewMode(e.target.value as 'map' | 'bar')}
                                >
                                    <option value="map">Map View</option>
                                    <option value="bar">Bar Chart View</option>
                                </select>
                            </div>
                            <div className="w-full flex items-center bg-white/5 rounded-xl border border-white/10 overflow-hidden" style={{ display: viewMode === 'map' ? 'block' : 'none' }}>
                                    <HighchartsReact
                                        highcharts={Highcharts}
                                        constructorType={"mapChart"}
                                        options={mapOptions}
                                        ref={chartComponentRef}
                                        containerProps={{ style: { width: '100%', minWidth: '300px' } }}
                                    />
                                </div>
                            <div className="w-full flex items-center bg-white/5 rounded-xl border border-white/10 overflow-hidden" style={{ display: viewMode === 'bar' ? 'block' : 'none' }}>
                                    <HighchartsReact
                                        highcharts={Highcharts}
                                        options={barOptions}
                                    ref={barChartRef}
                                        containerProps={{ style: { width: '100%', minWidth: '300px' } }}
                                    />
                                </div>
                            {/* Pie Chart for Provider Distribution (Solana only) */}
                            {network === 'solana' && providerCounts.length > 0 && (
                                <div className="w-full flex items-center bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                                    <HighchartsReact
                                        highcharts={Highcharts}
                                        options={{
                                            ...pieOptions,
                                            plotOptions: {
                                                ...pieOptions.plotOptions,
                                                pie: {
                                                    ...(pieOptions.plotOptions?.pie || {}),
                                                    animation: {
                                                        duration: 2000, // Slower animation (default is 1000)
                                                        easing: 'easeOutBounce'
                                                    }
                                                }
                                            }
                                        }}
                                        ref={pieChartRef}
                                        containerProps={{ style: { width: '100%', height: '300px' } }}
                                    />
                                </div>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col md:flex-row gap-5 items-stretch md:items-start md:px-12 pb-8 pt-0">
                        {/* Metrics */}
                        <div className="flex-1 bg-white/5 rounded-xl border border-white/10 p-6 min-w-[220px]">
                            <div className="text-xl font-bold mb-2 text-white">Metrics</div>
                            <div className="text-gray-300 text-base space-y-1">
                                <div>Total Nodes: <span className="font-mono">{results ? results.total_nodes : points.length}</span></div>
                                <div>Gini Coefficient: <span className="font-mono">{results ? results.gini.toFixed(3) : "-"}</span></div>
                                <div>Nakamoto Coefficient: <span className="font-mono">{results ? results.nakamoto : "-"}</span></div>
                                <div>Connectivity Loss: <span className="font-mono">{results ? results.connectivityLoss : "-"}</span></div>
                                <div>Countries Represented{results ? " (Remaining)" : ""}: <span className="font-mono">{results ? remainingCountries : countryCounts.length}</span></div>
                                <div>Nodes via TOR: <span className="font-mono">{torCount}</span></div>
                                <div>Failed Nodes: <span className="font-mono">{results ? results.failed_nodes : "-"}</span></div>
                            </div>
                        </div>
                        {/* Optimization Suggestion */}
                        <div className="flex-1 bg-white/5 rounded-xl border border-white/10 p-6 min-w-[220px]">
                            <div className="text-xl font-bold mb-2 text-white">Optimization Suggestion</div>
                            <div className="text-gray-300 text-base">
                                {suggestions.length > 0 ? suggestions.map((s, i) => <p key={i}>{s}</p>) : (results ? results.suggestion : "Run an analysis to get suggestions.")}
                            </div>
                            <button
                            onClick={() => generateAnalysisPDF({
                                analysisName,
                                network,
                                results,
                                suggestions,
                                points,
                                countryCounts,
                                torCount,
                                mapChartRef: chartComponentRef,
                                barChartRef: barChartRef,
                                pieChartRef: network === 'solana' ? pieChartRef : undefined,
                            })}
                            disabled={!results || analyzing || optimizing || saving}
                            className="bg-purple-600 text-white my-2 py-2 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Download PDF Report
                        </button>
                        </div>
                        
                    </CardFooter>
                </Card>
            </main>
        </>
    );
}