import { useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { PageShell } from "@/components/page-shell";
import { ClipboardCheck, ArrowRight, Save, CheckCircle, Loader2, FolderOpen, ExternalLink } from "lucide-react";

// Sesuaikan path import ini jika letak folder lib Anda berbeda
import { saveDataToSheet } from "@/lib/api"; 

const KABUPATEN_NTT = [
  "Kota Kupang", "Kab. Kupang", "Kab. Timor Tengah Selatan", "Kab. Timor Tengah Utara", 
  "Kab. Belu", "Kab. Alor", "Kab. Flores Timur", "Kab. Sikka", "Kab. Ende", 
  "Kab. Ngada", "Kab. Manggarai", "Kab. Lembata", "Kab. Rote Ndao", "Kab. Manggarai Barat", 
  "Kab. Nagekeo", "Kab. Sumba Tengah", "Kab. Sumba Barat Daya", "Kab. Manggarai Timur", 
  "Kab. Sabu Raijua", "Kab. Malaka", "Kab. Sumba Timur", "Kab. Sumba Barat"
].sort();

export const Route = createFileRoute("/submit")({
  beforeLoad: () => { 
    if (typeof window !== 'undefined') {
      if (!localStorage.getItem("auth_token")) {
        throw redirect({ to: "/login" });
      }
    }
  },
  component: SubmitPage,
});

function SubmitPage() {
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedId, setGeneratedId] = useState("");
  const [generatedFolderUrl, setGeneratedFolderUrl] = useState(""); 
  
  const [formData, setFormData] = useState({
    nama: "", nik: "", phone: "", email: "",
    kabupaten: "", alamat: "", kecamatan: "", kelurahan: "", rt: "", rw: "",
    lat: "", long: ""
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
      if (!formData.nama || formData.nik.length !== 16 || !formData.phone) {
        alert("Mohon lengkapi Nama, NIK (harus 16 digit), dan No. Telepon!");
        return;
      }
      setStep(2);
    } else if (currentStep === 2) {
      if (!formData.kabupaten || !formData.alamat || !formData.kecamatan || !formData.kelurahan || !formData.rt || !formData.rw || !formData.lat || !formData.long) {
        alert("Mohon lengkapi semua data lokasi bertanda bintang (*)");
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
        // Menambahkan fallback || "" agar TypeScript tidak error
        setGeneratedId(result.id || ""); 
        
        if (result.folderUrl) {
          setGeneratedFolderUrl(result.folderUrl || "");
        }
      } else {
        throw new Error(result?.message || "Gagal dari server");
      }
    } catch (error: any) {
      console.error("Error submit data:", error);
      alert(error.message || "Gagal mengirim data. Pastikan koneksi lancar.");
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
                    <div><label className={labelClass}>EMAIL</label><input name="email" className={inputClass} placeholder="Masukkan alamat email" type="email" value={formData.email} onChange={handleChange} /></div>
                  </div>
                  <div className="flex justify-end pt-4 border-t border-gray-100 mt-6">
                    <button onClick={() => handleNextStep(1)} className="bg-[#ffc107] text-[#072456] px-8 py-3 rounded-xl font-bold text-sm hover:bg-[#f5b027] transition-colors shadow-sm flex items-center gap-2">Lanjut ke Lokasi <ArrowRight size={16} /></button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="sm:col-span-2"><label className={labelClass}>KABUPATEN/KOTA *</label><select name="kabupaten" className={inputClass} value={formData.kabupaten} onChange={handleChange}><option value="">Pilih Kabupaten</option>{KABUPATEN_NTT.map(k => <option key={k} value={k}>{k}</option>)}</select></div>
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
                     <div><span className="block text-[10px] font-bold text-gray-500 uppercase mb-1">No. Telepon</span><span className="font-semibold text-gray-900">{formData.phone}</span></div>
                     <div><span className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Alamat</span><span className="font-medium text-gray-800">{formData.alamat}, RT {formData.rt}/RW {formData.rw}, {formData.kelurahan}, {formData.kecamatan}, {formData.kabupaten}</span></div>
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
    </PageShell>
  );
}