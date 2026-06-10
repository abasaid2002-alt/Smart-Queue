import type { ReactNode } from "react"
import { ArrowDown, ArrowUp, CheckCircle2, Globe2, GripVertical, LayoutList, RotateCcw, Settings, Store, UserRound } from "lucide-react"
import { Link } from "react-router"
import {
  getEffectiveWorkspaceMode,
  getNavigationLabel,
  moveNavigationItem,
  DEFAULT_NAVIGATION_ORDER,
  updateUserPreferences,
  useUserPreferences,
  type LanguageCode,
  type NavigationItemId,
  type WorkspaceMode,
} from "../lib/preferences"
import { getAuthUser } from "../lib/auth"

const languageOptions: { value: LanguageCode; label: string; nativeLabel: string }[] = [
  { value: "it", label: "Italiano", nativeLabel: "Italiano" },
  { value: "en", label: "English", nativeLabel: "English" },
  { value: "fr", label: "Francese", nativeLabel: "Français" },
  { value: "de", label: "Tedesco", nativeLabel: "Deutsch" },
  { value: "es", label: "Spagnolo", nativeLabel: "Español" },
  { value: "ar", label: "Arabo", nativeLabel: "العربية" },
]

const text = {
  it: {
    eyebrow: "Preferenze",
    title: "Impostazioni",
    description: "Personalizza profilo, lingua e menu del tuo pannello.",
    profileTitle: "Profilo",
    profileDescription: "Scegli come usare il tuo account in questa sessione.",
    managerMode: "Manager",
    clientMode: "Cliente",
    managerModeDescription: "Gestisci attività, code e statistiche.",
    clientModeDescription: "Prenota ticket nelle attività degli altri manager.",
    clientOnlyDescription: "Prenota ticket e segui i tuoi turni.",
    activeMode: "Modalità attiva",
    languageTitle: "Lingua del sito",
    languageDescription: "Scegli la lingua da usare nel pannello.",
    orderTitle: "Ordine menu principale",
    orderDescription: "Sposta le sezioni in base al tuo modo di lavorare.",
    up: "Sposta su",
    down: "Sposta giù",
    restore: "Ripristina ordine predefinito",
    managerTitle: "Attività e code",
    managerDescription: "Crea nuove attività e gestisci ogni coda separatamente dalla pagina Coda.",
    openQueue: "Vai a Gestione attività",
    newBusiness: "Nuova attività",
  },
  en: {
    eyebrow: "Preferences",
    title: "Settings",
    description: "Customize profile, language and menu order.",
    profileTitle: "Profile",
    profileDescription: "Choose how to use your account in this session.",
    managerMode: "Manager",
    clientMode: "Client",
    managerModeDescription: "Manage businesses, queues and statistics.",
    clientModeDescription: "Book tickets in businesses managed by others.",
    clientOnlyDescription: "Book tickets and follow your turns.",
    activeMode: "Active mode",
    languageTitle: "Site language",
    languageDescription: "Choose the language used in the panel.",
    orderTitle: "Main menu order",
    orderDescription: "Move sections to match the way you work.",
    up: "Move up",
    down: "Move down",
    restore: "Restore default order",
    managerTitle: "Businesses and queues",
    managerDescription: "Create new businesses and manage every queue separately from the Queue page.",
    openQueue: "Open business management",
    newBusiness: "New business",
  },
  fr: {
    eyebrow: "Préférences",
    title: "Paramètres",
    description: "Personnalisez le profil, la langue et l’ordre du menu.",
    profileTitle: "Profil",
    profileDescription: "Choisissez comment utiliser votre compte dans cette session.",
    managerMode: "Manager",
    clientMode: "Client",
    managerModeDescription: "Gérez les activités, les files et les statistiques.",
    clientModeDescription: "Réservez des tickets dans les activités d’autres managers.",
    clientOnlyDescription: "Réservez des tickets et suivez vos tours.",
    activeMode: "Mode actif",
    languageTitle: "Langue du site",
    languageDescription: "Choisissez la langue du panneau.",
    orderTitle: "Ordre du menu principal",
    orderDescription: "Déplacez les sections selon votre façon de travailler.",
    up: "Monter",
    down: "Descendre",
    restore: "Restaurer l’ordre par défaut",
    managerTitle: "Activités et files",
    managerDescription: "Créez de nouvelles activités et gérez chaque file séparément.",
    openQueue: "Ouvrir la gestion",
    newBusiness: "Nouvelle activité",
  },
  de: {
    eyebrow: "Einstellungen",
    title: "Einstellungen",
    description: "Profil, Sprache und Menü-Reihenfolge anpassen.",
    profileTitle: "Profil",
    profileDescription: "Wähle, wie du dein Konto in dieser Sitzung verwendest.",
    managerMode: "Manager",
    clientMode: "Kunde",
    managerModeDescription: "Aktivitäten, Warteschlangen und Statistiken verwalten.",
    clientModeDescription: "Tickets bei Aktivitäten anderer Manager buchen.",
    clientOnlyDescription: "Tickets buchen und deine Warteschlange verfolgen.",
    activeMode: "Aktiver Modus",
    languageTitle: "Sprache der Seite",
    languageDescription: "Wähle die Sprache des Panels.",
    orderTitle: "Hauptmenü-Reihenfolge",
    orderDescription: "Ordne die Bereiche nach deiner Arbeitsweise.",
    up: "Nach oben",
    down: "Nach unten",
    restore: "Standardreihenfolge wiederherstellen",
    managerTitle: "Aktivitäten und Warteschlangen",
    managerDescription: "Neue Aktivitäten erstellen und jede Warteschlange separat verwalten.",
    openQueue: "Verwaltung öffnen",
    newBusiness: "Neue Aktivität",
  },
  es: {
    eyebrow: "Preferencias",
    title: "Ajustes",
    description: "Personaliza perfil, idioma y orden del menú.",
    profileTitle: "Perfil",
    profileDescription: "Elige cómo usar tu cuenta en esta sesión.",
    managerMode: "Manager",
    clientMode: "Cliente",
    managerModeDescription: "Gestiona actividades, colas y estadísticas.",
    clientModeDescription: "Reserva tickets en actividades de otros managers.",
    clientOnlyDescription: "Reserva tickets y sigue tus turnos.",
    activeMode: "Modo activo",
    languageTitle: "Idioma del sitio",
    languageDescription: "Elige el idioma del panel.",
    orderTitle: "Orden del menú principal",
    orderDescription: "Mueve las secciones según tu forma de trabajar.",
    up: "Subir",
    down: "Bajar",
    restore: "Restaurar orden predeterminado",
    managerTitle: "Actividades y colas",
    managerDescription: "Crea nuevas actividades y gestiona cada cola por separado.",
    openQueue: "Abrir gestión",
    newBusiness: "Nueva actividad",
  },
  ar: {
    eyebrow: "التفضيلات",
    title: "الإعدادات",
    description: "خصّص الملف الشخصي واللغة وترتيب القائمة.",
    profileTitle: "الملف الشخصي",
    profileDescription: "اختر طريقة استخدام الحساب في هذه الجلسة.",
    managerMode: "مدير",
    clientMode: "عميل",
    managerModeDescription: "إدارة الأنشطة والطوابير والإحصائيات.",
    clientModeDescription: "حجز تذاكر في أنشطة مديرين آخرين.",
    clientOnlyDescription: "حجز التذاكر ومتابعة الدور.",
    activeMode: "الوضع الحالي",
    languageTitle: "لغة الموقع",
    languageDescription: "اختر لغة لوحة التحكم.",
    orderTitle: "ترتيب القائمة الرئيسية",
    orderDescription: "رتّب الأقسام حسب طريقة عملك.",
    up: "أعلى",
    down: "أسفل",
    restore: "استعادة الترتيب الافتراضي",
    managerTitle: "الأنشطة والطوابير",
    managerDescription: "أنشئ أنشطة جديدة وأدر كل طابور بشكل منفصل.",
    openQueue: "فتح الإدارة",
    newBusiness: "نشاط جديد",
  },
} satisfies Record<LanguageCode, Record<string, string>>

