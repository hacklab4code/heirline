import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "motion/react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  CreditCard,
  HeartHandshake,
  Inbox,
  Lock,
  ShieldAlert,
  Smartphone,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { API, http } from "@/lib/api";
import { FALLBACK_PLAN_CATALOG, getPricingPlanPresentation } from "@/lib/app-shared";

const heroHighlights = [
  "Vault E2EE",
  "Numero blindato su richiesta",
  "Accessi, alias e OTP nello stesso flusso",
];

const featureCards = [
  {
    icon: Inbox,
    title: "Inbox dedicato",
    description: "OTP SMS, TOTP e alias email dentro un feed unico, leggibile da desktop e mobile.",
  },
  {
    icon: ShieldAlert,
    title: "Shield quando serve",
    description: "Attivi il numero blindato solo per banca, exchange e casi sensibili, senza rifare il setup.",
  },
  {
    icon: HeartHandshake,
    title: "Continuita digitale",
    description: "Deleghe, recovery e controllo accessi restano nello stesso prodotto, senza pannelli separati.",
  },
  {
    icon: Lock,
    title: "Vault operativo",
    description: "TOTP, passkeys e policy di sicurezza convivono nello stesso percorso, con meno attrito.",
  },
  {
    icon: Smartphone,
    title: "Multi-device vero",
    description: "Dashboard, sessioni, notifiche e gestione dispositivi restano allineati su ogni endpoint.",
  },
  {
    icon: CreditCard,
    title: "Piani leggibili",
    description: "Parti da Vault, sali a Shield o Control solo quando la complessita lo richiede davvero.",
  },
];

const inboxMessages = [
  { from: "BANCA INTESA", code: "847293", time: "Ora" },
  { from: "PAYPAL", code: "129485", time: "2 min fa" },
  { from: "AMAZON", code: "582716", time: "5 min fa" },
];

