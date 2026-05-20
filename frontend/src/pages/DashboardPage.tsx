import { ArrowUpRight, Bell, Clock3, LayoutDashboard, Store, TicketCheck } from "lucide-react"
import type { LucideIcon } from "lucide-react"

type MetricCardProps = {
  title: string
  description: string
  icon: LucideIcon
}

const metrics: MetricCardProps[] = [
  {
    title: "Code attive",
    description: "Collegamento al backend previsto nella prossima fase.",
    icon: Store,
  },
  {
    title: "Ticket in attesa",
    description: "Mostrerà i ticket WAITING della coda selezionata.",
    icon: TicketCheck,
  },
  {
    title: "Tempo stimato",
    description: "Userà la media dinamica degli ultimi ticket completati.",
    icon: Clock3,
  },
  {
    title: "Notifiche",
    description: "Mostrerà notifiche interne non lette e aggiornamenti turno.",
    icon: Bell,
  },
]

export function DashboardPage() {
  return (
    <section className="flex flex-col gap-6">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
        <div className="bg-gradient-to-br from-cyan-400/20 via-slate-900 to-slate-950 p-6 sm:p-8">
          <div className="flex max-w-3xl flex-col gap-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-200">
              <LayoutDashboard className="size-4" />
              Piattaforma manager
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Gestisci le file digitali con un’esperienza professionale.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Smart Queue è pensato per attività commerciali che vogliono ridurre attese, no-show e confusione operativa con ticket digitali, notifiche e
                analytics.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="/queue"
                className="inline-flex items-center gap-2 rounded-2xl bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
              >
                Gestisci coda
                <ArrowUpRight className="size-4" />
              </a>

              <a
                href="/analytics"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Apri analytics
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <h3 className="text-lg font-bold text-white">Stato integrazione</h3>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Il layout è pronto. Nella prossima fase collegheremo login, token JWT e chiamate API reali verso il backend Spring Boot.
        </p>
      </div>
    </section>
  )
}

function MetricCard({ title, description, icon: Icon }: MetricCardProps) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition hover:-translate-y-1 hover:bg-white/[0.06]">
      <div className="mb-5 flex size-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
        <Icon className="size-5" />
      </div>

      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>

      <div className="mt-5 border-t border-white/10 pt-4">
        <span className="text-2xl font-bold text-white">—</span>
      </div>
    </article>
  )
}
