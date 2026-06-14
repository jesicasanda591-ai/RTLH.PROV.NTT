import { useState, useMemo, useEffect } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { PageShell } from "@/components/page-shell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBnbaData, updateBnbaStatus, updateBnbaProgress, RtlhData } from "@/lib/api";
import { 
  Search, CheckCircle2, User, MapPin, 
  Loader2, FolderOpen, AlertCircle, X, UploadCloud, FileCheck
} from "lucide-react";

// URL Web App Apps Script kamu
const BASE_URL = "https://script.google.com/macros/s/AKfycbxrmD2cSnEdEpToTJDJokCo4if12CLGkMiaGDZktzvJzqmkB_TrGJ1oUfK1QuXZe5bF/exec";

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

export const Route = createFileRoute("/monitoring")({
  head: () => ({ meta: [{ title: "Monitoring & Kontrol RTLH · SIM-RTLH" }] }),
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const isAuthenticated = sessionStorage.getItem("auth_token") || localStorage.getItem("auth_token");
      if (!isAuthenticated) throw redirect({ to: "/login" });
    }
  },
  component: MonitoringPage,
});

export function MonitoringPage() {
  const queryClient = useQueryClient();
  
  const [showToast, setShowToast] = useState(false);
  const [toastConfig, setToastConfig] = useState({ title: "Berhasil!", msg: "" });
  
  const userKab = typeof window !== "undefined" ? (sessionStorage.getItem("user_kabupaten") || localStorage.getItem("user_kabupaten") || "") : "";
  const isProvinsi = userKab.toLowerCase() === "provinsi" || userKab.toLowerCase() === "admin";
  
  const [selectedKabupaten, setSelectedKabupaten] = useState<string>(isProvinsi ? "Kota Kupang" : userKab);
  const [searchQuery, setSearchQuery] = useState<string>(""); 
  const [selectedId, setSelectedId] = useState<string>("");
  
  const [statusSelect, setStatusSelect] = useState<string>("");
  const [kerusakanSelect, setKerusakanSelect] = useState<string>("Rusak Ringan");
  const [koordinatBaru, setKoordinatBaru] = useState<string>(""); 
  
  const [selectedProgressValue, setSelectedProgressValue] = useState<number>(25);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  const { data: serverBnbaData = [], isLoading: isBnbaLoading } = useQuery<RtlhData[]>({
    queryKey: ["bnbaData"],
    queryFn: getBnbaData,
  });

  const mutation = useMutation({
    mutationFn: ({ id, status, kerusakan, koordinat }: { id: string; status: string; kerusakan: string; koordinat?: string }) => 
      updateBnbaStatus(id, status, kerusakan, koordinat),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bnbaData"] });
      setToastConfig({ title: "Status Diperbarui!", msg: "Perubahan data dan status berhasil disimpan." });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    },
  });

  const progressMutation = useMutation({
    mutationFn: ({ id, progress }: { id: string, progress: number }) => updateBnbaProgress(id, progress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bnbaData"] });
      setToastConfig({ title: "Progres Diupdate!", msg: "Progres fisik telah tersimpan ke spreadsheet." });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    },
  });

  const handleFileUpload = async () => {
    if (!selectedFile || !activePenerima) return;
    setUploadLoading(true);

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(",")[1];
          resolve(base64);
        };
        reader.readAsDataURL(selectedFile);
      });

      const base64Data = await base64Promise;

      const response = await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "uploadFile",
          id: activePenerima.id,
          fileName: selectedFile.name,
          mimeType: selectedFile.type,
          fileData: base64Data
        }),
      });

      const res = await response.json();
      if (res.status === "success") {
        setToastConfig({ title: "Upload Sukses!", msg: "Dokumen administrasi berhasil disimpan di Drive Utama warga." });
        setShowToast(true);
        setSelectedFile(null);
        setTimeout(() => setShowToast(false), 3000);
      } else {
        alert("Gagal: " + res.message);
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat mengunggah file.");
    } finally {
      setUploadLoading(false);
    }
  };

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
      setKoordinatBaru(activePenerima.koordinat || ""); 
      setSelectedFile(null);
    }
  }, [activePenerima]);

  const handleSaveStatus = () => { 
    if (activePenerima) {
      mutation.mutate({ 
        id: activePenerima.id, 
        status: statusSelect, 
        kerusakan: kerusakanSelect,
        koordinat: statusSelect === "Survei" ? koordinatBaru : undefined 
      }); 
    }
  };

  const handleUpdateProgress = () => { if (activePenerima) progressMutation.mutate({ id: activePenerima.id, progress: selectedProgressValue }); };

  return (
    <PageShell>
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-24 right-6 z-50 animate-in slide-in-from-right-5 fade-in duration-300">
           <div className="bg-white border border-green-200 shadow-xl rounded-lg p-4 flex items-center gap-3 border-l-4 border-l-green-500">
              <CheckCircle2 className="text-green-500 h-6 w-6" />
              <div>
                <h4 className="text-sm font-bold text-slate-800">{toastConfig.title}</h4>
                <p className="text-xs text-slate-500">{toastConfig.msg}</p>
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
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-500">Status Baru</label>
                      <select value={statusSelect} onChange={(e) => setStatusSelect(e.target.value)} className="w-full rounded-lg border border-slate-200 p-2 text-xs">
                        {Object.keys(STATUS_TO_STEP).map(status => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </div>

                    {/* KHUSUS VERIFIKASI */}
                    {statusSelect === "Verifikasi" && (
                      <div className="space-y-2 animate-in fade-in duration-300 mt-4 border-t border-slate-100 pt-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700">Tingkat Kerusakan</label>
                          <select value={kerusakanSelect} onChange={(e) => setKerusakanSelect(e.target.value)} className="w-full rounded-lg border border-slate-200 p-2 text-xs">
                            <option value="Rusak Ringan">Rusak Ringan</option>
                            <option value="Rusak Sedang">Rusak Sedang</option>
                            <option value="Rusak Berat">Rusak Berat</option>
                          </select>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-1 text-left">
                          <div className="flex items-start gap-1.5 text-amber-800">
                              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                              <p className="text-[10px] leading-relaxed text-justify">
                                <strong>Pilih tingkat kerusakan rumah sesuai dengan kondisi yang terlihat pada foto rumah yang diunggah.</strong><br/>
                                Pastikan tingkat kerusakan yang dipilih (Ringan, Sedang, atau Berat) sesuai dengan kondisi fisik bangunan yang tampak pada foto. Ketidaksesuaian antara foto dan tingkat kerusakan yang dipilih dapat memengaruhi hasil verifikasi dan penilaian usulan bantuan.
                              </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* KHUSUS SURVEI */}
                    {statusSelect === "Survei" && (
                      <div className="space-y-4 animate-in fade-in duration-300 mt-4 border-t border-slate-100 pt-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-blue-600" /> Koordinat Lokasi Rumah
                          </label>
                          <input 
                            type="text" 
                            value={koordinatBaru}
                            onChange={(e) => setKoordinatBaru(e.target.value)}
                            placeholder="Contoh: -10.123456, 123.654321"
                            className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                          />
                          <p className="text-[10px] text-slate-400 italic">Dapat disesuaikan jika titik koordinat hasil survei berbeda dengan data awal.</p>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700">Tingkat Kerusakan</label>
                          <select value={kerusakanSelect} onChange={(e) => setKerusakanSelect(e.target.value)} className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                            <option value="Rusak Ringan">Rusak Ringan</option>
                            <option value="Rusak Sedang">Rusak Sedang</option>
                            <option value="Rusak Berat">Rusak Berat</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* KHUSUS VALIDASI (UPLOAD FILE) */}
                    {statusSelect === "Validasi" && (
                      <div className="space-y-3 border border-blue-100 bg-blue-50/40 rounded-xl p-4 text-center animate-in fade-in slide-in-from-top-2 duration-300 mt-4">
                        <label className="block text-xs font-bold text-blue-950 uppercase tracking-wide mb-1 text-left">
                          Dokumen Administrasi (Folder Utama)
                        </label>
                        
                        {activePenerima.linkDrive && String(activePenerima.linkDrive).trim() !== "-" && (
                          <a 
                            href={activePenerima.linkDrive} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="flex items-center justify-center py-2.5 rounded-lg border bg-[#eef2ff] border-blue-200 text-blue-700 hover:bg-blue-100 cursor-pointer shadow-sm text-xs font-bold w-full transition-colors"
                          >
                            <FolderOpen size={14} className="mr-1.5" /> Buka Folder Utama di Drive
                          </a>
                        )}

                        <div className="relative cursor-pointer bg-white rounded-lg border border-slate-200 p-4 hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-1 mt-2">
                          <input 
                            type="file" 
                            accept=".pdf" 
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                            onChange={(e) => {
                              if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                            }}
                          />
                          {selectedFile ? (
                            <>
                              <FileCheck className="h-7 w-7 text-green-600 animate-bounce" />
                              <span className="text-xs font-semibold text-slate-700 max-w-[180px] truncate">{selectedFile.name}</span>
                            </>
                          ) : (
                            <>
                              <UploadCloud className="h-7 w-7 text-blue-500" />
                              <span className="text-xs font-medium text-slate-600">Pilih Berkas Upload</span>
                              <span className="text-[10px] text-slate-400 font-bold text-red-500">Wajib 1 File PDF (Maks 10MB)</span>
                            </>
                          )}
                        </div>

                        {selectedFile && (
                          <button 
                            onClick={handleFileUpload} 
                            disabled={uploadLoading}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg text-xs transition-colors shadow-sm flex items-center justify-center gap-1 mt-2"
                          >
                            {uploadLoading ? <><Loader2 className="animate-spin h-3.5 w-3.5" />Mengunggah...</> : "Mulai Upload ke Drive"}
                          </button>
                        )}

                        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3.5 text-left">
                           <h4 className="text-xs font-bold text-amber-900 mb-2 flex items-center gap-1.5">
                             <AlertCircle className="h-4 w-4" /> Syarat Dokumen Validasi
                           </h4>
                           <p className="text-[10px] text-amber-800 mb-2 leading-relaxed">
                             Seluruh dokumen wajib digabungkan dan diunggah dalam <strong>1 (satu) file PDF</strong> dengan urutan:
                           </p>
                           <ol className="list-decimal pl-4 pr-1 text-[10px] text-amber-800 space-y-1.5 mb-3 text-justify">
                             <li>Surat Pernyataan Bupati/Wali Kota tentang kebenaran informasi dan validitas data usulan;</li>
                             <li>Foto kondisi rumah (tampak depan, samping, struktural, & non-struktural);</li>
                             <li>Fotokopi KTP & KK atau Surat Keterangan Domisili;</li>
                             <li>Fotokopi sertifikat hak atas tanah / surat keterangan kepemilikan sah;</li>
                             <li>Surat Pernyataan bermeterai belum pernah menerima bantuan serupa (10 thn terakhir);</li>
                             <li>Surat Pernyataan Kesanggupan Berswadaya (bagi yang mampu);</li>
                             <li>Surat Pernyataan Bebas Kredit dari PB;</li>
                             <li>Titik koordinat lokasi rumah;</li>
                             <li>Surat Keterangan Overlay Guna Lahan dari Dinas PRKP/PUPR;</li>
                             <li>Daftar Usulan Peningkatan Kualitas Rumah yang diisi lengkap.</li>
                           </ol>
                           <p className="text-[10px] text-amber-900 font-semibold leading-relaxed text-justify bg-amber-100/50 p-2 rounded">
                             Pastikan seluruh dokumen terbaca dengan jelas. Berkas yang tidak lengkap/sesuai dapat menyebabkan usulan tidak dapat diproses lebih lanjut.
                           </p>
                        </div>
                      </div>
                    )}

                  </div>
                  <button onClick={handleSaveStatus} disabled={mutation.isPending} className="w-full bg-blue-600 text-white p-2 rounded-lg text-xs font-bold hover:bg-blue-700 mt-4 transition-colors shadow-sm">
                    {mutation.isPending ? <><Loader2 className="animate-spin inline-block mr-2 h-4 w-4" />Menyimpan...</> : "Simpan Status"}
                  </button>
                </div>
              </div>

              {/* FOLDER PROGRES PELAKSANAAN (HANYA MUNCUL DI TAHAP SELESAI) */}
              {activePenerima.status === "Selesai" && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8 animate-in fade-in duration-300">
                  <h3 className="mb-5 flex items-center gap-2 text-xs font-bold uppercase text-slate-800 border-b border-slate-100 pb-3">
                      <FolderOpen size={16} className="text-blue-600" /> Folder Progres Pelaksanaan
                  </h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                      {[25, 50, 75, 100].map((num) => {
                          const key = `progres${num}` as keyof RtlhData;
                          const link = activePenerima[key];
                          const isAvailable = Boolean(link && String(link).trim() !== "" && String(link).trim() !== "-");
                          return (
                              <a 
                                  key={num} 
                                  href={isAvailable ? String(link) : "#"} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className={`flex flex-col items-center justify-center py-2.5 rounded-lg border transition-all ${isAvailable ? "bg-[#eef2ff] border-blue-200 text-blue-700 hover:bg-blue-100 cursor-pointer shadow-sm" : "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed"}`}
                              >
                                  <span className="text-sm font-bold">{num}%</span>
                              </a>
                          );
                      })}
                  </div>

                  <div className="mb-5 p-3.5 bg-[#fffbeb] border border-[#fde68a] rounded-xl">
                      <div className="flex items-start gap-2 text-amber-800">
                          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                          <div>
                              <p className="text-xs font-bold uppercase mb-1">Penting: Persiapan Dokumen</p>
                              <p className="text-[11px] leading-relaxed">
                                  Sebelum menekan tombol <strong className="text-amber-900">Update</strong>, pastikan file foto progres pekerjaan (tampak depan/samping/belakang/dalam) telah diunggah atau tersedia di sistem untuk tahap progres yang dipilih.
                              </p>
                          </div>
                      </div>
                  </div>

                  <div className="flex gap-3">
                      <select 
                        value={selectedProgressValue} 
                        onChange={(e) => setSelectedProgressValue(Number(e.target.value))} 
                        className="flex-1 rounded-xl border border-blue-200 bg-white p-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      >
                          <option value={25}>Tahap 25%</option>
                          <option value={50}>Tahap 50%</option>
                          <option value={75}>Tahap 75%</option>
                          <option value={100}>Tahap 100%</option>
                      </select>
                      <button 
                        onClick={handleUpdateProgress} 
                        disabled={progressMutation.isPending} 
                        className="px-8 py-3 bg-[#1a56db] text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-sm active:scale-[0.98]"
                      >
                        {progressMutation.isPending ? <Loader2 className="animate-spin h-4 w-4 mx-auto" /> : "Update"}
                      </button>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="lg:col-span-8 xl:col-span-9 bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs">Pilih penerima di panel kiri untuk melihat detail...</div>
          )}
        </div>
      </div>
    </PageShell>
  );
}