import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Home, LayoutDashboard, Database, MapPin, Map, FilePlus2, Activity, Menu, X, Building2, ShieldCheck, LogOut, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Beranda", icon: Home },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/rtlh", label: "Data RTLH", icon: Database },
  { to: "/districts", label: "Kabupaten", icon: MapPin },
  { to: "/map", label: "Peta RTLH", icon: Map },
  { to: "/submit", label: "Pengajuan", icon: FilePlus2 },
  { to: "/monitoring", label: "Monitoring", icon: Activity },
] as const;

export function SiteNavbar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  
  // State untuk kontrol visibilitas menu logout dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // State untuk menyimpan nama kabupaten yang sedang login
  const [userKabupaten, setUserKabupaten] = useState<string>("Kota Kupang");

  // Mengambil sesi wilayah login secara aman saat komponen dimuat
  useEffect(() => {
    const sessionKabupaten = localStorage.getItem("user_kabupaten");
    if (sessionKabupaten) {
      setUserKabupaten(sessionKabupaten);
    }
  }, []);

  // Fungsi penanganan keluar dari akun pengguna
  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_kabupaten");
    setIsDropdownOpen(false);
    setOpen(false);
    navigate({ to: "/login" });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 glass">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
        
        {/* BRAND LOGO */}
        <Link to="/" className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-hero shadow-soft">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <div className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">SIM-RTLH · NTT</div>
            <div className="text-sm font-bold text-primary-deep">Rumah Tidak Layak Huni</div>
          </div>
        </Link>

        {/* NAVIGATION MENUS */}
        <nav className="hidden items-center gap-1 lg:flex">
          {items.map((it) => {
            const active = it.to === "/" ? path === "/" : path.startsWith(it.to);
            return (
              <Link
                key={it.to}
                to={it.to}
                className={cn(
                  "relative rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active ? "text-primary-deep" : "text-muted-foreground hover:text-primary-deep",
                )}
              >
                {it.label}
                {active && <span className="absolute inset-x-2 -bottom-[5px] h-[2px] rounded-full bg-accent-gold" />}
              </Link>
            );
          })}
        </nav>

        {/* SISI KANAN DESKTOP: Informasi Akun Wilayah Interaktif dengan Menu Log Out (Sesuai image_5e3d01.png) */}
        <div className="hidden lg:flex relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="inline-flex items-center gap-2.5 rounded-full border border-border bg-primary-soft/30 hover:bg-primary-soft/60 pl-2 pr-4 py-1.5 shadow-soft transition-colors focus:outline-none text-left"
          >
            {/* Badge Lingkaran Ikon */}
            <div className="grid h-7 w-7 place-items-center rounded-full bg-primary-deep text-white shadow-sm shrink-0">
              <Building2 className="h-3.5 w-3.5" />
            </div>
            {/* Teks Deskripsi */}
            <div className="flex flex-col leading-none">
              <span className="text-xs font-bold text-primary-deep max-w-[140px] truncate capitalize">
                {userKabupaten.toLowerCase().replace("kabupaten ", "").replace("kota ", "")}
              </span>
              <span className="text-[9px] font-semibold text-muted-foreground mt-0.5 uppercase tracking-wider flex items-center gap-0.5">
                <ShieldCheck className="h-2.5 w-2.5 text-emerald-600" /> Admin Wilayah
              </span>
            </div>
            <ChevronDown className={cn("h-3.5 w-3.5 text-primary-deep ml-1 transition-transform", isDropdownOpen && "rotate-180")} />
          </button>

          {/* Popover Dropdown Log Out Desktop */}
          {isDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
              <div className="absolute right-0 mt-12 w-52 bg-white rounded-xl border border-border shadow-xl z-50 py-1.5 animate-fadeIn">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors text-left"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  Keluar / Log Out
                </button>
              </div>
            </>
          )}
        </div>

        {/* MOBILE MENU TOGGLE */}
        <button
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
          className="grid h-10 w-10 place-items-center rounded-lg border border-border lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* MOBILE DRAWER */}
      {open && (
        <div className="border-t border-border bg-background/95 backdrop-blur lg:hidden">
          <div className="grid gap-1 px-4 py-3">
            
            {/* Informasi Kabupaten di bagian paling atas menu mobile + Tombol Keluar Langsung */}
            <div className="flex items-center justify-between p-3 mb-2 rounded-lg bg-primary-soft/40 border border-border/40">
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-primary-deep shrink-0" />
                <div className="flex flex-col leading-none">
                  <span className="text-xs font-bold text-primary-deep">{userKabupaten}</span>
                  <span className="text-[9px] font-medium text-muted-foreground mt-1">Otoritas Sesi Aktif</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Log Out"
                className="p-1.5 rounded-md bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>

            {items.map((it) => {
              const Icon = it.icon;
              const active = it.to === "/" ? path === "/" : path.startsWith(it.to);
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                    active ? "bg-primary-soft text-primary-deep" : "text-foreground hover:bg-muted",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {it.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}