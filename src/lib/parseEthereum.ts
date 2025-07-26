import { countryNameToCode } from "@/lib/countryNameToCode";

export interface NodePoint { name?: string; lat: number; lon: number; country?: string }
export interface CountryCount { code: string; value: number }

/**
 * Parse the public Ethereum node dump (CSV or JSON) used in Nodelyzer.
 * Returns both mappoint nodes (when lat/lon exist) and aggregated per-country counts.
 */
export function parseEthereumDump(raw: string): { points: NodePoint[]; counts: CountryCount[] } {
  const trim = raw.trim();
  const points: NodePoint[] = [];
  const perCountry: Record<string, number> = {};

  const addCountry = (c?: string) => {
    const code = countryNameToCode[c?.toLowerCase?.() ?? ""];
    if (code) perCountry[code] = (perCountry[code] || 0) + 1;
  };

  const pushPoint = (p: NodePoint) => {
    points.push(p);
  };

  const strip = (s: string) => s.replace(/^"|"$/g, "");

  const parseCSV = (csv: string) => {
    const lines = csv.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return;
    const header = lines[0].split(/,|;|\t/).map(h => strip(h.trim()).toLowerCase());
    const latIdx = header.findIndex(h => h === "lat" || h === "latitude");
    const lonIdx = header.findIndex(h => h === "lon" || h === "longitude" || h === "lng");
    const countryIdx = header.indexOf("country");
    const nameIdx = header.findIndex(h => h === "name" || h === "node id");
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(/,|;|\t/).map(strip);
      const countryRaw = countryIdx !== -1 ? parts[countryIdx] : undefined;
      addCountry(countryRaw);
      const lat = latIdx !== -1 ? parseFloat(parts[latIdx]) : NaN;
      const lon = lonIdx !== -1 ? parseFloat(parts[lonIdx]) : NaN;
      const name = nameIdx !== -1 ? parts[nameIdx] : `Node ${i}`;
      const code = countryNameToCode[countryRaw?.toLowerCase() ?? ""];
      pushPoint({
        lat,
        lon,
        name,
        country: code ?? countryRaw?.toLowerCase(),
      });
    }
  };

  try {
    if (trim.startsWith("[")) {
      const arr = JSON.parse(trim);
      if (Array.isArray(arr)) {
        arr.forEach((item: any, idx: number) => {
          const countryRaw = item.country ?? item.Country;
          addCountry(typeof countryRaw === "string" ? countryRaw : undefined);
          const lat = parseFloat(item.lat ?? item.latitude);
          const lon = parseFloat(item.lon ?? item.longitude);
          const code = countryNameToCode[(countryRaw ?? "").toLowerCase()];
          pushPoint({
            lat,
            lon,
            name: item.name ?? item["Node Id"] ?? `Node ${idx + 1}`,
            country: code ?? (typeof countryRaw === "string" ? countryRaw.toLowerCase() : undefined),
          });
        });
      }
    } else {
      parseCSV(trim);
    }
  } catch (e) {
    console.error("Ethereum dump parse error", e);
  }

  return {
    points,
    counts: Object.entries(perCountry).map(([code, value]) => ({ code, value })),
  };
} 