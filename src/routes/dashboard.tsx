import { useMemo } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/page-shell";
import { StatCard } from "@/components/stat-card";
import { getDistricts, getMonthlyAid, getBnbaData } from "@/lib/api"; 
import { Home, CheckCircle2, Clock, MapPin, Loader2 } from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ 
    meta: [
      { title: "Dashboard · SIM-RTLH · NTT" }, 
      { name: "description", content: "Dashboard analitik program RTLH nasional." }
    ] 
  }),
  beforeLoad: () => {
    // --- PENAMBAHAN PENGAMANAN SSR ---
    if (typeof window !== "undefined") {
      // UBAH DI SINI: Mendukung sessionStorage dan localStorage sekaligus
      const isAuthenticated = sessionStorage.getItem("auth_token") || localStorage.getItem("auth_token");
      if (!isAuthenticated) {
        throw redirect({ to: "/login" });
      }
    }
    // ---------------------------------
  },
  component: DashboardPage,
});

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight="bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CustomLegend = (props: any) => {
  const { payload } = props;
  return (
    <ul className="flex w-full flex-col gap-2 px-8 pt-4">
      {payload.map((entry: any, index: number) => (
        <li key={`item-${index}`} className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2.5">
            <span className="block h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.value}</span>
          </div>
          <span className="font-semibold text-primary-deep">
            {entry.payload.value.toLocaleString("id-ID")}
          </span>
        </li>
      ))}
    </ul>
  );
};

function DashboardPage() {
  const { data: districts, isLoading: dLoading } = useQuery({ queryKey: ["districtsData"], queryFn: getDistricts });
  const { data: monthlyAid, isLoading: mLoading } = useQuery({ queryKey: ["monthlyAid"], queryFn: getMonthlyAid });
  const { data: rows, isLoading: rLoading } = useQuery({ queryKey: ["bnbaData"], queryFn: getBnbaData });

  const safeDistricts = useMemo(() => Array.isArray(districts) ? districts : [], [districts]);
  const safeMonthlyAid = useMemo(() => Array.isArray(monthlyAid) ? monthlyAid : [], [monthlyAid]);
  const safeRows = useMemo(() => Array.isArray(rows) ? rows : [], [rows]);

  const isLoading = dLoading || mLoading || rLoading;

  // Memoized KPI calculations for performance
  const kpis = useMemo(() => ({
    totalRtlh: safeDistricts.reduce((acc: number, d: any) => acc + (Number(d.total) || 0), 0),
    assisted: safeDistricts.reduce((acc: number, d: any) => acc + (Number(d.assisted) || 0), 0),
    verifying: safeDistricts.reduce((acc: number, d: any) => acc + (Number(d.verifying) || 0), 0),
    districts: safeDistricts.length,
  }), [safeDistricts]);

  const conditionBreakdown = useMemo(() => [
    { name: "Rusak Berat", value: safeRows.filter((r: any) => r.kerusakan === "Rusak Berat").length, color: "#dc2626" },
    { name: "Rusak Sedang", value: safeRows.filter((r: any) => r.kerusakan === "Rusak Sedang").length, color: "#f59e0b" },
    { name: "Rusak Ringan", value: safeRows.filter((r: any) => r.kerusakan === "Rusak Ringan").length, color: "#16a34a" },
  ], [safeRows]);

  // FIX: Membuat salinan array (spread operator) sebelum di-sort agar tidak merusak state asli React
  const sortedDistricts = useMemo(() => {
    return [...safeDistricts].sort((a: any, b: any) => {
      const progA = a.total > 0 ? a.assisted / a.total : 0;
      const progB = b.total > 0 ? b.assisted / b.total : 0;
      return progB - progA;
    });
  }, [safeDistricts]);

  return (
    <PageShell>
      <PageHeader eyebrow="Dashboard Analitik" title="Ringkasan Kinerja Program RTLH" description="Pantau capaian dan tren secara real-time." />

      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Home} label="Total RTLH" value={kpis.totalRtlh.toLocaleString("id-ID")} tone="info" />
          <StatCard icon={CheckCircle2} label="Rumah Terbantu" value={kpis.assisted.toLocaleString("id-ID")} tone="success" />
          <StatCard icon={Clock} label="Dalam Verifikasi" value={kpis.verifying.toLocaleString("id-ID")} tone="warning" />
          <StatCard icon={MapPin} label="Total Kabupaten" value={kpis.districts.toString()} tone="gold" />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h3 className="text-base font-bold text-primary-deep">Tren Bantuan RTLH</h3>
            <div className="mt-5 h-72">
              {isLoading ? <LoadingSpinner /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={safeMonthlyAid} margin={{ left: -20, right: 8, top: 10 }}>
                    <CartesianGrid strokeDasharray="3 6" stroke="oklch(0.92 0.01 250)" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} style={{ fontSize: 12 }} />
                    <YAxis tickLine={false} axisLine={false} style={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: 12 }} />
                    <Area type="monotone" dataKey="diajukan" stroke="oklch(0.28 0.13 263)" fill="oklch(0.28 0.13 263)" fillOpacity={0.1} />
                    <Area type="monotone" dataKey="disetujui" stroke="oklch(0.82 0.16 85)" fill="oklch(0.82 0.16 85)" fillOpacity={0.2} />
                    <Area type="monotone" dataKey="selesai" stroke="oklch(0.62 0.15 152)" fill="oklch(0.62 0.15 152)" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h3 className="text-base font-bold text-primary-deep">Kondisi Rumah</h3>
            <div className="mt-2 h-80">
              {isLoading ? <LoadingSpinner /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={conditionBreakdown} 
                      dataKey="value" 
                      nameKey="name" 
                      innerRadius={55} 
                      outerRadius={75} 
                      paddingAngle={4} 
                      stroke="none"
                      labelLine={false}
                      label={renderCustomizedLabel}
                    >
                      {conditionBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                    <Legend content={<CustomLegend />} verticalAlign="bottom" />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h3 className="text-base font-bold text-primary-deep">Capaian per Kabupaten</h3>
            <div className="mt-5 h-72">
              {isLoading ? <LoadingSpinner /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={safeDistricts} margin={{ left: -20 }}>
                    <CartesianGrid strokeDasharray="3 6" stroke="oklch(0.92 0.01 250)" vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} style={{ fontSize: 11 }} />
                    <YAxis tickLine={false} axisLine={false} style={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="total" fill="oklch(0.28 0.13 263)" radius={[4,4,0,0]} />
                    <Bar dataKey="assisted" fill="oklch(0.82 0.16 85)" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h3 className="text-base font-bold text-primary-deep">Progres Kabupaten</h3>
            {isLoading ? <LoadingSpinner /> : (
              <div className="mt-5 flex flex-col gap-5 h-72 overflow-y-auto pr-2">
                {sortedDistricts.map((d: any, i: number) => {
                  const percentage = d.total > 0 ? Math.round((d.assisted / d.total) * 100) : 0;
                  return (
                    <div key={i} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-foreground">{d.name}</span>
                        <span className="font-bold text-primary">{percentage}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function LoadingSpinner() {
  return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
}