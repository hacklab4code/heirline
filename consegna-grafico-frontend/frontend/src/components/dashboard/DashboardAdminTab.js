import { Activity, TriangleAlert as AlertTriangle, ChartBar as BarChart3, CreditCard, FileDown, Phone, RefreshCw, Search, ShieldAlert, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TabsContent } from "@/components/ui/tabs";

const formatDateTime = (value) => {
  if (!value) return "n/d";
  try {
    return new Date(value).toLocaleString("it-IT", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "n/d";
  }
};

const formatLongDateTime = (value) => {
  if (!value) return "n/d";
  try {
    return new Date(value).toLocaleString("it-IT");
  } catch {
    return "n/d";
  }
};

const formatPercent = (value) => `${Number(value || 0).toFixed(2)}%`;

const formatAmount = (value, currency = "EUR") => {
  const amount = Number(value || 0);
  try {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: currency || "EUR",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency || "EUR"}`;
  }
};

const getSeverityBadgeClass = (severity) => {
  const normalized = String(severity || "").toLowerCase();
  if (normalized === "high") return "bg-danger/15 text-danger border-danger/30";
  if (normalized === "medium") return "bg-amber-500/15 text-amber-300 border-amber-500/30";
  return "bg-accent-primary/15 text-accent-primary border-accent-primary/30";
};

const getStatusBadgeClass = (status) => {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "active" || normalized === "complete" || normalized === "fulfilled") {
    return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  }
  if (normalized === "frozen" || normalized === "failed" || normalized === "suspended") {
    return "bg-danger/15 text-danger border-danger/30";
  }
  if (normalized === "pending" || normalized === "processing") {
    return "bg-amber-500/15 text-amber-300 border-amber-500/30";
  }
  return "bg-neutral-500/15 text-neutral-200 border-white/10";
};

export const DashboardAdminTab = ({ section }) => {
  const {
    securityAlerts,
    loadingSecurityAlerts,
    loadSecurityAlerts,
    resolveSecurityAlert,
    resolvingAlertId,
    adminSearchQuery,
    onAdminSearchQueryChange,
    adminSearchResults,
    searchingAdminUsers,
    selectedAdminUserId,
    loadAdminUserProfile,
    adminUserProfile,
    loadingAdminUserProfile,
    adminPlanDraft,
    onAdminPlanDraftChange,
    updateAdminUserPlan,
    updatingAdminUserPlan,
    adminBurnerHours,
    onAdminBurnerHoursChange,
    grantAdminBurnerNumber,
    addingAdminBurnerNumber,
    freezeAdminUser,
    freezingAdminUserId,
    realignAdminBilling,
    realigningAdminUserId,
    kpiData,
    kpiDays,
    onKpiDaysChange,
    loadAdminKpi,
    loadingAdminKpi,
    exportAdminCsv,
    exportingAdminCsv,
  } = section;

  const selectedUser = adminUserProfile?.user || null;
  const selectedSummary = adminUserProfile?.summary || {};
  const selectedNumbers = adminUserProfile?.numbers || [];
  const selectedInboundLogs = adminUserProfile?.inbound_logs || [];
  const selectedPayments = adminUserProfile?.payment_transactions || [];
  const selectedWebhooks = adminUserProfile?.stripe_webhooks || [];
  const funnelRows = kpiData?.funnel || [];
  const dailyPulseRows = [...(kpiData?.daily_pulse?.series || [])].slice(-7).reverse();
  const kpiAlerts = kpiData?.alerts || [];
  const nextBestActions = kpiData?.next_best_actions || [];
  const topBottlenecks = kpiData?.bottlenecks || [];
  const healthScore = kpiData?.health_score || {};
  const totals = kpiData?.totals || {};
  const severitySummary = securityAlerts.reduce((acc, alert) => {
    const key = String(alert?.severity || "low").toLowerCase();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, { high: 0, medium: 0, low: 0 });

  const overallConversionPct = funnelRows.length >= 2 && Number(funnelRows[0]?.unique_actors || 0) > 0
    ? formatPercent((Number(funnelRows[funnelRows.length - 1]?.unique_actors || 0) / Number(funnelRows[0]?.unique_actors || 0)) * 100)
    : "0.00%";

  return (
    <TabsContent value="admin" className="mt-0">
      <div className="space-y-8">
        <Card className="panel-surface-elevated border-white/10">
          <CardHeader className="p-4 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl font-display font-bold text-foreground">
                  <ShieldAlert className="h-5 w-5 text-danger" /> Radar Sicurezza
                </CardTitle>
                <CardDescription className="mt-1 text-neutral-400">
                  Alert anti-abuso aperti e risoluzione operativa immediata.
                </CardDescription>
              </div>
              <Button variant="outline" className="border-border" onClick={loadSecurityAlerts}>
                {loadingSecurityAlerts ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Aggiorna alert"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 p-4 pt-0 sm:p-8 sm:pt-0">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="stat-tile">
                <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Alert aperti</p>
                <p className="mt-2 text-2xl font-display font-bold text-foreground">{securityAlerts.length}</p>
              </div>
              <div className="stat-tile">
                <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">High</p>
                <p className="mt-2 text-2xl font-display font-bold text-danger">{severitySummary.high || 0}</p>
              </div>
              <div className="stat-tile">
                <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Medium</p>
                <p className="mt-2 text-2xl font-display font-bold text-amber-300">{severitySummary.medium || 0}</p>
              </div>
              <div className="stat-tile">
                <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Low</p>
                <p className="mt-2 text-2xl font-display font-bold text-accent-primary">{severitySummary.low || 0}</p>
              </div>
            </div>

            {securityAlerts.length === 0 ? (
              <div className="card-highlight">
                <p className="text-sm font-semibold text-foreground">Nessun alert aperto.</p>
                <p className="mt-1 text-sm text-neutral-400">Il radar anti-abuso e pulito in questo momento.</p>
              </div>
            ) : (
              <div className="card-dark overflow-hidden p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="px-4 py-3">Severita</TableHead>
                      <TableHead className="px-4 py-3">Alert</TableHead>
                      <TableHead className="px-4 py-3">Occorrenze</TableHead>
                      <TableHead className="px-4 py-3">Ultimo trigger</TableHead>
                      <TableHead className="px-4 py-3 text-right">Azione</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {securityAlerts.map((alert) => (
                      <TableRow key={alert.id} className="border-white/10">
                        <TableCell className="px-4 py-4 align-top">
                          <Badge variant="outline" className={getSeverityBadgeClass(alert.severity)}>
                            {String(alert.severity || "low").toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-4 align-top">
                          <p className="font-semibold text-foreground">{alert.title}</p>
                          <p className="mt-1 text-xs leading-relaxed text-neutral-400">{alert.description}</p>
                        </TableCell>
                        <TableCell className="px-4 py-4 align-top text-sm text-neutral-300">
                          {alert.occurrences || 1}
                        </TableCell>
                        <TableCell className="px-4 py-4 align-top text-sm text-neutral-400">
                          {formatLongDateTime(alert.last_triggered_at || alert.created_at)}
                        </TableCell>
                        <TableCell className="px-4 py-4 align-top text-right">
                          <Button
                            size="sm"
                            className="btn-teal"
                            disabled={resolvingAlertId === alert.id}
                            onClick={() => resolveSecurityAlert(alert.id)}
                          >
                            {resolvingAlertId === alert.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Risolvi"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="panel-surface-elevated border-white/10">
          <CardHeader className="p-4 sm:p-8">
            <div className="flex flex-col gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl font-display font-bold text-foreground">
                  <UserRound className="h-5 w-5 text-accent-secondary" /> Anagrafica Utenti
                </CardTitle>
                <CardDescription className="mt-1 text-neutral-400">
                  CRM operativo per ricerca email, numeri blindati, log OTP e remediation manuali.
                </CardDescription>
              </div>
              <div className="flex flex-col gap-3 lg:flex-row">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                  <Input
                    value={adminSearchQuery}
                    onChange={(event) => onAdminSearchQueryChange(event.target.value)}
                    placeholder="Cerca per email cliente"
                    className="input-dark h-12 pl-10"
                  />
                </div>
                <div className="dashboard-chip flex items-center justify-center text-neutral-400">
                  {searchingAdminUsers ? "Ricerca in corso..." : "Inserisci almeno 2 caratteri"}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-4 pt-0 sm:p-8 sm:pt-0">
            {adminSearchResults.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {adminSearchResults.map((match) => (
                  <button
                    key={match.id}
                    type="button"
                    onClick={() => loadAdminUserProfile(match.id)}
                    className={`card-dark text-left ${selectedAdminUserId === match.id ? "border-accent-primary/40 shadow-[0_0_0_1px_rgba(15,214,179,0.18)]" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{match.nome || match.email}</p>
                        <p className="mt-1 text-sm text-neutral-400">{match.email}</p>
                      </div>
                      <Badge variant="outline" className={getStatusBadgeClass(match.status)}>
                        {String(match.status || "active").toUpperCase()}
                      </Badge>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge variant="outline" className="border-accent-secondary/30 text-accent-secondary">
                        {match.plan_label}
                      </Badge>
                      {match.panic_mode ? (
                        <Badge variant="outline" className="border-danger/30 text-danger">
                          PANIC
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-3 text-xs text-neutral-500">Ultima attivita {formatDateTime(match.last_activity)}</p>
                  </button>
                ))}
              </div>
            ) : adminSearchQuery.trim().length >= 2 && !searchingAdminUsers ? (
              <div className="card-dark">
                <p className="text-sm font-semibold text-foreground">Nessun account trovato.</p>
                <p className="mt-1 text-sm text-neutral-400">Controlla l&apos;email o amplia la ricerca.</p>
              </div>
            ) : null}

            {loadingAdminUserProfile ? (
              <div className="card-dark flex items-center gap-3">
                <RefreshCw className="h-4 w-4 animate-spin text-accent-primary" />
                <p className="text-sm text-neutral-400">Caricamento profilo utente...</p>
              </div>
            ) : selectedUser ? (
              <div className="space-y-6">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="stat-tile">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Piano</p>
                    <p className="mt-2 text-xl font-display font-bold text-foreground">{selectedUser.plan_label}</p>
                  </div>
                  <div className="stat-tile">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Stato account</p>
                    <p className="mt-2 text-xl font-display font-bold text-foreground">{String(selectedUser.status || "active").toUpperCase()}</p>
                  </div>
                  <div className="stat-tile">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Numeri attivi</p>
                    <p className="mt-2 text-xl font-display font-bold text-foreground">{selectedSummary.total_numbers || 0}</p>
                  </div>
                  <div className="stat-tile">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Ultimo log ricezione</p>
                    <p className="mt-2 text-sm font-semibold text-foreground">{formatLongDateTime(selectedSummary.last_received_at)}</p>
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
                  <div className="space-y-6">
                    <div className="card-dark">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="section-kicker border-0">Profilo utente</p>
                          <p className="mt-3 text-xl font-display font-bold text-foreground">{selectedUser.nome || selectedUser.email}</p>
                          <p className="mt-1 text-sm text-neutral-400">{selectedUser.email}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className={getStatusBadgeClass(selectedUser.status)}>
                            {String(selectedUser.status || "active").toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="border-accent-secondary/30 text-accent-secondary">
                            {selectedUser.plan_label}
                          </Badge>
                          {selectedUser.panic_mode ? (
                            <Badge variant="outline" className="border-danger/30 text-danger">
                              PANIC MODE
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                      <div className="mt-5 grid gap-3 md:grid-cols-2">
                        <div className="dashboard-chip">
                          <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Telefono</p>
                          <p className="mt-2 text-sm text-foreground">{selectedUser.phone || "n/d"}</p>
                        </div>
                        <div className="dashboard-chip">
                          <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Ultima attivita</p>
                          <p className="mt-2 text-sm text-foreground">{formatLongDateTime(selectedUser.last_activity)}</p>
                        </div>
                        <div className="dashboard-chip">
                          <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Attivita inbox</p>
                          <p className="mt-2 text-sm text-foreground">
                            {selectedSummary.total_messages || 0} messaggi, {selectedSummary.unread_messages || 0} non letti
                          </p>
                        </div>
                        <div className="dashboard-chip">
                          <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Sessioni attive</p>
                          <p className="mt-2 text-sm text-foreground">{selectedSummary.active_sessions || 0}</p>
                        </div>
                      </div>
                    </div>

                    <div className="card-dark overflow-hidden p-0">
                      <div className="flex items-center gap-2 border-b border-white/10 px-6 py-4">
                        <Phone className="h-4 w-4 text-accent-primary" />
                        <p className="font-semibold text-foreground">Numeri blindati assegnati</p>
                      </div>
                      {selectedNumbers.length === 0 ? (
                        <div className="px-6 py-5 text-sm text-neutral-500">Nessun numero assegnato a questo account.</div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow className="border-white/10">
                              <TableHead className="px-4 py-3">Numero</TableHead>
                              <TableHead className="px-4 py-3">Tipo</TableHead>
                              <TableHead className="px-4 py-3">Stato</TableHead>
                              <TableHead className="px-4 py-3">Scadenza</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedNumbers.map((number) => (
                              <TableRow key={number.id} className="border-white/10">
                                <TableCell className="px-4 py-4">
                                  <p className="font-mono text-sm text-foreground">{number.e164}</p>
                                  <p className="mt-1 text-xs text-neutral-500">{number.friendly_name || "Numero blindato"}</p>
                                </TableCell>
                                <TableCell className="px-4 py-4">
                                  <Badge variant="outline" className={number.is_burner ? "border-accent-gold/30 text-accent-gold" : "border-accent-primary/30 text-accent-primary"}>
                                    {number.is_burner ? "Burner" : number.is_virtual ? "Virtuale" : "Primario"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="px-4 py-4">
                                  <Badge variant="outline" className={getStatusBadgeClass(number.status)}>
                                    {String(number.status || "active").toUpperCase()}
                                  </Badge>
                                </TableCell>
                                <TableCell className="px-4 py-4 text-sm text-neutral-400">
                                  {formatLongDateTime(number.expires_at)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>

                    <div className="card-dark overflow-hidden p-0">
                      <div className="flex items-center gap-2 border-b border-white/10 px-6 py-4">
                        <Activity className="h-4 w-4 text-accent-secondary" />
                        <p className="font-semibold text-foreground">Log di ricezione recenti</p>
                      </div>
                      {selectedInboundLogs.length === 0 ? (
                        <div className="px-6 py-5 text-sm text-neutral-500">Nessun log di ricezione disponibile.</div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow className="border-white/10">
                              <TableHead className="px-4 py-3">Canale</TableHead>
                              <TableHead className="px-4 py-3">Mittente</TableHead>
                              <TableHead className="px-4 py-3">Anteprima</TableHead>
                              <TableHead className="px-4 py-3">Ricevuto</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedInboundLogs.map((log) => (
                              <TableRow key={log.id} className="border-white/10">
                                <TableCell className="px-4 py-4">
                                  <div className="flex flex-col gap-2">
                                    <Badge variant="outline" className="w-fit border-accent-secondary/30 text-accent-secondary">
                                      {String(log.source || "sms").toUpperCase()}
                                    </Badge>
                                    {log.is_otp ? (
                                      <Badge variant="outline" className="w-fit border-accent-primary/30 text-accent-primary">
                                        OTP
                                      </Badge>
                                    ) : null}
                                  </div>
                                </TableCell>
                                <TableCell className="px-4 py-4">
                                  <p className="text-sm font-semibold text-foreground">{log.sender_name || log.from_number || "n/d"}</p>
                                  <p className="mt-1 text-xs text-neutral-500">{log.from_number || "Origine non disponibile"}</p>
                                </TableCell>
                                <TableCell className="px-4 py-4">
                                  <p className="text-sm text-neutral-300">{log.body_preview || "Contenuto non disponibile"}</p>
                                  {log.is_quarantined ? (
                                    <p className="mt-1 text-xs text-danger">Quarantena: {log.quarantine_reason || "motivo non specificato"}</p>
                                  ) : null}
                                </TableCell>
                                <TableCell className="px-4 py-4 text-sm text-neutral-400">
                                  {formatLongDateTime(log.received_at)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="card-highlight">
                      <p className="text-sm font-semibold text-foreground">Azioni operative</p>
                      <div className="mt-4 space-y-4">
                        <div className="space-y-2">
                          <label htmlFor="admin-plan-draft" className="text-xs font-bold uppercase tracking-widest text-neutral-500">Cambio piano</label>
                          <div className="flex gap-2">
                            <select
                              id="admin-plan-draft"
                              value={adminPlanDraft}
                              onChange={(event) => onAdminPlanDraftChange(event.target.value)}
                              className="input-dark h-11 flex-1 rounded-xl px-3"
                            >
                              <option value="pending">Pending</option>
                              <option value="silver">Vault</option>
                              <option value="gold">Shield</option>
                              <option value="elite">Control</option>
                            </select>
                            <Button className="btn-teal" disabled={updatingAdminUserPlan} onClick={updateAdminUserPlan}>
                              {updatingAdminUserPlan ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Aggiorna"}
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="admin-burner-hours" className="text-xs font-bold uppercase tracking-widest text-neutral-500">Burner compensativo</label>
                          <div className="flex gap-2">
                            <select
                              id="admin-burner-hours"
                              value={String(adminBurnerHours)}
                              onChange={(event) => onAdminBurnerHoursChange(Number(event.target.value))}
                              className="input-dark h-11 flex-1 rounded-xl px-3"
                            >
                              {[12, 24, 48, 72].map((hours) => (
                                <option key={hours} value={hours}>{hours} ore</option>
                              ))}
                            </select>
                            <Button className="btn-teal" disabled={addingAdminBurnerNumber} onClick={grantAdminBurnerNumber}>
                              {addingAdminBurnerNumber ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Aggiungi"}
                            </Button>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          className="w-full border-accent-secondary/30 text-accent-secondary hover:bg-accent-secondary/10"
                          disabled={realigningAdminUserId === selectedUser.id}
                          onClick={realignAdminBilling}
                        >
                          {realigningAdminUserId === selectedUser.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                          Riallinea stato billing
                        </Button>

                        <Button
                          variant="outline"
                          className="w-full border-danger/40 text-danger hover:bg-danger/10"
                          disabled={freezingAdminUserId === selectedUser.id}
                          onClick={freezeAdminUser}
                        >
                          {freezingAdminUserId === selectedUser.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ShieldAlert className="mr-2 h-4 w-4" />}
                          Congela account
                        </Button>
                      </div>
                    </div>

                    <div className="card-dark">
                      <p className="text-sm font-semibold text-foreground">Pagamenti recenti</p>
                      {selectedPayments.length === 0 ? (
                        <p className="mt-3 text-sm text-neutral-500">Nessuna transazione trovata.</p>
                      ) : (
                        <div className="mt-4 space-y-3">
                          {selectedPayments.map((payment) => (
                            <div key={payment.id} className="rounded-2xl border border-white/10 px-4 py-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-foreground">{payment.plan_id || "Piano n/d"}</p>
                                  <p className="mt-1 text-xs text-neutral-500">{formatAmount(payment.amount, payment.currency)} • {formatLongDateTime(payment.created_at)}</p>
                                </div>
                                <div className="flex flex-wrap justify-end gap-2">
                                  <Badge variant="outline" className={getStatusBadgeClass(payment.payment_status)}>
                                    {String(payment.payment_status || "pending").toUpperCase()}
                                  </Badge>
                                  <Badge variant="outline" className={getStatusBadgeClass(payment.fulfillment_status)}>
                                    {String(payment.fulfillment_status || "pending").toUpperCase()}
                                  </Badge>
                                </div>
                              </div>
                              {payment.last_error ? (
                                <p className="mt-3 text-xs leading-relaxed text-danger">{payment.last_error}</p>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="card-dark">
                      <p className="text-sm font-semibold text-foreground">Trace Stripe / webhook</p>
                      {selectedWebhooks.length === 0 ? (
                        <p className="mt-3 text-sm text-neutral-500">Nessun evento webhook associato.</p>
                      ) : (
                        <div className="mt-4 space-y-3">
                          {selectedWebhooks.map((event) => (
                            <div key={event.id} className="rounded-2xl border border-white/10 px-4 py-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-foreground">{event.event_type || "stripe.event"}</p>
                                  <p className="mt-1 text-xs text-neutral-500">{event.session_id || "sessione n/d"}</p>
                                </div>
                                <Badge variant="outline" className={getStatusBadgeClass(event.processing_status)}>
                                  {String(event.processing_status || "processing").toUpperCase()}
                                </Badge>
                              </div>
                              {event.last_error ? (
                                <p className="mt-3 text-xs leading-relaxed text-danger">{event.last_error}</p>
                              ) : (
                                <p className="mt-3 text-xs text-neutral-500">Processato {formatLongDateTime(event.processed_at || event.created_at)}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="dashboard-empty-state">
                <div className="dashboard-empty-orb">
                  <UserRound className="h-10 w-10 text-white/85" />
                </div>
                <p className="text-lg font-bold text-foreground">Seleziona un utente per aprire il CRM operativo</p>
                <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-neutral-400">
                  Cerca per email, apri il profilo e usa da qui piano, burner compensativo, riallineamento billing e freeze account.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="panel-surface-elevated border-white/10">
          <CardHeader className="p-4 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl font-display font-bold text-foreground">
                  <BarChart3 className="h-5 w-5 text-accent-primary" /> Salute Business e KPI
                </CardTitle>
                <CardDescription className="mt-1 text-neutral-400">
                  Daily pulse, funnel analytics e conversion report per capire se la piattaforma sta monetizzando o perdendo inerzia.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                {[7, 14, 30, 60].map((days) => (
                  <Button
                    key={days}
                    size="sm"
                    variant={kpiDays === days ? "default" : "outline"}
                    className={kpiDays === days ? "btn-teal" : "border-border"}
                    onClick={() => onKpiDaysChange(days)}
                  >
                    {days}d
                  </Button>
                ))}
                <Button variant="outline" className="border-border" onClick={() => loadAdminKpi(kpiDays)}>
                  {loadingAdminKpi ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Aggiorna"}
                </Button>
                <Button variant="outline" className="border-accent-primary/30 text-accent-primary hover:bg-accent-primary/10" disabled={exportingAdminCsv} onClick={exportAdminCsv}>
                  {exportingAdminCsv ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-4 pt-0 sm:p-8 sm:pt-0">
            {loadingAdminKpi && !kpiData ? (
              <div className="card-dark flex items-center gap-3">
                <RefreshCw className="h-4 w-4 animate-spin text-accent-primary" />
                <p className="text-sm text-neutral-400">Caricamento KPI in corso...</p>
              </div>
            ) : kpiData ? (
              <>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="stat-tile">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Sessioni</p>
                    <p className="mt-2 text-2xl font-display font-bold text-foreground">{totals.sessions || 0}</p>
                  </div>
                  <div className="stat-tile">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Eventi</p>
                    <p className="mt-2 text-2xl font-display font-bold text-foreground">{totals.events || 0}</p>
                  </div>
                  <div className="stat-tile">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Health score</p>
                    <p className="mt-2 text-2xl font-display font-bold text-foreground">{healthScore.score || 0}/100</p>
                  </div>
                  <div className="stat-tile">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Landing to paid</p>
                    <p className="mt-2 text-2xl font-display font-bold text-foreground">{overallConversionPct}</p>
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                  <div className="card-dark overflow-hidden p-0">
                    <div className="flex items-center gap-2 border-b border-white/10 px-6 py-4">
                      <Activity className="h-4 w-4 text-accent-primary" />
                      <p className="font-semibold text-foreground">Funnel analytics</p>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/10">
                          <TableHead className="px-4 py-3">Step</TableHead>
                          <TableHead className="px-4 py-3">Attori unici</TableHead>
                          <TableHead className="px-4 py-3">Conv. step</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {funnelRows.map((step) => (
                          <TableRow key={step.key} className="border-white/10">
                            <TableCell className="px-4 py-4">
                              <p className="font-semibold text-foreground">{step.label}</p>
                              <p className="mt-1 text-xs text-neutral-500">{step.key}</p>
                            </TableCell>
                            <TableCell className="px-4 py-4 text-sm text-neutral-300">{step.unique_actors || 0}</TableCell>
                            <TableCell className="px-4 py-4 text-sm text-accent-primary">
                              {formatPercent(step.conversion_from_previous_pct || 0)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="space-y-6">
                    <div className="card-highlight">
                      <p className="text-sm font-semibold text-foreground">Alert KPI</p>
                      {kpiAlerts.length === 0 ? (
                        <p className="mt-3 text-sm text-neutral-400">Nessun alert critico nel periodo selezionato.</p>
                      ) : (
                        <div className="mt-4 space-y-3">
                          {kpiAlerts.slice(0, 3).map((alert) => (
                            <div key={alert.code} className="rounded-2xl border border-white/10 px-4 py-4">
                              <div className="flex items-start justify-between gap-3">
                                <p className="text-sm font-semibold text-foreground">{alert.title}</p>
                                <Badge variant="outline" className={getSeverityBadgeClass(alert.severity)}>
                                  {String(alert.severity || "low").toUpperCase()}
                                </Badge>
                              </div>
                              <p className="mt-2 text-xs leading-relaxed text-neutral-400">{alert.description}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="card-dark">
                      <p className="text-sm font-semibold text-foreground">Next best actions</p>
                      {nextBestActions.length === 0 ? (
                        <p className="mt-3 text-sm text-neutral-500">Nessuna azione prioritaria proposta.</p>
                      ) : (
                        <div className="mt-4 space-y-3">
                          {nextBestActions.map((action) => (
                            <div key={action.code} className="rounded-2xl border border-white/10 px-4 py-4">
                              <p className="text-sm font-semibold text-foreground">{action.title}</p>
                              <p className="mt-2 text-xs leading-relaxed text-neutral-400">{action.recommendation}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                  <div className="card-dark overflow-hidden p-0">
                    <div className="flex items-center gap-2 border-b border-white/10 px-6 py-4">
                      <AlertTriangle className="h-4 w-4 text-accent-gold" />
                      <p className="font-semibold text-foreground">Daily pulse</p>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/10">
                          <TableHead className="px-4 py-3">Data</TableHead>
                          <TableHead className="px-4 py-3">Landing</TableHead>
                          <TableHead className="px-4 py-3">OTP</TableHead>
                          <TableHead className="px-4 py-3">Paid</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dailyPulseRows.map((row) => (
                          <TableRow key={row.date} className="border-white/10">
                            <TableCell className="px-4 py-4 text-sm text-foreground">{row.date}</TableCell>
                            <TableCell className="px-4 py-4 text-sm text-neutral-300">
                              {row.landing_views || 0}
                              <div className="mt-1 text-xs text-neutral-500">{formatPercent(row.landing_to_otp_pct || 0)} to OTP</div>
                            </TableCell>
                            <TableCell className="px-4 py-4 text-sm text-neutral-300">
                              {row.otp_requested || 0}
                              <div className="mt-1 text-xs text-neutral-500">{formatPercent(row.otp_to_checkout_pct || 0)} to checkout</div>
                            </TableCell>
                            <TableCell className="px-4 py-4 text-sm text-neutral-300">
                              {row.checkout_paid || 0}
                              <div className="mt-1 text-xs text-neutral-500">{formatPercent(row.checkout_to_paid_pct || 0)} paid</div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="card-dark">
                    <p className="text-sm font-semibold text-foreground">Bottleneck principali</p>
                    {topBottlenecks.length === 0 ? (
                      <p className="mt-3 text-sm text-neutral-500">Nessun bottleneck rilevato.</p>
                    ) : (
                      <div className="mt-4 space-y-3">
                        {topBottlenecks.map((bottleneck) => (
                          <div key={`${bottleneck.from_key}-${bottleneck.to_key}`} className="rounded-2xl border border-white/10 px-4 py-4">
                            <p className="text-sm font-semibold text-foreground">
                              {bottleneck.from_label} → {bottleneck.to_label}
                            </p>
                            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                              <div className="dashboard-chip">
                                <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Persi</p>
                                <p className="mt-2 text-foreground">{bottleneck.lost_actors || 0}</p>
                              </div>
                              <div className="dashboard-chip">
                                <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Conversione</p>
                                <p className="mt-2 text-foreground">{formatPercent(bottleneck.conversion_pct || 0)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="card-dark">
                <p className="text-sm text-neutral-500">Nessun dato KPI disponibile.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
};
