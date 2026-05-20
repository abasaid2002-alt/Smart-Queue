import { ListOrdered, LockKeyhole, Play, RotateCcw, UnlockKeyhole } from "lucide-react"

export function QueuePage() {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-semibold text-cyan-300">Gestione operativa</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">Coda</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          Da questa pagina il manager potrà aprire, chiudere, resettare e mandare avanti la coda.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <QueueAction title="Manda avanti" description="Chiama il prossimo ticket." icon={<Play />} />
        <QueueAction title="Chiudi coda" description="Blocca nuovi ticket." icon={<LockKeyhole />} />
        <QueueAction title="Riapri coda" description="Permette nuovi ticket." icon={<UnlockKeyhole />} />
        <QueueAction title="Reset coda" description="Ripulisce la coda corrente." icon={<RotateCcw />} />
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
            <ListOrdered className="size-5" />
          </div>

          <div>
            <h3 className="font-bold text-white">Ordine ticket</h3>
            <p className="text-sm text-slate-400">Qui mostreremo la coda reale ordinata per sortOrder.</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">
          Nessun dato caricato. Collegamento API nella prossima fase.
        </div>
      </div>
    </section>
  )
}

function QueueAction({ title, description, icon }: { title: string; description: string; icon: React.ReactNode }) {
  return (
    <button type="button" className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-left transition hover:-translate-y-1 hover:bg-white/[0.06]">
      <div className="mb-5 flex size-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">{icon}</div>
      <p className="font-bold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
    </button>
  )
}
