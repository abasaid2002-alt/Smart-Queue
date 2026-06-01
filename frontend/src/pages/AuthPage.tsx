import axios from "axios"
import { useMemo, useState, type ReactNode, type SyntheticEvent } from "react"
import { useNavigate, useSearchParams } from "react-router"
import { ArrowRight, Eye, EyeOff, KeyRound, Lock, Mail, ShieldCheck, UserPlus } from "lucide-react"
import { forgotPassword, loginUser, registerUser, resetPassword, type UserRole } from "../lib/api"
import { saveAuthSession } from "../lib/auth"

type AuthMode = "login" | "register" | "forgot" | "reset"

export function AuthPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const resetToken = searchParams.get("token")
  const initialMode: AuthMode = resetToken ? "reset" : "login"

  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const [name, setName] = useState("")
  const [surname, setSurname] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<UserRole>("CLIENT")

  const title = useMemo(() => {
    if (mode === "register") return "Crea account"
    if (mode === "forgot") return "Recupera password"
    if (mode === "reset") return "Nuova password"
    return "Accedi al pannello"
  }, [mode])

  const subtitle = useMemo(() => {
    if (mode === "register") return "Registra cliente o manager per usare Smart Queue."
    if (mode === "forgot") return "Inserisci l'email e riceverai il link di reset."
    if (mode === "reset") return "Inserisci una nuova password sicura."
    return "Inserisci le credenziali create nel backend."
  }, [mode])

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()

    setLoading(true)
    setMessage("")
    setError("")

    try {
      const cleanEmail = email.trim().toLowerCase()
      const cleanName = name.trim()
      const cleanSurname = surname.trim()

      if (mode === "login") {
        const response = await loginUser({
          email: cleanEmail,
          password,
        })

        saveAuthSession(response)
        navigate("/dashboard", { replace: true })
        return
      }

      if (mode === "register") {
        await registerUser({
          name: cleanName,
          surname: cleanSurname,
          email: cleanEmail,
          password,
          role,
        })

        setMessage("Account creato correttamente. Ora puoi fare login.")
        setMode("login")
        setPassword("")
        return
      }

      if (mode === "forgot") {
        const response = await forgotPassword({
          email: cleanEmail,
        })

        setMessage(response.message)
        return
      }

      if (mode === "reset") {
        if (!resetToken) {
          setError("Token di reset mancante.")
          return
        }

        const response = await resetPassword({
          token: resetToken,
          newPassword: password,
        })

        setMessage(`${response.message}. Ora puoi fare login.`)
        setMode("login")
        setPassword("")
        return
      }
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
    } finally {
      setLoading(false)
    }
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode)
    setMessage("")
    setError("")
    setPassword("")
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 py-10">
        <section className="grid w-full overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] shadow-2xl lg:grid-cols-[1fr_1.05fr]">
          <div className="relative hidden min-h-[520px] flex-col justify-between overflow-hidden bg-cyan-500/10 p-10 lg:flex">
            <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />

            <div className="relative">
              <div className="mb-14 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/30">
                <ShieldCheck className="h-6 w-6" />
              </div>

              <h1 className="text-5xl font-black tracking-tight">Smart Queue</h1>

              <p className="mt-6 max-w-md text-base leading-7 text-cyan-50/80">
                Accesso alla piattaforma per gestire code digitali, ticket, notifiche, Smart Delay e analytics per attività commerciali.
              </p>
            </div>

            <div className="relative rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-center">
              <p className="font-bold">Pensato per attività commerciali</p>
              <p className="mt-2 text-sm leading-6 text-cyan-50/70">
                Ideale per tabaccherie, farmacie, uffici, barber shop, sportelli pubblici e attività con gestione turni.
              </p>
            </div>
          </div>

          <div className="p-8 sm:p-10 lg:p-14">
            <div className="mx-auto max-w-md">
              <div className="mb-8 text-center">
                <p className="text-sm font-bold text-cyan-300">Accesso sicuro</p>
                <h2 className="mt-2 text-3xl font-black">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-400">{subtitle}</p>
              </div>

              {message && <div className="mb-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">{message}</div>}

              {error && <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div>}

              <form className="space-y-5" onSubmit={handleSubmit}>
                {mode === "register" && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Nome">
                      <input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        className="auth-input"
                        placeholder="Mario"
                        required
                        autoComplete="given-name"
                      />
                    </Field>

                    <Field label="Cognome">
                      <input
                        value={surname}
                        onChange={(event) => setSurname(event.target.value)}
                        className="auth-input"
                        placeholder="Rossi"
                        required
                        autoComplete="family-name"
                      />
                    </Field>
                  </div>
                )}

                {mode !== "reset" && (
                  <Field label="Email">
                    <div className="auth-input-with-icon">
                      <Mail className="h-5 w-5 text-slate-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="w-full bg-transparent outline-none"
                        placeholder="manager@email.com"
                        required
                        autoComplete="email"
                      />
                    </div>
                  </Field>
                )}

                {(mode === "login" || mode === "register" || mode === "reset") && (
                  <Field label={mode === "reset" ? "Nuova password" : "Password"}>
                    <div className="auth-input-with-icon">
                      <Lock className="h-5 w-5 text-slate-500" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="w-full bg-transparent outline-none"
                        placeholder="Password1!"
                        required
                        autoComplete={mode === "reset" || mode === "register" ? "new-password" : "current-password"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="text-slate-500 transition hover:text-white"
                        aria-label={showPassword ? "Nascondi password" : "Mostra password"}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </Field>
                )}

                {mode === "register" && (
                  <Field label="Ruolo">
                    <select value={role} onChange={(event) => setRole(event.target.value as UserRole)} className="auth-input">
                      <option value="CLIENT">Cliente</option>
                      <option value="MANAGER">Manager</option>
                    </select>
                  </Field>
                )}

                {(mode === "register" || mode === "reset") && (
                  <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs leading-5 text-slate-400">
                    La password deve avere almeno 8 caratteri, una maiuscola, una minuscola, un numero, un carattere speciale e nessuno spazio.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-4 font-black text-slate-950 shadow-lg shadow-cyan-400/20 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Attendere..." : getSubmitLabel(mode)}

                  {mode === "forgot" ? (
                    <KeyRound className="h-5 w-5" />
                  ) : mode === "register" ? (
                    <UserPlus className="h-5 w-5" />
                  ) : (
                    <ArrowRight className="h-5 w-5" />
                  )}
                </button>
              </form>

              <div className="mt-8 space-y-3 text-center text-sm text-slate-400">
                {mode !== "login" && (
                  <button type="button" onClick={() => switchMode("login")} className="font-semibold text-cyan-300 hover:text-cyan-200">
                    Torna al login
                  </button>
                )}

                {mode === "login" && (
                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <button type="button" onClick={() => switchMode("forgot")} className="font-semibold text-cyan-300 hover:text-cyan-200">
                      Password dimenticata?
                    </button>

                    <span className="hidden text-slate-600 sm:block">•</span>

                    <button type="button" onClick={() => switchMode("register")} className="font-semibold text-cyan-300 hover:text-cyan-200">
                      Crea un account
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-200">{label}</span>
      {children}
    </label>
  )
}

function getSubmitLabel(mode: AuthMode) {
  if (mode === "register") return "Registrati"
  if (mode === "forgot") return "Invia email di reset"
  if (mode === "reset") return "Aggiorna password"
  return "Accedi"
}

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data

    if (typeof responseData === "object" && responseData !== null && "message" in responseData && typeof responseData.message === "string") {
      return responseData.message
    }

    if (typeof responseData === "string") {
      return responseData
    }
  }

  return "Operazione non riuscita. Controlla i dati e riprova."
}
