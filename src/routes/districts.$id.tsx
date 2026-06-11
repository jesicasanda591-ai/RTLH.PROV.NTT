import { useMemo } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/page-shell";
import { StatCard } from "@/components/stat-card";
import { Home, CheckCircle2, Clock, MapPin, ArrowLeft, Loader2 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { getDistricts, getBnbaData } from "@/lib/api"; 

export const Route = createFileRoute("/districts/$id")({
  head: () => ({ meta: [{ title: `Detail Wilayah · SIM-RTLH · NTT` }] }),
  beforeLoad: () => {
    // Pengamanan SSR & Proteksi Halaman Internal
    if (typeof window !== "undefined") {
      // UBAH DI SINI: Cek kedua brankas
      const isAuthenticated = sessionStorage.getItem("auth_token") || localStorage.getItem("auth_token");
      if (!isAuthenticated) {
        throw redirect({ to: "/login" });
      }
    }
  },
  component: DistrictDetail,
});

function DistrictDetail() {
  const { id } = Route.useParams();

  const { data: fetchedDistricts, isLoading: isLoadingDistricts } = useQuery({
    queryKey: ["districtsData"],
    queryFn: getDistricts,
  });

  const { data: fetchedRows, isLoading: isLoadingRows } = useQuery({
    queryKey: ["bnbaData"],
    queryFn: getBnbaData,
  });

  const activeDistricts = Array.isArray(fetchedDistricts) ? fetchedDistricts : [];
  const activeRows = Array.isArray(fetchedRows) ? fetchedRows : [];

  // 1. Optimasi pencarian data kabupaten & kalkulasi progres dinamis
  const d = useMemo(() => {
    const found = activeDistricts.find((x: any) => {
      const urlId = String(id).toLowerCase();
      const dataName = String(x.name).toLowerCase();
      return dataName === urlId || dataName.replace(/\s+/g, '-') === urlId;
    });

    if (found) {
      // Hitung persentase real-time karena backend spreadsheet tidak mengirim field progress
      const calculatedProgress = found.total > 0 ? Math.round((found.assisted / found.total) * 100) : 0;
      return { ...found, progress: calculatedProgress };
    }

    return {
      id: id,
      name: String(id).replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), 
      total: 0, 
      assisted: 0, 
      verifying: 0, 
      progress: 0
    };
  }, [activeDistricts, id]);

  // 2. Filter baris BNBA yang spesifik untuk kabupaten ini
  const rows = useMemo(() => {
    return activeRows.filter((r: any) => {
      if (!r.kabupaten) return false;
      const cleanKabupaten = r.kabupaten.toLowerCase().replace(/kab\.|kabupaten|kab /g, "").trim();
      const cleanURLName = d.name.toLowerCase().replace(/kab\.|kabupaten|kab /g, "").trim();
      return cleanKabupaten.includes(cleanURLName) || cleanURLName.includes(cleanKabupaten);
    });
  }, [activeRows, d.name]);

  // 3. Olah data grafik sebaran per Kelurahan / Desa
  const sub = useMemo(() => {
    const kelurahanMap: Record<string, { name: string; total: number; terbantu: number }> = {};
    
    rows.forEach((r: any) => {
      const kel = r.kelurahan || r.desa || "Lainnya";
      if (!kelurahanMap[kel]) kelurahanMap[kel] = { name: kel, total: 0, terbantu: 0 };
      
      kelurahanMap[kel].total += 1;
      // Sinkronisasi status selesai dari baris data BNBA backend
      if (r.status?.toLowerCase() === "selesai" || r.status?.toLowerCase() === "terbantu") {
        kelurahanMap[kel].terbantu += 1;
      }
    });
    
    // Konversi object ke array dan sort dengan aman (Object.values membuat array baru)
    return Object.values(kelurahanMap).sort((a, b) => b.total - a.total).slice(0, 10);
  }, [rows]);

  // 4. Proses matriks warna Heatmap berdasarkan tingkat kerusakan rumah
  const heatmapColors = useMemo(() => {
    if (isLoadingRows || rows.length === 0) {
      return Array(64).fill("bg-muted/30"); // State fallback saat loading atau kosong
    }

    const totalRows = rows.length;
    // Menyesuaikan penamaan nilai tingkat kerusakan dari form/spreadsheet backend
    const countBerat = rows.filter((r: any) => r.kerusakan?.toLowerCase() === "rusak berat").length;
    const countSedang = rows.filter((r: any) => r.kerusakan?.toLowerCase() === "rusak sedang").length;
    
    const squaresBerat = Math.round((countBerat / totalRows) * 64);
    const squaresSedang = Math.round((countSedang / totalRows) * 64);
    const squaresRingan = 64 - squaresBerat - squaresSedang;

    const colors = [
      ...Array(Math.max(0, squaresRingan)).fill("bg-success/70"),
      ...Array(Math.max(0, squaresSedang)).fill("bg-warning/70"),
      ...Array(Math.max(0, squaresBerat)).fill("bg-destructive/70")
    ];

    // Potong agar panjang array selalu tepat 64 kotak
    return colors.slice(0, 64);
  }, [rows, isLoadingRows]);

  if (isLoadingDistricts) {
    return (
      <PageShell>
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Sinkronisasi pangkalan data wilayah...</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader 
        eyebrow="Kabupaten / Kota" 
        title={`Wilayah ${d.name}`} 
        description="Statistik akumulasi, tingkat keparahan kerusakan, dan pemantauan real-time progres pemulihan RTLH."
      >
        <Link 
          to="/dashboard" 
          className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-4 py-2 text-sm font-semibold backdrop-blur transition-colors hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Dashboard
        </Link>
      </PageHeader>

      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        {/* STATS GRID */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Home} label="Total RTLH" value={(d.total || 0).toLocaleString("id-ID")} tone="info" />
          <StatCard icon={CheckCircle2} label="Terbantu" value={(d.assisted || 0).toLocaleString("id-ID")} tone="success" />
          <StatCard icon={Clock} label="Masa Verifikasi" value={(d.verifying || 0).toLocaleString("id-ID")} tone="warning" />
          <StatCard icon={MapPin} label="Capaian Progres" value={`${d.progress || 0}%`} tone="gold" />
        </div>

        {/* CHARTS GRAPH SECTION */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-soft lg:col-span-2">
            <div>
              <h3 className="text-base font-bold text-foreground">Top 10 Sebaran Desa / Kelurahan</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Perbandingan jumlah target akumulasi dan kasus yang telah terselesaikan.</p>
            </div>
            
            <div className="mt-6 h-72 w-full">
              {isLoadingRows ? (
                <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" /> Mengurai data spasial...
                </div>
              ) : sub.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Tidak ada rekaman data taktis di kelurahan wilayah ini.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sub} margin={{ left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 6" stroke="oklch(0.92 0.01 250)" vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} style={{ fontSize: 11 }} angle={-20} textAnchor="end" />
                    <YAxis tickLine={false} axisLine={false} style={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: 12, background: "var(--background)", border: "1px solid border" }} />
                    <Bar dataKey="total" fill="oklch(0.28 0.13 263)" radius={[4, 4, 0, 0]} name="Total Target" />
                    <Bar dataKey="terbantu" fill="oklch(0.72 0.16 145)" radius={[4, 4, 0, 0]} name="Selesai Ditangani" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          
          {/* VISUAL HEATMAP */}
          <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div>
              <h3 className="text-base font-bold text-foreground">Matriks Densitas Kondisi</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Rasio proporsi tingkat kerusakan dari total seluruh rumah terdata di lapangan.</p>
            </div>

            <div className="my-auto py-4">
              {isLoadingRows ? (
                <div className="grid grid-cols-8 gap-1 animate-pulse">
                  {Array(64).fill(0).map((_, i) => (
                    <div key={i} className="aspect-square rounded bg-muted/40" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-8 gap-1">
                  {heatmapColors.map((tone, i) => (
                    <div key={i} className={`aspect-square rounded ${tone} transition-all duration-300`} style={{ opacity: 0.85 }} />
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-success/70" /> Ringan</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-warning/70" /> Sedang</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-destructive/70" /> Berat</span>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}