import { countryNameToCode } from "@/lib/countryNameToCode";
import type { NodePoint, CountryCount } from "./parseEthereum";

export function parseBitcoinDump(raw: string): { points: NodePoint[]; counts: CountryCount[]; tor: number } {
  const trim = raw.trim();
  const points: NodePoint[] = [];
  const perCountry: Record<string, number> = {};
  let torCount = 0;

  const add = (c?: string) => {
    if (!c) return;
    const raw = c.trim();
    let code: string | undefined;
    if (raw.length === 2) {
      code = raw.toLowerCase();
    } else {
      code = countryNameToCode[raw.toLowerCase()] ?? undefined;
    }
    if (code) perCountry[code] = (perCountry[code] || 0) + 1;
  };

  const push = (p: NodePoint) => {
    if (!isNaN(p.lat) && !isNaN(p.lon) && !(p.lat === 0 && p.lon === 0)) {
      points.push(p);
    }
  };
  const strip = (s: string) => s.replace(/^"|"$/g, "");

  const parseCSV = (csv: string) => {
    const lines = csv.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return;
    const header = lines[0].split(/,|;|\t/).map(h => strip(h.trim()).toLowerCase());
    const latIdx = header.findIndex(h => h === "lat" || h === "latitude");
    const lonIdx = header.findIndex(h => h === "lon" || h === "longitude" || h === "lng");
    const ccIdx = header.findIndex(h => h === "country" || h === "cc" || h === "country_code");
    const addrIdx = header.indexOf("address");
    const asnIdx = header.indexOf("asn");
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(/,|;|\t/).map(strip);
      const countryRaw = ccIdx !== -1 ? parts[ccIdx] : undefined;
      add(countryRaw);

      // TOR detection -----------------------------------------------------------------
      const addressStr = addrIdx !== -1 ? parts[addrIdx] : "";
      const asnStr = asnIdx !== -1 ? parts[asnIdx] : "";
      const isTorAddress = typeof addressStr === "string" && addressStr.toLowerCase().includes(".onion");
      const isTorAsn = typeof asnStr === "string" && asnStr.trim().toUpperCase() === "TOR";
      const isTorCountry = typeof countryRaw === "string" && countryRaw.trim().toUpperCase() === "TOR";
      if (isTorAddress || isTorAsn || isTorCountry) torCount++;
      if (latIdx !== -1 && lonIdx !== -1) {
        const lat = parseFloat(parts[latIdx]);
        const lon = parseFloat(parts[lonIdx]);
        if (!isNaN(lat) && !isNaN(lon)) push({ lat, lon, country: countryRaw, name: `Node ${i}` });
      }
    }
  };

  try {
    if (trim.startsWith("[")) {
      const arr = JSON.parse(trim);
      if (Array.isArray(arr)) {
        arr.forEach((it: any, idx: number) => {
          const countryRaw = it.country ?? it.cc;
          add(countryRaw);
          if (typeof countryRaw === "string" && countryRaw.toUpperCase() === "TOR") torCount++;
          const lat = parseFloat(it.lat ?? it.latitude);
          const lon = parseFloat(it.lon ?? it.longitude);
          if (!isNaN(lat) && !isNaN(lon)) push({ lat, lon, country: countryRaw, name: it.name ?? `Node ${idx+1}` });
        });
      }
    } else if (trim.startsWith("{")) {
      const obj = JSON.parse(trim);
      if (obj && typeof obj === "object" && obj.nodes && typeof obj.nodes === "object") {
        Object.entries(obj.nodes).forEach(([address, arr]: [string, any], idx: number) => {
          if (!Array.isArray(arr)) return;
          // In the Bitnodes schema country_code is usually at index 7, but TOR nodes often
          // have it blank and instead store the literal "TOR" at index 11. We examine both.
          const countryRaw = arr[7] ?? arr[11];
          const lat = parseFloat(arr[8]);
          const lon = parseFloat(arr[9]);

          // Keep country tally (even if undefined)
          add(countryRaw);

          // TOR detection for JSON -----------------------------------------------
          const isTorAddress  = typeof address === "string" && address.toLowerCase().includes(".onion");
          const isTorCountry  = typeof countryRaw === "string" && countryRaw.trim().toUpperCase() === "TOR";
          const isTorAltField = typeof arr[11] === "string" && arr[11].trim().toUpperCase() === "TOR";
          if (isTorAddress || isTorCountry || isTorAltField) torCount++;

          if (!isNaN(lat) && !isNaN(lon)) {
            push({ lat, lon, country: countryRaw, name: `Node ${idx + 1}` });
          }
        });
      } else {
        parseCSV(trim);
      }
    } else {
      parseCSV(trim);
    }
  } catch (e) { console.error("Bitcoin dump parse error", e); }

  return {
    points,
    counts: Object.entries(perCountry).map(([code, value]) => ({ code, value })),
    tor: torCount,
  };
}