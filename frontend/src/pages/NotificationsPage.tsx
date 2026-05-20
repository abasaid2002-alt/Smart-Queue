import { Bell, CheckCheck, Inbox } from "lucide-react"

export function NotificationsPage() {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-semibold text-cyan-300">Internal notification system</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">Notifiche</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          Qui il cliente vedrà notifiche come turno vicino, turno chiamato, ticket cancellato e coda chiusa.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <NotificationBox title="Tutte" description="Tutte le notifiche ricevute." icon={<Bell />} />
        <NotificationBox title="Non lette" description="Solo notifiche ancora da leggere." icon={<Inbox />} />
        <NotificationBox title="Letta" description="Stato dopo conferma lettura." icon={<CheckCheck />} />
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <h3 className="text-lg font-bold text-white">Centro notifiche</h3>
        <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">
          Nessuna notifica caricata. Collegheremo questa pagina a GET /notifications/my.
        </div>
      </div>
    </section>
  )
}

function NotificationBox({ title, description, icon }: { title: string; description: string; icon: React.ReactNode }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-5 flex size-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">{icon}</div>
      <p className="font-bold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
    </article>
  )
}
