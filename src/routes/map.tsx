import { useState, useMemo, useEffect } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { PageShell } from "@/components/page-shell"; // Hapus PageHeader, kita pakai custom section
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { 
  Maximize2, Loader2, ArrowRight, X, User, MapPin, 
  FileText, Home, FolderOpen, Folder 
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getDistricts, getRtlhRows, RtlhData, DistrictData } from "@/lib/api";

export const Route = createFileRoute("/map")({
  head: () => ({ meta: [{ title: "Peta RTLH · SIM-RTLH · NTT" }] }),
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const isAuthenticated = sessionStorage.getItem("auth_token") || localStorage.getItem("auth_token");
      if (!isAuthenticated) {
        throw redirect({ to: "/login" });
      }
    }
  },
  component: MapPage,
  ssr: false, 
});

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

  const userKab = typeof window !== "undefined" ? (sessionStorage.getItem("user_kabupaten") || localStorage.getItem("user_kabupaten") || "") : "";
  const isProvinsi = userKab.toLowerCase() === "provinsi" || userKab.toLowerCase() === "admin";
  
  // Format nama kabupaten untuk tampilan dropdown agar lebih rapi
  const displayUserKab = userKab ? userKab.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : "Kabupaten Anda";

  const { data: districts = [] } = useQuery<DistrictData[]>({ queryKey: ["districtsData"], queryFn: getDistricts });
  const { data: rows = [], isLoading: isRowsLoading } = useQuery<RtlhData[]>({ queryKey: ["rtlhRows"], queryFn: getRtlhRows });

  const activeRows = Array.isArray(rows) ? rows : [];

  const filteredRows = useMemo(() => {
    return activeRows.filter((r) => {
      const rowKab = String(r.kabupaten || "").toLowerCase();
      
      // PERBAIKAN 1: Gunakan .includes() agar "Kota Kupang" bisa cocok dengan data login "Kupang"
      const matchKec = isProvinsi 
        ? (kec === "all" || rowKab.includes(kec.toLowerCase()))
        : (rowKab.includes(userKab.toLowerCase()));

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
      {/* PERBAIKAN 2: Desain Header diperbarui agar sejajar dengan desain web dan tidak tertutup Navbar */}
      <section className="relative w-full bg-[#072456] pb-24 pt-16 lg:pt-20 lg:pb-32">
        <div className="absolute inset-0 bg-gradient-to-r from-[#031433] via-transparent to-[#0a3275] opacity-50" />
        <div className="relative mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
          <div className="mb-5 inline-flex items-center rounded-full border border-[#f5b027]/30 bg-[#f5b027]/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#f5b027]">PETA SEBARAN</div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">Peta RTLH Interaktif</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-blue-100 opacity-90">Visualisasi geografis sebaran rumah tidak layak huni dengan indikator warna kondisi secara real-time.</p>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-16 max-w-[1600px] px-4 pb-16 lg:px-8">
        {/* Kontrol Filter */}
        <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          {/* PERBAIKAN 3: Berikan min-w-[220px] agar dropdown tidak menyusut/rusak */}
          <select
            value={isProvinsi ? kec : userKab}
            onChange={(e) => setKec(e.target.value)}
            disabled={!isProvinsi}
            className={`h-11 min-w-[220px] rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-blue-500 focus:outline-none ${!isProvinsi ? 'cursor-not-allowed bg-slate-50 text-slate-500 font-semibold' : 'text-slate-800'}`}
          >
            {isProvinsi ? (
              <>
                <option value="all">Semua Kabupaten</option>
                {Array.isArray(districts) && districts.map((d) => (
                  <option key={d.name} value={d.name}>{d.name}</option>
                ))}
              </>
            ) : (
              <option value={userKab}>{displayUserKab}</option>
            )}
          </select>

          <div className="flex items-center gap-4 text-xs font-medium text-slate-600 bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-100">
            <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#16a34a] shadow-sm" /> Ringan</span>
            <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#f59e0b] shadow-sm" /> Sedang</span>
            <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#dc2626] shadow-sm" /> Berat</span>
          </div>

          <div className="ml-auto text-sm text-slate-500 bg-blue-50 border border-blue-100 px-4 py-2.5 rounded-lg">
            Total titik valid: <span className="font-bold text-blue-700">{filteredRows.length}</span>
          </div>
        </div>

        {/* Peta */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 shadow-lg bg-slate-100">
          {isRowsLoading ? (
            <div className="flex h-[600px] w-full items-center justify-center flex-col gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
              <p className="text-sm font-medium text-slate-500">Memuat titik koordinat dari satelit...</p>
            </div>
          ) : (
            <MapContainer center={[-10.17, 123.6]} zoom={8} style={{ height: 600, width: "100%", zIndex: 0 }}>
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
                      <div className="text-sm pb-1 min-w-[200px]">
                        <div className="font-bold text-slate-800 text-base mb-1">{nama}</div>
                        <div className="text-xs text-slate-500 leading-snug">{textAlamatPeta || "Alamat belum lengkap"}</div>
                        <div className="mt-3 bg-slate-50 p-2 rounded border border-slate-100 space-y-1.5">
                            <div className="text-xs flex justify-between">
                                <span className="text-slate-500">Kondisi:</span>
                                <b className="text-slate-800">{r.kerusakan || "-"}</b>
                            </div>
                            <div className="text-xs flex justify-between">
                                <span className="text-slate-500">Status:</span>
                                <span><b className="capitalize text-slate-800">{r.status || "Menunggu"}</b> ({r.progress || 0}%)</span>
                            </div>
                        </div>
                        <div className="mt-3">
                          <button onClick={() => setDetail(r)} className="w-full justify-center inline-flex items-center gap-1.5 rounded-lg bg-blue-50 py-2 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-100">
                            Lihat detail penuh <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          )}

          <div className="pointer-events-none absolute right-4 top-4 z-[999] inline-flex items-center gap-1.5 rounded-lg bg-slate-900/90 px-3 py-1.5 text-xs font-bold tracking-wide text-white backdrop-blur shadow-lg">
            <Maximize2 className="h-3.5 w-3.5 text-blue-400" /> GIS · Real-time
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-y-auto" onClick={() => setDetail(null)}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl my-auto overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between bg-[#072456] px-6 py-4 text-white">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#f5b027] font-bold">Data Masuk: {detail.timestamp ? String(detail.timestamp).split("T")[0] : "-"}</div>
            <div className="text-xl mt-0.5 font-extrabold">{detail.nama || "Tanpa Nama"}</div>
          </div>
          <button onClick={() => setDetail(null)} className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors"><X className="h-4 w-4" /></button>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2 mt-2">
          <Info icon={User} label="NIK" value={detail.nik || "Tidak tersedia"} />
          <Info icon={MapPin} label="Alamat Lengkap" value={finalAlamat || "Data tidak lengkap"} />
          <Info icon={MapPin} label="Lokasi" value={finalLokasi || "Data tidak lengkap"} />
          <Info icon={Home} label="Kondisi" value={detail.kerusakan || "-"} />
          <Info icon={FileText} label="Status" value={detail.status || "Menunggu"} />
          <Info icon={FileText} label="Progres" value={`${detail.progress || 0}%`} />
        </div>

        <div className="bg-slate-50 px-6 py-5 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-4"><FolderOpen className="h-4 w-4 text-blue-500" /> Folder Dokumentasi Progres</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <ProgressFolderButton progress="25" url={detail.progres25} />
            <ProgressFolderButton progress="50" url={detail.progres50} />
            <ProgressFolderButton progress="75" url={detail.progres75} />
            <ProgressFolderButton progress="100" url={detail.progres100} />
          </div>
        </div>

        <div className="border-t border-slate-100 bg-white px-6 py-4 flex flex-wrap justify-between items-center gap-4">
          {detail.linkDrive && String(detail.linkDrive).trim() !== "-" ? (
            <a href={detail.linkDrive} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline">
              <FolderOpen className="h-4 w-4" /> Buka Folder Induk Drive
            </a>
          ) : <div/>}
          <button onClick={() => setDetail(null)} className="rounded-lg bg-[#072456] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#0a3275] transition-colors shadow-sm ml-auto">Tutup Detail</button>
        </div>
      </div>
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5"><Icon className="h-3.5 w-3.5 text-blue-500" /> {label}</div>
      <div className="text-sm font-bold text-slate-800">{value}</div>
    </div>
  );
}

function ProgressFolderButton({ progress, url }: { progress: string, url?: string }) {
  const isUrlValid = url && String(url).trim() !== "" && String(url).trim() !== "-";
  if (!isUrlValid) return <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-3 px-2 text-center text-xs text-slate-400 opacity-60 cursor-not-allowed"><Folder className="h-5 w-5 opacity-50" /><span className="font-bold">Tahap {progress}%</span></div>;
  return (
    <a href={String(url)} target="_blank" rel="noreferrer" className="group flex flex-col items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 py-3 px-2 text-center text-xs font-bold text-blue-700 hover:bg-blue-600 hover:border-blue-600 hover:text-white transition-all shadow-sm">
      <FolderOpen className="h-5 w-5 group-hover:scale-110 transition-transform" />
      <span>Tahap {progress}%</span>
    </a>
  );
}