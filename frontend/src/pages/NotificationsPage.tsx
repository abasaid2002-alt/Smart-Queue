/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react"
import { useSearchParams } from "react-router"
import { Bell, CheckCheck, Inbox, MessageCircle, Send } from "lucide-react"
import {
  getApiErrorMessage,
  getConversationMessages,
  getConversations,
  getNotifications,
  markNotificationAsRead,
  sendConversationMessage,
  type ConversationMessageResponse,
  type ConversationResponse,
  type NotificationResponse,
} from "../lib/api"
import { getAuthUser } from "../lib/auth"

function formatDateTime(value: string | null) {
  if (!value) return "-"
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value))
}

function notificationTypeLabel(type: NotificationResponse["type"]) {
  const labels: Record<NotificationResponse["type"], string> = {
    TURN_NEAR: "Turno vicino",
    TURN_CALLED: "Turno chiamato",
    TICKET_CANCELLED: "Ticket cancellato",
    TICKET_POSTPONED: "Ticket posticipato",
    QUEUE_CLOSED: "Coda chiusa",
    QUEUE_REOPENED: "Coda riaperta",
    QUEUE_RESET: "Coda resettata",
    MESSAGE_RECEIVED: "Nuovo messaggio",
    BUSINESS_UPDATED: "Attività aggiornata",
  }

  return labels[type]
}

const NOTIFICATION_REFRESH_EVENT = "smart-queue-notifications-updated"