export const LandingPage = ({ isAuthenticated }) => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState(FALLBACK_PLAN_CATALOG);
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.97]);

  useEffect(() => {
    http.get(`${API}/plans`).then((res) => {
      if (Array.isArray(res.data) && res.data.length > 0) {
        setPlans(res.data);
      }
    }).catch(() => {});
  }, []);

  const primaryAction = () => {
    navigate(isAuthenticated ? "/dashboard" : "/register");
  };

  return (
    <div className="landing-shell" data-testid="landing-page">
      <div className="grain-overlay" />
      <div className="landing-bg landing-bg-a" />
      <div className="landing-bg landing-bg-b" />
      <div className="landing-bg landing-bg-grid" />

      <motion.section
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="hero-section overflow-hidden px-4 pb-16 pt-24 sm:px-6 lg:px-8"
      >
        <div className="hero-gradient" />
        <div className="hero-gradient-secondary" />

        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-20">
          <div className="relative z-10 space-y-8">
            <div className="landing-pill">
              <span className="landing-kicker">Heirline • OTP vault &amp; accessi</span>
            </div>

            <div className="space-y-5">
              <h1 className="max-w-4xl text-4xl font-display font-bold leading-[1.02] tracking-tight text-white sm:text-5xl lg:text-6xl">
                I tuoi OTP, <span className="text-gradient">al sicuro</span> in un solo posto.
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-neutral-400 sm:text-xl">
                Vault E2EE, alias email, numero blindato e controllo accessi nello stesso prodotto. Nessun flusso secondario, nessun pannello dispersivo.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Button size="lg" onClick={primaryAction} className="btn-teal glow-teal h-14 px-8 text-base">
                <span>{isAuthenticated ? "Apri dashboard" : "Crea account"}</span>
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
                className="btn-outline-teal h-14 px-8 text-base"
              >
                Vedi piani
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-2">
              {heroHighlights.map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.08 }}
                  className="flex items-center gap-2"
                >
                  <div className="feature-check">
                    <Check className="h-3 w-3" />
                  </div>
                  <span className="text-sm text-neutral-400">{item}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.06 }}
            className="relative hidden lg:block"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="landing-phone mx-auto max-w-md"
            >
              <div className="landing-phone-header">
                <span>Inbox OTP</span>
                <Badge className="badge-otp">LIVE</Badge>
              </div>

              <div className="space-y-3">
                {inboxMessages.map((message, index) => (
                  <motion.div
                    key={message.from}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.12 }}
                    className="landing-phone-row"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <span className="font-semibold text-white">{message.from}</span>
                      <span className="text-xs text-neutral-500">{message.time}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="otp-display text-2xl">{message.code}</span>
                      <span className="landing-channel-tag">OTP</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-teal-500/10 blur-3xl" />
            <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-blue-500/10 blur-3xl" />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex"
        >
          <span className="text-xs uppercase tracking-[0.2em] text-neutral-500">Scorri</span>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <ChevronDown className="h-5 w-5 text-neutral-500" />
          </motion.div>
        </motion.div>
      </motion.section>

      <section id="features" className="relative px-4 py-24 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-teal-500/[0.02] to-transparent" />

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <div className="section-kicker mb-4 border-0">
              <Sparkles className="h-4 w-4" />
              <span>Funzionalita</span>
            </div>
            <h2 className="text-3xl font-display font-bold text-white sm:text-4xl lg:text-5xl">
              Meno rumore, <span className="text-gradient">piu controllo</span>.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-400">
              La dashboard resta concentrata su inbox, sicurezza, accessi ed eredita digitale. Tutto il resto e rumore che non ti serve.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {featureCards.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="landing-feature-card h-full"
              >
                <div className="landing-feature-icon">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-white">{feature.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-neutral-400 sm:text-base">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="relative px-4 py-24 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/5 blur-[150px]" />

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <div className="section-kicker mb-4 border-0">
              <CreditCard className="h-4 w-4" />
              <span>Pricing</span>
            </div>
            <h2 className="text-3xl font-display font-bold text-white sm:text-4xl lg:text-5xl">
              Parti da Vault, sali solo se <span className="text-gradient">ti serve davvero</span>.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-400">
              Il software entra prima. Shield e Control arrivano solo quando il numero blindato o la governance operativa diventano necessari.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {plans.map((plan, index) => {
              const presentation = getPricingPlanPresentation(plan);
              const isFeatured = presentation.isPopular;
              const isElite = plan.plan_key === "elite";

              return (
                <motion.div
                  key={plan.plan_key || plan.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: index * 0.08 }}
                  className={isFeatured ? "landing-plan-card landing-plan-card-highlight" : "landing-plan-card"}
                >
                  {presentation.badgeLabel ? (
                    <div className="landing-plan-badge">
                      <Badge className={isFeatured ? "badge-pro" : isElite ? "badge-team" : "badge-otp"}>
                        {presentation.badgeLabel}
                      </Badge>
                    </div>
                  ) : null}

                  <div className="space-y-3 pt-4">
                    <h3 className="text-2xl font-bold text-white">{presentation.publicLabel}</h3>
                    <p className="text-sm leading-relaxed text-neutral-400">{presentation.headline}</p>
                    <p className="text-sm leading-relaxed text-neutral-500">{presentation.subheadline}</p>
                  </div>

                  <div className="mt-8">
                    <div className="flex items-end gap-2">
                      <span className={isElite ? "price-display price-display-gold" : "price-display"}>
                        {presentation.priceValue}
                      </span>
                      <span className="pb-2 text-sm text-neutral-500">{presentation.priceSuffix}</span>
                    </div>
                    {presentation.billingNote ? (
                      <p className="mt-2 text-sm text-teal-400">{presentation.billingNote}</p>
                    ) : null}
                  </div>

                  <div className="mt-8 space-y-3">
                    {(plan.features || []).slice(0, 5).map((feature) => (
                      <div key={feature} className="flex items-start gap-3">
                        <div className="feature-check mt-0.5">
                          <Check className="h-3 w-3" />
                        </div>
                        <span className="text-sm text-neutral-300">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => navigate(isAuthenticated ? "/dashboard" : "/register")}
                    className={`mt-8 h-12 w-full ${isFeatured ? "btn-teal" : "border border-white/10 bg-white/5 text-white hover:bg-white/10"}`}
                  >
                    <span>{isAuthenticated ? "Apri dashboard" : presentation.ctaLabel}</span>
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="panel-surface-elevated mx-auto max-w-7xl p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <h2 className="text-3xl font-display font-bold tracking-tight text-white">
                Parti dal vault. Il resto si aggiunge dopo.
              </h2>
              <p className="text-base leading-relaxed text-neutral-400">
                Nessun percorso parallelo, nessun front end secondario: prima la base solida, poi numero blindato e controllo avanzato solo se servono davvero.
              </p>
            </div>
            <Button onClick={primaryAction} className="btn-teal h-12 px-8">
              <span>{isAuthenticated ? "Apri dashboard" : "Inizia ora"}</span>
            </Button>
          </div>
        </div>
      </section>

      {!isAuthenticated ? (
        <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="mobile-sticky-cta sm:hidden">
          <div className="mobile-sticky-cta-inner">
            <Button onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })} className="btn-teal h-12 flex-1">
              <span>Vedi piani</span>
            </Button>
            <Button variant="outline" onClick={() => navigate("/login")} className="btn-outline-teal h-12">
              Accedi
            </Button>
          </div>
        </motion.div>
      ) : null}

      <footer className="border-t border-white/5 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-teal-500/30 bg-gradient-to-br from-teal-500/30 to-teal-600/10">
              <HeartHandshake className="h-5 w-5 text-teal-400" />
            </div>
            <span className="font-display text-xl font-bold text-white">Heirline</span>
          </div>
          <div className="text-center md:text-right">
            <p className="text-sm text-neutral-500">Vault per TOTP e alias, Shield per numero blindato, Control per governance operativa.</p>
            <p className="mt-1 text-xs text-neutral-600">Eredita digitale e funzioni avanzate si attivano solo quando il piano lo prevede.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
