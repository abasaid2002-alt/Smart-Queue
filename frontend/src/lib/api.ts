import axios from "axios"
import { getAuthToken, logout } from "./auth"

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001"

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

api.interceptors.request.use((config) => {
  const token = getAuthToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      logout()
    }

    return Promise.reject(error)
  },
)

export type UserRole = "MANAGER" | "CLIENT"

export type QueueStatus = "OPEN" | "CLOSED"

export type TicketStatus = "WAITING" | "SERVING" | "SERVED" | "CANCELLED" | "NO_SHOW"

export type NotificationType =
  | "TURN_NEAR"
  | "TURN_CALLED"
  | "TICKET_CANCELLED"
  | "TICKET_POSTPONED"
  | "QUEUE_CLOSED"
  | "QUEUE_REOPENED"
  | "QUEUE_RESET"
  | "MESSAGE_RECEIVED"
  | "BUSINESS_UPDATED"

export type LoginResponse = {
  token: string
  userId: number
  name: string
  surname: string
  email: string
  role: UserRole
}

export type UserResponse = {
  id: number
  name: string
  surname: string
  email: string
  role: UserRole
  emailVerified: boolean
}

export type MessageResponse = {
  message: string
}

export type RegisterRequest = {
  name: string
  surname: string
  email: string
  password: string
  role: UserRole
  businessName?: string
  businessDescription?: string
  businessAddress?: string
  businessCity?: string
  businessCategory?: string
}

export type LoginRequest = {
  email: string
  password: string
}

export type BusinessRequest = {
  name: string
  description: string
  address: string
  city: string
  category: string
  openingTime: string
  closingTime: string
}

export type BusinessResponse = {
  id: number
  name: string
  description: string
  address: string
  city: string
  category: string
  openingTime: string | null
  closingTime: string | null
  ownerId: number
  ownerName: string
  active: boolean
}

export type QueueResponse = {
  id: number
  status: QueueStatus
  currentNumber: number
  lastNumber: number
  businessId: number
  businessName: string
  manuallyPaused: boolean
  openingTime: string | null
  closingTime: string | null
  businessDay: string | null
  nextOpeningAt: string | null
  availabilityMessage: string | null
  createdAt?: string | null
}

export type TicketResponse = {
  id: number
  ticketNumber: number
  status: TicketStatus
  peopleBefore: number
  createdAt: string
  calledAt: string | null
  startedAt?: string | null
  completedAt: string | null
  queueId: number
  businessId: number
  businessName: string
  userId: number
  userName: string
  currentNumber: number
  smartDelayUsed: boolean
  smartDelayAt: string | null
  sortOrder: number
  canCancel: boolean
  canSmartDelay: boolean
  canDelay?: boolean
  canUndoFinalization: boolean
}

export type WaitingInfoResponse = {
  ticketId: number
  ticketNumber: number
  status: TicketStatus
  position?: number
  peopleBefore: number
  queueStatus?: QueueStatus
  currentNumber?: number
  averageServiceMinutes?: number
  estimatedWaitingMinutes?: number
}

export type NotificationResponse = {
  id: number
  message: string
  type: NotificationType
  read: boolean
  createdAt: string
  ticketId: number | null
  ticketNumber: number | null
  businessName: string | null
}

export type ConversationResponse = {
  id: number
  businessId: number
  businessName: string
  ticketId: number | null
  ticketNumber: number | null
  customerId: number
  customerName: string
  managerId: number
  managerName: string
  lastMessage: string
  lastMessageAt: string
}

export type ConversationMessageResponse = {
  id: number
  conversationId: number
  senderId: number
  senderName: string
  body: string
  createdAt: string
}

export type ManagerAnalyticsResponse = {
  queueId: number
  businessName: string
  currentNumber: number
  lastNumber: number
  waitingTickets: number
  servingTickets: number
  completedToday: number
  cancelledToday: number
  noShowToday: number
  averageWaitingMinutes: number
  averageServiceMinutes: number
  smartDelayUsedToday: number
}

export type DashboardResponse = {
  businesses: number
  openQueues: number
  activeTickets: number
  unreadNotifications: number
  averagePeopleBefore: number
}

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data

    if (typeof responseData === "string") {
      return responseData
    }

    if (typeof responseData?.message === "string") {
      return responseData.message
    }

    if (typeof responseData?.error === "string") {
      return responseData.error
    }
  }

  return "Si è verificato un errore. Riprova."
}

export async function registerUser(body: RegisterRequest) {
  const response = await api.post<UserResponse>("/auth/register", body)
  return response.data
}

export async function loginUser(body: LoginRequest) {
  const response = await api.post<LoginResponse>("/auth/login", body)
  return response.data
}

export async function verifyEmail(input: string | { token: string }) {
  const token = typeof input === "string" ? input : input.token
  const response = await api.get<MessageResponse>("/auth/verify-email", {
    params: { token },
  })

  return response.data
}

export async function forgotPassword(input: string | { email: string }) {
  const email = typeof input === "string" ? input : input.email
  const response = await api.post<MessageResponse>("/auth/forgot-password", { email })
  return response.data
}

type ResetPasswordInput = {
  token: string
  newPassword?: string
  password?: string
}

export async function resetPassword(input: ResetPasswordInput): Promise<MessageResponse>
export async function resetPassword(token: string, password: string): Promise<MessageResponse>
export async function resetPassword(input: string | ResetPasswordInput, password?: string) {
  const body =
    typeof input === "string" ? { token: input, newPassword: password ?? "" } : { token: input.token, newPassword: input.newPassword ?? input.password ?? "" }

  const response = await api.post<MessageResponse>("/auth/reset-password", body)
  return response.data
}

