import { useState } from "react";
import { createFileRoute, useRouter, redirect } from "@tanstack/react-router";
import { Building2, AlertCircle, Loader2, Eye, EyeOff, ShieldQuestion } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login · SIM-RTLH · NTT" },
      { name: "description", content: "Halaman login Sistem Informasi Manajemen RTLH NTT." },
    ],
  }),
  beforeLoad: () => {
    // Pindahkan pengecekan ke beforeLoad agar tidak ada "flicker" halaman login
    // Tetap gunakan pengamanan SSR typeof window
    if (typeof window !== "undefined") {
      // UBAH HANYA DI SINI: localStorage menjadi sessionStorage
      if (sessionStorage.getItem("auth_token")) {
        throw redirect({ to: "/" });
      }
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // useEffect untuk pengecekan login DIHAPUS karena sudah ditangani oleh beforeLoad di atas

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const username = (formData.get("username") as string || "").trim();
    const password = (formData.get("password") as string || "").trim();

    // Simulasi pengecekan ke server (mocking auth)
    setTimeout(() => {
      if (password === `user_${username}`) {
        // UBAH HANYA DI SINI: localStorage menjadi sessionStorage
        sessionStorage.setItem("auth_token", "mock-development-token-12345");
        sessionStorage.setItem("user_kabupaten", username);
        
        // Gunakan invalidate agar TanStack Router me-refresh context auth
        router.invalidate().then(() => {
          router.navigate({ to: "/" });
        });
      } else {
        setError("Username atau password salah!");
        setIsSubmitting(false);
      }
    }, 800);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 p-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-8 shadow-soft">
        
        {/* Header & Logo */}
        <div className="space-y-3 text-center">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary-deep text-white shadow-md">
            <Building2 className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              SIM-RTLH • NTT
            </p>
            <h2 className="text-2xl font-extrabold text-primary-deep">
              Sistem Informasi Manajemen <br />
              <span className="text-foreground">Rumah Tidak Layak Huni</span>
            </h2>
          </div>
        </div>

        {error && (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm font-semibold text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="username" className="text-sm font-semibold text-foreground">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              required
              disabled={isSubmitting}
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground transition-all placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              placeholder="Masukkan nama kabupaten (misal: kupang)"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-semibold text-foreground">
                Password
              </label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                required
                disabled={isSubmitting}
                className="w-full rounded-xl border border-input bg-background px-4 py-3 pr-10 text-sm text-foreground transition-all placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="remember"
              className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
            />
            <label htmlFor="remember" className="text-sm font-medium text-muted-foreground cursor-pointer">
              Ingat akun saya
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#ffc107] px-4 py-3.5 font-bold text-black shadow-md transition-all duration-200 hover:bg-[#e0a800] active:scale-[0.98] disabled:opacity-70"
          >
            {isSubmitting ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Mengautentikasi...</>
            ) : (
              "Masuk ke Sistem"
            )}
          </button>
        </form>

        {/* Bantuan Akses Pengganti Tombol Kembali */}
        <div className="pt-4 border-t border-border flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldQuestion className="h-4 w-4" />
          <span>Kendala akses? Hubungi Admin PUPR Provinsi.</span>
        </div>
      </div>
    </div>
  );
}