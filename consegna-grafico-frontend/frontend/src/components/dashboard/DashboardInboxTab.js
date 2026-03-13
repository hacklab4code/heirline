import { toast } from "sonner";
import { Copy, Inbox, Mail, MessageSquare, Mic, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { TabsContent } from "@/components/ui/tabs";

export const DashboardInboxTab = ({
  messages,
  inboxSourceFilter,
  onInboxSourceFilterChange,
  inboxOtpOnly,
  onInboxOtpOnlyChange,
  sourceCounts,
  encryptedMessageCount,
  e2eeUnlocked,
  messageDecrypting,
  filteredMessages,
  onSimulate,
  canSimulate,
  normalizeMessageSource,
  onMarkRead,
  sharedInboxMessages,
  loadingSharedInbox,
  canManageSharedAccess,
  sharedAccessOwned,
  sharedAccessReceived,
  sharedAccessForm,
  onSharedAccessFormChange,
  createSharedAccess,
  savingSharedAccess,
  revokeSharedAccess,
  revokingSharedAccessId,
  onMarkSharedRead,
}) => {
  const inboxFilters = [
    { key: "all", label: "Tutti" },
    { key: "sms", label: "SMS" },
    { key: "voice", label: "Voice" },
    { key: "email", label: "Email" },
  ];
  const activeFilterLabel = inboxFilters.find((filter) => filter.key === inboxSourceFilter)?.label || "Tutti";
  const showSharedInbox = canManageSharedAccess || loadingSharedInbox || sharedInboxMessages.length > 0;

  return (
    <TabsContent value="inbox" className="mt-0">
      <div className="space-y-6 sm:space-y-8">
        <Card className="panel-surface-elevated overflow-hidden border-white/10">
          <CardHeader className="border-b border-white/10 p-4 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-3 text-xl font-display font-bold text-foreground sm:text-2xl">
                <MessageSquare className="h-6 w-6 text-accent-primary" /> Inbox
              </CardTitle>
              <Badge variant="outline" className="border-white/10 font-mono text-neutral-400">
                {messages.length} TOTALE
              </Badge>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {inboxFilters.map((filter) => (
                <Button
                  key={filter.key}
                  size="sm"
                  variant={inboxSourceFilter === filter.key ? "default" : "outline"}
                  className={inboxSourceFilter === filter.key ? "btn-teal h-9 rounded-xl px-3" : "btn-outline-teal h-9 rounded-xl px-3"}
                  onClick={() => onInboxSourceFilterChange(filter.key)}
                >
                  {filter.label} ({sourceCounts[filter.key] || 0})
                </Button>
              ))}
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto]">
              <div className="card-dark flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Solo OTP</p>
                  <p className="text-xs text-neutral-500">Nasconde email e messaggi normali senza codice.</p>
                </div>
                <div className="flex items-center gap-3">
                  {inboxOtpOnly ? (
                    <Badge variant="outline" className="border-accent-primary/40 text-accent-primary">Attivo</Badge>
                  ) : null}
                  <Switch checked={inboxOtpOnly} onCheckedChange={onInboxOtpOnlyChange} aria-label="Mostra solo messaggi OTP" />
                </div>
              </div>

              {canSimulate ? (
                <Button onClick={onSimulate} variant="outline" className="btn-outline-teal h-auto min-h-[76px]">
                  Prova una simulazione
                </Button>
              ) : null}
            </div>
            {encryptedMessageCount > 0 ? (
              <div className={`mt-4 ${e2eeUnlocked ? "card-highlight" : "card-dark border-danger/30"}`}>
                <p className="font-semibold text-foreground">
                  {e2eeUnlocked
                    ? `${encryptedMessageCount} messaggi protetti disponibili per lettura locale`
                    : `${encryptedMessageCount} messaggi protetti richiedono sblocco E2EE`}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  {e2eeUnlocked
                    ? messageDecrypting
                      ? "Decifratura lato client in corso."
                      : "I payload cifrati vengono decifrati solo in questo browser."
                    : "Vai in Sicurezza per attivare o sbloccare la cassaforte locale."}
                </p>
              </div>
            ) : null}
          </CardHeader>
          <CardContent className="p-0">
            {filteredMessages.length === 0 ? (
              <div className="dashboard-empty-state m-3 sm:m-4">
                <div className="dashboard-empty-orb animate-pulse-soft">
                  <Inbox className="h-10 w-10 text-white/85" />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-bold text-foreground sm:text-xl">
                    {messages.length === 0 ? "Ancora nessun messaggio" : "Nessun messaggio per questo filtro"}
                  </p>
                  <p className="mx-auto max-w-md text-sm leading-relaxed text-neutral-400">
                    {messages.length === 0
                      ? "La inbox resta in ascolto per SMS, voice ed email alias. I codici OTP ricevuti appariranno qui in tempo reale."
                      : "I filtri attivi stanno restringendo la vista corrente. Cambia sorgente o disattiva Solo OTP per rivedere il flusso completo."}
                  </p>
                </div>
                <div className="dashboard-empty-meta">
                  <div className="dashboard-empty-chip">Filtro: {activeFilterLabel}</div>
                  <div className="dashboard-empty-chip">{inboxOtpOnly ? "Solo OTP attivo" : "Vista completa"}</div>
                  <div className="dashboard-empty-chip">{messages.length === 0 ? "In attesa del primo evento" : "Nessun match disponibile"}</div>
                </div>
                {canSimulate ? (
                  <div className="mt-6">
                    <Button onClick={onSimulate} variant="outline" className="btn-outline-teal h-11 rounded-xl px-5">
                      Prova un evento demo
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : (
              <ScrollArea className="h-[65vh] sm:h-[600px]">
                <div className="space-y-3 p-3 sm:p-4">
                  {filteredMessages.map((msg) => {
                    const sourceType = normalizeMessageSource(msg);
                    return (
                      <div
                        key={msg.id}
                        onClick={() => !msg.is_read && onMarkRead(msg.id)}
                        className={`inbox-item group cursor-pointer ${!msg.is_read ? "unread" : ""}`}
                      >
                        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${sourceType === "voice" ? "bg-accent-secondary/20 text-accent-secondary" : sourceType === "email" ? "bg-accent-gold/20 text-accent-gold" : "bg-accent-primary/20 text-accent-primary"}`}>
                              {sourceType === "voice" ? <Mic className="h-5 w-5" /> : sourceType === "email" ? <Mail className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
                            </div>
                            <div>
                              <p className="font-bold tracking-wide text-foreground">{msg.sender_name || msg.from_number}</p>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                                {sourceType === "voice" ? "Chiamata vocale" : sourceType === "email" ? "Email Vault Alias" : "SMS standard"}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-mono text-neutral-500">{new Date(msg.received_at).toLocaleString("it-IT", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}</span>
                        </div>

                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center sm:gap-6">
                          <div className="flex-grow space-y-3">
                            <p className="text-sm leading-relaxed text-neutral-400">
                              {msg.body || (msg.encrypted_payload ? "Messaggio cifrato: completa la decrittazione lato client." : "Contenuto non disponibile.")}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {msg.encrypted_payload ? (
                                <Badge variant="outline" className={msg.decrypted_local ? "border-accent-primary/40 text-accent-primary" : "border-white/10 text-neutral-400"}>
                                  {msg.decrypted_local ? "Decifrato localmente" : "Payload cifrato"}
                                </Badge>
                              ) : null}
                              {msg.requires_e2ee_setup ? (
                                <Badge variant="outline" className="border-danger/40 text-danger">
                                  Configura E2EE per i nuovi messaggi
                                </Badge>
                              ) : null}
                              {msg.decrypt_error ? (
                                <Badge variant="outline" className="border-danger/40 text-danger">
                                  Chiave locale non compatibile con questo messaggio
                                </Badge>
                              ) : null}
                            </div>
                            {msg.is_otp && msg.otp_code ? (
                              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                                <span className="otp-display text-3xl sm:text-4xl">{msg.otp_code}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="w-fit text-accent-primary opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(msg.otp_code);
                                    toast.success("Codice copiato");
                                  }}
                                >
                                  <Copy className="mr-2 h-4 w-4" /> Copia
                                </Button>
                              </div>
                            ) : null}
                            {msg.is_otp && !msg.otp_code ? (
                              <p className="text-xs text-neutral-500">OTP non mostrato in questa vista protetta.</p>
                            ) : null}
                          </div>
                          {!msg.is_read ? <div className="h-2 w-2 rounded-full bg-accent-primary shadow-[0_0_10px_rgba(0,212,170,0.5)]" /> : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      {canManageSharedAccess ? (
        <Card className="panel-surface-elevated border-white/10">
          <CardHeader className="border-b border-white/10 p-4 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-xl font-display font-bold text-foreground flex items-center gap-2">
                <Users className="h-5 w-5 text-accent-primary" />
                Condivisione Team / Family
              </CardTitle>
              <p className="hidden text-xs text-neutral-500 sm:block">
                Invita membri fidati a consultare solo gli OTP che servono al loro lavoro.
              </p>
            </div>
          </CardHeader>
        <CardContent className="space-y-6 p-4 sm:p-8">
          <form onSubmit={createSharedAccess} className="flex flex-col gap-3 md:flex-row">
            <input
              type="email"
              className="input-dark h-12 flex-1 rounded-xl px-4"
              placeholder="email del membro"
              value={sharedAccessForm.viewer_email}
              onChange={(e) => onSharedAccessFormChange({ viewer_email: e.target.value })}
            />
            <Button type="submit" className="btn-teal" disabled={savingSharedAccess}>
              {savingSharedAccess ? "Salvataggio..." : "Condividi inbox"}
            </Button>
          </form>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Accessi concessi</p>
              {sharedAccessOwned.length === 0 ? (
                <div className="card-dark p-5 text-sm text-neutral-500">Nessuna condivisione attiva.</div>
              ) : sharedAccessOwned.map((share) => (
                <div key={share.id} className="card-dark">
                  <p className="text-sm font-semibold text-foreground">{share.viewer_name || share.viewer_email}</p>
                  <p className="text-xs text-neutral-500">{share.viewer_email}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 border-danger/40 text-danger hover:bg-danger/10"
                    disabled={revokingSharedAccessId === share.id}
                    onClick={() => revokeSharedAccess(share.id)}
                  >
                    {revokingSharedAccessId === share.id ? "Revoca..." : "Revoca"}
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Accessi ricevuti</p>
              {sharedAccessReceived.length === 0 ? (
                <div className="card-dark p-5 text-sm text-neutral-500">Nessun accesso ricevuto.</div>
              ) : sharedAccessReceived.map((share) => (
                <div key={share.id} className="card-dark">
                  <p className="text-sm font-semibold text-foreground">{share.owner_name || share.owner_email}</p>
                  <p className="text-xs text-neutral-500">{share.owner_email}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      ) : null}

      {showSharedInbox ? (
        <Card className="panel-surface-elevated border-white/10">
          <CardHeader className="border-b border-white/10 p-4 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-xl font-display font-bold text-foreground flex items-center gap-2">
                <Inbox className="h-5 w-5 text-accent-primary" />
                Inbox condivisa
              </CardTitle>
              <p className="hidden text-xs text-neutral-500 sm:block">
                Qui vedi solo gli OTP condivisi dai tuoi contatti o dal team.
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 p-4 sm:p-8">
            {loadingSharedInbox ? (
              <p className="text-sm text-neutral-500">Caricamento shared inbox...</p>
            ) : sharedInboxMessages.length === 0 ? (
              <p className="text-sm text-neutral-500">Nessun OTP condiviso disponibile.</p>
            ) : (
              sharedInboxMessages.map((msg) => (
                <div key={msg.id} className="card-dark">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {msg.owner_name || msg.owner_email || msg.sender_name || msg.from_number}
                      </p>
                      <p className="mt-1 text-sm text-neutral-400">
                        {msg.body || "Messaggio condiviso disponibile."}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" className="border-border" onClick={() => onMarkSharedRead(msg.id)}>
                      Segna letto
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ) : null}
      </div>
    </TabsContent>
  );
};