export async function getBusinesses() {
  const response = await api.get<BusinessResponse[]>("/businesses")
  return response.data
}

export async function getMyBusinesses() {
  const response = await api.get<BusinessResponse[]>("/businesses/my")
  return response.data
}

export async function getBusinessById(businessId: number) {
  const response = await api.get<BusinessResponse>(`/businesses/${businessId}`)
  return response.data
}

export async function createBusiness(body: BusinessRequest) {
  const response = await api.post<BusinessResponse>("/businesses", body)
  return response.data
}

export async function updateBusiness(businessId: number, body: BusinessRequest) {
  const response = await api.put<BusinessResponse>(`/businesses/${businessId}`, body)
  return response.data
}

export async function deleteBusiness(businessId: number) {
  await api.delete(`/businesses/${businessId}`)
}

export async function createQueue(businessId: number) {
  const response = await api.post<QueueResponse>(`/businesses/${businessId}/queue`)
  return response.data
}

export async function getQueueByBusiness(businessId: number) {
  const response = await api.get<QueueResponse>(`/businesses/${businessId}/queue`)
  return response.data
}

export async function getQueueById(queueId: number) {
  const response = await api.get<QueueResponse>(`/queues/${queueId}`)
  return response.data
}

export async function openQueue(queueId: number) {
  const response = await api.patch<QueueResponse>(`/queues/${queueId}/open`)
  return response.data
}

export async function closeQueue(queueId: number) {
  const response = await api.patch<QueueResponse>(`/queues/${queueId}/close`)
  return response.data
}

export async function nextTicket(queueId: number) {
  const response = await api.patch<TicketResponse>(`/queues/${queueId}/next`)
  return response.data
}

export async function undoNext(queueId: number) {
  const response = await api.patch<TicketResponse>(`/queues/${queueId}/undo-next`)
  return response.data
}

export async function resetQueue(queueId: number) {
  const response = await api.patch<QueueResponse>(`/queues/${queueId}/reset`)
  return response.data
}

export async function getQueueTickets(queueId: number) {
  const response = await api.get<TicketResponse[]>(`/queues/${queueId}/tickets`)
  return response.data
}

export async function createTicket(queueId: number) {
  const response = await api.post<TicketResponse>(`/queues/${queueId}/tickets`)
  return response.data
}

export async function getMyTickets() {
  const response = await api.get<TicketResponse[]>("/tickets/my")
  return response.data
}

export async function getTicketById(ticketId: number) {
  const response = await api.get<TicketResponse>(`/tickets/${ticketId}`)
  return response.data
}

export async function getTicketWaitingInfo(ticketId: number) {
  const response = await api.get<WaitingInfoResponse>(`/tickets/${ticketId}/waiting-info`)
  return response.data
}

export const getWaitingInfo = getTicketWaitingInfo

export async function completeTicket(ticketId: number) {
  const response = await api.patch<TicketResponse>(`/tickets/${ticketId}/complete`)
  return response.data
}

export async function markNoShow(ticketId: number) {
  const response = await api.patch<TicketResponse>(`/tickets/${ticketId}/no-show`)
  return response.data
}

export async function undoCompleteTicket(ticketId: number) {
  const response = await api.patch<TicketResponse>(`/tickets/${ticketId}/undo-complete`)
  return response.data
}

export async function cancelTicket(ticketId: number) {
  const response = await api.patch<TicketResponse>(`/tickets/${ticketId}/cancel`)
  return response.data
}

export async function smartDelayTicket(ticketId: number, positions = 3) {
  const response = await api.patch<TicketResponse>(`/tickets/${ticketId}/smart-delay`, null, {
    params: { positions },
  })

  return response.data
}

export function smartDelay(ticketId: number, positions = 3) {
  return smartDelayTicket(ticketId, positions)
}

export async function delayTicket(ticketId: number) {
  return smartDelayTicket(ticketId)
}

export async function getNotifications() {
  const response = await api.get<NotificationResponse[]>("/notifications/my")
  return response.data
}

export async function getUnreadNotifications() {
  const response = await api.get<NotificationResponse[]>("/notifications/my/unread")
  return response.data
}

export async function markNotificationAsRead(notificationId: number) {
  const response = await api.patch<NotificationResponse>(`/notifications/${notificationId}/read`)
  return response.data
}

export async function getConversations() {
  const response = await api.get<ConversationResponse[]>("/conversations/my")
  return response.data
}

export async function getOrCreateConversation(ticketId: number) {
  const response = await api.post<ConversationResponse>(`/tickets/${ticketId}/conversation`)
  return response.data
}

export async function getConversationMessages(conversationId: number) {
  const response = await api.get<ConversationMessageResponse[]>(`/conversations/${conversationId}/messages`)
  return response.data
}

export async function sendConversationMessage(conversationId: number, body: string) {
  const response = await api.post<ConversationMessageResponse>(`/conversations/${conversationId}/messages`, {
    body,
  })

  return response.data
}

export async function getQueueAnalytics(queueId: number) {
  const response = await api.get<ManagerAnalyticsResponse>(`/queues/${queueId}/analytics`)
  return response.data
}

export async function getDashboard() {
  const response = await api.get<DashboardResponse>("/dashboard")
  return response.data
}
