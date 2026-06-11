import { useMemo } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/page-shell";
import { MapPin, ArrowRight, Loader2, Database } from "lucide-react"; 
import { useQuery } from "@tanstack/react-query";
import { getDistricts } from "@/lib/api"; 

// Interface untuk memastikan tipe data konsisten
interface District {
  id: string;
  name: string;
  total: number;
  assisted: number;
  verifying: number;
  progress: number;
}

export const Route = createFileRoute("/districts/")({
  head: () => ({ 
    meta: [
      { title: "Kabupaten · SIM-RTLH · NTT" }, 
      { name: "description", content: "Sebaran Data RTLH per Kabupaten." }
    ] 
  }),
  beforeLoad: () => {
    // --- PENAMBAHAN PENGAMANAN SSR ---
    if (typeof window !== "undefined") {
      // UBAH DI SINI: Cek kedua tempat penyimpanan (sessionStorage & localStorage)
      const isAuthenticated = sessionStorage.getItem("auth_token") || localStorage.getItem("auth_token");
      if (!isAuthenticated) {
        throw redirect({ to: "/login" });
      }
    }
    // ---------------------------------
  },
  component: DistrictsPage,
});

function DistrictsPage() {
  const { data: fetchedDistricts, isLoading, isError } = useQuery({
    queryKey: ["districtsData"],
    queryFn: getDistricts,
  });

  const sortedDistricts = useMemo(() => {
    // Jika data kosong, kembalikan array kosong untuk diproses oleh UI
    if (!fetchedDistricts || fetchedDistricts.length === 0) return [];

    return fetchedDistricts
      .map((d: any) => {
        const total = Number(d.total) || 0;
        const assisted = Number(d.assisted) || 0;
        
        // Kalkulasi progres dinamis
        const progress = total > 0 ? Math.round((assisted / total) * 100) : 0;
        
        // Membuat ID slug (ex: "Kupang" -> "kupang")
        const id = d.name ? String(d.name).toLowerCase().replace(/\s+/g, '-') : Math.random().toString();

        return {
          id,
          name: d.name || "Tidak Diketahui",
          total,
          assisted,
          verifying: Number(d.verifying) || 0,
          progress,
        };
      })
      .sort((a, b) => b.progress - a.progress); // Urutkan berdasarkan progres terbesar
  }, [fetchedDistricts]);

  return (
    <PageShell>
      <PageHeader
        eyebrow="Sebaran Wilayah"
        title="Data RTLH per Kabupaten"
        description="Pilih Kabupaten untuk melihat detail capaian, sebaran rumah, dan progres bantuan."
      />
      
      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        {/* State: Loading */}
        {isLoading ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Menarik data dari Spreadsheet...</p>
          </div>
        ) : isError ? (
          /* State: Error */
           <div className="rounded-lg bg-destructive/10 p-6 text-center text-destructive">
             <p className="font-bold">Terjadi kesalahan</p>
             <p className="text-sm">Gagal memuat data dari database. Silakan coba lagi nanti.</p>
           </div>
        ) : sortedDistricts.length === 0 ? (
           /* State: Empty Data */
           <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 border-2 border-dashed border-muted rounded-3xl">
             <Database className="h-12 w-12 text-muted-foreground" />
             <div className="text-center">
               <h3 className="font-bold text-muted-foreground">Data Kosong</h3>
               <p className="text-sm text-muted-foreground">Belum ada data kabupaten yang diinput di Spreadsheet.</p>
             </div>
           </div>
        ) : (
          /* State: Data Tersedia */
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sortedDistricts.map((d: District) => (
                <Link 
                  key={d.id} 
                  to="/districts/$id" 
                  params={{ id: d.id }} 
                  className="group flex flex-col rounded-2xl border border-border bg-gradient-card p-5 shadow-soft transition-all hover:-translate-y-1 hover:shadow-elevated"
                >
                  <div className="flex items-center justify-between">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
                      {d.progress}%
                    </span>
                  </div>
                  
                  <div className="mt-4 text-xs uppercase tracking-wider text-muted-foreground">Kabupaten</div>
                  <div className="text-lg font-bold text-primary-deep">{d.name}</div>
                  
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <Mini label="Total" value={d.total} />
                    <Mini label="Terbantu" value={d.assisted} />
                    <Mini label="Verifikasi" value={d.verifying} />
                  </div>
                  
                  <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-gradient-gold transition-all duration-500" style={{ width: `${d.progress}%` }} />
                  </div>
                  
                  {/* Perbaikan: Dihapus mt-4 agar tidak konflik dengan mt-auto */}
                  <div className="pt-4 border-t border-border/60 mt-auto">
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition-colors group-hover:text-primary-deep">
                      Lihat detail <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
        )}
      </div>
    </PageShell>
  );
}

// Komponen kecil untuk statistik angka di kartu
function Mini({ label, value }: { label: string; value: number | string }) {
  const numericValue = Number(value) || 0;
  return (
    <div className="rounded-lg bg-muted/60 p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-bold text-primary-deep">{numericValue.toLocaleString("id-ID")}</div>
    </div>
  );
}