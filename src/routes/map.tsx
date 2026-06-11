import { useState, useMemo, useEffect } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/page-shell";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { 
  Maximize2, Loader2, ArrowRight, X, User, MapPin, 
  FileText, Home, FolderOpen, Folder 
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

// Impor fungsi dan interface langsung dari file index.ts API Anda
import { getDistricts, getRtlhRows, RtlhData, DistrictData } from "@/lib/api";

// Definisi Rute
export const Route = createFileRoute("/map")({
  head: () => ({ meta: [{ title: "Peta RTLH · SIM-RTLH · NTT" }] }),
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      // UBAH DI SINI: Cek kedua tempat penyimpanan (sessionStorage & localStorage)
      const isAuthenticated = sessionStorage.getItem("auth_token") || localStorage.getItem("auth_token");
      if (!isAuthenticated) {
        throw redirect({ to: "/login" });
      }
    }
  },
  component: MapPage,
  ssr: false, 
});

// Komponen Auto-Zoom untuk Peta
function MapBoundsUpdater({ rows }: { rows: RtlhData[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (rows.length === 0) return;
    
    const validCoords = rows
      .filter((r) => r.lat !== 0 && r.lng !== 0 && !isNaN(r.lat) && !isNaN(r.lng))
      .map((r) => [r.lat, r.lng] as [number, number]);

    if (validCoords.length > 0) {
      const bounds = L.latLngBounds(validCoords);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14, animate: true });
    }
  }, [rows, map]);

  return null;
}

