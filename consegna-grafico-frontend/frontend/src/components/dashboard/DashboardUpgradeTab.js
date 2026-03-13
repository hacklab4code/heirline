import { Check, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { getPricingPlanPresentation, getPublicPlanLabel, normalizePlanKey } from "@/lib/app-shared";

export const DashboardUpgradeTab = ({
  sortedCatalogPlans,
  getCheckoutPlanIdForKey,
  isPlanIncluded,
  currentPlanKey,
  currentPlanLabel,
  handleCheckout,
  checkoutPlanId,
  getUpgradeActionLabel,
}) => {
  const resolvedCurrentPlanLabel = currentPlanLabel || getPublicPlanLabel(currentPlanKey);

  return (
    <TabsContent value="upgrade" className="mt-0">
      <div className="space-y-6 sm:space-y-8">
        <Card className="panel-surface-elevated overflow-hidden border-white/10 p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="section-kicker">Piano attuale</p>
                <h2 className="text-3xl font-display font-bold text-foreground sm:text-4xl">{resolvedCurrentPlanLabel}</h2>
                <p className="max-w-2xl text-sm leading-relaxed text-neutral-400">
                  Confronta in una sola vista quello che hai gia attivo, cosa e gia incluso e quale tier sblocca il passo successivo per inbox, sicurezza e condivisione.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="metric-pill">
                  <span className="landing-preview-badge">01</span>
                  Stato account allineato al checkout
                </div>
                <div className="metric-pill">
                  <span className="landing-preview-badge">02</span>
                  Upgrade in ordine lineare senza duplicazioni
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="border-none bg-accent-primary/20 text-accent-primary">{resolvedCurrentPlanLabel.toUpperCase()}</Badge>
              <Badge variant="outline" className="border-white/10 text-neutral-300">
                {currentPlanKey === "pending" ? "Completa checkout per attivare un piano" : "I tier superiori includono i vantaggi precedenti"}
              </Badge>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
          {sortedCatalogPlans.map((plan) => {
            const presentation = getPricingPlanPresentation(plan);
            const checkoutId = getCheckoutPlanIdForKey(plan.plan_key);
            const included = isPlanIncluded(plan.plan_key);
            const current = currentPlanKey === normalizePlanKey(plan.plan_key);
            const statusLabel = current ? "ATTUALE" : included ? "GIA INCLUSO" : null;
            const buttonClass = current || included
              ? "btn-outline-teal"
              : presentation.isPopular
                ? "btn-teal glow-teal"
                : plan.plan_key === "elite"
                  ? "btn-outline-teal border-accent-gold/40 text-accent-gold hover:bg-accent-gold/10"
                  : "btn-teal";
            const cardClass = presentation.isPopular
              ? "landing-plan-card landing-plan-card-highlight"
              : current
                ? "landing-plan-card border-[rgba(15,214,179,0.22)] shadow-[0_0_30px_-18px_rgba(15,214,179,0.35)]"
                : "landing-plan-card";
            const statusBadgeClass = current
              ? "border-none bg-accent-primary/20 text-accent-primary"
              : included
                ? "border-none bg-white/10 text-neutral-200"
                : "border-none bg-transparent text-transparent";
            const badgeClass = presentation.isPopular
              ? "badge-pro"
              : plan.plan_key === "elite"
                ? "badge-team"
                : "badge-otp";

            return (
              <Card
                key={plan.plan_key || plan.id}
                className={`relative space-y-8 p-6 sm:p-8 ${cardClass}`}
              >
                {presentation.badgeLabel ? (
                  <div className={`landing-plan-badge ${badgeClass}`}>
                    {presentation.badgeLabel}
                  </div>
                ) : null}
                <div className="space-y-4">
                  <div className="flex min-h-6 flex-wrap gap-2">
                    {statusLabel ? (
                      <Badge className={statusBadgeClass}>
                        {statusLabel}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-foreground text-2xl font-display font-bold">{presentation.publicLabel}</h3>
                    <p className="text-sm text-neutral-400">{presentation.headline}</p>
                    {presentation.subheadline ? (
                      <p className="text-xs text-neutral-500">{presentation.subheadline}</p>
                    ) : null}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-display font-bold text-foreground">{presentation.priceValue}</span>
                    <span className="text-neutral-500">{presentation.priceSuffix}</span>
                  </div>
                  {presentation.billingNote ? (
                    <p className="text-xs text-neutral-500">{presentation.billingNote}</p>
                  ) : null}
                </div>
                <ul className="space-y-3 text-sm text-neutral-400">
                  {(plan.features || []).slice(0, 4).map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-accent-primary" /> <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="card-dark p-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Percorso</p>
                  <p className="mt-2 text-sm text-neutral-300">
                    {current
                      ? "Questo e il piano attualmente attivo sul tuo account."
                      : included
                        ? "Queste funzioni sono gia comprese nel tuo tier corrente."
                        : "Passa a questo tier per sbloccare le funzionalita aggiuntive di sicurezza e gestione."}
                  </p>
                </div>
                <Button
                  onClick={() => checkoutId && handleCheckout(checkoutId)}
                  disabled={!checkoutId || included || checkoutPlanId === checkoutId}
                  className={`h-12 w-full rounded-xl ${buttonClass} ${included ? "cursor-not-allowed opacity-70" : ""}`}
                  variant={current || included || (plan.plan_key === "elite" && !presentation.isPopular) ? "outline" : "default"}
                >
                  {checkoutPlanId === checkoutId ? <RefreshCw className="h-4 w-4 animate-spin" /> : (current ? "Gia attivo" : getUpgradeActionLabel(plan.plan_key))}
                </Button>
              </Card>
            );
          })}
        </div>
      </div>
    </TabsContent>
  );
};