export function SettingsPage() {
  const user = getAuthUser()
  const preferences = useUserPreferences()
  const effectiveMode = getEffectiveWorkspaceMode(user?.role, preferences.workspaceMode)
  const t = text[preferences.language]
  const visibleNavigationOrder = preferences.navigationOrder.filter((itemId) => effectiveMode === "MANAGER" || itemId !== "analytics")

  function changeLanguage(language: LanguageCode) {
    updateUserPreferences({ language })
  }

  function changeWorkspaceMode(workspaceMode: WorkspaceMode) {
    updateUserPreferences({ workspaceMode })
  }

  function moveItem(itemId: NavigationItemId, direction: "up" | "down") {
    updateUserPreferences({ navigationOrder: moveNavigationItem(preferences.navigationOrder, itemId, direction) })
  }

  return (
    <section className="flex flex-col gap-5 text-left sm:gap-6">
      <div>
        <p className="text-sm font-semibold text-cyan-300">{t.eyebrow}</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">{t.title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{t.description}</p>
      </div>

      <section className="panel-card rounded-3xl p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <UserRound className="mt-1 size-6 text-cyan-300" />
          <div>
            <h3 className="text-lg font-bold text-white">{t.profileTitle}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-400">{t.profileDescription}</p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
              {t.activeMode}: {effectiveMode === "MANAGER" ? t.managerMode : t.clientMode}
            </p>
          </div>
        </div>

        {user?.role === "MANAGER" ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <ModeButton
              selected={effectiveMode === "MANAGER"}
              title={t.managerMode}
              description={t.managerModeDescription}
              icon={<Settings />}
              onClick={() => changeWorkspaceMode("MANAGER")}
            />
            <ModeButton
              selected={effectiveMode === "CLIENT"}
              title={t.clientMode}
              description={t.clientModeDescription}
              icon={<UserRound />}
              onClick={() => changeWorkspaceMode("CLIENT")}
            />
          </div>
        ) : (
          <p className="mt-5 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-300">{t.clientOnlyDescription}</p>
        )}
      </section>

      <section className="panel-card rounded-3xl p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <Globe2 className="size-6 text-cyan-300" />
          <div>
            <h3 className="text-lg font-bold text-white">{t.languageTitle}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-400">{t.languageDescription}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {languageOptions.map((option) => {
            const selected = preferences.language === option.value

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => changeLanguage(option.value)}
                className={`soft-card-hover flex items-center justify-between rounded-2xl border px-4 py-3 text-left ${
                  selected ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100" : "border-white/10 bg-slate-900/60 text-slate-300 hover:bg-white/[0.06]"
                }`}
              >
                <span>
                  <span className="block font-bold">{option.nativeLabel}</span>
                  <span className="text-xs text-slate-500">{option.label}</span>
                </span>
                {selected && <CheckCircle2 className="size-5 text-cyan-300" />}
              </button>
            )
          })}
        </div>
      </section>

      <section className="panel-card rounded-3xl p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <LayoutList className="size-6 text-cyan-300" />
            <div>
              <h3 className="text-lg font-bold text-white">{t.orderTitle}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-400">{t.orderDescription}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => updateUserPreferences({ navigationOrder: DEFAULT_NAVIGATION_ORDER })}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/10"
          >
            <RotateCcw className="size-4" />
            {t.restore}
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {visibleNavigationOrder.map((itemId, index) => (
            <div key={itemId} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-3">
              <GripVertical className="size-5 shrink-0 text-slate-500" />
              <span className="flex-1 font-bold text-white">{getSettingsNavigationLabel(itemId, preferences.language, effectiveMode)}</span>

              <button
                type="button"
                disabled={index === 0}
                onClick={() => moveItem(itemId, "up")}
                className="inline-flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label={t.up}
                title={t.up}
              >
                <ArrowUp className="size-4" />
              </button>

              <button
                type="button"
                disabled={index === visibleNavigationOrder.length - 1}
                onClick={() => moveItem(itemId, "down")}
                className="inline-flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label={t.down}
                title={t.down}
              >
                <ArrowDown className="size-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {user?.role === "MANAGER" && (
        <div className="panel-card rounded-3xl border-cyan-300/20 bg-cyan-300/5 p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <Store className="mt-1 size-6 text-cyan-300" />
            <div>
              <h3 className="text-lg font-bold text-white">{t.managerTitle}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{t.managerDescription}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/queue" className="action-button bg-cyan-400 text-slate-950 hover:bg-cyan-300 sm:w-auto">
              {t.openQueue}
            </Link>
            <Link
              to="/queue"
              state={{ openCreateBusinessForm: true }}
              className="action-button border border-white/10 bg-white/[0.04] text-white hover:bg-white/10 sm:w-auto"
            >
              {t.newBusiness}
            </Link>
          </div>
        </div>
      )}
    </section>
  )
}

function getSettingsNavigationLabel(itemId: NavigationItemId, language: LanguageCode, mode: "MANAGER" | "CLIENT") {
  if (mode === "CLIENT") {
    if (itemId === "queue") return language === "it" ? "Prenota ticket" : "Book ticket"
    if (itemId === "tickets") return language === "it" ? "I miei ticket" : "My tickets"
  }

  return getNavigationLabel(itemId, language)
}

function ModeButton({
  selected,
  title,
  description,
  icon,
  onClick,
}: {
  selected: boolean
  title: string
  description: string
  icon: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${selected ? "border-cyan-300/40 bg-cyan-300/10" : "border-white/10 bg-slate-900/60 hover:bg-white/[0.06]"}`}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">{icon}</span>
        <span>
          <span className="flex items-center gap-2 font-bold text-white">
            {title}
            {selected && <CheckCircle2 className="size-4 text-cyan-300" />}
          </span>
          <span className="mt-1 block text-sm leading-6 text-slate-400">{description}</span>
        </span>
      </div>
    </button>
  )
}
