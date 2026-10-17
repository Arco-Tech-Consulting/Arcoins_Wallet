import { Navigate, Route, Routes } from 'react-router-dom'
import AuthLayout from '@/layouts/AuthLayout'
import AppLayout from '@/layouts/AppLayout'
import ProtectedRoute from '@/router/ProtectedRoute'
import LoginPage from '@/features/auth/LoginPage'
import RegisterPage from '@/features/auth/RegisterPage'
import DashboardPage from '@/features/dashboard/DashboardPage'
import OperationsPage from '@/features/transactions/OperationsPage'
import HistoryPage from '@/features/transactions/HistoryPage'
import DepositPage from '@/features/deposit/DepositPage'
import PaymentsPage from '@/features/payments/PaymentsPage'
import ChatPage from '@/features/chat/ChatPage'
import BudgetPage from '@/features/budget/BudgetPage'

export default function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/operations" element={<OperationsPage />} />
        <Route path="/deposit" element={<DepositPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/budget" element={<BudgetPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}