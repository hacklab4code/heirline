import { motion } from "motion/react";

export const AuthLayout = ({
  badge,
  title,
  description,
  icon,
  children,
}) => {
  const supportCards = badge === "Accesso"
    ? [
        { label: "Metodi", value: "Password, passkey e recovery email" },
        { label: "Rientro", value: "Redirect diretto alla dashboard" },
        { label: "Obiettivo", value: "Zero passaggi inutili" },
      ]
    : [
        { label: "Setup", value: "Base account in pochi minuti" },
        { label: "Controllo", value: "Password verificata prima del vault" },
        { label: "Output", value: "Ingresso diretto in dashboard" },
      ];

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
      <div className="grain-overlay" />
      <div className="hero-gradient opacity-70" />
      <div className="hero-gradient-secondary opacity-70" />

      <div className="relative mx-auto flex min-h-[calc(100vh-12rem)] max-w-6xl items-center">
        <div className="grid w-full gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45 }}
            className="hidden lg:block"
          >
            <div className="max-w-xl space-y-6">
              <div className="section-kicker w-fit border-0">{badge}</div>
              <div className="flex h-20 w-20 items-center justify-center rounded-[24px] border border-white/10 bg-white/5 text-accent-primary animate-float">
                {icon}
              </div>
              <div className="space-y-4">
                <h1 className="text-5xl font-display font-bold tracking-tight text-white">
                  {title}
                </h1>
                <p className="text-lg leading-relaxed text-neutral-400">
                  {description}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {supportCards.map((item) => (
                  <div key={item.label} className="auth-side-card p-4">
                    <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-neutral-500">{item.label}</div>
                    <div className="mt-2 text-sm font-semibold text-white">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