function MapPage() {
  const [kec, setKec] = useState("all");
  const [detail, setDetail] = useState<RtlhData | null>(null);

  // Ambil data user dari localStorage
  const userKab = typeof window !== "undefined" ? (localStorage.getItem("user_kabupaten") || "") : "";
  const isProvinsi = userKab.toLowerCase() === "provinsi" || userKab.toLowerCase() === "admin";

  const { data: districts = [] } = useQuery<DistrictData[]>({ queryKey: ["districtsData"], queryFn: getDistricts });
  const { data: rows = [], isLoading: isRowsLoading } = useQuery<RtlhData[]>({ queryKey: ["rtlhRows"], queryFn: getRtlhRows });

  const activeRows = Array.isArray(rows) ? rows : [];

  // Filter Data dengan Logika Akses (Kunci per Kabupaten)
  const filteredRows = useMemo(() => {
    return activeRows.filter((r) => {
      const rowKab = String(r.kabupaten || "").toLowerCase();
      
      // Jika provinsi: bisa filter 'all' atau pilih kecamatan.
      // Jika kabupaten: kunci secara paksa ke userKab.
      const matchKec = isProvinsi 
        ? (kec === "all" || rowKab === kec.toLowerCase())
        : (rowKab === userKab.toLowerCase());

      const isValidCoords = r.lat !== 0 && r.lng !== 0 && !isNaN(r.lat) && !isNaN(r.lng);

      return matchKec && isValidCoords;
    });
  }, [activeRows, kec, isProvinsi, userKab]);

  const getColor = (kondisi?: string) => {
    const k = String(kondisi).toLowerCase();
    if (k.includes("berat")) return "#dc2626";
    if (k.includes("sedang")) return "#f59e0b";
    return "#16a34a";
  };

  return (
    <PageShell>
      <PageHeader
        eyebrow="Peta Sebaran"
        title="Peta RTLH Interaktif"
        description="Visualisasi geografis sebaran rumah tidak layak huni dengan indikator warna kondisi."
      />

      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        {/* Kontrol Filter */}
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
          <select
            value={isProvinsi ? kec : userKab}
            onChange={(e) => setKec(e.target.value)}
            disabled={!isProvinsi}
            className={`h-10 rounded-xl border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary ${!isProvinsi ? 'cursor-not-allowed opacity-70' : ''}`}
          >
            {isProvinsi ? (
              <>
                <option value="all">Semua Kabupaten</option>
                {Array.isArray(districts) && districts.map((d) => (
                  <option key={d.name} value={d.name}>{d.name}</option>
                ))}
              </>
            ) : (
              <option value={userKab}>{userKab}</option>
            )}
          </select>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-success" /> Ringan</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-warning" /> Sedang</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-destructive" /> Berat</span>
          </div>

          <div className="ml-auto text-xs text-muted-foreground">
            Total titik valid: <span className="font-semibold text-primary-deep">{filteredRows.length}</span>
          </div>
        </div>

        {/* Peta */}
        <div className="relative overflow-hidden rounded-2xl border border-border shadow-soft bg-muted/20">
          {isRowsLoading ? (
            <div className="flex h-[560px] w-full items-center justify-center flex-col gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Memuat titik koordinat dari API...</p>
            </div>
          ) : (
            <MapContainer center={[-10.17, 123.6]} zoom={8} style={{ height: 560, width: "100%", zIndex: 0 }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
              
              <MapBoundsUpdater rows={filteredRows} />

              {filteredRows.map((r) => {
                const nama = r.nama || "-";
                const kel = r.kelurahan || "";
                const almt = r.alamat || "";
                const textAlamatPeta = [almt, kel].filter(x => x && x !== "-").join(", ");

                return (
                  <CircleMarker
                    key={r.id || `${r.lat}-${r.lng}`}
                    center={[r.lat, r.lng]}
                    radius={8}
                    pathOptions={{
                      color: getColor(r.kerusakan),
                      fillColor: getColor(r.kerusakan),
                      fillOpacity: 0.7
                    }}
                    eventHandlers={{
                      mouseover: (e) => e.target.setStyle({ fillOpacity: 1, radius: 10 }),
                      mouseout: (e) => e.target.setStyle({ fillOpacity: 0.7, radius: 8 })
                    }}
                  >
                    <Popup>
                      <div className="text-sm pb-1">
                        <div className="font-bold text-primary-deep">{nama}</div>
                        <div className="text-xs text-muted-foreground">{textAlamatPeta || "Alamat belum lengkap"}</div>
                        <div className="mt-2 text-xs">Kondisi: <b>{r.kerusakan || "-"}</b></div>
                        <div className="text-xs mb-2">Status: <b className="capitalize">{r.status || "Menunggu"}</b> ({r.progress || 0}%)</div>
                        <div className="mt-2 border-t border-border/50 pt-2">
                          <button onClick={() => setDetail(r)} className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary-deep hover:underline">
                            Lihat detail <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          )}

          <div className="pointer-events-none absolute right-4 top-4 z-[999] inline-flex items-center gap-1.5 rounded-full bg-primary-deep/80 px-3 py-1 text-xs font-semibold text-primary-foreground backdrop-blur">
            <Maximize2 className="h-3 w-3" /> GIS · Real-time
          </div>
        </div>
      </div>

      {detail && <RenderDetailModal detail={detail} setDetail={setDetail} />}
    </PageShell>
  );
}

function RenderDetailModal({ detail, setDetail }: { detail: RtlhData, setDetail: React.Dispatch<React.SetStateAction<RtlhData | null>> }) {
  const finalAlamat = [detail.alamat, detail.rt ? `RT ${detail.rt}` : "", detail.rw ? `RW ${detail.rw}` : ""].filter(Boolean).join(", ");
  const finalLokasi = [detail.kelurahan, detail.kecamatan, detail.kabupaten].filter(Boolean).join(", ");

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-primary-deep/60 p-4 backdrop-blur-sm overflow-y-auto" onClick={() => setDetail(null)}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl my-auto overflow-hidden rounded-2xl border border-border bg-card shadow-elevated animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between bg-gradient-hero px-6 py-4 text-primary-foreground">
          <div>
            <div className="text-xs uppercase tracking-widest text-accent-gold">Data Masuk: {detail.timestamp ? String(detail.timestamp).split("T")[0] : "-"}</div>
            <div className="text-lg font-bold">{detail.nama || "Tanpa Nama"}</div>
          </div>
          <button onClick={() => setDetail(null)} className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 hover:bg-white/20"><X className="h-4 w-4" /></button>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2 mt-2">
          <Info icon={User} label="NIK" value={detail.nik || "Tidak tersedia"} />
          <Info icon={MapPin} label="Alamat Lengkap" value={finalAlamat || "Data tidak lengkap"} />
          <Info icon={MapPin} label="Lokasi" value={finalLokasi || "Data tidak lengkap"} />
          <Info icon={Home} label="Kondisi" value={detail.kerusakan || "-"} />
          <Info icon={FileText} label="Status" value={detail.status || "Menunggu"} />
          <Info icon={FileText} label="Progres" value={`${detail.progress || 0}%`} />
        </div>

        <div className="bg-muted/30 px-6 py-5 border-t border-border">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4"><FolderOpen className="h-4 w-4" /> Folder Progres</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <ProgressFolderButton progress="25" url={detail.progres25} />
            <ProgressFolderButton progress="50" url={detail.progres50} />
            <ProgressFolderButton progress="75" url={detail.progres75} />
            <ProgressFolderButton progress="100" url={detail.progres100} />
          </div>
        </div>

        <div className="border-t border-border bg-muted/50 px-6 py-3 flex justify-between items-center">
          {detail.linkDrive && String(detail.linkDrive).trim() !== "-" ? (
            <a href={detail.linkDrive} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary-deep hover:underline">
              <FolderOpen className="h-4 w-4" /> Buka Folder Drive Foto
            </a>
          ) : <div/>}
          <button onClick={() => setDetail(null)} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Tutup</button>
        </div>
      </div>
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {label}</div>
      <div className="mt-1 text-sm font-semibold text-primary-deep">{value}</div>
    </div>
  );
}

function ProgressFolderButton({ progress, url }: { progress: string, url?: string }) {
  const isUrlValid = url && String(url).trim() !== "" && String(url).trim() !== "-";
  if (!isUrlValid) return <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-background/40 py-3 px-2 text-center text-xs text-muted-foreground opacity-60 cursor-not-allowed"><Folder className="h-5 w-5 opacity-50" /><span className="font-medium">Tahap {progress}%</span></div>;
  return (
    <a href={String(url)} target="_blank" rel="noreferrer" className="group flex flex-col items-center justify-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 py-3 px-2 text-center text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground shadow-sm">
      <FolderOpen className="h-5 w-5 group-hover:scale-110 transition-transform" />
      <span>Tahap {progress}%</span>
    </a>
  );
}