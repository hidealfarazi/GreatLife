/**
 * components/belajar/RadarSection.tsx
 * 03 Roadmap tech stack — GET /api/ai/radar (through lib/repo.ts), grouped by track.
 * "Perubahan minggu ini": pending AI proposals with Terapkan / Abaikan.
 * "Cek pembaruan" when stale (with loading state), then the sources as small links.
 * API unavailable -> local seed labelled "Roadmap awal (offline)".
 */
"use client";

import { useEffect, useState } from "react";
import { loadRadar, updateRadar, type RadarLoad } from "@/lib/repo";
import type { Confidence, RadarChange, RadarItem, RadarKind, RadarStatus, RadarTrack } from "@/lib/ai/types";
import { Button } from "@/components/ui/Button";
import { SectionHead } from "./SectionHead";

const TRACKS: { id: RadarTrack; label: string }[] = [
  { id: "web", label: "Web" },
  { id: "data", label: "Data" },
  { id: "ai", label: "AI" },
  { id: "mobile", label: "Mobile" },
  { id: "iot", label: "IoT" },
  { id: "game", label: "Game" },
];
const STATUS_LABEL: Record<RadarStatus, string> = {
  adopt: "Pelajari sekarang",
  trial: "Coba",
  assess: "Pantau",
  hold: "Tunda",
};
const KIND_LABEL: Record<RadarKind, string> = { language: "Bahasa", framework: "Framework", tool: "Alat", platform: "Platform" };
const CONF_LABEL: Record<Confidence, string> = { low: "rendah", medium: "sedang", high: "tinggi" };

function changeTitle(change: RadarChange, items: RadarItem[]): string {
  if (change.type === "new") return `Baru: ${change.item.name} (${STATUS_LABEL[change.item.status]})`;
  const item = items.find((i) => i.id === change.itemId);
  const from = item ? STATUS_LABEL[item.status] : "?";
  return `${item?.name ?? change.itemId}: ${from} → ${STATUS_LABEL[change.to]}`;
}

export function RadarSection() {
  const [data, setData] = useState<RadarLoad | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    loadRadar().then((d) => {
      if (alive) setData(d);
    });
    return () => {
      alive = false;
    };
  }, []);

  const run = async (key: string, action: "apply" | "dismiss" | "refresh", index?: number) => {
    setBusy(key);
    setNotice(null);
    const next = await updateRadar(action, index);
    setBusy(null);
    if (next) {
      setData(next);
      if (action === "refresh") {
        setNotice(next.radar.pending.length ? "Ada usulan baru untuk ditinjau." : "Belum ada perubahan penting minggu ini.");
      }
    } else {
      setNotice("Belum bisa terhubung ke AI. Coba lagi nanti.");
    }
  };

  const radar = data?.radar;

  return (
    <section aria-labelledby="sec-radar" aria-busy={!data}>
      <SectionHead
        id="sec-radar"
        number="03"
        title="Roadmap tech stack"
        meta={data?.offline ? "Roadmap awal (offline)" : undefined}
      />

      {!radar ? (
        <div aria-hidden="true" style={{ minHeight: "10rem" }} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {data.offline && (
            <p style={{ color: "var(--rn-muted)", fontSize: "1rem", lineHeight: 1.6 }}>
              AI belum tersedia, jadi ini titik awal yang tersimpan di aplikasi. Usulan mingguan muncul setelah AI aktif.
            </p>
          )}

          {TRACKS.map((track) => {
            const items = radar.items.filter((i) => i.track === track.id);
            if (items.length === 0) return null;
            return (
              <div key={track.id} role="group" aria-label={`Jalur ${track.label}`}>
                <h3 className="rn-label" style={{ marginBottom: "0.25rem" }}>{track.label}</h3>
                <ul style={{ listStyle: "none" }}>
                  {items.map((item) => (
                    <li key={item.id} style={{ padding: "0.875rem 0", borderBottom: "1px solid var(--rn-line)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "0.75rem", flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 700, fontSize: "1.0625rem" }}>
                          {item.name}
                          <span className="rn-label" style={{ marginLeft: "0.5rem", letterSpacing: "0.06em" }}>{KIND_LABEL[item.kind]}</span>
                        </span>
                        <span
                          className="rn-label"
                          style={{ color: item.status === "adopt" ? "var(--rn-accent)" : item.status === "trial" ? "var(--rn-text)" : "var(--rn-muted)", fontWeight: 700 }}
                        >
                          {STATUS_LABEL[item.status]}
                        </span>
                      </div>
                      <p style={{ color: "var(--rn-muted)", fontSize: "1rem", lineHeight: 1.5, marginTop: "0.25rem" }}>{item.why}</p>
                      <p className="rn-label" style={{ marginTop: "0.35rem", letterSpacing: "0.06em", textTransform: "none" }}>
                        Mulai: {item.startWhen}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          {!data.offline && (
            <div role="group" aria-labelledby="radar-changes">
              <h3 id="radar-changes" className="rn-label" style={{ color: "var(--rn-text)", fontWeight: 700, marginBottom: "0.5rem" }}>
                Perubahan minggu ini
              </h3>

              {radar.pending.length === 0 ? (
                <p style={{ color: "var(--rn-muted)", fontSize: "1rem" }}>Tidak ada usulan yang menunggu.</p>
              ) : (
                <ul style={{ listStyle: "none" }}>
                  {radar.pending.map((change, index) => (
                    <li key={`${index}-${change.reason}`} style={{ padding: "1rem 0", borderBottom: "1px solid var(--rn-line)" }}>
                      <p style={{ fontWeight: 700 }}>{changeTitle(change, radar.items)}</p>
                      <p style={{ color: "var(--rn-muted)", fontSize: "1rem", lineHeight: 1.5, marginTop: "0.25rem" }}>{change.reason}</p>
                      <p className="rn-label" style={{ marginTop: "0.35rem" }}>Keyakinan: {CONF_LABEL[change.confidence]}</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: "0.75rem" }}>
                        <Button variant="secondary" disabled={busy !== null} onClick={() => run(`apply-${index}`, "apply", index)}>
                          {busy === `apply-${index}` ? "Menerapkan…" : "Terapkan"}
                        </Button>
                        <Button variant="secondary" disabled={busy !== null} onClick={() => run(`dismiss-${index}`, "dismiss", index)}>
                          {busy === `dismiss-${index}` ? "Mengabaikan…" : "Abaikan"}
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {data.stale && (
                <div style={{ marginTop: "1rem" }}>
                  <Button variant="secondary" disabled={busy !== null} aria-busy={busy === "refresh"} onClick={() => run("refresh", "refresh")}>
                    {busy === "refresh" ? "Memeriksa…" : "Cek pembaruan"}
                  </Button>
                </div>
              )}

              {notice && (
                <p role="status" className="rn-label" style={{ marginTop: "0.75rem", textTransform: "none", letterSpacing: "0.04em" }}>
                  {notice}
                </p>
              )}

              {radar.sources.length > 0 && (
                <ul aria-label="Sumber" style={{ listStyle: "none", marginTop: "1rem", display: "flex", flexWrap: "wrap", gap: "0 1rem" }}>
                  {radar.sources.map((src) => (
                    <li key={src.url}>
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rn-label"
                        style={{ color: "var(--rn-accent)", textDecoration: "underline", textUnderlineOffset: 3, textTransform: "none", minHeight: 44, display: "inline-flex", alignItems: "center" }}
                      >
                        {src.title || src.url}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
