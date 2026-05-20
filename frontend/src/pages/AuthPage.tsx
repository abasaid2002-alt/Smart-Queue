import { ArrowRight, LockKeyhole, Mail, ShieldCheck } from "lucide-react"

export function AuthPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <section className="grid w-full max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-2xl lg:grid-cols-2">
        <div className="bg-gradient-to-br from-cyan-400/20 via-slate-900 to-slate-950 p-8 sm:p-10">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950">
            <ShieldCheck className="size-6" />
          </div>

          <h1 className="mt-8 text-4xl font-bold tracking-tight">Smart Queue</h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">Accesso alla piattaforma per gestire code digitali, ticket, notifiche e analytics.</p>

          <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm font-semibold text-white">Pensato per attività commerciali</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Ideale per tabaccherie, farmacie, uffici, barber shop, sportelli pubblici e attività con gestione turni.
            </p>
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <div>
            <p className="text-sm font-semibold text-cyan-300">Accesso sicuro</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">Accedi al pannello</h2>
            <p className="mt-2 text-sm text-slate-400">La connessione al backend verrà collegata nella fase API.</p>
          </div>

          <form className="mt-8 flex flex-col gap-4" onSubmit={(event) => event.preventDefault()}>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-300">Email</span>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <Mail className="size-5 text-slate-500" />
                <input className="w-full bg-transparent text-sm outline-none placeholder:text-slate-600" placeholder="manager@email.com" type="email" />
              </div>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-300">Password</span>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <LockKeyhole className="size-5 text-slate-500" />
                <input className="w-full bg-transparent text-sm outline-none placeholder:text-slate-600" placeholder="••••••••" type="password" />
              </div>
            </label>

            <button
              type="submit"
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
            >
              Accedi
              <ArrowRight className="size-4" />
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
