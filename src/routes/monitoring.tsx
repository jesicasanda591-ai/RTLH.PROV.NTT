import { useState, useMemo, useEffect } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { PageShell } from "@/components/page-shell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBnbaData, updateBnbaStatus, updateBnbaProgress, RtlhData } from "@/lib/api";
import { 
  Search, CheckCircle2, User, MapPin, 
  Loader2, FolderOpen, AlertCircle, X 
} from "lucide-react";

// --- Constants ---
const KABUPATEN_LIST = [
  "Kabupaten Alor", "Kabupaten Belu", "Kabupaten Ende", "Kabupaten Flores Timur",
  "Kabupaten Kupang", "Kabupaten Lembata", "Kabupaten Malaka", "Kabupaten Manggarai",
  "Kabupaten Manggarai Barat", "Kabupaten Manggarai Timur", "Kabupaten Nagekeo",
  "Kabupaten Ngada", "Kabupaten Rote Ndao", "Kabupaten Sabu Raijua", "Kabupaten Sikka",
  "Kabupaten Sumba Barat", "Kabupaten Sumba Barat Daya", "Kabupaten Sumba Tengah",
  "Kabupaten Sumba Timur", "Kabupaten Timor Tengah Selatan", "Kabupaten Timor Tengah Utara",
  "Kota Kupang"
].sort();

const TIMELINE_STEPS = [
  { step: 1, label: "Pengajuan", desc: "Dokumen pengajuan terverifikasi sistem." },
  { step: 2, label: "Verifikasi", desc: "Verifikasi kelengkapan dokumen berkas." },
  { step: 3, label: "Survei", desc: "Petugas melakukan kunjungan fisik dan dokumentasi." },
  { step: 4, label: "Validasi", desc: "Validasi data final oleh admin kabupaten atau provinsi." },
  { step: 5, label: "Penetapan", desc: "Penerima ditetapkan resmi melalui SK." },
  { step: 6, label: "Selesai", desc: "Bantuan material/dana diturunkan." },
];

const STATUS_TO_STEP: Record<string, number> = {
  "Pengajuan": 1,
  "Verifikasi": 2,
  "Survei": 3,
  "Validasi": 4,
  "Penetapan": 5,
  "Selesai": 6,
};

// --- Route Definition ---
export const Route = createFileRoute("/monitoring")({
  head: () => ({ meta: [{ title: "Monitoring & Kontrol RTLH · SIM-RTLH" }] }),
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      // UBAH 1: Cek kedua brankas untuk token login
      const isAuthenticated = sessionStorage.getItem("auth_token") || localStorage.getItem("auth_token");
      if (!isAuthenticated) throw redirect({ to: "/login" });
    }
  },
  component: MonitoringPage,
});

