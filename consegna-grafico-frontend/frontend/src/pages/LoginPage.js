import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Fingerprint, Lock, Mail, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { AuthLayout } from "@/components/app/AuthLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { API, http } from "@/lib/api";
import {
  credentialToJson,
  getApiErrorMessage,
  isPasskeySupported,
  normalizeLegacyEmailDomain,
  normalizePublicKeyRequestOptions,
} from "@/lib/app-shared";

export const LoginPage = ({ onLogin }) => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [authMode, setAuthMode] = useState("password");
  const [loginHoneypot, setLoginHoneypot] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryOtpCode, setRecoveryOtpCode] = useState("");
  const [recoveryChallengeId, setRecoveryChallengeId] = useState("");
  const [recoveryMaskedEmail, setRecoveryMaskedEmail] = useState("");
  const [recoverySecondsLeft, setRecoverySecondsLeft] = useState(0);
  const [recoveryRequestLoading, setRecoveryRequestLoading] = useState(false);
  const [recoveryVerifyLoading, setRecoveryVerifyLoading] = useState(false);
  const [recoveryDebugOtp, setRecoveryDebugOtp] = useState("");
  const [recoveryHoneypot, setRecoveryHoneypot] = useState("");
  const navigate = useNavigate();
  const nextPath = (() => {
    const value = String(searchParams.get("next") || "").trim();
    return value.startsWith("/") ? value : "/dashboard";
  })();
  const recoveryRequested = Boolean(recoveryChallengeId);

  useEffect(() => {
    if (!recoverySecondsLeft) return undefined;
    const timer = setInterval(() => {
      setRecoverySecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [recoverySecondsLeft]);

  const normalizeEmailValue = useCallback((value) => String(value || "").trim().toLowerCase(), []);

  const resetRecoveryFlow = useCallback(() => {
    setRecoveryOtpCode("");
    setRecoveryChallengeId("");
    setRecoveryMaskedEmail("");
    setRecoverySecondsLeft(0);
    setRecoveryDebugOtp("");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const normalizedEmail = normalizeLegacyEmailDomain(email);
    if (!normalizedEmail) {
      toast.error("Inserisci l'email dell'account");
      return;
    }
    setLoading(true);
    try {
      const res = await http.post(`${API}/auth/login`, {
        email: normalizedEmail,
        password,
        honeypot: loginHoneypot,
        client_ts: Date.now(),
      });
      setEmail(normalizedEmail);
      toast.success("Accesso effettuato");
      onLogin(res.data);
      navigate(nextPath);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Credenziali non valide"));
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeyLogin = async (e) => {
    e.preventDefault();
    if (!isPasskeySupported()) {
      toast.error("Passkey non supportate su questo browser o dispositivo");
      return;
    }

    const normalizedEmail = normalizeLegacyEmailDomain(recoveryEmail || email);
    if (!normalizedEmail) {
      toast.error("Inserisci l'email dell'account");
      return;
    }

    setPasskeyLoading(true);
    try {
      const optionsRes = await http.post(`${API}/auth/passkeys/authenticate/options`, {
        email: normalizedEmail,
        honeypot: loginHoneypot,
        client_ts: Date.now(),
      });
      const challengeId = optionsRes.data?.challenge_id;
      const publicKey = normalizePublicKeyRequestOptions(optionsRes.data?.public_key);
      if (!challengeId || !publicKey) {
        throw new Error("Challenge passkey non disponibile");
      }

      const assertion = await navigator.credentials.get({ publicKey });
      if (!assertion) {
        throw new Error("Autenticazione passkey annullata");
      }

      const verifyRes = await http.post(`${API}/auth/passkeys/authenticate/verify`, {
        challenge_id: challengeId,
        email: normalizedEmail,
        credential: credentialToJson(assertion),
        honeypot: loginHoneypot,
        client_ts: Date.now(),
      });
      setEmail(normalizedEmail);
      toast.success("Accesso passkey completato");
      onLogin(verifyRes.data);
      navigate(nextPath);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Autenticazione passkey non riuscita"));
    } finally {
      setPasskeyLoading(false);
    }
  };

  const requestRecoveryCode = async (e) => {
    if (e) e.preventDefault();
    const normalizedEmail = normalizeLegacyEmailDomain(normalizeEmailValue(recoveryEmail || email));
    if (!normalizedEmail) {
      toast.error("Inserisci l'email dell'account");
      return;
    }
    setRecoveryRequestLoading(true);
    setRecoveryDebugOtp("");
    try {
      const res = await http.post(`${API}/auth/email/request`, {
        email: normalizedEmail,
        purpose: "recovery",
        honeypot: recoveryHoneypot,
        client_ts: Date.now(),
      });
      setRecoveryEmail(normalizedEmail);
      setRecoveryChallengeId(res.data.challenge_id);
      setRecoveryMaskedEmail(res.data.masked_email || normalizedEmail);
      setRecoverySecondsLeft(Math.max(1, Number(res.data.expires_in || 120)));
      if (res.data.debug_otp) {
        setRecoveryDebugOtp(String(res.data.debug_otp));
      }
      toast.success("Codice inviato via email");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Impossibile inviare il codice");
    } finally {
      setRecoveryRequestLoading(false);
    }
  };

  const verifyRecoveryCode = async (e) => {
    e.preventDefault();
    if (!recoveryChallengeId) return;
    const normalizedEmail = normalizeLegacyEmailDomain(normalizeEmailValue(recoveryEmail || email));
    if (!normalizedEmail) {
      toast.error("Inserisci l'email dell'account");
      return;
    }
    setRecoveryVerifyLoading(true);
    try {
      const res = await http.post(`${API}/auth/email/verify`, {
        challenge_id: recoveryChallengeId,
        email: normalizedEmail,
        otp_code: recoveryOtpCode,
        honeypot: recoveryHoneypot,
      });
      toast.success("Accesso completato");
      onLogin(res.data);
      navigate(nextPath);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Codice non valido");
    } finally {
      setRecoveryVerifyLoading(false);
    }
  };

  return (
    <AuthLayout
      badge="Accesso"
      title="Entra nel tuo vault operativo."
      description="Scegli il metodo di accesso piu comodo e rientra direttamente in dashboard, senza passaggi superflui."
      icon={<Lock className="h-9 w-9" />}
    >
      <Card className="glass-strong w-full max-w-[34rem] overflow-hidden border-white/10">
        <CardHeader className="space-y-4 border-b border-white/10 p-6 text-center sm:p-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] border border-accent-primary/20 bg-accent-primary/10 animate-pulse-soft">
            <Lock className="h-10 w-10 text-accent-primary" />
          </div>
          <div className="space-y-2">
            <div className="section-kicker border-0">Login</div>
            <CardTitle className="text-3xl font-display font-bold tracking-tight text-white">Bentornato in Heirline</CardTitle>
            <CardDescription className="mx-auto max-w-md text-base leading-relaxed text-neutral-400">
              {authMode === "password"
                ? "Accesso tradizionale con email e password, pensato per l'uso quotidiano."
                : authMode === "passkey"
                  ? "Sblocca l'account con la passkey del dispositivo, senza ricordare nulla."
                  : "Recupera l'accesso ricevendo un codice monouso via email."}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-6 sm:p-8">
          <Tabs value={authMode} onValueChange={setAuthMode} className="space-y-6">
            {authMode === "recovery" ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Recupero accesso</p>
                    <p className="text-xs text-neutral-500">Questo flusso resta separato dal login principale.</p>
                  </div>
                  <button
                    type="button"
                    className="text-sm font-semibold text-accent-primary hover:underline"
                    onClick={() => setAuthMode("password")}
                  >
                    Torna al login
                  </button>
                </div>
              </div>
            ) : (
              <TabsList className="grid w-full grid-cols-2 border border-white/5 bg-black/30 p-1">
                <TabsTrigger value="password" className="text-neutral-400 data-[state=active]:bg-white/10 data-[state=active]:text-white">
                  Password
                </TabsTrigger>
                <TabsTrigger value="passkey" className="text-neutral-400 data-[state=active]:bg-white/10 data-[state=active]:text-white">
                  Passkey
                </TabsTrigger>
              </TabsList>
            )}

            <TabsContent value="password" className="mt-0">
              <form onSubmit={handleSubmit} className="space-y-5">
                <input
                  type="text"
                  value={loginHoneypot}
                  onChange={(e) => setLoginHoneypot(e.target.value)}
                  className="sr-only"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                />

                <div className="space-y-2">
                  <Label className="ml-1 text-xs font-bold uppercase tracking-[0.22em] text-neutral-300">Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="input-dark h-12"
                    placeholder="nome@esempio.it"
                    autoComplete="username webauthn"
                  />
                </div>

                <div className="space-y-2">
                  <div className="ml-1 flex items-center justify-between">
                    <Label className="text-xs font-bold uppercase tracking-[0.22em] text-neutral-300">Password</Label>
                    <button
                      type="button"
                      className="text-xs font-semibold text-accent-primary hover:underline"
                      onClick={() => {
                        setAuthMode("recovery");
                        setRecoveryEmail((prev) => prev || normalizeLegacyEmailDomain(email));
                      }}
                    >
                      Password dimenticata?
                    </button>
                  </div>

                  <div className="relative">
                    <Input
                      type={showPwd ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="input-dark h-12 pr-12"
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-foreground"
                      aria-label={showPwd ? "Nascondi password" : "Mostra password"}
                    >
                      {showPwd ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="btn-teal h-14 w-full text-base">
                  {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : "Accedi alla dashboard"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="passkey" className="mt-0">
              <form onSubmit={handlePasskeyLogin} className="space-y-5">
                <input
                  type="text"
                  value={loginHoneypot}
                  onChange={(e) => setLoginHoneypot(e.target.value)}
                  className="sr-only"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                />

                <div className="space-y-2">
                  <Label className="ml-1 text-xs font-bold uppercase tracking-[0.22em] text-neutral-300">Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="input-dark h-12"
                    placeholder="nome@esempio.it"
                    autoComplete="username webauthn"
                  />
                </div>

                <Button type="submit" disabled={passkeyLoading} className="btn-teal h-14 w-full text-base">
                  {passkeyLoading ? (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Fingerprint className="h-5 w-5" />
                      Accedi con passkey
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="recovery" className="mt-0">
              <div className="space-y-5">
                {!recoveryRequested ? (
                  <form onSubmit={requestRecoveryCode} className="space-y-5">
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-neutral-400">
                      Inserisci l&apos;email dell&apos;account. Ti inviamo un codice e rientri subito in dashboard.
                    </div>
                    <div className="space-y-2">
                      <Label className="ml-1 text-xs font-bold uppercase tracking-[0.22em] text-neutral-300">Email account</Label>
                      <Input
                        type="email"
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        required
                        className="input-dark h-12"
                        placeholder="nome@esempio.it"
                        autoComplete="email"
                      />
                      <input
                        type="text"
                        value={recoveryHoneypot}
                        onChange={(e) => setRecoveryHoneypot(e.target.value)}
                        className="sr-only"
                        tabIndex={-1}
                        autoComplete="off"
                        aria-hidden="true"
                      />
                    </div>

                    <Button type="submit" disabled={recoveryRequestLoading} className="btn-teal h-14 w-full text-base">
                      {recoveryRequestLoading ? (
                        <RefreshCw className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                      <Mail className="h-5 w-5" />
                          Invia codice via email
                        </>
                      )}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={verifyRecoveryCode} className="space-y-5">
                    <div className="space-y-2">
                      <Label className="ml-1 text-xs font-bold uppercase tracking-[0.22em] text-neutral-300">Codice OTP</Label>
                      <Input
                        value={recoveryOtpCode}
                        onChange={(e) => setRecoveryOtpCode((e.target.value || "").replace(/\D/g, "").slice(0, 8))}
                        required
                        minLength={4}
                        maxLength={8}
                        className="input-dark h-14 text-center font-mono tracking-[0.24em]"
                        placeholder="000000"
                        autoComplete="one-time-code"
                        inputMode="numeric"
                      />
                      <p className="text-xs text-neutral-500">
                        Codice inviato a {recoveryMaskedEmail || recoveryEmail}
                      </p>
                      {recoveryDebugOtp ? (
                        <p className="text-xs font-semibold text-accent-primary">Dev OTP: {recoveryDebugOtp}</p>
                      ) : null}
                    </div>

                    <Button
                      type="submit"
                      disabled={recoveryVerifyLoading || recoveryOtpCode.length < 4}
                      className="btn-teal h-14 w-full text-base"
                    >
                      {recoveryVerifyLoading ? <RefreshCw className="h-5 w-5 animate-spin" /> : "Verifica codice"}
                    </Button>

                    <div className="flex items-center justify-between text-sm">
                      <button type="button" onClick={resetRecoveryFlow} className="text-neutral-400 hover:text-foreground">
                        Cambia email
                      </button>
                      <button
                        type="button"
                        onClick={requestRecoveryCode}
                        disabled={recoveryRequestLoading || recoverySecondsLeft > 0}
                        className="font-semibold text-accent-primary disabled:text-neutral-600"
                      >
                        {recoverySecondsLeft > 0 ? `Reinvia tra ${recoverySecondsLeft}s` : "Reinvia codice"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-8 border-t border-white/10 pt-6 text-center">
            <p className="text-sm text-neutral-500">
              Non hai ancora un account?{" "}
              <button onClick={() => navigate("/register")} className="font-semibold text-accent-primary hover:underline">
                Registrati ora
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  );
};
