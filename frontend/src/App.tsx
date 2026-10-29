import { Navigate, Route, Routes } from 'react-router-dom'
import AuthLayout from '@/layouts/AuthLayout'
import AppLayout from '@/layouts/AppLayout'
import ProtectedRoute from '@/router/ProtectedRoute'
import LandingPage from '@/features/landing/LandingPage'
import LoginPage from '@/features/auth/LoginPage'
import RegisterPage from '@/features/auth/RegisterPage'
import DashboardPage from '@/features/dashboard/DashboardPage'
import OperationsPage from '@/features/transactions/OperationsPage'
import HistoryPage from '@/features/transactions/HistoryPage'
import DepositPage from '@/features/deposit/DepositPage'
import PaymentsPage from '@/features/payments/PaymentsPage'
import BudgetPage from '@/features/budget/BudgetPage'
import TransferPage from '@/features/transfers/TransferPage'
import NotFoundPage from '@/features/not-found/NotFoundPage'

export default function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route path="/" element={<LandingPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/operations" element={<OperationsPage />} />
        <Route path="/deposit" element={<DepositPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/transfers" element={<TransferPage />} />
        <Route path="/history" element={<HistoryPage />} />
        {/* El asistente vive flotando en AppLayout; la URL antigua redirige */}
        <Route path="/chat" element={<Navigate to="/dashboard" replace />} />
        <Route path="/budget" element={<BudgetPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
