import { Database, KeyRound, Settings, Shield } from "lucide-react"

const settingsSections = [
  {
    title: "API Backend",
    description: "Configurazione base URL e collegamento con Spring Boot.",
    icon: Database,
  },
  {
    title: "Autenticazione",
    description: "Gestione token JWT, ruolo manager e ruolo cliente.",
    icon: KeyRound,
  },
  {
    title: "Sicurezza",
    description: "Protezione rotte e gestione sessione utente.",
    icon: Shield,
  },
]

export function SettingsPage() {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-semibold text-cyan-300">Configurazione</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">Impostazioni</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Sezione preparata per gestire configurazioni frontend, API e sicurezza.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {settingsSections.map((section) => {
          const Icon = section.icon

          return (
            <article key={section.title} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-5 flex size-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
                <Icon className="size-5" />
              </div>
              <p className="font-bold text-white">{section.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">{section.description}</p>
            </article>
          )
        })}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex items-center gap-3">
          <Settings className="size-6 text-cyan-300" />
          <h3 className="text-lg font-bold text-white">Preferenze applicazione</h3>
        </div>

        <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">
          Le impostazioni reali verranno aggiunte dopo il collegamento API.
        </div>
      </div>
    </section>
  )
}
