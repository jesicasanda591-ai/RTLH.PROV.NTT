// src/lib/api/index.ts

export type Status = "Pengajuan" | "Verifikasi" | "Survei" | "Validasi" | "Penetapan" | "Selesai";

// 1. Interface Utama
export interface RtlhData {
  id: string;
  timestamp: string;
  nik: string;
  nama: string;
  desil: string; // <-- KOLOM BARU DITAMBAHKAN
  telepon: string;
  email: string;
  kabupaten: string;
  kecamatan: string;
  kelurahan: string;
  rt: string;
  rw: string;
  alamat: string;
  koordinat: string;
  lat: number;
  lng: number;
  linkDrive: string; 
  progress: number;
  kerusakan: string;
  status: Status;
  progres25: string;
  progres50: string;
  progres75: string;
  progres100: string;
}

export interface SaveResponse {
  status: string;
  id?: string;
  folderUrl?: string; 
  message?: string;
}

export interface DistrictData {
  name: string;
  total: number;
  assisted: number;
  verifying: number;
}

export interface MonthlyData {
  month: string;
  diajukan: number;
  disetujui: number;
  selesai: number;
  order: number;
}

export interface ActivityData {
  id: string;
  waktu: string;
  nama: string;
  kabupaten: string;
  status: Status;
}

// URL Web App Apps Script
const BASE_URL = "https://script.google.com/macros/s/AKfycbxrmD2cSnEdEpToTJDJokCo4if12CLGkMiaGDZktzvJzqmkB_TrGJ1oUfK1QuXZe5bF/exec";

// 3. Fungsi Normalizer
const parseRawRtlh = (raw: any): RtlhData => {
  const coords = raw.koordinat ? String(raw.koordinat).split(",") : ["0", "0"];
  
  return {
    id: String(raw.id || raw.Timestamp || Math.random()),
    timestamp: raw.timestamp || "",
    nik: raw.nik || "",
    nama: raw.nama || "",
    desil: raw.desil || "", // <-- NORMALIZER DITAMBAHKAN
    telepon: raw.telepon || "",
    email: raw.email || "",
    kabupaten: raw.kabupaten || "",
    kecamatan: raw.kecamatan || "",
    kelurahan: raw.kelurahan || "",
    rt: raw.rt || "",
    rw: raw.rw || "",
    alamat: raw.alamat || "",
    koordinat: raw.koordinat || "",
    lat: Number(coords[0]?.trim()) || 0,
    lng: Number(coords[1]?.trim()) || 0,
    linkDrive: raw.linkDrive || raw.scanKtp || "",
    progress: Number(raw.progress) || 0,
    kerusakan: raw.kerusakan || "",
    status: (raw.status as Status) || "Pengajuan",
    progres25: raw.progres25 || "",
    progres50: raw.progres50 || "",
    progres75: raw.progres75 || "",
    progres100: raw.progres100 || "",
  };
};

// 4. FUNGSI API

export async function getBnbaData(): Promise<RtlhData[]> {
  try {
    const response = await fetch(`${BASE_URL}?type=rows`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const textData = await response.text();
    const rawData = JSON.parse(textData);
    return Array.isArray(rawData) ? rawData.map(parseRawRtlh) : [];
  } catch (error) {
    console.error("Error getBnbaData:", error);
    return [];
  }
}

export const getRtlhRows = getBnbaData;

// --- FUNGSI DIPERBARUI: Tambah parameter `koordinat` ---
export async function updateBnbaStatus(id: string, status: string, kerusakan?: string, koordinat?: string): Promise<any> {
  try {
    const payload: any = { action: "updateStatus", id, status, kerusakan };
    
    // Masukkan koordinat ke payload jika ada nilainya
    if (koordinat) {
      payload.koordinat = koordinat;
    }

    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    const textData = await response.text();
    return JSON.parse(textData);
  } catch (error: any) {
    console.error("Error updateBnbaStatus:", error);
    return { status: "error", message: error.message };
  }
}

// FUNGSI BARU: Mengirim progres ke Spreadsheet
export async function updateBnbaProgress(id: string, progressValue: number): Promise<any> {
  try {
    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "updateProgress", id, progress: progressValue }),
    });
    const textData = await response.text();
    return JSON.parse(textData);
  } catch (error: any) {
    console.error("Error updateBnbaProgress:", error);
    return { status: "error", message: error.message };
  }
}

export async function getDistricts(): Promise<DistrictData[]> {
  try {
    const response = await fetch(`${BASE_URL}?type=districts`);
    if (!response.ok) return [];
    const textData = await response.text();
    return JSON.parse(textData);
  } catch (error) {
    console.error("Error getDistricts:", error);
    return [];
  }
}

export async function getMonthlyAid(): Promise<MonthlyData[]> {
  try {
    const response = await fetch(`${BASE_URL}?type=monthly`);
    if (!response.ok) return [];
    const textData = await response.text();
    return JSON.parse(textData);
  } catch (error) {
    console.error("Error getMonthlyAid:", error);
    return [];
  }
}

export async function getActivity(): Promise<ActivityData[]> {
  try {
    const response = await fetch(`${BASE_URL}?type=activity`);
    if (!response.ok) return [];
    const textData = await response.text();
    return JSON.parse(textData);
  } catch (error) {
    console.error("Error getActivity:", error);
    return [];
  }
}

export async function saveDataToSheet(formData: any): Promise<SaveResponse> {
  try {
    const payload = {
      nik: formData.nik || "",
      nama: formData.nama || "",
      desil: formData.desil || "", // <-- PAYLOAD DITAMBAHKAN UNTUK INSERT
      phone: formData.telepon || formData.phone || "",
      email: formData.email || "",
      kabupaten: formData.kabupaten || "",
      kecamatan: formData.kecamatan || "",
      kelurahan: formData.kelurahan || "",
      rt: formData.rt || "",
      rw: formData.rw || "",
      alamat: formData.alamat || "",
      lat: Number(formData.lat) || 0,
      long: Number(formData.lng || formData.long) || 0,
    };

    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    const textData = await response.text();
    return JSON.parse(textData);
  } catch (error: any) {
    console.error("Error saveDataToSheet:", error);
    return { status: "error", message: error.message || "Koneksi terputus" };
  }
}