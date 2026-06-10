import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router"
import { CheckCircle2, LoaderCircle, MailWarning, ShieldCheck } from "lucide-react"
import { getApiErrorMessage, verifyEmail } from "../lib/api"

type VerifyStatus = "loading" | "success" | "error"

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token") ?? ""

  const [status, setStatus] = useState<VerifyStatus>(() => (token ? "loading" : "error"))
  const [message, setMessage] = useState(() => (token ? "Verifica email in corso..." : "Token mancante. Il link di verifica non è valido."))

  useEffect(() => {
    if (!token) return

    async function confirmEmail() {
      try {
        const response = await verifyEmail({ token })

        setStatus("success")
        setMessage(response.message)
      } catch (caughtError) {
        setStatus("error")
        setMessage(getApiErrorMessage(caughtError))
      }
    }

    void confirmEmail()
  }, [token])

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-6 py-10">
        <section className="panel-card w-full rounded-[2rem] p-8 text-center shadow-2xl sm:p-12">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/20">
            {status === "loading" && <LoaderCircle className="h-8 w-8 animate-spin" />}
            {status === "success" && <CheckCircle2 className="h-8 w-8" />}
            {status === "error" && <MailWarning className="h-8 w-8" />}
          </div>

          <p className="text-sm font-bold text-cyan-300">Smart Queue</p>
          <h1 className="mt-2 text-3xl font-black">Verifica email</h1>

          <p className={status === "error" ? "mt-5 text-sm leading-6 text-red-200" : "mt-5 text-sm leading-6 text-slate-300"}>{message}</p>

          {status === "loading" && <p className="mt-4 text-xs text-slate-500">Attendi qualche secondo...</p>}

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {status === "success" && (
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 font-black text-slate-950 shadow-lg shadow-cyan-400/20 transition hover:bg-cyan-300"
              >
                Vai al login
                <ShieldCheck className="h-5 w-5" />
              </Link>
            )}

            {status === "error" && (
              <>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 font-black text-slate-950 shadow-lg shadow-cyan-400/20 transition hover:bg-cyan-300"
                >
                  Torna al login
                </Link>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
