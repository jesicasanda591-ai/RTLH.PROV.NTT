import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { PageShell, PageHeader } from "@/components/page-shell";
import { 
  Search, Download, ChevronLeft, ChevronRight, X, Loader2,
  User, MapPin, FileText, Home, FolderOpen, Folder, AlertCircle 
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getDistricts, getRtlhRows, RtlhData, DistrictData, Status } from "@/lib/api";

// --- Route Config ---
export const Route = createFileRoute("/rtlh")({
  head: () => ({ meta: [{ title: "Data RTLH · SIM-RTLH" }] }),
  beforeLoad: () => {
    // Pengamanan SSR agar tidak crash di server
    if (typeof window !== "undefined") {
      // UBAH 1: Cek kedua brankas
      const isAuthenticated = sessionStorage.getItem("auth_token") || localStorage.getItem("auth_token");
      if (!isAuthenticated) {
        throw redirect({ to: "/login" });
      }
    }
  },
  component: RtlhPage,
});

// --- Page Component ---
function RtlhPage() {
  const [q, setQ] = useState("");
  const [kec, setKec] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<RtlhData | null>(null); 
  const [toast, setToast] = useState<{ message: string } | null>(null);

  const perPage = 8;
  
  // UBAH 2: Cek kedua brankas untuk mengambil nama kabupaten
  const userKab = typeof window !== "undefined" ? (sessionStorage.getItem("user_kabupaten") || localStorage.getItem("user_kabupaten") || "") : "";
  const isProvinsi = userKab.toLowerCase() === "provinsi" || userKab.toLowerCase() === "admin";

  // Auto-hide Toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const { data: districts = [] } = useQuery<DistrictData[]>({ 
    queryKey: ["districtsData"], 
    queryFn: getDistricts 
  });

  const { data: rtlhData = [], isLoading } = useQuery<RtlhData[]>({ 
    queryKey: ["rtlhRows"], 
    queryFn: getRtlhRows 
  });

  const filtered = useMemo(() => {
    return rtlhData.filter((r) => {
      const matchKab = isProvinsi 
        ? (kec === "all" || r.kabupaten.toLowerCase() === kec.toLowerCase())
        : r.kabupaten.toLowerCase() === userKab.toLowerCase();
      const matchStatus = status === "all" || r.status.toLowerCase() === status.toLowerCase();
      const matchSearch = !q || `${r.nama} ${r.nik} ${r.alamat}`.toLowerCase().includes(q.toLowerCase());
      return matchKab && matchStatus && matchSearch;
    });
  }, [rtlhData, isProvinsi, kec, userKab, status, q]);

  // --- Fungsi Export CSV (Dinamis sesuai filter) ---
  const exportToCSV = () => {
    if (filtered.length === 0) {
      setToast({ message: "Tidak ada data untuk di-export" });
      return;
    }

    const headers = ["Nama", "NIK", "Alamat", "Kelurahan", "Kecamatan", "Kabupaten", "Status", "Progress", "Kondisi"];
    const csvRows = filtered.map(r => [
      `"${r.nama || ""}"`,
      `"${r.nik || ""}"`,
      `"${r.alamat || ""}"`,
      `"${r.kelurahan || ""}"`,
      `"${r.kecamatan || ""}"`,
      `"${r.kabupaten || ""}"`,
      `"${r.status || ""}"`,
      `"${r.progress || 0}%"`,
      `"${r.kerusakan || ""}"`
    ].join(","));

    const csvString = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    const fileName = (kec === "all" || kec === "") ? "Data_RTLH_Semua_Kabupaten.csv" : `Data_RTLH_${kec}.csv`;
    a.setAttribute('href', url);
    a.setAttribute('download', fileName);
    a.click();
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageRows = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <PageShell>
      <PageHeader
        eyebrow={isProvinsi ? "Basis Data Nasional" : `Kab. ${userKab}`}
        title="Data Rumah Tidak Layak Huni"
        description="Pantau, filter, dan telusuri data penerima bantuan RTLH."
      />

      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft grid gap-3 lg:grid-cols-[1fr_220px_220px_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              className="h-11 w-full rounded-xl border border-input bg-background pl-9 pr-4 text-sm outline-none ring-ring/30 focus:ring-2"
              placeholder="Cari nama, NIK, atau alamat..."
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
            />
          </div>
          
          {/* Dropdown Kabupaten (Terkunci untuk User Kab) */}
          <select 
            value={isProvinsi ? kec : userKab}
            onChange={(e) => { if(isProvinsi) setKec(e.target.value); setPage(1); }}
            disabled={!isProvinsi}
            className="h-11 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProvinsi ? (
              <>
                <option value="all">Semua Kabupaten</option>
                {districts.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
              </>
            ) : (
              <option value={userKab}>{userKab}</option>
            )}
          </select>
          
          <select 
            value={status} 
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="h-11 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2"
          >
            <option value="all">Semua Status</option>
            <option value="pengajuan">Pengajuan</option>
            <option value="survei">Survei</option>
            <option value="verifikasi">Verifikasi</option>
            <option value="validasi">Validasi</option>
            <option value="penetapan">Penetapan</option>
            <option value="selesai">Selesai</option>
          </select>
          
          <button 
            onClick={exportToCSV}
            className="h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Download className="h-4 w-4" /> Export
          </button>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs font-semibold uppercase text-muted-foreground border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-left">Nama</th>
                      <th className="px-4 py-3 text-left">NIK</th>
                      <th className="px-4 py-3 text-left">Lokasi</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {pageRows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Tidak ada data ditemukan.</td>
                      </tr>
                    ) : (
                      pageRows.map((r) => (
                        <tr key={r.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3 font-medium">{r.nama}</td>
                          <td className="px-4 py-3 font-mono">{r.nik}</td>
                          <td className="px-4 py-3 text-muted-foreground">{r.kelurahan}, {r.kabupaten}</td>
                          <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                          <td className="px-4 py-3 text-center">
                            <button onClick={() => setDetail(r)} className="text-primary font-semibold hover:underline">Detail</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border bg-muted/20 px-4 py-3 sm:px-6">
                  <span className="text-sm text-muted-foreground">Halaman <strong>{page}</strong> dari <strong>{totalPages}</strong></span>
                  <div className="flex gap-2">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background hover:bg-muted disabled:opacity-50"><ChevronLeft className="h-4 w-4"/></button>
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background hover:bg-muted disabled:opacity-50"><ChevronRight className="h-4 w-4"/></button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-[9999] flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-6 py-4 shadow-lg animate-in slide-in-from-bottom-5">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <p className="text-sm font-semibold text-amber-900">{toast.message}</p>
          <button onClick={() => setToast(null)} className="ml-2 text-amber-600 hover:text-amber-800"><X size={16} /></button>
        </div>
      )}

      {detail && <DetailModal detail={detail} onClose={() => setDetail(null)} />}
    </PageShell>
  );
}

// --- Detail Modal (Layout Konsisten) ---
function DetailModal({ detail, onClose }: { detail: RtlhData; onClose: () => void }) {
  const finalAlamat = [detail.alamat, detail.rt ? `RT ${detail.rt}` : "", detail.rw ? `RW ${detail.rw}` : ""].filter(Boolean).join(", ");
  const finalLokasi = [detail.kelurahan, detail.kecamatan, detail.kabupaten].filter(Boolean).join(", ");
  const formatDate = (dateStr?: string) => dateStr ? String(dateStr).split("T")[0] : "-";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-primary-deep/60 p-4 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl my-auto overflow-hidden rounded-2xl border border-border bg-card shadow-elevated animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between bg-gradient-hero px-6 py-4 text-primary-foreground">
          <div>
            <div className="text-xs uppercase tracking-widest text-accent-gold">Data Masuk: {formatDate(detail.timestamp)}</div>
            <div className="text-lg font-bold">{detail.nama || "Tanpa Nama"}</div>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 hover:bg-white/20"><X className="h-4 w-4" /></button>
        </div>
        <div className="grid gap-4 p-6 sm:grid-cols-2 mt-2">
          <InfoCard icon={User} label="NIK" value={detail.nik || "-"} />
          <InfoCard icon={MapPin} label="Alamat" value={finalAlamat || "-"} />
          <InfoCard icon={MapPin} label="Lokasi" value={finalLokasi || "-"} />
          <InfoCard icon={Home} label="Kondisi" value={detail.kerusakan || "-"} />
          <InfoCard icon={FileText} label="Status" value={detail.status || "-"} />
          <InfoCard icon={FileText} label="Progres" value={`${detail.progress || 0}%`} />
        </div>
        <div className="bg-muted/30 px-6 py-5 border-t border-border">
          <h3 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"><FolderOpen className="h-4 w-4" /> Folder Progres</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <FolderCard title="Tahap 25%" link={detail.progres25} />
            <FolderCard title="Tahap 50%" link={detail.progres50} />
            <FolderCard title="Tahap 75%" link={detail.progres75} />
            <FolderCard title="Tahap 100%" link={detail.progres100} />
          </div>
        </div>
        <div className="border-t border-border bg-muted/50 px-6 py-3 flex justify-between items-center">
          {detail.linkDrive && String(detail.linkDrive).trim() !== "-" ? (
            <a href={detail.linkDrive} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary-deep hover:underline">
              <FolderOpen className="h-4 w-4" /> Buka Folder Drive Utama
            </a>
          ) : <div/>}
          <button onClick={onClose} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Tutup</button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Status | string }) {
  const s = status.toLowerCase();
  let color = "bg-gray-50 text-gray-700 ring-gray-200"; 
  if (s.includes("selesai") || s.includes("penetapan")) color = "bg-emerald-50 text-emerald-700 ring-emerald-200";
  else if (s.includes("verifikasi") || s.includes("survei") || s.includes("validasi")) color = "bg-sky-50 text-sky-700 ring-sky-200";
  else if (s.includes("pengajuan")) color = "bg-amber-50 text-amber-700 ring-amber-200";
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${color}`}>{status}</span>;
}

function InfoCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {label}</div>
      <div className="mt-1 text-sm font-semibold text-primary-deep">{value}</div>
    </div>
  );
}

function FolderCard({ title, link }: { title: string, link?: string }) {
  const isAvailable = Boolean(link && String(link).trim() !== "" && String(link).trim() !== "-");
  return (
    <a href={isAvailable ? link : undefined} target="_blank" rel="noreferrer" className={`group flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-center text-xs font-semibold transition-all ${isAvailable ? "border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground shadow-sm" : "border-border bg-muted/40 text-muted-foreground opacity-60 cursor-not-allowed"}`}>
      <FolderOpen className="h-5 w-5" /> <span>{title}</span>
    </a>
  );
}