// --- Main Page Component ---
export function MonitoringPage() {
  const queryClient = useQueryClient();
  
  // State untuk Toast Notification
  const [showToast, setShowToast] = useState(false);
  
  // UBAH 2: Cek kedua brankas untuk mengambil nama kabupaten agar filter dan izin admin tidak rusak
  const userKab = typeof window !== "undefined" ? (sessionStorage.getItem("user_kabupaten") || localStorage.getItem("user_kabupaten") || "") : "";
  const isProvinsi = userKab.toLowerCase() === "provinsi" || userKab.toLowerCase() === "admin";
  
  const [selectedKabupaten, setSelectedKabupaten] = useState<string>(isProvinsi ? "Kota Kupang" : userKab);
  const [searchQuery, setSearchQuery] = useState<string>(""); 
  const [selectedId, setSelectedId] = useState<string>("");
  const [statusSelect, setStatusSelect] = useState<string>("");
  const [kerusakanSelect, setKerusakanSelect] = useState<string>("Rusak Ringan");
  const [selectedProgressValue, setSelectedProgressValue] = useState<number>(25);

  const { data: serverBnbaData = [], isLoading: isBnbaLoading } = useQuery<RtlhData[]>({
    queryKey: ["bnbaData"],
    queryFn: getBnbaData,
  });

  const mutation = useMutation({
    mutationFn: ({ id, status, kerusakan }: { id: string; status: string; kerusakan: string }) => 
      updateBnbaStatus(id, status, kerusakan),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bnbaData"] }),
  });

  const progressMutation = useMutation({
    mutationFn: ({ id, progress }: { id: string, progress: number }) => updateBnbaProgress(id, progress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bnbaData"] });
      // Tampilkan toast dan hilangkan setelah 3 detik
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    },
  });

  const filteredData = useMemo(() => {
    return serverBnbaData.filter((item) => {
      const matchKab = isProvinsi ? item.kabupaten.toLowerCase() === selectedKabupaten.toLowerCase() : item.kabupaten.toLowerCase() === userKab.toLowerCase();
      const matchSearch = item.nama.toLowerCase().includes(searchQuery.toLowerCase()) || item.nik.includes(searchQuery);
      return matchKab && matchSearch;
    });
  }, [serverBnbaData, selectedKabupaten, searchQuery, isProvinsi, userKab]);

  const activePenerima = useMemo(() => {
    if (selectedId) return serverBnbaData.find((p) => p.id === selectedId);
    return filteredData[0] || null;
  }, [serverBnbaData, selectedId, filteredData]);

  useEffect(() => {
    if (activePenerima) {
      setStatusSelect(activePenerima.status);
      setKerusakanSelect(activePenerima.kerusakan || "Rusak Ringan");
    }
  }, [activePenerima]);

  const handleSaveStatus = () => { if (activePenerima) mutation.mutate({ id: activePenerima.id, status: statusSelect, kerusakan: kerusakanSelect }); };
  const handleUpdateProgress = () => { if (activePenerima) progressMutation.mutate({ id: activePenerima.id, progress: selectedProgressValue }); };

  return (
    <PageShell>
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-24 right-6 z-50 animate-in slide-in-from-right-5 fade-in duration-300">
           <div className="bg-white border border-green-200 shadow-xl rounded-lg p-4 flex items-center gap-3 border-l-4 border-l-green-500">
              <CheckCircle2 className="text-green-500 h-6 w-6" />
              <div>
                <h4 className="text-sm font-bold text-slate-800">Berhasil!</h4>
                <p className="text-xs text-slate-500">Progres telah diupdate ke spreadsheet.</p>
              </div>
              <button onClick={() => setShowToast(false)} className="ml-4 text-slate-400 hover:text-slate-600"><X size={16}/></button>
           </div>
        </div>
      )}

      <section className="relative w-full bg-[#072456] pb-24 pt-16 lg:pt-20 lg:pb-32">
        <div className="absolute inset-0 bg-gradient-to-r from-[#031433] via-transparent to-[#0a3275] opacity-50" />
        <div className="relative mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
          <div className="mb-5 inline-flex items-center rounded-full border border-[#f5b027]/30 bg-[#f5b027]/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#f5b027]">MONITORING & KONTROL</div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">Pantau Status Verifikasi RTLH</h1>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-16 max-w-[1600px] px-4 pb-6 lg:px-8 space-y-6">
        <div className="grid gap-4 sm:grid-cols-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Pilih Kabupaten / Kota</label>
            <select value={selectedKabupaten} onChange={(e) => setSelectedKabupaten(e.target.value)} disabled={!isProvinsi} className={`w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition-all ${!isProvinsi ? "bg-slate-50 text-slate-400 cursor-not-allowed" : "bg-white text-slate-800 focus:border-blue-500 focus:outline-none"}`}>
              {KABUPATEN_LIST.map((kab) => <option key={kab} value={kab}>{kab}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500">Cari Nama Penerima (BNBA)</label>
            <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input type="text" placeholder="Ketik nama penerima atau NIK..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none" /></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4 xl:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[820px]">
             <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-xl"><span className="text-xs font-bold uppercase tracking-wider text-slate-600">Daftar BNBA</span></div>
             <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
               {isBnbaLoading ? <div className="p-8 text-center"><Loader2 className="animate-spin h-6 w-6 mx-auto text-blue-600" /></div> : filteredData.map((item) => (
                  <button key={item.id} onClick={() => setSelectedId(item.id)} className={`w-full text-left p-4 transition-all ${activePenerima?.id === item.id ? "bg-blue-50/60 border-l-4 border-blue-600" : ""}`}>
                    <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{item.nama}</h4>
                    <p className="text-xs text-slate-400 font-mono">NIK {item.nik.slice(0, 6)}...</p>
                  </button>
               ))}
             </div>
          </div>

          {activePenerima ? (
            <div className="lg:col-span-8 xl:col-span-9 space-y-6 h-[820px] overflow-y-auto pr-1">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                 <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5"><User className="h-4 w-4 text-blue-600" /> Informasi Penerima</h3>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6 text-xs">
                    <div><span className="text-slate-400 block mb-0.5">Nama</span><span className="font-bold text-slate-800">{activePenerima.nama}</span></div>
                    <div><span className="text-slate-400 block mb-0.5">NIK</span><span className="font-bold text-slate-800 font-mono">{activePenerima.nik}</span></div>
                    <div className="col-span-2"><span className="text-slate-400 block mb-0.5">Alamat</span><span className="font-bold text-slate-800">{activePenerima.alamat}</span></div>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                <div className="md:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                  <h3 className="text-sm font-bold text-slate-800 mb-5">Timeline Pengajuan</h3>
                  <div className="relative pl-2 space-y-5">
                    <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-100" />
                    {TIMELINE_STEPS.map((stepItem) => {
                      const isCompleted = stepItem.step <= (STATUS_TO_STEP[activePenerima.status] || 0);
                      return (
                        <div key={stepItem.step} className="relative flex items-start gap-4">
                          <div className={`z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-bold border ${isCompleted ? "bg-green-600 border-green-600 text-white" : "bg-white border-slate-200 text-slate-400"}`}>
                            {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5" /> : stepItem.step}
                          </div>
                          <div className="flex-1"><h4 className={`text-xs font-bold ${isCompleted ? "text-slate-800" : "text-slate-400"}`}>{stepItem.label}</h4><p className="text-[11px] text-slate-400">{stepItem.desc}</p></div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="md:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2">Ubah Status</h3>
                  <div className="space-y-3">
                    <div className="space-y-1.5"><label className="text-xs font-medium text-slate-500">Status Baru</label><select value={statusSelect} onChange={(e) => setStatusSelect(e.target.value)} className="w-full rounded-lg border border-slate-200 p-2 text-xs">{Object.keys(STATUS_TO_STEP).map(status => <option key={status} value={status}>{status}</option>)}</select></div>
                    {!["Validasi", "Penetapan", "Selesai"].includes(statusSelect) && (<div className="space-y-1.5"><label className="text-xs font-medium text-slate-500">Tingkat Kerusakan</label><select value={kerusakanSelect} onChange={(e) => setKerusakanSelect(e.target.value)} className="w-full rounded-lg border border-slate-200 p-2 text-xs"><option value="Rusak Ringan">Rusak Ringan</option><option value="Rusak Sedang">Rusak Sedang</option><option value="Rusak Berat">Rusak Berat</option></select></div>)}
                  </div>
                  <button onClick={handleSaveStatus} disabled={mutation.isPending} className="w-full bg-blue-600 text-white p-2 rounded-lg text-xs font-bold hover:bg-blue-700 mt-4">{mutation.isPending ? "Menyimpan..." : "Simpan Status"}</button>
                </div>
              </div>

              {activePenerima.status === "Selesai" && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 animate-in fade-in duration-300">
                  <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase text-slate-800 border-b pb-2">
                      <FolderOpen size={16} className="text-blue-600" /> Folder Progres
                  </h3>
                  
                  <div className="grid grid-cols-4 gap-2 mb-6">
                      {[25, 50, 75, 100].map((num) => {
                          const key = `progres${num}` as keyof RtlhData;
                          const link = activePenerima[key];
                          const isAvailable = Boolean(link && String(link).trim() !== "" && String(link).trim() !== "-");
                          return (
                              <a key={num} href={isAvailable ? String(link) : "#"} target="_blank" rel="noreferrer" className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${isAvailable ? "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 cursor-pointer" : "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed"}`}>
                                  <span className="text-xs font-bold">{num}%</span>
                              </a>
                          );
                      })}
                  </div>

                  {/* Kotak Peringatan */}
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-start gap-2 text-amber-800">
                          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                          <div>
                              <p className="text-xs font-bold uppercase mb-1">Penting: Persiapan Dokumen</p>
                              <p className="text-[11px] leading-relaxed">
                                  Sebelum menekan tombol <strong>Update</strong>, pastikan file foto progres pekerjaan (tampak depan/samping/belakang/dalam) telah diunggah atau tersedia di sistem untuk tahap progres yang dipilih.
                              </p>
                          </div>
                      </div>
                  </div>

                  <div className="flex gap-3">
                      <select value={selectedProgressValue} onChange={(e) => setSelectedProgressValue(Number(e.target.value))} className="flex-1 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500">
                          <option value={25}>Tahap 25%</option>
                          <option value={50}>Tahap 50%</option>
                          <option value={75}>Tahap 75%</option>
                          <option value={100}>Tahap 100%</option>
                      </select>
                      <button onClick={handleUpdateProgress} disabled={progressMutation.isPending} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-sm">Update</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="lg:col-span-8 xl:col-span-9 bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs">Pilih penerima...</div>
          )}
        </div>
      </div>
    </PageShell>
  );
}