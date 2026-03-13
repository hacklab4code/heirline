import { toast } from "sonner";
import { Copy, RefreshCw, Shield, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const formatDateTime = (value) => {
  if (!value) return "n/d";
  try {
    return new Date(value).toLocaleString("it-IT");
  } catch {
    return "n/d";
  }
};

const buildPreviewText = (value, maxLength = 220) => {
  const normalized = String(value || "").trim();
  if (!normalized) return "Contenuto non disponibile in questa vista.";
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength)}…`;
};

export const DashboardSecureNotesSection = ({
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
  e2eeReadyForEncrypt,
  e2eeUnlocked,
}) => {
  const isEditing = Boolean(secureNoteForm?.id);
  const secureNotesAtLimit = secureNotesLimit > 0 && secureNotes.length >= secureNotesLimit && !isEditing;
  const noteBody = String(secureNoteForm?.body || "");
  const vaultStatusLabel = e2eeUnlocked ? "Cassaforte sbloccata" : e2eeReadyForEncrypt ? "Pronta per cifrare" : "Da sbloccare";
  const canSubmit = canUseSecureNotes && e2eeReadyForEncrypt && noteBody.trim().length > 0 && !secureNotesAtLimit;

  return (
    <Card className="panel-surface-elevated border-white/10">
      <CardHeader className="p-4 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-xl font-display font-bold text-foreground">
              <Shield className="h-5 w-5 text-accent-primary" /> Note Sicure
            </CardTitle>
            <CardDescription className="text-neutral-400">
              Testi liberi cifrati localmente con la stessa cassaforte E2EE di TOTP e deleghe.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {canUseSecureNotes ? (
              <Badge variant="outline" className="border-white/10 font-mono text-neutral-300">
                {secureNotes.length}{secureNotesLimit > 0 ? `/${secureNotesLimit}` : ""} NOTE
              </Badge>
            ) : null}
            <Button size="sm" variant="outline" className="border-border" onClick={loadSecureNotes}>
              {loadingSecureNotes ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Aggiorna"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-4 pt-0 sm:p-8 sm:pt-0">
        {!canUseSecureNotes ? (
          <div className="card-dark p-5 text-sm text-neutral-500">
            Note Sicure disponibili dal piano Vault in poi.
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="stat-tile">
                <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Note attive</p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {secureNotes.length}{secureNotesLimit > 0 ? `/${secureNotesLimit}` : ""}
                </p>
              </div>
              <div className="stat-tile">
                <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Vault</p>
                <p className="mt-2 text-sm font-semibold text-foreground">{vaultStatusLabel}</p>
              </div>
              <div className="stat-tile">
                <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Storage</p>
                <p className="mt-2 text-sm font-semibold text-foreground">Solo ciphertext lato server</p>
              </div>
            </div>

            <div className="card-dark border-amber-500/30 text-sm text-amber-200">
              Seed phrase, recovery code e testi sensibili restano cifrati prima dell&apos;upload. Se perdi passphrase e vault locale, il backend non puo recuperarli.
            </div>

            {!e2eeReadyForEncrypt ? (
              <div className="card-dark border-amber-500/30 text-sm text-amber-200">
                Per creare o aggiornare una nota devi prima attivare o sbloccare la cassaforte E2EE.
              </div>
            ) : null}

            {secureNotesAtLimit ? (
              <div className="card-dark border-amber-500/30 text-sm text-amber-200">
                Hai raggiunto il limite del tuo piano. Elimina una nota o passa a un tier superiore per aggiungerne altre.
              </div>
            ) : null}

            <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <form onSubmit={saveSecureNote} className="space-y-4">
                <div className="card-dark space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">
                      {isEditing ? "Aggiorna nota cifrata" : "Nuova nota cifrata"}
                    </p>
                    <Badge className="border-none bg-accent-primary/20 text-accent-primary">
                      {isEditing ? "MODIFICA" : "NUOVA"}
                    </Badge>
                  </div>
                  <Input
                    placeholder="Titolo (opzionale)"
                    className="input-dark"
                    value={secureNoteForm?.title || ""}
                    onChange={(e) => onSecureNoteFormChange((prev) => ({ ...prev, title: e.target.value }))}
                    disabled={savingSecureNote}
                  />
                  <Textarea
                    placeholder="Seed phrase, recovery code, istruzioni operative, appunti sensibili..."
                    className="input-dark min-h-[220px] resize-y font-mono leading-relaxed"
                    value={secureNoteForm?.body || ""}
                    onChange={(e) => onSecureNoteFormChange((prev) => ({ ...prev, body: e.target.value }))}
                    disabled={savingSecureNote}
                  />
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button type="submit" className="btn-teal flex-1" disabled={!canSubmit || savingSecureNote}>
                      {savingSecureNote ? <RefreshCw className="h-4 w-4 animate-spin" /> : isEditing ? "Aggiorna nota" : "Salva nota"}
                    </Button>
                    <Button type="button" variant="outline" className="border-border" onClick={resetSecureNoteForm}>
                      Svuota
                    </Button>
                  </div>
                  <p className="text-xs text-neutral-500">
                    Suggerimento: usa un titolo neutro e tieni il contenuto completo solo nel corpo della nota.
                  </p>
                </div>
              </form>

              <div className="space-y-3">
                {loadingSecureNotes ? (
                  <div className="card-dark p-5 text-sm text-neutral-500">Caricamento note sicure...</div>
                ) : secureNotes.length === 0 ? (
                  <div className="dashboard-empty-state">
                    <div className="dashboard-empty-orb animate-pulse-soft">
                      <Shield className="h-8 w-8 text-accent-primary" />
                    </div>
                    <h3 className="text-xl font-display font-bold text-foreground">Nessuna nota nel vault</h3>
                    <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-neutral-400">
                      Crea qui note E2EE per seed phrase, recovery kit o istruzioni che devono restare fuori da inbox e clipboard casuali.
                    </p>
                  </div>
                ) : (
                  secureNotes.map((note) => (
                    <div key={note.id} className="card-dark">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0 flex-1 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {note.title || "Nota sicura"}
                            </p>
                            <Badge
                              variant="outline"
                              className={note.decrypted_local ? "border-accent-primary/40 text-accent-primary" : "border-white/10 text-neutral-400"}
                            >
                              {note.decrypted_local ? "Decifrata localmente" : "Payload cifrato"}
                            </Badge>
                            {note.decrypt_error ? (
                              <Badge variant="outline" className="border-danger/40 text-danger">
                                Chiave locale non compatibile
                              </Badge>
                            ) : null}
                          </div>
                          <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
                            Aggiornata {formatDateTime(note.updated_at)}
                          </p>
                          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-neutral-400">
                            {buildPreviewText(note.body)}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {note.decrypted_local && note.body ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-border"
                              onClick={() => {
                                navigator.clipboard.writeText(note.body);
                                toast.success("Contenuto nota copiato");
                              }}
                            >
                              <Copy className="mr-2 h-4 w-4" /> Copia
                            </Button>
                          ) : null}
                          {note.decrypted_local && !note.decrypt_error ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-border"
                              onClick={() => editSecureNote(note)}
                            >
                              Modifica
                            </Button>
                          ) : null}
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-danger/40 text-danger hover:bg-danger/10"
                            disabled={deletingSecureNoteId === note.id}
                            onClick={() => deleteSecureNote(note.id)}
                          >
                            {deletingSecureNoteId === note.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <><Trash2 className="mr-2 h-4 w-4" /> Elimina</>}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
