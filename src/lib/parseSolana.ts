import { countryNameToCode } from "@/lib/countryNameToCode";

interface NodePoint { name?: string; lat: number; lon: number; country?: string; stake?: number; provider?: string; }
interface CountryCount { code: string; value: number; }

export function parseSolanaDump(raw: string): { points: NodePoint[]; counts: CountryCount[]; tor: number } {
  const points: NodePoint[] = [];
  const perCountry: Record<string, number> = {};
  let torCount = 0;

  const lines = raw.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { points, counts: [], tor: 0 };

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',').map(p => p.trim());
    if (parts.length < 20) continue;

    const countryRaw = parts[3];
    const countryCode = countryRaw.length === 2 ? countryRaw.toLowerCase() : countryNameToCode[countryRaw.toLowerCase()] ?? countryRaw.toLowerCase();

    if (countryCode) perCountry[countryCode] = (perCountry[countryCode] || 0) + 1;

    if (countryRaw.trim().toUpperCase() === 'TOR') torCount++;

    const loc = parts[4];
    const locParts = loc.split(/\s+/);
    const lat = parseFloat(locParts[0]) || NaN;
    const lon = parseFloat(locParts[1]) || NaN;

    const name = parts[8] || `Validator ${i}`;
    const provider = parts[5];
    points.push({ name, lat, lon, country: countryCode, stake: parseInt(parts[13]) || 0, provider });
  }

  const counts = Object.entries(perCountry).map(([code, value]) => ({ code, value }));

  return { points, counts, tor: torCount };
}
