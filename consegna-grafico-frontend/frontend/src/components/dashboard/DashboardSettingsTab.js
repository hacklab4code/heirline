import { toast } from "sonner";
import { AlertOctagon, Copy, RefreshCw, Shield, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DashboardSecureNotesSection } from "@/components/dashboard/DashboardSecureNotesSection";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { TabsContent } from "@/components/ui/tabs";

export const DashboardSettingsTab = ({ section }) => {
  const {
    e2eeEnabled,
    e2eeStatus,
    e2eeUnlocked,
    hasLocalVaultState,
    localVaultAligned,
    e2eePassphrase,
    onE2eePassphraseChange,
    handleEnableE2ee,
    handleUnlockE2ee,
    handleLockE2ee,
    e2eeBusy,
    canUseSecureNotes,
    secureNotes,
    secureNotesLimit,
    secureNoteForm,
    onSecureNoteFormChange,
    saveSecureNote,
    savingSecureNote,
    resetSecureNoteForm,
    loadSecureNotes,
    loadingSecureNotes,
    editSecureNote,
    deleteSecureNote,
    deletingSecureNoteId,
    canUseTotp,
    e2eeReadyForEncrypt,
    totpEntries,
    totpCodes,
    loadingTotpCodes,
    refreshTotpCodes,
    totpForm,
    onTotpFormChange,
    createTotpEntry,
    savingTotp,
    deleteTotpEntry,
    deletingTotpId,
    otpPolicy,
    savingOtpPolicy,
    saveOtpPolicy,
    canUseAutoDelete,
    canUseWhitelist,
    trustedSenders,
    loadingTrustedSenders,
    trustedSenderForm,
    onTrustedSenderFormChange,
    addTrustedSender,
    savingTrustedSender,
    removeTrustedSender,
    removingTrustedSenderId,
    otpAccessLogs,
    otpAutofillLogs,
    accountAuditLogs,
    canViewSharedOtpAudit,
    canViewAccountAudit,
    loadingOtpAccessLogs,
    loadingOtpAutofillLogs,
    loadingAccountAuditLogs,
    loadOtpAccessLogs,
    loadOtpAutofillLogs,
    loadAccountAuditLogs,
    securityAlerts,
    loadingSecurityAlerts,
    loadSecurityAlerts,
    resolveSecurityAlert,
    resolvingAlertId,
    canUseKillSwitch,
    panicPassword,
    onPanicPasswordChange,
    panicConfirmDelete,
    onPanicConfirmDeleteChange,
    triggerPanicFreeze,
    panicBusy,
    isAdmin,
  } = section;

  const whitelistMode = otpPolicy?.whitelist_mode || (otpPolicy?.whitelist_enabled ? "monitor" : "off");
  const hasAuditVisibility = canViewSharedOtpAudit || canViewAccountAudit;
  const killSwitchReady = String(panicPassword || "").trim().length >= 8;
  const localVaultLabel = e2eeUnlocked ? "Sbloccato" : hasLocalVaultState ? (localVaultAligned ? "Bloccato" : "Chiave non allineata") : "Assente";

  return (
    <TabsContent value="settings" className="mt-0">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="panel-surface-elevated border-white/10">
            <CardHeader className="p-4 sm:p-8">
              <CardTitle className="text-xl font-display font-bold text-foreground">Sicurezza e accesso</CardTitle>
              <CardDescription className="text-neutral-400">
                Controlli principali per vault locale, policy OTP e mittenti trusted.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-8 pt-0 space-y-6">
              <div className="flex flex-wrap gap-2">
                <div className="metric-pill">Vault {localVaultLabel}</div>
                <div className="metric-pill">Whitelist {whitelistMode}</div>
                <div className="metric-pill">{otpPolicy?.mask_otp ? "Mask OTP attivo" : "Mask OTP disattivo"}</div>
              </div>
              <div className={`flex flex-col justify-between gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center sm:p-6 ${e2eeEnabled ? "card-highlight" : "card-dark border-danger/20"}`}>
                <div className="space-y-1">
                  <p className="text-foreground font-bold">Cifratura E2EE account</p>
                  <p className="text-neutral-500 text-xs">
                    {e2eeEnabled
                      ? `Chiave attiva: ${e2eeStatus?.key_id}. I nuovi payload sensibili vengono persistiti solo in forma cifrata.`
                      : "Configura la chiave E2EE: nuovi inbox protetti, deleghe e TOTP non plaintext dipendono da questo setup."}
                  </p>
                </div>
                <Badge className={e2eeEnabled ? "bg-accent-primary/20 text-accent-primary border-none" : "bg-danger/20 text-danger border-none"}>
                  {e2eeEnabled ? "ATTIVA" : "RICHIESTA"}
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="stat-tile">
                  <p className="text-neutral-500 text-[11px] font-bold uppercase tracking-widest">Stato account</p>
                  <p className="text-foreground text-sm font-semibold mt-2">{e2eeEnabled ? "E2EE attivo" : "Non attivo"}</p>
                </div>
                <div className="stat-tile">
                  <p className="text-neutral-500 text-[11px] font-bold uppercase tracking-widest">Key ID</p>
                  <p className="text-foreground text-sm font-mono mt-2 truncate">{e2eeStatus?.key_id || "N/A"}</p>
                </div>
                <div className="stat-tile">
                  <p className="text-neutral-500 text-[11px] font-bold uppercase tracking-widest">Vault locale</p>
                  <p className="text-foreground text-sm font-semibold mt-2">{localVaultLabel}</p>
                </div>
              </div>
              {!e2eeEnabled ? (
                <div className="card-dark space-y-3">
                  <Input
                    type="password"
                    placeholder="Passphrase vault (min 10 caratteri)"
                    className="input-dark h-12"
                    value={e2eePassphrase}
                    onChange={(e) => onE2eePassphraseChange(e.target.value)}
                  />
                  <Button onClick={handleEnableE2ee} disabled={e2eeBusy} className="w-full btn-teal">
                    {e2eeBusy ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Attiva E2EE"}
                  </Button>
                  <p className="text-xs text-neutral-500">
                    La passphrase non lascia il browser: protegge la chiave privata usata per decifrare inbox, deleghe e TOTP lato client.
                  </p>
                </div>
              ) : !hasLocalVaultState ? (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                  Nessun vault locale trovato su questo browser. Importa o rigenera la chiave da un dispositivo trusted prima di poter leggere i payload cifrati.
                </div>
              ) : !localVaultAligned ? (
                <div className="card-dark space-y-3 border-danger/30">
                  <p className="text-sm text-danger">
                    Il vault locale presente non corrisponde alla chiave registrata sull&apos;account. Usa il browser corretto o rigenera la chiave con una rotazione controllata.
                  </p>
                </div>
              ) : !e2eeUnlocked ? (
                <div className="card-dark space-y-3">
                  <Input
                    type="password"
                    placeholder="Passphrase per sbloccare la cassaforte"
                    className="input-dark h-12"
                    value={e2eePassphrase}
                    onChange={(e) => onE2eePassphraseChange(e.target.value)}
                  />
                  <Button onClick={handleUnlockE2ee} disabled={e2eeBusy} className="w-full btn-teal">
                    {e2eeBusy ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Sblocca Cassaforte"}
                  </Button>
                </div>
              ) : (
                <div className="card-highlight space-y-3">
                  <p className="text-sm text-neutral-300">
                    Cassaforte attiva e sbloccata. I contenuti protetti vengono decifrati solo localmente in questo browser.
                  </p>
                  <Button onClick={handleLockE2ee} variant="outline" className="w-full border-border">
                    Blocca Cassaforte
                  </Button>
                </div>
              )}
              <div className="card-dark flex flex-col justify-between gap-4 sm:flex-row sm:items-center sm:p-6">
                <div className="space-y-1">
                  <p className="text-foreground font-bold">Autodistruzione OTP</p>
                  <p className="text-neutral-500 text-xs">I messaggi vengono eliminati automaticamente dopo un intervallo definito.</p>
                </div>
                <Switch
                  checked={Boolean(otpPolicy?.auto_delete)}
                  disabled={!canUseAutoDelete || savingOtpPolicy}
                  onCheckedChange={(checked) => saveOtpPolicy({ ...otpPolicy, auto_delete: checked })}
                />
              </div>
              <div className="card-dark flex flex-col justify-between gap-4 sm:flex-row sm:items-center sm:p-6">
                <div className="space-y-1">
                  <p className="text-foreground font-bold">Mascheramento Codici</p>
                  <p className="text-neutral-500 text-xs">Nasconde i codici OTP finché non viene effettuata l&apos;azione di sblocco.</p>
                </div>
                <Switch
                  checked={Boolean(otpPolicy?.mask_otp)}
                  disabled={savingOtpPolicy}
                  onCheckedChange={(checked) => saveOtpPolicy({ ...otpPolicy, mask_otp: checked })}
                />
              </div>
              <div className="card-dark flex flex-col justify-between gap-4 sm:flex-row sm:items-center sm:p-6">
                <div className="space-y-1">
                  <p className="text-foreground font-bold">Whitelist Mittenti</p>
                  <p className="text-neutral-500 text-xs">
                    {whitelistMode === "enforce"
                      ? "Modalita enforcement attiva: i mittenti non fidati finiscono in quarantena."
                      : whitelistMode === "monitor"
                        ? "Modalita monitor attiva: osserva i mittenti senza bloccare il flusso."
                        : "Whitelist disattivata."}
                  </p>
                </div>
                <Switch
                  checked={whitelistMode !== "off"}
                  disabled={!canUseWhitelist || savingOtpPolicy}
                  onCheckedChange={(checked) => saveOtpPolicy({ ...otpPolicy, whitelist_mode: checked ? "monitor" : "off" })}
                />
              </div>
              <div className="card-dark px-4 py-3 text-xs text-neutral-500">
                {savingOtpPolicy
                  ? "Salvataggio policy in corso..."
                  : `Policy attuale: auto-delete ${otpPolicy?.auto_delete ? "on" : "off"}, mask OTP ${otpPolicy?.mask_otp ? "on" : "off"}, whitelist ${whitelistMode}.`}
              </div>
              {canUseWhitelist ? (
                <div className="card-dark space-y-4">
                  <p className="text-sm font-semibold text-foreground">Mittenti trusted</p>
                  <form onSubmit={addTrustedSender} className="flex flex-col gap-3 md:flex-row">
                    <Input
                      placeholder="Sender ID"
                      className="input-dark"
                      value={trustedSenderForm.sender_id}
                      onChange={(e) => onTrustedSenderFormChange((prev) => ({ ...prev, sender_id: e.target.value }))}
                    />
                    <Input
                      placeholder="Nome mittente"
                      className="input-dark"
                      value={trustedSenderForm.sender_name}
                      onChange={(e) => onTrustedSenderFormChange((prev) => ({ ...prev, sender_name: e.target.value }))}
                    />
                    <Button type="submit" className="btn-teal" disabled={savingTrustedSender}>
                      {savingTrustedSender ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Aggiungi"}
                    </Button>
                  </form>
                  {loadingTrustedSenders ? (
                    <p className="text-sm text-neutral-500">Caricamento whitelist...</p>
                  ) : trustedSenders.length === 0 ? (
                    <p className="text-sm text-neutral-500">Nessun mittente in whitelist.</p>
                  ) : (
                    trustedSenders.map((sender) => (
                      <div key={sender.id} className="glass-subtle flex items-center justify-between gap-3 rounded-xl p-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{sender.sender_name || sender.sender_id}</p>
                          <p className="text-xs text-neutral-500">{sender.sender_id}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-danger/40 text-danger hover:bg-danger/10"
                          disabled={removingTrustedSenderId === sender.id}
                          onClick={() => removeTrustedSender(sender.id)}
                        >
                          {removingTrustedSenderId === sender.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Rimuovi"}
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <DashboardSecureNotesSection
            canUseSecureNotes={canUseSecureNotes}
            secureNotes={secureNotes}
            secureNotesLimit={secureNotesLimit}
            secureNoteForm={secureNoteForm}
            onSecureNoteFormChange={onSecureNoteFormChange}
            saveSecureNote={saveSecureNote}
            savingSecureNote={savingSecureNote}
            resetSecureNoteForm={resetSecureNoteForm}
            loadSecureNotes={loadSecureNotes}
            loadingSecureNotes={loadingSecureNotes}
            editSecureNote={editSecureNote}
            deleteSecureNote={deleteSecureNote}
            deletingSecureNoteId={deletingSecureNoteId}
            e2eeReadyForEncrypt={e2eeReadyForEncrypt}
            e2eeUnlocked={e2eeUnlocked}
          />

          <Card className="panel-surface-elevated border-white/10">
            <CardHeader className="p-4 sm:p-8">
              <CardTitle className="flex items-center gap-2 text-xl font-display font-bold text-foreground">
                <Shield className="h-5 w-5 text-accent-primary" /> Authenticator TOTP
              </CardTitle>
              <CardDescription className="text-neutral-400">
                Importa un `otpauth://` o un secret base32 e genera i codici localmente nel vault.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-4 pt-0 sm:p-8 sm:pt-0">
              {!canUseTotp ? (
                <div className="card-dark p-5 text-sm text-neutral-500">TOTP non disponibile per il tuo piano.</div>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="stat-tile">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Account TOTP</p>
                      <p className="mt-2 text-sm font-semibold text-foreground">{totpEntries.length}</p>
                    </div>
                    <div className="stat-tile">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Vault</p>
                      <p className="mt-2 text-sm font-semibold text-foreground">{e2eeReadyForEncrypt ? "Pronto per cifrare" : "Da sbloccare"}</p>
                    </div>
                    <div className="stat-tile">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Refresh</p>
                      <p className="mt-2 text-sm font-semibold text-foreground">Locale ogni secondo</p>
                    </div>
                  </div>
                  {!e2eeReadyForEncrypt ? (
                    <div className="card-dark border-amber-500/30 text-sm text-amber-200">
                      Per aggiungere account TOTP devi prima attivare o sbloccare la cassaforte E2EE.
                    </div>
                  ) : null}
                  <form onSubmit={createTotpEntry} className="space-y-3">
                    <Input
                      placeholder="URL otpauth:// (consigliato)"
                      className="input-dark"
                      value={totpForm.otpauth_url}
                      onChange={(e) => onTotpFormChange((prev) => ({ ...prev, otpauth_url: e.target.value }))}
                    />
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input
                        placeholder="Label"
                        className="input-dark"
                        value={totpForm.label}
                        onChange={(e) => onTotpFormChange((prev) => ({ ...prev, label: e.target.value }))}
                      />
                      <Input
                        placeholder="Secret base32"
                        className="input-dark font-mono"
                        value={totpForm.secret_base32}
                        onChange={(e) => onTotpFormChange((prev) => ({ ...prev, secret_base32: e.target.value }))}
                      />
                    </div>
                    <Button type="submit" className="btn-teal w-full" disabled={savingTotp || !e2eeReadyForEncrypt}>
                      {savingTotp ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Aggiungi account TOTP"}
                    </Button>
                  </form>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-neutral-500">Codici aggiornati localmente ogni secondo</p>
                    <Button size="sm" variant="outline" className="border-border" onClick={refreshTotpCodes}>
                      {loadingTotpCodes ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Aggiorna"}
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {totpEntries.length === 0 ? (
                      <div className="card-dark p-5 text-sm text-neutral-500">
                        Nessun account TOTP configurato. Importa un `otpauth://` o un secret base32 per centralizzare i codici nel vault locale.
                      </div>
                    ) : (
                      totpEntries.map((entry) => {
                        const codeRow = (totpCodes || []).find((row) => row.id === entry.id);
                        return (
                          <div key={entry.id} className="card-dark">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-foreground">{entry.label || entry.account_name || "TOTP"}</p>
                                <p className="text-xs text-neutral-500">{entry.issuer || entry.account_name || "Authenticator"}</p>
                                <p className="mt-2 font-mono text-2xl text-accent-primary">
                                  {codeRow?.code || (entry.encrypted_payload ? "Sblocca vault" : "------")}
                                </p>
                                <p className="text-xs text-neutral-500">
                                  {codeRow?.expires_in ? `Scade tra ${codeRow.expires_in}s` : entry.encrypted_payload ? "Codice disponibile dopo lo sblocco locale." : "Codice non disponibile"}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {codeRow?.code ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-border"
                                    onClick={() => {
                                      navigator.clipboard.writeText(codeRow.code);
                                      toast.success("Codice TOTP copiato");
                                    }}
                                  >
                                    <Copy className="mr-2 h-4 w-4" /> Copia
                                  </Button>
                                ) : null}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-danger/40 text-danger hover:bg-danger/10"
                                  aria-label={`Rimuovi account TOTP ${entry.label || entry.account_name || entry.id}`}
                                  disabled={deletingTotpId === entry.id}
                                  onClick={() => deleteTotpEntry(entry.id)}
                                >
                                  {deletingTotpId === entry.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {hasAuditVisibility ? (
            <Card className="panel-surface-elevated border-white/10">
              <CardHeader className="p-4 sm:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl font-display font-bold text-foreground">Audit log</CardTitle>
                    <CardDescription className="mt-1 text-neutral-400">
                      Traccia accessi OTP condivisi, eventi di autofill e audit account in un solo blocco operativo.
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {canViewSharedOtpAudit ? <Button variant="outline" className="btn-outline-teal" onClick={loadOtpAccessLogs}>OTP accessi</Button> : null}
                    {canViewSharedOtpAudit ? <Button variant="outline" className="btn-outline-teal" onClick={loadOtpAutofillLogs}>Autofill</Button> : null}
                    {canViewAccountAudit ? <Button variant="outline" className="btn-outline-teal" onClick={loadAccountAuditLogs}>Account</Button> : null}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 p-4 pt-0 sm:p-8 sm:pt-0">
                {canViewSharedOtpAudit ? (
                  <div>
                    <p className="mb-3 text-sm font-semibold text-foreground">Accessi OTP condivisi</p>
                    {loadingOtpAccessLogs ? (
                      <p className="text-sm text-neutral-500">Caricamento log accessi...</p>
                    ) : otpAccessLogs.length === 0 ? (
                      <div className="card-dark text-sm text-neutral-500">Nessun log accessi disponibile.</div>
                    ) : (
                      otpAccessLogs.slice(0, 5).map((row) => (
                        <div key={row.id} className="card-dark mb-2 text-sm">
                          <p className="font-semibold text-foreground">{row.viewer_name || row.viewer_email || "Viewer"}</p>
                          <p className="text-neutral-500">{row.sender_name || row.from_number || "Messaggio OTP"} • {row.created_at ? new Date(row.created_at).toLocaleString("it-IT") : "n/d"}</p>
                        </div>
                      ))
                    )}
                  </div>
                ) : null}

                {canViewSharedOtpAudit ? (
                  <div>
                    <p className="mb-3 text-sm font-semibold text-foreground">Autofill OTP</p>
                    {loadingOtpAutofillLogs ? (
                      <p className="text-sm text-neutral-500">Caricamento log autofill...</p>
                    ) : otpAutofillLogs.length === 0 ? (
                      <div className="card-dark text-sm text-neutral-500">Nessun log autofill disponibile.</div>
                    ) : (
                      otpAutofillLogs.slice(0, 5).map((row) => (
                        <div key={row.id} className="card-dark mb-2 text-sm">
                          <p className="font-semibold text-foreground">{row.domain || row.tab_url || "Evento autofill"}</p>
                          <p className="text-neutral-500">{row.event_type || row.status} • {row.created_at ? new Date(row.created_at).toLocaleString("it-IT") : "n/d"}</p>
                        </div>
                      ))
                    )}
                  </div>
                ) : null}

                {canViewAccountAudit ? (
                  <div>
                    <p className="mb-3 text-sm font-semibold text-foreground">Eventi account</p>
                    {loadingAccountAuditLogs ? (
                      <p className="text-sm text-neutral-500">Caricamento audit account...</p>
                    ) : accountAuditLogs.length === 0 ? (
                      <div className="card-dark text-sm text-neutral-500">Nessun audit account disponibile.</div>
                    ) : (
                      accountAuditLogs.slice(0, 5).map((row) => (
                        <div key={row.id} className="card-dark mb-2 text-sm">
                          <p className="font-semibold text-foreground">{row.event_type || "Evento"}</p>
                          <p className="text-neutral-500">{row.message || "Nessun dettaglio"} • {row.created_at ? new Date(row.created_at).toLocaleString("it-IT") : "n/d"}</p>
                        </div>
                      ))
                    )}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-8">
          {isAdmin ? (
            <Card className="panel-surface-elevated overflow-hidden border-white/10">
              <CardHeader className="p-4 sm:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl font-display font-bold text-foreground">Alert operativi</CardTitle>
                    <CardDescription className="mt-1 text-neutral-400">
                      Alert di sicurezza generati dal backend.
                    </CardDescription>
                  </div>
                  <Button variant="outline" className="border-border" onClick={loadSecurityAlerts}>
                    {loadingSecurityAlerts ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Aggiorna"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 p-4 pt-0 sm:p-8 sm:pt-0">
                {loadingSecurityAlerts ? (
                  <p className="text-sm text-neutral-500">Caricamento alert...</p>
                ) : securityAlerts.length === 0 ? (
                  <div className="card-dark text-sm text-neutral-500">Nessun alert aperto.</div>
                ) : (
                  securityAlerts.map((alert) => (
                    <div key={alert.id} className="card-dark">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-foreground">{alert.title}</p>
                          <p className="text-sm text-neutral-400">{alert.description}</p>
                          <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
                            {alert.severity} • occorrenze {alert.occurrences || 1} • ultimo trigger {alert.last_triggered_at ? new Date(alert.last_triggered_at).toLocaleString("it-IT") : "n/d"}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-border"
                          disabled={resolvingAlertId === alert.id}
                          onClick={() => resolveSecurityAlert(alert.id)}
                        >
                          {resolvingAlertId === alert.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Risolvi"}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ) : null}

          {canUseKillSwitch ? (
            <Card className="overflow-hidden rounded-[32px] border border-danger/20 bg-danger/5">
              <CardHeader className="p-4 sm:p-8">
                <CardTitle className="text-danger text-xl font-display font-bold flex items-center gap-2"><AlertOctagon className="w-6 h-6" /> Zona Pericolo</CardTitle>
                <CardDescription className="text-neutral-400">
                  Da usare solo in caso di compromissione reale dell&apos;account o dei dispositivi trusted.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-8 pt-0 space-y-6">
                <p className="text-neutral-400 text-sm leading-relaxed">
                  In caso di compromissione del tuo account o dei tuoi dispositivi, attiva il Kill Switch per congelare istantaneamente ogni accesso.
                </p>
                <div className="card-dark border-danger/20 p-4 text-xs text-neutral-400">
                  L&apos;azione richiede password step-up e puo includere il freeze dei messaggi. Usala solo quando vuoi interrompere subito l&apos;operativita.
                </div>
                <Input
                  type="password"
                  placeholder="Password account per conferma step-up"
                  className="input-dark"
                  value={panicPassword}
                  onChange={(e) => onPanicPasswordChange(e.target.value)}
                  disabled={panicBusy}
                />
                <label htmlFor="panic-delete-data" className="flex items-center gap-3 text-sm text-neutral-300">
                  <Checkbox
                    id="panic-delete-data"
                    checked={panicConfirmDelete}
                    onCheckedChange={(checked) => onPanicConfirmDeleteChange(Boolean(checked))}
                    disabled={panicBusy}
                  />
                  Cancella anche i dati messaggi durante il freeze
                </label>
                <Button
                  onClick={triggerPanicFreeze}
                  disabled={panicBusy || !killSwitchReady}
                  className="w-full bg-danger hover:bg-danger/90 text-white h-14 rounded-2xl font-bold shadow-[0_10px_20px_rgba(239,68,68,0.2)]"
                >
                  {panicBusy ? <RefreshCw className="h-5 w-5 animate-spin" /> : "ATTIVA KILL SWITCH"}
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </TabsContent>
  );
};