export function NotificationsPage() {
  const user = getAuthUser()
  const [searchParams, setSearchParams] = useSearchParams()
  const conversationIdFromUrl = Number(searchParams.get("conversationId"))
  const [activeTab, setActiveTab] = useState<"alerts" | "messages">(conversationIdFromUrl ? "messages" : "alerts")
  const [notifications, setNotifications] = useState<NotificationResponse[]>([])
  const [conversations, setConversations] = useState<ConversationResponse[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(
    Number.isFinite(conversationIdFromUrl) && conversationIdFromUrl > 0 ? conversationIdFromUrl : null,
  )
  const [messages, setMessages] = useState<ConversationMessageResponse[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState("")

  async function loadNotifications() {
    const loadedNotifications = await getNotifications()
    setNotifications(loadedNotifications)
  }

  async function loadConversations(preferredConversationId = selectedConversationId) {
    const loadedConversations = await getConversations()
    setConversations(loadedConversations)

    const nextConversationId = loadedConversations.some((conversation) => conversation.id === preferredConversationId)
      ? preferredConversationId
      : (loadedConversations[0]?.id ?? null)

    setSelectedConversationId(nextConversationId)

    if (nextConversationId) {
      const loadedMessages = await getConversationMessages(nextConversationId)
      setMessages(loadedMessages)
    } else {
      setMessages([])
    }
  }

  async function loadPage(options: { silent?: boolean } = {}) {
    if (!options.silent) {
      setLoading(true)
      setError("")
    }

    try {
      await Promise.all([loadNotifications(), loadConversations(selectedConversationId)])
    } catch (caughtError) {
      if (!options.silent) {
        setError(getApiErrorMessage(caughtError))
      }
    } finally {
      if (!options.silent) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    void loadPage()

    const intervalId = window.setInterval(() => {
      void loadPage({ silent: true })
    }, 4000)

    return () => window.clearInterval(intervalId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversationId])

  async function handleSelectConversation(conversationId: number) {
    setActionLoading(true)
    setError("")
    setSelectedConversationId(conversationId)
    setActiveTab("messages")
    setSearchParams({ conversationId: String(conversationId) })

    try {
      const loadedMessages = await getConversationMessages(conversationId)
      setMessages(loadedMessages)
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError))
    } finally {
      setActionLoading(false)
    }
  }

  async function handleMarkAsRead(notificationId: number) {
    setActionLoading(true)
    setError("")

    try {
      await markNotificationAsRead(notificationId)
      await loadNotifications()
      window.dispatchEvent(new Event(NOTIFICATION_REFRESH_EVENT))
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError))
    } finally {
      setActionLoading(false)
    }
  }

  async function handleMarkAllAsRead() {
    const unreadNotifications = notifications.filter((notification) => !notification.read)

    if (unreadNotifications.length === 0) return

    setActionLoading(true)
    setError("")

    try {
      await Promise.all(unreadNotifications.map((notification) => markNotificationAsRead(notification.id)))
      await loadNotifications()
      window.dispatchEvent(new Event(NOTIFICATION_REFRESH_EVENT))
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError))
    } finally {
      setActionLoading(false)
    }
  }

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedConversationId || !newMessage.trim()) return

    setActionLoading(true)
    setError("")

    try {
      await sendConversationMessage(selectedConversationId, newMessage.trim())
      setNewMessage("")
      const loadedMessages = await getConversationMessages(selectedConversationId)
      setMessages(loadedMessages)
      await loadConversations(selectedConversationId)
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError))
    } finally {
      setActionLoading(false)
    }
  }

  const unreadCount = useMemo(() => notifications.filter((notification) => !notification.read).length, [notifications])
  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId],
  )

  return (
    <section className="flex flex-col gap-5 text-left sm:gap-6">
      <div>
        <p className="text-sm font-semibold text-cyan-300">Centro notifiche</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">Notifiche</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Avvisi automatici e messaggi collegati ai ticket delle attività.</p>
      </div>

      {error && <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div>}

      <div className="grid gap-4 md:grid-cols-3">
        <NotificationBox title="Avvisi" value={notifications.length} description="Aggiornamenti automatici." icon={<Bell />} />
        <NotificationBox title="Non lette" value={unreadCount} description="Da leggere." icon={<Inbox />} />
        <NotificationBox title="Conversazioni" value={conversations.length} description="Messaggi con clienti o manager." icon={<MessageCircle />} />
      </div>

      <div className="flex flex-wrap gap-2 rounded-3xl border border-white/10 bg-white/[0.03] p-2">
        <TabButton active={activeTab === "alerts"} onClick={() => setActiveTab("alerts")}>
          Avvisi automatici
        </TabButton>
        <TabButton active={activeTab === "messages"} onClick={() => setActiveTab("messages")}>
          Messaggi
        </TabButton>
      </div>

      {activeTab === "alerts" && (
        <div className="panel-card rounded-3xl p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-white">Avvisi automatici</h3>
            <div className="flex flex-wrap items-center gap-2">
              {loading && <span className="text-xs font-semibold text-cyan-300">Caricamento...</span>}
              {unreadCount > 0 && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleMarkAllAsRead}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Segna tutte come lette
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {notifications.length === 0 && <EmptyState text="Nessuna notifica presente." />}
            {notifications.map((notification) => (
              <article key={notification.id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-white">{notification.message}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {notificationTypeLabel(notification.type)} · {formatDateTime(notification.createdAt)}
                      {notification.ticketNumber ? ` · Ticket #${notification.ticketNumber}` : ""}
                    </p>
                  </div>
                  <span
                    className={
                      notification.read
                        ? "rounded-full border border-slate-300/20 bg-slate-300/10 px-3 py-1 text-xs font-bold text-slate-200"
                        : "rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-200"
                    }
                  >
                    {notification.read ? "Letta" : "Nuova"}
                  </span>
                </div>

                {!notification.read && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Segna come letta
                  </button>
                )}
              </article>
            ))}
          </div>
        </div>
      )}

      {activeTab === "messages" && (
        <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
          <div className="panel-card rounded-3xl p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-white">Conversazioni</h3>
              {loading && <span className="text-xs font-semibold text-cyan-300">Caricamento...</span>}
            </div>
            <div className="mt-5 space-y-2">
              {conversations.length === 0 && <EmptyState text="Nessuna conversazione. Aprila da un ticket per scrivere al cliente o al manager." />}
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => handleSelectConversation(conversation.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition hover:bg-white/[0.06] ${
                    conversation.id === selectedConversationId ? "border-cyan-300/40 bg-cyan-300/10" : "border-white/10 bg-slate-900/60"
                  }`}
                >
                  <p className="font-bold text-white">{conversation.businessName}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Ticket {conversation.ticketNumber ? `#${conversation.ticketNumber}` : "—"} ·{" "}
                    {user?.id === conversation.managerId ? conversation.customerName : conversation.managerName}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-300">{conversation.lastMessage}</p>
                  <p className="mt-2 text-xs text-slate-500">{formatDateTime(conversation.lastMessageAt)}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="panel-card rounded-3xl p-4 sm:p-5">
            {selectedConversation ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <p className="text-lg font-bold text-white">{selectedConversation.businessName}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Ticket {selectedConversation.ticketNumber ? `#${selectedConversation.ticketNumber}` : "—"} · Conversazione con{" "}
                      {user?.id === selectedConversation.managerId ? selectedConversation.customerName : selectedConversation.managerName}
                    </p>
                  </div>
                  <CheckCheck className="size-5 text-cyan-300" />
                </div>

                <div className="mt-5 max-h-[420px] space-y-3 overflow-y-auto pr-1">
                  {messages.length === 0 && <EmptyState text="Nessun messaggio. Scrivi il primo messaggio." />}
                  {messages.map((message) => {
                    const isMine = message.senderId === user?.id

                    return (
                      <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                            isMine ? "bg-cyan-400 text-slate-950" : "border border-white/10 bg-slate-900/80 text-slate-100"
                          }`}
                        >
                          <p className="text-sm font-bold">{message.senderName}</p>
                          <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{message.body}</p>
                          <p className={`mt-2 text-xs ${isMine ? "text-slate-800" : "text-slate-500"}`}>{formatDateTime(message.createdAt)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <form onSubmit={handleSendMessage} className="mt-5 flex gap-2">
                  <input
                    value={newMessage}
                    onChange={(event) => setNewMessage(event.target.value)}
                    className="form-input"
                    placeholder="Scrivi un messaggio..."
                    maxLength={1000}
                  />
                  <button
                    type="submit"
                    disabled={actionLoading || !newMessage.trim()}
                    className="inline-flex items-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Send className="size-4" />
                    Invia
                  </button>
                </form>
              </>
            ) : (
              <EmptyState text="Seleziona una conversazione." />
            )}
          </div>
        </div>
      )}
    </section>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl px-4 py-2 text-sm font-bold transition ${active ? "bg-cyan-400 text-slate-950" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
    >
      {children}
    </button>
  )
}

function NotificationBox({ title, value, description, icon }: { title: string; value: number; description: string; icon: ReactNode }) {
  return (
    <article className="panel-card rounded-3xl p-4 sm:p-5">
      <div className="mb-5 flex size-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">{icon}</div>
      <p className="font-bold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
      <p className="mt-4 text-3xl font-black text-white">{value}</p>
    </article>
  )
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">{text}</div>
}
