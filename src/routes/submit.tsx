import { useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { PageShell } from "@/components/page-shell";
// Menambahkan AlertCircle untuk ikon Pop-up peringatan
import { ClipboardCheck, ArrowRight, Save, CheckCircle, Loader2, FolderOpen, ExternalLink, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { saveDataToSheet, getRtlhRows } from "@/lib/api"; 

const KABUPATEN_NTT = [
  "Kota Kupang", "Kabupaten Kupang", "Kabupaten Timor Tengah Selatan", "Kabupaten Timor Tengah Utara", 
  "Kabupaten Belu", "Kabupaten Alor", "Kabupaten Flores Timur", "Kabupaten Sikka", "Kabupaten Ende", 
  "Kabupaten Ngada", "Kabupaten Manggarai", "Kabupaten Lembata", "Kabupaten Rote Ndao", "Kabupaten Manggarai Barat", 
  "Kabupaten Nagekeo", "Kabupaten Sumba Tengah", "Kabupaten Sumba Barat Daya", "Kabupaten Manggarai Timur", 
  "Kabupaten Sabu Raijua", "Kabupaten Malaka", "Kabupaten Sumba Timur", "Kabupaten Sumba Barat"
].sort();

export const Route = createFileRoute("/submit")({
  beforeLoad: () => { 
    if (typeof window !== 'undefined') {
      const isAuthenticated = sessionStorage.getItem("auth_token") || localStorage.getItem("auth_token");
      if (!isAuthenticated) {
        throw redirect({ to: "/login" });
      }
    }
  },
  component: SubmitPage,
});

function SubmitPage() {
  const userKab = typeof window !== "undefined" ? (sessionStorage.getItem("user_kabupaten") || localStorage.getItem("user_kabupaten") || "") : "";
  const isProvinsi = userKab.toLowerCase() === "provinsi" || userKab.toLowerCase() === "admin";

  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedId, setGeneratedId] = useState("");
  const [generatedFolderUrl, setGeneratedFolderUrl] = useState(""); 
  
  // State baru untuk mengontrol kustom pop-up peringatan
  const [alertModal, setAlertModal] = useState({
    show: false,
    title: "",
    message: "",
    type: "error" as "error" | "warning"
  });
  
  // email diganti menjadi desil
  const [formData, setFormData] = useState({
    nama: "", nik: "", phone: "", desil: "",
    kabupaten: isProvinsi ? "" : userKab, alamat: "", kecamatan: "", kelurahan: "", rt: "", rw: "",
    lat: "", long: ""
  });

  const { data: existingData = [], isLoading: isCheckingData } = useQuery({
    queryKey: ["rtlhRows"],
    queryFn: getRtlhRows,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.target.name === "nik") {
        const onlyNums = e.target.value.replace(/[^0-9]/g, '');
        setFormData({ ...formData, [e.target.name]: onlyNums });
    } else {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleNextStep = (currentStep: number) => {
    if (currentStep === 1) {
      // Validasi wajib isi untuk desil
      if (!formData.nama || formData.nik.length !== 16 || !formData.phone || !formData.desil) {
        setAlertModal({ 
          show: true, 
          title: "Data Belum Lengkap", 
          message: "Mohon lengkapi Nama, NIK (harus 16 digit), No. Telepon, dan Desil!", 
          type: "warning" 
        });
        return;
      }

      if (isCheckingData) {
        setAlertModal({ 
          show: true, 
          title: "Sistem Sedang Memuat", 
          message: "Sistem sedang memuat database untuk validasi anti-duplikasi. Mohon tunggu beberapa detik dan coba klik kembali.", 
          type: "warning" 
        });
        return;
      }

      const isDuplicate = existingData.find((item: any) => 
        item.nik === formData.nik || 
        item.nama.toLowerCase().trim() === formData.nama.toLowerCase().trim()
      );

      if (isDuplicate) {
        setAlertModal({ 
          show: true, 
          title: "PENGAJUAN DITOLAK!", 
          message: `Nama atau NIK ini sudah terdaftar di sistem pada wilayah ${isDuplicate.kabupaten || "lain"}.\n\nTidak diizinkan melakukan pengajuan ganda untuk individu yang sama.`, 
          type: "error" 
        });
        return;
      }

      setStep(2);
    } else if (currentStep === 2) {
      if (!formData.kabupaten || !formData.alamat || !formData.kecamatan || !formData.kelurahan || !formData.rt || !formData.rw || !formData.lat || !formData.long) {
        setAlertModal({ 
          show: true, 
          title: "Lokasi Belum Lengkap", 
          message: "Mohon lengkapi semua data lokasi yang bertanda bintang (*)", 
          type: "warning" 
        });
        return;
      }
      setStep(3);
    } else if (currentStep === 3) {
      setStep(4);
    }
  };

  const handleSubmit = async () => { 
    setLoading(true);
    
    try {
      const result = await saveDataToSheet(formData);

      if (result && result.status === "success") {
        setIsSubmitted(true);
        setGeneratedId(result.id || ""); 
        
        if (result.folderUrl) {
          setGeneratedFolderUrl(result.folderUrl || "");
        }
      } else {
        throw new Error(result?.message || "Gagal dari server");
      }
    } catch (error: any) {
      console.error("Error submit data:", error);
      setAlertModal({ 
        show: true, 
        title: "Gagal Mengirim Data", 
        message: error.message || "Gagal mengirim data ke server. Pastikan koneksi internet Anda lancar.", 
        type: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none placeholder:text-gray-400";
  const labelClass = "block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1.5";

  return (
    <PageShell>
      <section className="relative w-full bg-[#072456] pb-32 pt-16 lg:pt-24 lg:pb-36">
        <div className="absolute inset-0 bg-gradient-to-r from-[#031433] via-transparent to-[#0a3275] opacity-50" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 inline-flex items-center rounded-full border border-[#f5b027]/30 bg-[#f5b027]/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#f5b027]">
            PENGAJUAN BANTUAN
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Formulir Pengajuan RTLH
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-blue-100 opacity-90">
            Lengkapi data diri, lokasi, dan dokumen pendukung untuk mengajukan permohonan bantuan perbaikan Rumah Tidak Layak Huni di wilayah NTT.
          </p>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-20 max-w-4xl px-4 pb-16">
        
        {!isSubmitted && (
            <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
            <div className="flex items-center justify-between px-2 sm:px-12">
                {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`flex flex-col items-center gap-2 ${step !== i ? 'opacity-40' : ''}`}>
                    <span className={`grid h-10 w-10 place-items-center rounded-full text-sm font-bold shadow-sm transition-colors ${step === i ? 'bg-[#ffc107] text-black ring-4 ring-[#ffc107]/20' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>{i}</span>
                    <span className={`text-[10px] font-bold uppercase ${step === i ? 'text-[#072456]' : 'text-gray-500'}`}>{i === 1 ? "Data Diri" : i === 2 ? "Lokasi" : i === 3 ? "Dokumen" : "Konfirmasi"}</span>
                </div>
                ))}
            </div>
            </div>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-lg">
          {isSubmitted ? (
            <div className="text-center py-10 sm:py-16 space-y-5 animate-in fade-in zoom-in-95 duration-500">
                <div className="bg-emerald-100 text-emerald-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle size={40} />
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Pengajuan Berhasil Dibuat!</h2>
                
                <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg border border-blue-100 font-mono text-sm">
                  <span>ID Pengajuan:</span>
                  <span className="font-bold">{generatedId}</span>
                </div>

                <div className="max-w-md mx-auto mt-6 bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <FolderOpen className="mx-auto h-10 w-10 text-[#ffc107] mb-3" />
                  <h3 className="font-bold text-slate-800 mb-2">Folder Berkas Telah Disiapkan</h3>
                  <p className="text-sm text-slate-600 mb-5 leading-relaxed">
                    Sistem telah membuatkan folder utama untuk <b>{formData.nama}</b> beserta sub-folder (Progres 25%, 50%, 75%, 100%). Silakan buka folder tersebut untuk mulai mengunggah dokumentasi.
                  </p>
                  
                  {generatedFolderUrl ? (
                    <a 
                      href={generatedFolderUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 w-full bg-[#072456] text-white px-6 py-3.5 rounded-xl font-bold text-sm hover:bg-[#0a3275] transition-colors shadow-md"
                    >
                      Buka Folder Drive & Upload <ExternalLink size={16} />
                    </a>
                  ) : (
                    <p className="text-xs text-red-500 italic">Folder gagal dimuat. Silakan cek spreadsheet secara manual.</p>
                  )}
                </div>

                <div className="pt-6">
                    <button 
                      onClick={() => window.location.reload()} 
                      className="text-slate-500 font-semibold hover:text-[#072456] transition-colors underline underline-offset-4"
                    >
                      Buat Pengajuan Baru
                    </button>
                </div>
            </div>
          ) : (
            <>
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 text-amber-900 shadow-sm">
                    <div className="flex gap-3">
                      <ClipboardCheck className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-950">PENTING: PERSIAPAN DOKUMEN PETUGAS</h4>
                        <p className="mt-1 text-xs text-amber-900/90 leading-relaxed">
                          Sebelum melanjutkan pengisian formulir pengajuan, pastikan Anda sebagai admin/petugas telah menyiapkan berkas-berkas digital berikut agar proses input berjalan lancar:
                        </p>
                        <div className="mt-3 grid gap-2.5 sm:grid-cols-2 text-xs font-semibold text-amber-950">
                          <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-amber-600" /> Foto Rumah Tampak Depan</div>
                          <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-amber-600" /> Foto Rumah Tampak Samping</div>
                          <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-amber-600" /> Foto Rumah Tampak Belakang</div>
                          <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-amber-600" /> Foto Rumah Tampak Dalam</div>
                          <div className="flex items-center gap-2 sm:col-span-2"><span className="h-1.5 w-1.5 rounded-full bg-amber-600" /> Foto KTP Penerima</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
                    <div><label className={labelClass}>NAMA LENGKAP *</label><input name="nama" className={inputClass} placeholder="Masukkan nama lengkap" value={formData.nama} onChange={handleChange} /></div>
                    <div><label className={labelClass}>NIK *</label><input name="nik" className={inputClass} placeholder="Masukkan 16 digit NIK" maxLength={16} inputMode="numeric" value={formData.nik} onChange={handleChange} /></div>
                    <div><label className={labelClass}>NO. TELEPON *</label><input name="phone" className={inputClass} placeholder="Contoh: 081234567890" value={formData.phone} onChange={handleChange} /></div>
                    
                    {/* UBAH: Dropdown Desil dan Note Link Kemensos */}
                    <div>
                      <label className={labelClass}>DESIL *</label>
                      <select 
                        name="desil" 
                        required
                        className={inputClass} 
                        value={formData.desil} 
                        onChange={handleChange}
                      >
                        <option value="" disabled>Pilih Status Desil...</option>
                        <option value="1">Desil 1 (Sangat Miskin)</option>
                        <option value="2">Desil 2 (Miskin)</option>
                        <option value="3">Desil 3 (Hampir Miskin)</option>
                        <option value="4">Desil 4 (Rentan Miskin)</option>
                        <option value="5">Desil 5 (Pas-pasan)</option>
                        <option value="6">Desil 6 (Menengah ke Atas)</option>
                        <option value="-">Tidak Ditemukan</option>
                      </select>
                      <p className="mt-1.5 text-[11px] text-gray-500 italic leading-snug">
                        * Apabila status desil belum diketahui, silakan periksa menggunakan NIK melalui situs Cek Bansos Kemensos.{" "}
                        <a 
                          href="https://cekbansos.kemensos.go.id/" 
                          target="_blank" 
                          rel="noreferrer" 
                          className="font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          cekbansos.kemensos.go.id
                        </a>
                      </p>
                    </div>

                  </div>
                  <div className="flex justify-end pt-4 border-t border-gray-100 mt-6">
                    <button onClick={() => handleNextStep(1)} className="bg-[#ffc107] text-[#072456] px-8 py-3 rounded-xl font-bold text-sm hover:bg-[#f5b027] transition-colors shadow-sm flex items-center gap-2">Lanjut ke Lokasi <ArrowRight size={16} /></button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="sm:col-span-2">
                      <label className={labelClass}>KABUPATEN/KOTA *</label>
                      <select 
                        name="kabupaten" 
                        className={`${inputClass} ${!isProvinsi ? 'bg-gray-100 text-gray-500 cursor-not-allowed opacity-90' : ''}`} 
                        value={formData.kabupaten} 
                        onChange={handleChange}
                        disabled={!isProvinsi}
                      >
                        <option value="">Pilih Kabupaten</option>
                        {KABUPATEN_NTT.map(k => <option key={k} value={k}>{k}</option>)}
                      </select>
                      {!isProvinsi && (
                        <p className="mt-1.5 text-xs text-blue-600 font-semibold italic">
                          * Terkunci pada otoritas wilayah Anda.
                        </p>
                      )}
                    </div>
                    <div className="sm:col-span-2"><label className={labelClass}>ALAMAT LENGKAP *</label><input name="alamat" className={inputClass} placeholder="Nama jalan, gang, atau patokan" value={formData.alamat} onChange={handleChange} /></div>
                    <div><label className={labelClass}>KECAMATAN *</label><input name="kecamatan" className={inputClass} placeholder="Masukkan Kecamatan" value={formData.kecamatan} onChange={handleChange} /></div>
                    <div><label className={labelClass}>KELURAHAN/DESA *</label><input name="kelurahan" className={inputClass} placeholder="Masukkan Kelurahan/Desa" value={formData.kelurahan} onChange={handleChange} /></div>
                    <div><label className={labelClass}>RT *</label><input name="rt" className={inputClass} placeholder="000" inputMode="numeric" value={formData.rt} onChange={handleChange} /></div>
                    <div><label className={labelClass}>RW *</label><input name="rw" className={inputClass} placeholder="000" inputMode="numeric" value={formData.rw} onChange={handleChange} /></div>
                    <div><label className={labelClass}>LATITUDE *</label><input name="lat" className={inputClass} placeholder="-10.xxxxxx" value={formData.lat} onChange={handleChange} /></div>
                    <div><label className={labelClass}>LONGITUDE *</label><input name="long" className={inputClass} placeholder="123.xxxxxx" value={formData.long} onChange={handleChange} /></div>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-6">
                    <button onClick={() => setStep(1)} className="text-sm font-bold text-gray-500 hover:text-[#072456] transition-colors">← Kembali</button>
                    <button onClick={() => handleNextStep(2)} className="bg-[#ffc107] text-[#072456] px-8 py-3 rounded-xl font-bold text-sm hover:bg-[#f5b027] transition-colors shadow-sm flex items-center gap-2">Lanjut ke Dokumen <ArrowRight size={16} /></button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-6 text-blue-900 shadow-sm flex flex-col items-center text-center">
                    <FolderOpen className="h-12 w-12 text-blue-500 mb-3" />
                    <h4 className="text-sm font-bold uppercase tracking-wider text-blue-950 mb-2">PEMBUATAN FOLDER OTOMATIS</h4>
                    <p className="text-xs text-blue-900 leading-relaxed max-w-lg">
                      Sistem akan secara otomatis membuatkan direktori folder di Google Drive (lengkap dengan sub-folder Progres 25%, 50%, 75%, dan 100%) untuk menyimpan dokumen penerima bantuan ini. Tautan (link) akan diberikan di akhir halaman.
                    </p>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-8">
                    <button onClick={() => setStep(2)} className="text-sm font-bold text-gray-500 hover:text-[#072456] transition-colors">← Kembali</button>
                    <button onClick={() => handleNextStep(3)} className="bg-[#ffc107] text-[#072456] px-8 py-3 rounded-xl font-bold text-sm hover:bg-[#f5b027] transition-colors shadow-sm flex items-center gap-2">Cek Konfirmasi <ArrowRight size={16} /></button>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 text-[#072456] bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <CheckCircle className="text-blue-600" />
                    <div>
                      <h4 className="font-bold text-sm">Konfirmasi Akhir</h4>
                      <p className="text-xs text-blue-800/80">Pastikan semua data di bawah ini sudah akurat sebelum dikirim ke server.</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 text-sm bg-gray-50 border border-gray-100 p-6 rounded-xl">
                     <div><span className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nama</span><span className="font-semibold text-gray-900">{formData.nama}</span></div>
                     <div><span className="block text-[10px] font-bold text-gray-500 uppercase mb-1">NIK</span><span className="font-semibold text-gray-900">{formData.nik}</span></div>
                     {/* Info Desil di Konfirmasi Akhir */}
                     <div><span className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Desil</span><span className="font-semibold text-gray-900">{formData.desil}</span></div>
                     <div><span className="block text-[10px] font-bold text-gray-500 uppercase mb-1">No. Telepon</span><span className="font-semibold text-gray-900">{formData.phone}</span></div>
                     <div className="sm:col-span-2"><span className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Alamat</span><span className="font-medium text-gray-800">{formData.alamat}, RT {formData.rt}/RW {formData.rw}, {formData.kelurahan}, {formData.kecamatan}, {formData.kabupaten}</span></div>
                     <div className="sm:col-span-2"><span className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Koordinat</span><span className="font-medium text-gray-800">{formData.lat}, {formData.long}</span></div>
                     <div className="sm:col-span-2 bg-blue-50/50 border border-blue-100 p-3 rounded-lg text-center">
                        <span className="text-xs text-blue-700 italic">Folder upload dokumen akan dibuat otomatis setelah pengajuan dikirim.</span>
                     </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-8">
                    <button onClick={() => setStep(3)} className="text-sm font-bold text-gray-500 hover:text-[#072456] transition-colors disabled:opacity-50" disabled={loading}>← Kembali Edit</button>
                    <button onClick={handleSubmit} disabled={loading} className="bg-[#072456] text-white px-8 py-3.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-[#0a3275] transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed">
                        {loading ? <><Loader2 className="animate-spin" size={16}/> Memproses Data...</> : <>Kirim Data Pengajuan <Save size={16} /></>}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* KUSTOM POP-UP MODAL PERINGATAN / ERROR */}
      {alertModal.show && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#072456]/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200">
            <div className={`flex items-center gap-3 px-6 py-4 ${alertModal.type === 'error' ? 'bg-red-50 border-b border-red-100' : 'bg-amber-50 border-b border-amber-100'}`}>
              <AlertCircle className={`h-6 w-6 shrink-0 ${alertModal.type === 'error' ? 'text-red-600' : 'text-amber-600'}`} />
              <h3 className={`text-sm font-extrabold uppercase tracking-wide ${alertModal.type === 'error' ? 'text-red-900' : 'text-amber-900'}`}>
                {alertModal.title}
              </h3>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {alertModal.message}
              </p>
            </div>
            
            <div className="bg-gray-50 px-6 py-4 flex justify-end border-t border-gray-100">
              <button
                onClick={() => setAlertModal({ ...alertModal, show: false })}
                className="rounded-xl bg-[#072456] px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-[#0a3275] active:scale-95"
              >
                Tutup Peringatan
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}