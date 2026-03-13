import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { AuthLayout } from "@/components/app/AuthLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API, http } from "@/lib/api";
import { getApiErrorMessage, normalizeLegacyEmailDomain } from "@/lib/app-shared";

export const RegisterPage = ({ onLogin }) => {
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "", nome: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [registerHoneypot, setRegisterHoneypot] = useState("");
  const navigate = useNavigate();
  const passwordChecks = [
    { label: "Almeno 8 caratteri", valid: form.password.length >= 8 },
    { label: "Una lettera", valid: /[A-Za-z]/.test(form.password) },
    { label: "Un numero", valid: /\d/.test(form.password) },
  ];
  const passwordsMatch = form.password && form.password === form.confirmPassword;
  const canSubmit = passwordChecks.every((item) => item.valid) && passwordsMatch && form.nome.trim() && form.email.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const normalizedEmail = normalizeLegacyEmailDomain(form.email);
    if (!normalizedEmail) {
      toast.error("Inserisci un'email valida");
      return;
    }
    if (!passwordChecks.every((item) => item.valid)) {
      toast.error("Scegli una password piu robusta");
      return;
    }
    if (!passwordsMatch) {
      toast.error("Le password non coincidono");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        email: normalizedEmail,
        password: form.password,
        nome: (form.nome || "").trim(),
        phone: (form.phone || "").trim() || undefined,
        honeypot: registerHoneypot,
        client_ts: Date.now(),
      };
      const res = await http.post(`${API}/auth/register`, payload);
      toast.success("Account creato con successo");
      onLogin(res.data);
      navigate("/dashboard");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Errore registrazione"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      badge="Nuovo account"
      title="Parti dal vault, senza frizioni."
      description="Compila solo i campi essenziali, verifica una password solida e arrivi direttamente in dashboard."
      icon={<UserPlus className="h-9 w-9" />}
    >
      <Card className="glass-strong w-full max-w-[34rem] overflow-hidden border-white/10">
        <CardHeader className="space-y-4 border-b border-white/10 p-6 text-center sm:p-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] border border-accent-secondary/20 bg-accent-secondary/10 animate-pulse-soft">
            <UserPlus className="h-10 w-10 text-accent-secondary" />
          </div>
          <div className="space-y-2">
            <div className="section-kicker border-0">Registrazione</div>
            <CardTitle className="text-3xl font-display font-bold tracking-tight text-white">Crea il tuo account</CardTitle>
            <CardDescription className="mx-auto max-w-md text-base leading-relaxed text-neutral-400">
              Pochi campi chiari, controllo password in tempo reale e nessun passo aggiuntivo prima del vault.
            </CardDescription>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-neutral-500">
              Numero blindato, piani e funzioni avanzate si attivano dopo. Qui serve solo creare la base account.
            </p>
          </div>
        </CardHeader>

        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <input
              type="text"
              value={registerHoneypot}
              onChange={(e) => setRegisterHoneypot(e.target.value)}
              className="sr-only"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label className="ml-1 text-xs font-bold uppercase tracking-[0.22em] text-neutral-300">Nome completo</Label>
                <Input
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  required
                  className="input-dark h-12"
                  placeholder="Mario Rossi"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label className="ml-1 text-xs font-bold uppercase tracking-[0.22em] text-neutral-300">Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="input-dark h-12"
                  placeholder="mario@esempio.it"
                />
              </div>

              <div className="space-y-2">
                <div className="ml-1 flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-[0.22em] text-neutral-300">Telefono</Label>
                  <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-500">Opzionale</span>
                </div>
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="input-dark h-12 font-mono"
                  placeholder="+39 333 123 4567"
                />
              </div>

              <div className="space-y-2">
                <Label className="ml-1 text-xs font-bold uppercase tracking-[0.22em] text-neutral-300">Password</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={8}
                  className="input-dark h-12"
                  placeholder="Minimo 8 caratteri"
                />
              </div>

              <div className="space-y-2">
                <Label className="ml-1 text-xs font-bold uppercase tracking-[0.22em] text-neutral-300">Conferma password</Label>
                <Input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  required
                  minLength={8}
                  className="input-dark h-12"
                  placeholder="Ripeti la password"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-neutral-500">Controllo password</p>
              <div className="mt-3 grid gap-2 text-sm text-neutral-400 sm:grid-cols-2">
                {passwordChecks.map((item) => (
                  <div key={item.label} className={item.valid ? "text-accent-primary" : ""}>
                    {item.valid ? "OK" : "..." } {item.label}
                  </div>
                ))}
                <div className={passwordsMatch ? "text-accent-primary" : ""}>
                  {passwordsMatch ? "OK" : "..." } Le password coincidono
                </div>
              </div>
            </div>

            <Button type="submit" disabled={loading || !canSubmit} className="btn-teal h-14 w-full text-base">
              {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <span>Crea account e vai in dashboard</span>}
              }
            </Button>
          </form>

          <div className="mt-8 border-t border-white/10 pt-6 text-center">
            <p className="text-sm text-neutral-500">
              Hai gia un account?{" "}
              <button onClick={() => navigate("/login")} className="font-semibold text-accent-secondary hover:underline">
                Accedi
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  );
};
