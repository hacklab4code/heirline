import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { AlertTriangle, CheckCircle, CreditCard, Lock, RefreshCw, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { API } from "@/lib/api";

const statusMeta = {
  checking: {
    icon: RefreshCw,
    title: "Verifica pagamento in corso",
    description: "Stiamo verificando la sessione e aggiornando l'account.",
    iconClass: "text-accent-primary animate-spin",
  },
  pending: {
    icon: RefreshCw,
    title: "Pagamento ancora in attesa",
    description: "La sessione esiste, ma la conferma definitiva non e ancora arrivata.",
    iconClass: "text-accent-secondary animate-spin",
  },
  activating: {
    icon: Shield,
    title: "Piano in attivazione",
    description: "Pagamento confermato. Stiamo completando l'attivazione del servizio.",
    iconClass: "text-accent-primary animate-pulse-soft",
  },
  success: {
    icon: CheckCircle,
    title: "Pagamento completato",
    description: "Il piano e attivo. Tra pochi secondi verrai reindirizzato alla dashboard.",
    iconClass: "text-accent-primary",
  },
  auth: {
    icon: Lock,
    title: "Accedi per continuare",
    description: "La sessione non e disponibile in questa pagina. Rientra nell'account e riprenderemo la verifica.",
    iconClass: "text-accent-secondary",
  },
  missing: {
    icon: AlertTriangle,
    title: "Transazione non trovata",
    description: "Non abbiamo trovato questa sessione di checkout per l'account corrente.",
    iconClass: "text-danger",
  },
  unavailable: {
    icon: RefreshCw,
    title: "Verifica temporaneamente non disponibile",
    description: "Il servizio pagamenti non e raggiungibile in questo momento.",
    iconClass: "text-accent-secondary animate-spin",
  },
  error: {
    icon: AlertTriangle,
    title: "Attivazione non riuscita",
    description: "Non siamo riusciti a completare la procedura automatica. Se l'addebito risulta effettuato, controlla dalla dashboard.",
    iconClass: "text-danger",
  },
};

const inferCheckoutEnvironment = (sessionId, isDemoCheckout) => {
  if (isDemoCheckout) return "demo";
  if (/^cs_test_/i.test(String(sessionId || ""))) return "test";
  if (/^cs_live_/i.test(String(sessionId || ""))) return "live";
  return "non rilevato";
};

const formatCheckoutEnvironmentLabel = (value) => {
  if (value === "demo") return "demo locale";
  if (value === "test") return "test";
  if (value === "live") return "live";
  return "non rilevato";
};

export const PaymentSuccessPage = ({ apiRequest, refreshUser }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState("checking");
  const [checkoutState, setCheckoutState] = useState(null);
  const [statusDetail, setStatusDetail] = useState("");
  const latestPaymentStatusRef = useRef(null);
  const sessionId = searchParams.get("session_id");
  const isDemoCheckout = searchParams.get("demo") === "1" || Boolean(checkoutState?.demo_mode);
  const environmentLabel = useMemo(
    () => formatCheckoutEnvironmentLabel(inferCheckoutEnvironment(sessionId, isDemoCheckout)),
    [sessionId, isDemoCheckout],
  );
  const returnTo = `${location.pathname}${location.search}`;

  useEffect(() => {
    latestPaymentStatusRef.current = checkoutState?.payment_status || null;
  }, [checkoutState?.payment_status]);

  useEffect(() => {
    if (!sessionId) {
      setStatus("missing");
      return undefined;
    }

    let cancelled = false;
    let timer = null;

    const check = async () => {
      try {
        const res = await apiRequest({ method: "get", url: `${API}/payments/status/${sessionId}` });
        if (cancelled) return;

        const nextState = res.data || {};
        setCheckoutState(nextState);
        setStatusDetail("");

        if (nextState.fulfillment_status === "failed") {
          setStatus("error");
          return;
        }

        if (nextState.payment_status === "paid" && nextState.fulfillment_status === "fulfilled") {
          setStatus("success");
          await refreshUser();
          timer = setTimeout(() => navigate("/dashboard"), 2500);
          return;
        }

        if (nextState.payment_status === "paid") {
          setStatus("activating");
          timer = setTimeout(check, 2500);
          return;
        }

        setStatus("pending");
        timer = setTimeout(check, 2500);
      } catch (error) {
        if (cancelled) return;

        const responseStatus = error?.response?.status;
        const responseDetail = error?.response?.data?.detail;
        const fallbackDetail = typeof responseDetail === "string" && responseDetail.trim()
          ? responseDetail
          : "";

        if (responseStatus === 401 || responseStatus === 403) {
          setCheckoutState(null);
          setStatus("auth");
          setStatusDetail(fallbackDetail || "Accedi di nuovo per verificare lo stato del pagamento.");
          return;
        }

        if (responseStatus === 404) {
          setCheckoutState(null);
          setStatus("missing");
          setStatusDetail(fallbackDetail || "Sessione di checkout non trovata.");
          return;
        }

        if (responseStatus === 503) {
          setStatus("unavailable");
          setStatusDetail(fallbackDetail || "Servizio pagamenti temporaneamente non disponibile.");
          return;
        }

        if (latestPaymentStatusRef.current === "paid") {
          setStatus("activating");
          setStatusDetail("Ultimo controllo non riuscito. Riproviamo tra poco.");
          timer = setTimeout(check, 3000);
          return;
        }

        setStatus("error");
        setStatusDetail(fallbackDetail);
      }
    };

    check();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [sessionId, apiRequest, navigate, refreshUser]);

  const currentMeta = statusMeta[status];
  const CurrentIcon = currentMeta.icon;

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
      <div className="grain-overlay" />
      <div className="absolute left-[-8%] top-[18%] h-72 w-72 rounded-full bg-accent-primary/10 blur-[120px]" />
      <div className="absolute right-[-10%] top-[10%] h-72 w-72 rounded-full bg-accent-secondary/10 blur-[120px]" />

      <div className="mx-auto flex min-h-[calc(100vh-12rem)] max-w-5xl items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="grid w-full gap-6 lg:grid-cols-[0.85fr_1.15fr]"
        >
          <div className="panel-surface hidden p-6 lg:block">
            <div className="section-kicker mb-6 border-0">Stato checkout</div>
            <div className="space-y-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-accent-primary/10 text-accent-primary">
                <CreditCard className="h-8 w-8" />
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-display font-bold text-foreground">Ultimo passaggio prima della dashboard</h1>
                <p className="text-base leading-relaxed text-neutral-400">
                  Questa scheda ti mostra solo lo stato del checkout, l&apos;esito e cosa succede dopo, senza rumore.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4">
            <div className="auth-side-card">
                <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-neutral-500">Sessione</div>
                <div className="mt-2 break-all text-sm font-mono text-foreground">{sessionId || "n/a"}</div>
              </div>
              <div className="auth-side-card">
                <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-neutral-500">Checkout mode</div>
                <div className="mt-2 text-sm font-semibold text-foreground">{isDemoCheckout ? "Demo locale" : "Stripe"}</div>
              </div>
            </div>
          </div>

          <Card className="panel-surface-strong overflow-hidden border-border/80">
            <CardContent className="p-6 sm:p-8">
              <div className="space-y-8 text-center">
                <div className="space-y-4">
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[30px] border border-border/70 bg-card/70">
                    <CurrentIcon className={`h-12 w-12 ${currentMeta.iconClass}`} />
                  </div>
                  <div className="space-y-3">
                    <div className="section-kicker border-0">{isDemoCheckout ? "Demo checkout" : "Pagamento"}</div>
                    <h2 className="text-3xl font-display font-bold tracking-tight text-foreground sm:text-4xl">
                      {isDemoCheckout && status === "checking" ? "Verifica demo in corso" : currentMeta.title}
                    </h2>
                    <p className="mx-auto max-w-xl text-base leading-relaxed text-neutral-400">
                      {status === "success" && checkoutState?.provisioned_number?.e164
                        ? `${currentMeta.description} Numero attivo: ${checkoutState.provisioned_number.e164}.`
                        : status === "error" && checkoutState?.last_error
                          ? checkoutState.last_error
                          : statusDetail
                          ? statusDetail
                          : isDemoCheckout && status === "checking"
                            ? "Stiamo completando il flusso demo prima del rientro in dashboard."
                            : currentMeta.description}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    { label: "Pagamento", value: checkoutState?.payment_status || (status === "auth" ? "non verificato" : "checking") },
                    { label: "Attivazione", value: checkoutState?.fulfillment_status || "pending" },
                    { label: "Ambiente", value: environmentLabel },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[24px] border border-border/70 bg-muted/40 px-4 py-5 text-left">
                      <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-neutral-500">{item.label}</div>
                      <div className="mt-2 text-sm font-semibold capitalize text-foreground">{item.value}</div>
                    </div>
                  ))}
                </div>

                {status === "auth" ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button
                      onClick={() => navigate(`/login?next=${encodeURIComponent(returnTo)}`)}
                      className="btn-teal h-14 w-full text-base"
                    >
                      Accedi e verifica
                    </Button>
                    <Button onClick={() => navigate("/")} variant="outline" className="h-14 w-full border-border/80 text-base">
                      Torna alla home
                    </Button>
                  </div>
                ) : status === "success" ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button onClick={() => navigate("/dashboard")} className="btn-teal h-14 w-full text-base">
                      Apri dashboard
                    </Button>
                    <Button onClick={() => navigate("/")} variant="outline" className="h-14 w-full border-border/80 text-base">
                      Torna alla home
                    </Button>
                  </div>
                ) : status === "error" || status === "missing" || status === "unavailable" ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button onClick={() => navigate("/dashboard")} className="btn-teal h-14 w-full text-base">
                      Torna alla dashboard
                    </Button>
                    <Button onClick={() => navigate("/")} variant="outline" className="h-14 w-full border-border/80 text-base">
                      Torna alla home
                    </Button>
                  </div>
                ) : (
                  <Button onClick={() => navigate("/dashboard")} variant="outline" className="h-14 w-full border-border/80 text-base">
                    Vai subito alla dashboard
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
