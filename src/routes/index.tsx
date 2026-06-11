import { useMemo } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  FilePlus2,
  Database,
  Home,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldCheck,
  BarChart3,
  Map,
  Loader2,
} from "lucide-react";

import { PageShell } from "@/components/page-shell";
import { getDistricts, getActivity } from "@/lib/api";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    // --- PENAMBAHAN PENGAMANAN SSR DI SINI ---
    if (typeof window !== "undefined") {
      // UBAH DI SINI: Cek kedua tempat penyimpanan (session & local)
      const isAuthenticated = sessionStorage.getItem("auth_token") || localStorage.getItem("auth_token");
      if (!isAuthenticated) throw redirect({ to: "/login" });
    }
    // -----------------------------------------
  },
  component: Index,
});

function Index() {
  const { data: fetchedDistricts, isLoading: isLoadingDistricts } = useQuery({
    queryKey: ["districtsData"],
    queryFn: getDistricts,
  });

  const { data: fetchedActivity, isLoading: isLoadingActivity } = useQuery({
    queryKey: ["activityData"],
    queryFn: getActivity,
  });

  const activeDistricts = Array.isArray(fetchedDistricts) ? fetchedDistricts : [];
  const activeActivity = Array.isArray(fetchedActivity) ? fetchedActivity : [];

  const isLoading = isLoadingDistricts || isLoadingActivity;

  // Kalkulasi KPI dari data agregasi kabupaten (Dioptimasi dengan useMemo)
  const { totalRtlh, totalAssisted, totalVerifying, totalDistrictCount } = useMemo(() => {
    return {
      totalRtlh: activeDistricts.reduce((sum, item: any) => sum + (Number(item.total) || 0), 0),
      totalAssisted: activeDistricts.reduce((sum, item: any) => sum + (Number(item.assisted) || 0), 0),
      totalVerifying: activeDistricts.reduce((sum, item: any) => sum + (Number(item.verifying) || 0), 0),
      totalDistrictCount: activeDistricts.length
    };
  }, [activeDistricts]);

  const stats = [
    { label: "Total RTLH Terdata", value: totalRtlh.toLocaleString("id-ID"), icon: Home, tone: "text-info" },
    { label: "Rumah Terbantu", value: totalAssisted.toLocaleString("id-ID"), icon: CheckCircle2, tone: "text-success" },
    { label: "Dalam Verifikasi", value: totalVerifying.toLocaleString("id-ID"), icon: Clock, tone: "text-warning" },
    { label: "Total Kabupaten", value: totalDistrictCount.toLocaleString("id-ID"), icon: MapPin, tone: "text-accent-gold" },
  ];

  return (
    <PageShell>
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h1 className="text-4xl font-extrabold lg:text-6xl">
            Sistem Informasi <br /> <span className="text-accent-gold">Rumah Tidak Layak Huni</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg opacity-90">
            Platform terpadu untuk pendataan, verifikasi, dan monitoring bantuan rumah layak huni Provinsi NTT.
          </p>
          <div className="mt-8 flex gap-3">
            <Link
              to="/submit"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-gold px-6 py-3 font-semibold text-accent-gold-foreground shadow-gold transition-transform hover:scale-105"
            >
              <FilePlus2 className="h-4 w-4" /> Ajukan Bantuan
            </Link>
          </div>
        </div>
      </section>

      {/* 2. STATS SECTION */}
      <section className="relative z-10 mx-auto -mt-10 max-w-7xl px-4 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <div key={i} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-elevated">
              <div className={`grid h-12 w-12 place-items-center rounded-full bg-muted/50 ${s.tone}`}>
                <s.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold">{isLoading ? "..." : s.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. FEATURES SECTION */}
      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Database, title: "Pendataan Terpadu", desc: "Basis data RTLH terintegrasi langsung dengan Spreadsheet." },
            { icon: ShieldCheck, title: "Verifikasi Berjenjang", desc: "Alur verifikasi data transparan dari lapangan hingga pusat." },
            { icon: BarChart3, title: "Analitik Real-time", desc: "Dashboard KPI interaktif yang diperbarui secara otomatis." },
            { icon: Map, title: "Pemetaan GIS", desc: "Peta sebaran lokasi RTLH berbasis koordinat geografis presisi." },
          ].map((f, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-6 shadow-soft hover:shadow-md transition-shadow">
              <f.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-4 font-bold text-foreground">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. CAPAIAN PER KABUPATEN */}
      <section className="bg-primary-soft/40 py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold text-primary-deep">Capaian per Kabupaten</h2>
              <p className="text-sm text-muted-foreground mt-1">Ringkasan kuota terdata dan progres pemulihan bantuan.</p>
            </div>
            <Link to="/dashboard" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
              Lihat Analitik Lengkap <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : activeDistricts.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">Belum ada data kabupaten terinput.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {activeDistricts.slice(0, 4).map((d: any, idx: number) => {
                // Hitung progres persentase secara real-time
                const progressPercentage = d.total > 0 ? Math.round((d.assisted / d.total) * 100) : 0;

                return (
                  <div key={d.name || idx} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                    <div className="flex justify-between items-center mb-4">
                      <MapPin className="h-5 w-5 text-primary" />
                      <span className="text-xs font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">
                        {progressPercentage}% Selesai
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{d.name}</p>
                    <p className="text-3xl font-extrabold mt-1">{Number(d.total || 0).toLocaleString("id-ID")}</p>
                    <span className="text-xs text-muted-foreground">Unit Terdata</span>
                    <div className="mt-4 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-gold rounded-full transition-all duration-500"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 5. AKTIVITAS & HELP CARD */}
      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h3 className="text-lg font-bold mb-4 text-primary-deep">Aktivitas Terbaru</h3>
          
          {isLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : activeActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Belum ada aktivitas terbaru saat ini.</p>
          ) : (
            <ul className="space-y-4">
              {activeActivity.slice(0, 5).map((a: any, i: number) => {
                // Memformat visual penanda waktu (Timestamp)
                const formattedTime = a.waktu
                  ? new Date(a.waktu).toLocaleString("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "-";

                return (
                  <li key={a.id || i} className="border-b last:border-0 pb-3 flex flex-col gap-0.5">
                    <p className="text-sm font-medium text-foreground">
                      <span className="font-semibold text-primary">{a.nama}</span> dari <span className="font-semibold">{a.kabupaten}</span> telah masuk dalam tahap <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-primary/10 text-primary">{a.status}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{formattedTime}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-2xl bg-primary text-primary-foreground p-6 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold">Butuh Bantuan Pengajuan?</h3>
            <p className="text-sm opacity-90 mt-2 leading-relaxed">
              Jika Anda mendapati hunian yang membutuhkan bantuan pemugaran atau ingin mengajukan usulan baru program RTLH, silakan masuk ke portal form pengisian resmi.
            </p>
          </div>
          <Link
            to="/submit"
            className="w-full mt-6 inline-flex justify-center items-center gap-2 rounded-full bg-white text-primary px-6 py-3 font-semibold shadow transition-transform hover:bg-neutral-50 active:scale-95"
          >
            Mulai Pengajuan Online
          </Link>
        </div>
      </section>
    </PageShell>
  );
}