import { Building2, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-primary-deep text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 lg:grid-cols-4 lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-gold">
              <Building2 className="h-5 w-5 text-accent-gold-foreground" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest opacity-70">SIM-RTLH · NTT</div>
              <div className="text-sm font-bold">Rumah Tidak Layak Huni</div>
            </div>
          </div>
          <p className="mt-4 text-sm opacity-80">
            Sistem Informasi Manajemen Rumah Tidak Layak Huni — mendukung percepatan pembangunan hunian layak bagi masyarakat Indonesia.
          </p>
        </div>

        <div>
          <div className="mb-4 text-sm font-semibold">Navigasi</div>
          <ul className="space-y-2 text-sm opacity-80">
            <li><Link to="/dashboard" className="hover:text-accent-gold">Dashboard</Link></li>
            <li><Link to="/rtlh" className="hover:text-accent-gold">Data RTLH</Link></li>
            <li><Link to="/map" className="hover:text-accent-gold">Peta RTLH</Link></li>
            
          </ul>
        </div>

        <div>
          <div className="mb-4 text-sm font-semibold">Layanan</div>
          <ul className="space-y-2 text-sm opacity-80">
            <li><Link to="/submit" className="hover:text-accent-gold">Pengajuan Bantuan</Link></li>
            <li><Link to="/monitoring" className="hover:text-accent-gold">Monitoring</Link></li>
            <li><Link to="/districts" className="hover:text-accent-gold">Data Kabupaten</Link></li>
          </ul>
        </div>

        <div>
          <div className="mb-4 text-sm font-semibold">Kontak</div>
          <ul className="space-y-3 text-sm opacity-80">
            <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent-gold" /><span>Jl. Basuki Rahmat No.1, Naikolan, Oepura, Kec. Maulafa, Kota Kupang, Nusa Tenggara Tim. 85142</span></li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-accent-gold" /><span>021-7228497</span></li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-accent-gold" /><span>rtlh@pu.go.id</span></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs opacity-70 lg:flex-row lg:px-8">
          <p>© {new Date().getFullYear()} Dinas Perumahan Rakyat dan Kawasan Permukman Provinsi Nusa Tenggara Timur</p>
          <p>v1.0 · Sistem Informasi Manajemen RTLH</p>
        </div>
      </div>
    </footer>
  );
}