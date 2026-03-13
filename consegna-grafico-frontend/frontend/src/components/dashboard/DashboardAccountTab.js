import { toast } from "sonner";
import { Bell, Copy, FingerprintPattern as Fingerprint, LogOut, Mail, RefreshCw, ShieldCheck, Smartphone, Trash2, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TabsContent } from "@/components/ui/tabs";

const formatDateTime = (value) => {
  if (!value) return "n/d";
  try {
    return new Date(value).toLocaleString("it-IT");
  } catch {
    return "n/d";
  }
};

const formatAuthMethod = (value) => {
  if (value === "passkey") return "Passkey";
  if (value === "otp_email") return "OTP Email";
  if (value === "otp_phone") return "OTP Telefono";
  return "Password";
};

export const DashboardAccountTab = ({ section }) => {
  const {
    user,
    planLabel,
    authSessions,
    loadSessions,
    loadingSessions,
    logoutAllSessions,
    loggingOutAll,
    revokingSessionId,
    revokeSession,
    onLogoutCurrent,
    canUsePasskeys,
    browserSupportsPasskeys,
    passkeysLimit,
    passkeys,
    passkeyLabel,
    onPasskeyLabelChange,
    handleRegisterPasskey,
    registeringPasskey,
    loadingPasskeys,
    loadPasskeys,
    deletingPasskeyId,
    handleDeletePasskey,
    canManageEmailAliases,
    createAlias,
    aliasForm,
    onAliasFormChange,
    creatingAlias,
    emailAliases,
    emailAliasLimit,
    loadingAliases,
    disableAlias,
    pushSupported,
    pushSubscribed,
    pushPermission,
    pushLoading,
    pushError,
    handlePushSubscribe,
    handlePushUnsubscribe,
    handlePushTest,
  } = section;

  const activeSessions = authSessions
    .filter((session) => !session.revoked_at)
    .sort((left, right) => {
      if (Boolean(left.is_current) !== Boolean(right.is_current)) {
        return left.is_current ? -1 : 1;
      }
      return new Date(right.last_used_at || 0).getTime() - new Date(left.last_used_at || 0).getTime();
    });
  const revokedSessionsCount = Math.max(0, authSessions.length - activeSessions.length);
  const activeAliases = emailAliases.filter((alias) => alias.status === "active");
  const userInitial = String(user?.nome || user?.email || "U").trim().charAt(0).toUpperCase();
  const roleLabel = String(user?.role || "user").toLowerCase() === "admin" ? "Admin" : "Utente";
  const pushStatusLabel = !pushSupported ? "Non supportato" : pushSubscribed ? "Attivo" : "Da attivare";

  return (
    <TabsContent value="account" className="mt-0">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="space-y-8 lg:col-span-2">
          <Card className="panel-surface-elevated border-white/10">
            <CardHeader className="p-4 sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="glass-subtle flex h-16 w-16 items-center justify-center rounded-3xl text-2xl font-display font-bold text-accent-primary">
                    {userInitial}
                  </div>
                  <div className="space-y-2">
                    <p className="section-kicker">Identita account</p>
                    <CardTitle className="flex items-center gap-2 text-2xl font-display font-bold text-foreground">
                      <UserRound className="h-5 w-5 text-accent-primary" /> Profilo e identita
                    </CardTitle>
                    <CardDescription className="text-neutral-400">
                      Tutte le informazioni che definiscono il tuo account sono raccolte qui: identita, piano, sessioni e recapiti protetti.
                    </CardDescription>
                    <div className="space-y-1">
                      <p className="text-lg font-semibold text-foreground">{user?.nome || "Profilo Heirline"}</p>
                      <p className="text-sm text-neutral-400">{user?.email || "Email non disponibile"}</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-accent-primary/20 text-accent-primary border-none">{planLabel}</Badge>
                  <Badge variant="outline" className="border-border text-neutral-300">{roleLabel}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-4 pt-0 sm:p-8 sm:pt-0">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="stat-tile">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Piano</p>
                  <p className="mt-2 text-lg font-display font-bold text-foreground">{planLabel}</p>
                </div>
                <div className="stat-tile">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Sessioni attive</p>
                  <p className="mt-2 text-lg font-display font-bold text-foreground">{activeSessions.length}</p>
                </div>
                <div className="stat-tile">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Passkeys</p>
                  <p className="mt-2 text-lg font-display font-bold text-foreground">{passkeys.length}/{passkeysLimit || 0}</p>
                </div>
                <div className="stat-tile">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Alias attivi</p>
                  <p className="mt-2 text-lg font-display font-bold text-foreground">{activeAliases.length}/{emailAliasLimit || 0}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  variant="outline"
                  className="border-border"
                  onClick={() => {
                    navigator.clipboard.writeText(user?.email || "");
                    toast.success("Email copiata");
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" /> Copia email
                </Button>
                <Button variant="outline" className="border-danger/40 text-danger hover:bg-danger/10" onClick={onLogoutCurrent}>
                  <LogOut className="mr-2 h-4 w-4" /> Esci da questo browser
                </Button>
              </div>

              <div className="card-highlight">
                <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Snapshot account</p>
                <p className="mt-2 text-sm leading-relaxed text-neutral-300">
                  Piano {planLabel}, {activeSessions.length} sessioni attive, {passkeys.length} passkeys registrate e {activeAliases.length} alias disponibili.
                  Da qui puoi controllare i punti che impattano accesso e recapiti senza saltare tra tab diverse.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="panel-surface-elevated border-white/10">
            <CardHeader className="p-4 sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl font-display font-bold text-foreground">
                    <Smartphone className="h-5 w-5 text-accent-primary" /> Dispositivi e sessioni
                  </CardTitle>
                  <CardDescription className="mt-1 text-neutral-400">
                    Ogni riga rappresenta un browser o dispositivo autorizzato: da qui puoi revocare in un click.
                  </CardDescription>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <div className="metric-pill">Attive {activeSessions.length}</div>
                    <div className="metric-pill">Revocate {revokedSessionsCount}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="border-border" onClick={loadSessions}>
                    {loadingSessions ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Aggiorna"}
                  </Button>
                  <Button variant="outline" className="border-danger/40 text-danger hover:bg-danger/10" onClick={logoutAllSessions} disabled={loggingOutAll}>
                    {loggingOutAll ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Disconnetti tutti"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-4 pt-0 sm:p-8 sm:pt-0">
              {activeSessions.length === 0 ? (
                <div className="card-dark p-5 text-sm text-neutral-500">
                  Nessun dispositivo attivo rilevato. Ricarica la sezione per sincronizzare lo stato reale delle sessioni autorizzate.
                </div>
              ) : (
                activeSessions.map((session) => (
                  <div key={session.session_id} className="card-dark flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-primary/10 text-accent-primary">
                        <Smartphone className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{formatAuthMethod(session.auth_method)}</p>
                          {session.is_current ? (
                            <Badge className="bg-accent-primary/20 text-accent-primary border-none">QUESTO BROWSER</Badge>
                          ) : null}
                          {session.revoked_at ? (
                            <Badge className="bg-neutral-700 text-neutral-200 border-none">REVOCATA</Badge>
                          ) : null}
                        </div>
                        <p className="text-xs uppercase tracking-[0.22em] text-neutral-500">
                          {session.ip_address || "IP non disponibile"} • ultimo uso {formatDateTime(session.last_used_at)}
                        </p>
                      </div>
                    </div>
                    {!session.revoked_at ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-danger/40 text-danger hover:bg-danger/10"
                        disabled={revokingSessionId === session.session_id}
                        onClick={() => revokeSession(session.session_id, Boolean(session.is_current))}
                      >
                        {revokingSessionId === session.session_id ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Disconnetti"}
                      </Button>
                    ) : null}
                  </div>
                ))
              )}
              {revokedSessionsCount > 0 ? (
                <p className="text-xs text-neutral-500">
                  {revokedSessionsCount} sessioni revocate nascoste per mantenere leggibile l&apos;elenco dei dispositivi attivi.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card className="panel-surface-elevated border-white/10">
            <CardHeader className="p-4 sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl font-display font-bold text-foreground">
                    <Fingerprint className="h-5 w-5 text-accent-primary" /> Passkeys
                  </CardTitle>
                  <CardDescription className="mt-1 text-neutral-400">
                    Gestisci gli accessi resistenti a phishing e revoca quelli che non usi piu.
                  </CardDescription>
                </div>
                <Button variant="outline" className="border-border" onClick={loadPasskeys}>
                  {loadingPasskeys ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Aggiorna"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-4 pt-0 sm:p-8 sm:pt-0">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="stat-tile">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Stato piano</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{canUsePasskeys ? "Abilitato" : "Upgrade richiesto"}</p>
                </div>
                <div className="stat-tile">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Browser</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{browserSupportsPasskeys ? "Compatibile" : "Non compatibile"}</p>
                </div>
                <div className="stat-tile">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Attive</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{passkeys.length}/{passkeysLimit || 0}</p>
                </div>
              </div>

              {!browserSupportsPasskeys ? (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                  Questo browser o dispositivo non supporta WebAuthn/passkeys.
                </div>
              ) : (
                <>
                  {!canUsePasskeys ? (
                    <div className="card-dark border-amber-500/30 text-sm text-amber-200">
                      La registrazione di nuove passkeys richiede un piano superiore.
                    </div>
                  ) : null}
                  <div className="flex flex-col gap-3 md:flex-row">
                    <Input
                      placeholder="Nome passkey (es. MacBook Pro)"
                      className="input-dark"
                      value={passkeyLabel}
                      onChange={(e) => onPasskeyLabelChange(e.target.value)}
                    />
                    <Button
                      onClick={handleRegisterPasskey}
                      disabled={!canUsePasskeys || registeringPasskey || (passkeysLimit > 0 && passkeys.length >= passkeysLimit)}
                      className="btn-teal"
                    >
                      {registeringPasskey ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Registra Passkey"}
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {passkeys.length === 0 ? (
                      <div className="card-dark p-5 text-sm text-neutral-500">
                        Nessuna passkey registrata. Aggiungine una per ridurre la dipendenza da password e OTP nei login quotidiani.
                      </div>
                    ) : (
                      passkeys.map((passkey) => (
                        <div key={passkey.id} className="card-dark flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{passkey.label || "Passkey"}</p>
                            <p className="text-xs text-neutral-500">
                              {passkey.device_type || "device"} • ultimo uso {formatDateTime(passkey.last_used_at)}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-danger/40 text-danger hover:bg-danger/10"
                            disabled={deletingPasskeyId === passkey.id}
                            onClick={() => handleDeletePasskey(passkey.id)}
                          >
                            {deletingPasskeyId === passkey.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <><Trash2 className="mr-2 h-4 w-4" />Revoca</>}
                            }
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="panel-surface-elevated border-white/10">
            <CardHeader className="p-4 sm:p-8">
              <CardTitle className="flex items-center gap-2 text-xl font-display font-bold text-foreground">
                <Bell className="h-5 w-5 text-accent-primary" /> Questo dispositivo
              </CardTitle>
              <CardDescription className="text-neutral-400">
                Stato delle notifiche e del browser da cui stai gestendo l&apos;account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 pt-0 sm:p-8 sm:pt-0">
              <div className="grid gap-3">
                <div className="stat-tile">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Push</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{pushStatusLabel}</p>
                </div>
                <div className="stat-tile">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Permesso notifiche</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{pushPermission || "default"}</p>
                </div>
              </div>
              <div className={pushSubscribed ? "card-highlight" : "card-dark"}>
                <p className="text-sm font-semibold text-foreground">
                  {pushSubscribed ? "Questo browser e gia pronto a ricevere notifiche." : "Attiva le push su questo browser per ridurre il tempo di risposta."}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  Le notifiche servono per OTP, alert e conferme operative legate all&apos;account.
                </p>
              </div>
              {pushError ? <p className="text-sm text-danger">{pushError}</p> : null}
              }
              <div className="flex flex-wrap gap-3">
                {!pushSupported ? null : pushSubscribed ? (
                  <Button onClick={handlePushUnsubscribe} disabled={pushLoading} variant="outline" className="border-danger/40 text-danger hover:bg-danger/10">
                    {pushLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Disattiva push"}
                  </Button>
                ) : (
                  <Button onClick={handlePushSubscribe} disabled={pushLoading} className="btn-teal">
                    {pushLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Attiva push"}
                  </Button>
                )}
                <Button onClick={handlePushTest} disabled={!pushSubscribed || pushLoading} variant="outline" className="border-border">
                  Test notifica
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="panel-surface-elevated border-white/10">
            <CardHeader className="p-4 sm:p-8">
              <CardTitle className="flex items-center gap-2 text-xl font-display font-bold text-foreground">
                <Mail className="h-5 w-5 text-accent-gold" /> Email Vault Alias
              </CardTitle>
              <CardDescription className="text-neutral-400">
                Crea e gestisci alias dedicati senza esporre la tua inbox personale.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 pt-0 sm:p-8 sm:pt-0">
              {!canManageEmailAliases ? (
                <div className="card-dark p-5 text-sm text-neutral-500">Alias email non inclusi in questo piano.</div>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="stat-tile">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Alias attivi</p>
                      <p className="mt-2 text-sm font-semibold text-foreground">{activeAliases.length}/{emailAliasLimit}</p>
                    </div>
                    <div className="stat-tile">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Uso consigliato</p>
                      <p className="mt-2 text-sm font-semibold text-foreground">1 alias per servizio critico</p>
                    </div>
                  </div>
                  <form onSubmit={createAlias} className="space-y-3">
                    <Input
                      placeholder="Etichetta servizio (es. Binance)"
                      value={aliasForm.service_label}
                      onChange={(e) => onAliasFormChange({ ...aliasForm, service_label: e.target.value })}
                      className="input-dark"
                    />
                    <Input
                      placeholder="Alias locale (opzionale)"
                      value={aliasForm.alias_local}
                      onChange={(e) => onAliasFormChange({ ...aliasForm, alias_local: e.target.value })}
                      className="input-dark font-mono"
                    />
                    <Button type="submit" disabled={creatingAlias || emailAliases.length >= emailAliasLimit} className="btn-teal w-full">
                      {creatingAlias ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Crea Alias"}
                    </Button>
                  </form>
                  <p className="text-xs text-neutral-500">Alias attivi: {activeAliases.length}/{emailAliasLimit}</p>
                  {loadingAliases ? (
                    <p className="text-sm text-neutral-500">Caricamento alias...</p>
                  ) : emailAliases.length === 0 ? (
                    <div className="card-dark p-5 text-sm text-neutral-500">
                      Nessun alias creato. Usa un alias dedicato per exchange, banking o servizi che non devono conoscere la tua inbox personale.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {emailAliases.map((alias) => (
                        <div key={alias.id} className="card-dark">
                          <p className="font-mono text-sm text-foreground">{alias.alias_address}</p>
                          <p className="mt-1 text-xs text-neutral-500">{alias.service_label || "Senza etichetta"} • {alias.status}</p>
                          <div className="mt-3 flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-border"
                              onClick={() => {
                                navigator.clipboard.writeText(alias.alias_address);
                                toast.success("Alias copiato");
                              }}
                            >
                              <Copy className="mr-2 h-4 w-4" /> Copia
                            </Button>
                            {alias.status === "active" ? (
                              <Button size="sm" variant="outline" className="border-danger/40 text-danger hover:bg-danger/10" onClick={() => disableAlias(alias.id)}>
                                Disattiva
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card className="panel-surface-elevated border-white/10">
            <CardHeader className="p-4 sm:p-8">
              <CardTitle className="flex items-center gap-2 text-xl font-display font-bold text-foreground">
                <ShieldCheck className="h-5 w-5 text-accent-primary" /> Stato accesso
              </CardTitle>
              <CardDescription className="text-neutral-400">
                Una vista rapida dello stato operativo del tuo account e del browser che stai usando.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-0 sm:p-8 sm:pt-0">
              <div className="stat-tile">
                <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Ruolo</p>
                <p className="mt-2 text-sm font-semibold text-foreground">{roleLabel}</p>
              </div>
              <div className="stat-tile">
                <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Email account</p>
                <p className="mt-2 break-all text-sm font-semibold text-foreground">{user?.email || "n/d"}</p>
              </div>
              <div className="card-highlight">
                <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Browser corrente</p>
                <p className="mt-2 text-sm leading-relaxed text-neutral-300">
                  Push {pushStatusLabel.toLowerCase()}, ruolo {roleLabel.toLowerCase()} e sessione locale pronta per le azioni operative principali.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TabsContent>
  );
};
