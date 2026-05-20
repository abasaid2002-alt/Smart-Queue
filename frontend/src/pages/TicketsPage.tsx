import { Clock, Ticket, UserCheck, XCircle } from "lucide-react"

const ticketStatuses = [
  {
    label: "In attesa",
    description: "Ticket ancora in stato WAITING.",
    icon: Clock,
  },
  {
    label: "In servizio",
    description: "Ticket chiamati e in gestione.",
    icon: UserCheck,
  },
  {
    label: "Completati",
    description: "Ticket conclusi correttamente.",
    icon: Ticket,
  },
  {
    label: "Cancellati / no-show",
    description: "Ticket annullati o non presentati.",
    icon: XCircle,
  },
]

export function TicketsPage() {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-semibold text-cyan-300">Ticket lifecycle</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">Ticket</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Qui verranno gestiti ticket, stato, posizione, Smart Delay e storico operativo.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {ticketStatuses.map((status) => {
          const Icon = status.icon

          return (
            <article key={status.label} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-5 flex size-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
                <Icon className="size-5" />
              </div>
              <p className="font-bold text-white">{status.label}</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">{status.description}</p>
              <p className="mt-5 text-2xl font-bold text-white">—</p>
            </article>
          )
        })}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <h3 className="text-lg font-bold text-white">Lista ticket</h3>
        <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">
          Nessun ticket caricato. Collegheremo questa sezione a GET /queues/:id/tickets.
        </div>
      </div>
    </section>
  )
}
