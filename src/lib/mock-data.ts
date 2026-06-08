export const districts = [
  { id: "bandung-utara", name: "Bandung Utara", total: 1240, assisted: 820, verifying: 180, progress: 66 },
  { id: "bandung-selatan", name: "Bandung Selatan", total: 980, assisted: 540, verifying: 220, progress: 55 },
  { id: "bandung-barat", name: "Bandung Barat", total: 1560, assisted: 1020, verifying: 240, progress: 65 },
  { id: "bandung-timur", name: "Bandung Timur", total: 870, assisted: 480, verifying: 150, progress: 55 },
  { id: "cimahi", name: "Cimahi", total: 640, assisted: 410, verifying: 95, progress: 64 },
  { id: "lembang", name: "Lembang", total: 520, assisted: 280, verifying: 110, progress: 54 },
  { id: "soreang", name: "Soreang", total: 720, assisted: 360, verifying: 180, progress: 50 },
  { id: "majalaya", name: "Majalaya", total: 590, assisted: 330, verifying: 120, progress: 56 },
] as const;

export type Status = "Selesai" | "Dalam Proses" | "Verifikasi";

export type RtlhRow = {
  id: string;
  nama: string;
  nik: string;
  alamat: string;
  kelurahan: string;
  Kabupaten: string;
  kondisi: "Rusak Berat" | "Rusak Sedang" | "Rusak Ringan";
  status: Status;
  progress: number;
  lat: number;
  lng: number;
};

const namaPool = [
  "Ahmad Sutrisno","Siti Aminah","Budi Hartono","Dewi Lestari","Rahmat Hidayat",
  "Nurul Hasanah","Joko Santoso","Eka Pratiwi","Hendra Wijaya","Lina Marlina",
  "Agus Salim","Yuli Andriani","Rizki Maulana","Indah Permata","Bambang Sugeng",
  "Tuti Alawiyah","Fajar Nugroho","Mega Kusuma","Dedi Kurniawan","Sri Wahyuni",
];

const kelurahanPool = ["Sukajadi","Cipaganti","Cihampelas","Dago","Antapani","Arcamanik","Buahbatu","Cibiru"];

const kondisiPool = ["Rusak Berat","Rusak Sedang","Rusak Ringan"] as const;
const statusPool: Status[] = ["Selesai","Dalam Proses","Verifikasi"];

function seeded(i: number) {
  return ((i * 9301 + 49297) % 233280) / 233280;
}

export const rtlhRows: RtlhRow[] = Array.from({ length: 48 }, (_, i) => {
  const k = districts[i % districts.length];
  const status = statusPool[i % statusPool.length];
  const progress =
    status === "Selesai" ? 100 : status === "Dalam Proses" ? 40 + ((i * 7) % 50) : 5 + ((i * 3) % 20);
  return {
    id: `RTLH-${String(1001 + i)}`,
    nama: namaPool[i % namaPool.length],
    nik: `32${String(7300000000 + i * 137).slice(0, 14)}`,
    alamat: `Jl. Merdeka No. ${10 + (i % 80)}`,
    kelurahan: kelurahanPool[i % kelurahanPool.length],
    Kabupaten: k.name,
    kondisi: kondisiPool[i % kondisiPool.length],
    status,
    progress,
    lat: -6.9 + seeded(i + 1) * 0.25,
    lng: 107.55 + seeded(i + 7) * 0.35,
  };
});

export const kpis = {
  totalRtlh: rtlhRows.length * 142,
  assisted: Math.round(rtlhRows.length * 142 * 0.58),
  verifying: Math.round(rtlhRows.length * 142 * 0.18),
  districts: districts.length,
};

export const monthlyAid = [
  { month: "Jan", diajukan: 240, disetujui: 180, selesai: 120 },
  { month: "Feb", diajukan: 280, disetujui: 220, selesai: 160 },
  { month: "Mar", diajukan: 320, disetujui: 260, selesai: 200 },
  { month: "Apr", diajukan: 360, disetujui: 290, selesai: 240 },
  { month: "Mei", diajukan: 410, disetujui: 330, selesai: 280 },
  { month: "Jun", diajukan: 450, disetujui: 370, selesai: 310 },
  { month: "Jul", diajukan: 480, disetujui: 400, selesai: 340 },
  { month: "Agu", diajukan: 520, disetujui: 430, selesai: 380 },
  { month: "Sep", diajukan: 560, disetujui: 470, selesai: 410 },
  { month: "Okt", diajukan: 600, disetujui: 510, selesai: 450 },
  { month: "Nov", diajukan: 640, disetujui: 550, selesai: 490 },
  { month: "Des", diajukan: 690, disetujui: 590, selesai: 530 },
];

export const conditionBreakdown = [
  { name: "Rusak Berat", value: 1820, color: "oklch(0.58 0.22 27)" },
  { name: "Rusak Sedang", value: 2640, color: "oklch(0.78 0.16 75)" },
  { name: "Rusak Ringan", value: 1980, color: "oklch(0.62 0.15 152)" },
];

export const activity = [
  { time: "2 menit lalu", text: "Pengajuan baru dari Siti Aminah — Kec. Bandung Utara", type: "submit" },
  { time: "18 menit lalu", text: "Verifikasi disetujui untuk RTLH-1042", type: "approve" },
  { time: "1 jam lalu", text: "Pembangunan RTLH-1019 selesai (100%)", type: "done" },
  { time: "3 jam lalu", text: "Foto progres diunggah — Kec. Cimahi", type: "upload" },
  { time: "Kemarin", text: "Laporan bulanan Oktober dipublikasikan", type: "report" },
];