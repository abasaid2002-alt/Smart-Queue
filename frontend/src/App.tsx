import { BrowserRouter, Navigate, Route, Routes } from "react-router"
import { ProtectedRoute } from "./components/auth/ProtectedRoute"
import { AppLayout } from "./layouts/AppLayout"
import { AnalyticsPage } from "./pages/AnalyticsPage"
import { AuthPage } from "./pages/AuthPage"
import { DashboardPage } from "./pages/DashboardPage"
import { NotificationsPage } from "./pages/NotificationsPage"
import { QueuePage } from "./pages/QueuePage"
import { SettingsPage } from "./pages/SettingsPage"
import { TicketsPage } from "./pages/TicketsPage"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/reset-password" element={<AuthPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/queue" element={<QueuePage />} />
            <Route path="/tickets" element={<TicketsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
