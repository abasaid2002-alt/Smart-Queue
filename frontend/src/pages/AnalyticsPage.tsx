import { BarChart3, Clock3, RotateCw, TicketCheck, Users } from "lucide-react"

const analyticsItems = [
  {
    label: "Ticket in attesa",
    icon: Users,
  },
  {
    label: "Ticket completati oggi",
    icon: TicketCheck,
  },
  {
    label: "Tempo medio attesa",
    icon: Clock3,
  },
  {
    label: "Smart Delay usati oggi",
    icon: RotateCw,
  },
]

export function AnalyticsPage() {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-semibold text-cyan-300">Manager intelligence</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">Analytics</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          Dashboard pensata per mostrare dati utili al manager e rendere il prodotto presentabile ad attività commerciali.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {analyticsItems.map((item) => {
          const Icon = item.icon

          return (
            <article key={item.label} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-5 flex size-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
                <Icon className="size-5" />
              </div>
              <p className="text-sm text-slate-400">{item.label}</p>
              <p className="mt-3 text-3xl font-bold text-white">—</p>
            </article>
          )
        })}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="size-6 text-cyan-300" />
          <h3 className="text-lg font-bold text-white">Report coda</h3>
        </div>

        <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">
          Nessun dato analytics caricato. Collegheremo questa pagina a GET /queues/:id/analytics.
        </div>
      </div>
    </section>
  )
}
