import { HeartHandshake, Mail, Plus, RefreshCw, Shield, Trash2, Undo2, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TabsContent } from "@/components/ui/tabs";

const statusLabelMap = {
  active: "Attiva",
  notified: "Rilasciata",
  accessed: "Consultata",
  pending: "In attesa",
};

const formatDateTime = (value) => {
  if (!value) return "n/d";
  try {
    return new Date(value).toLocaleString("it-IT");
  } catch {
    return "n/d";
  }
};

export const DashboardDelegatesTab = ({
  delegates,
  delegatesLimit,
  e2eeReadyForEncrypt,
  delegateForm,
  onDelegateFormChange,
  delegateStepUpPassword,
  onDelegateStepUpPasswordChange,
  createDelegate,
  creatingDelegate,
  loadDelegates,
  loadingDelegates,
  removeDelegate,
  removingDelegateId,
  overrideDelegateRelease,
  overridingDelegateId,
}) => {
  const canManageDelegates = delegatesLimit > 0;
  const formIsFull = String(delegateForm.delegate_name || "").trim() && String(delegateForm.delegate_email || "").trim();
  const delegateStepUpReady = String(delegateStepUpPassword || "").trim().length >= 8;
  const canCreateDelegate = canManageDelegates && formIsFull && delegateStepUpReady && e2eeReadyForEncrypt;
  const vaultStatusLabel = e2eeReadyForEncrypt ? "Vault pronto" : "Vault richiesto";

  return (
    <TabsContent value="delegates" className="mt-0">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="panel-surface-elevated overflow-hidden border-white/10">
          <CardHeader className="border-b border-white/10 p-4 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-3 text-2xl font-display font-bold text-foreground">
                  <HeartHandshake className="h-6 w-6 text-accent-gold" /> Eredi digitali
                </CardTitle>
                <CardDescription className="text-neutral-400">
                  Configura chi puo ricevere accesso dopo un periodo di inattivita e tieni visibile lo stato di rilascio.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-border font-mono text-neutral-400">
                  {delegates.length}/{delegatesLimit || 0}
                </Badge>
                {canManageDelegates ? (
                  <Badge className={delegateStepUpReady ? "bg-accent-primary/20 text-accent-primary border-none" : "bg-amber-500/20 text-amber-200 border-none"}>
                    {delegateStepUpReady ? "STEP-UP PRONTO" : "CONFERMA RICHIESTA"}
                  </Badge>
                ) : null}
                <Button variant="outline" className="border-border" onClick={loadDelegates}>
                  {loadingDelegates ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Aggiorna"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-8">
            {!canManageDelegates ? (
              <div className="dashboard-empty-state">
                <div className="dashboard-empty-orb">
                  <Shield className="h-8 w-8 text-accent-gold" />
                </div>
                <h3 className="text-xl font-display font-bold text-foreground">Funzione disponibile dal piano superiore</h3>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-neutral-400">
                  La continuita operativa e le deleghe sono gia supportate dal backend, ma il tuo piano corrente non abilita nuovi eredi.
                </p>
                <div className="dashboard-empty-meta">
                  <div className="dashboard-empty-chip">Limite attuale: {delegatesLimit || 0}</div>
                  <div className="dashboard-empty-chip">{vaultStatusLabel}</div>
                </div>
              </div>
            ) : delegates.length === 0 ? (
              <div className="dashboard-empty-state">
                <div className="dashboard-empty-orb animate-pulse-soft">
                  <Users className="h-8 w-8 text-accent-gold" />
                </div>
                <h3 className="text-xl font-display font-bold text-foreground">Nessun erede configurato</h3>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-neutral-400">
                  Aggiungi almeno un contatto fidato per testare davvero il flusso di delega ed evitare una dashboard solo illustrativa.
                </p>
                <div className="dashboard-empty-meta">
                  <div className="dashboard-empty-chip">Slot disponibili: {delegatesLimit || 0}</div>
                  <div className="dashboard-empty-chip">{vaultStatusLabel}</div>
                  <div className="dashboard-empty-chip">{delegateStepUpReady ? "Step-up pronto" : "Step-up da confermare"}</div>
                </div>
              </div>
            ) : (
              delegates.map((delegate) => {
                const releaseLive = Boolean(delegate.warning_stage || delegate.grace_until || delegate.status === "notified");
                return (
                  <div key={delegate.id} className="card-dark">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-semibold text-foreground">
                            {delegate.requires_client_decryption ? "Delega cifrata lato client" : (delegate.delegate_name || "Erede digitale")}
                          </p>
                          <Badge className={releaseLive ? "bg-accent-secondary/20 text-accent-secondary border-none" : "bg-accent-primary/20 text-accent-primary border-none"}>
                            {statusLabelMap[delegate.status] || delegate.status}
                          </Badge>
                          {delegate.warning_stage ? (
                            <Badge variant="outline" className="border-accent-gold/40 text-accent-gold">
                              Warning {delegate.warning_stage}
                            </Badge>
                          ) : null}
                        </div>

                        <div className="grid gap-3 text-sm text-neutral-400 sm:grid-cols-2">
                          <div className="glass-subtle rounded-2xl px-4 py-3">
                            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500">Rilascio dopo</div>
                            <div className="mt-1 font-semibold text-foreground">{delegate.inactivity_days} giorni</div>
                          </div>
                          <div className="glass-subtle rounded-2xl px-4 py-3">
                            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500">Creata il</div>
                            <div className="mt-1 font-semibold text-foreground">{formatDateTime(delegate.created_at)}</div>
                          </div>
                        </div>

                        <div className="space-y-1 text-sm text-neutral-400">
                          {!delegate.requires_client_decryption ? (
                            <>
                              <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-accent-primary" /> {delegate.delegate_email}</p>
                              {delegate.relationship ? <p>Relazione: <span className="text-foreground">{delegate.relationship}</span></p> : null}
                              {delegate.delegate_phone ? <p>Telefono: <span className="text-foreground">{delegate.delegate_phone}</span></p> : null}
                            </>
                          ) : (
                            <p>I dati del delegato sono conservati in payload cifrato e non vengono esposti in chiaro da questa vista.</p>
                          )}
                          {delegate.grace_until ? <p>Grace period fino al: <span className="text-foreground">{formatDateTime(delegate.grace_until)}</span></p> : null}
                          {delegate.access_expires_at ? <p>Accesso disponibile fino al: <span className="text-foreground">{formatDateTime(delegate.access_expires_at)}</span></p> : null}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {releaseLive ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-accent-secondary/40 text-accent-secondary hover:bg-accent-secondary/10"
                            disabled={!delegateStepUpReady || overridingDelegateId === delegate.id}
                            onClick={() => overrideDelegateRelease(delegate.id)}
                          >
                            {overridingDelegateId === delegate.id ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Undo2 className="mr-2 h-4 w-4" />}
                            Annulla rilascio
                          </Button>
                        ) : null}
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-danger/40 text-danger hover:bg-danger/10"
                          disabled={!delegateStepUpReady || removingDelegateId === delegate.id}
                          onClick={() => removeDelegate(delegate.id)}
                        >
                          {removingDelegateId === delegate.id ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                          Revoca
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="panel-surface-elevated border-white/10">
          <CardHeader className="p-4 sm:p-8">
            <CardTitle className="flex items-center gap-3 text-xl font-display font-bold text-foreground">
              <Plus className="h-5 w-5 text-accent-primary" /> Nuovo erede
            </CardTitle>
            <CardDescription className="text-neutral-400">
              Mantieni il flusso semplice: nome, email e finestra di inattivita sono sufficienti per attivare la funzione.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-4 pt-0 sm:p-8 sm:pt-0">
            <form onSubmit={createDelegate} className="space-y-4">
              <div className="card-dark p-4">
                <p className="text-sm font-semibold text-foreground">Conferma operazioni sensibili</p>
                <p className="mt-1 text-xs text-neutral-500">
                  Aggiunta, revoca e annullamento rilascio richiedono una conferma password per lo step-up.
                </p>
              </div>
              {!e2eeReadyForEncrypt ? (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                  Prima di creare un erede devi attivare o sbloccare la cassaforte E2EE nella tab Sicurezza.
                </div>
              ) : null}
              <Input
                placeholder="Nome completo"
                className="input-dark"
                value={delegateForm.delegate_name}
                onChange={(e) => onDelegateFormChange((prev) => ({ ...prev, delegate_name: e.target.value }))}
                disabled={!canManageDelegates || creatingDelegate}
              />
              <Input
                type="email"
                placeholder="Email erede"
                className="input-dark"
                value={delegateForm.delegate_email}
                onChange={(e) => onDelegateFormChange((prev) => ({ ...prev, delegate_email: e.target.value }))}
                disabled={!canManageDelegates || creatingDelegate}
              />
              <Input
                placeholder="Relazione (opzionale)"
                className="input-dark"
                value={delegateForm.relationship}
                onChange={(e) => onDelegateFormChange((prev) => ({ ...prev, relationship: e.target.value }))}
                disabled={!canManageDelegates || creatingDelegate}
              />
              <Input
                placeholder="Telefono (opzionale)"
                className="input-dark"
                value={delegateForm.delegate_phone}
                onChange={(e) => onDelegateFormChange((prev) => ({ ...prev, delegate_phone: e.target.value }))}
                disabled={!canManageDelegates || creatingDelegate}
              />
              <Input
                type="number"
                min={30}
                max={365}
                placeholder="Giorni di inattivita"
                className="input-dark"
                value={delegateForm.inactivity_days}
                onChange={(e) => onDelegateFormChange((prev) => ({ ...prev, inactivity_days: Number(e.target.value || 90) }))}
                disabled={!canManageDelegates || creatingDelegate}
              />
              <Input
                type="password"
                placeholder="Password account per conferma"
                className="input-dark"
                value={delegateStepUpPassword}
                onChange={(e) => onDelegateStepUpPasswordChange(e.target.value)}
                disabled={!canManageDelegates || creatingDelegate}
              />
              <Button type="submit" className="btn-teal w-full" disabled={!canCreateDelegate || creatingDelegate}>
                {creatingDelegate ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Aggiungi erede"}
              </Button>
            </form>

            <div className="card-highlight">
              <h4 className="flex items-center gap-2 text-lg font-display font-bold text-accent-gold">
                <Shield className="h-5 w-5" /> Come funziona
              </h4>
              <ul className="mt-4 space-y-3 text-sm text-neutral-400">
                <li>Se l&apos;account resta inattivo parte una sequenza di warning progressivi.</li>
                <li>Durante il grace period puoi annullare il rilascio dalla dashboard.</li>
                <li>Se E2EE e attivo, i dati del delegato restano protetti in payload cifrato.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
};
