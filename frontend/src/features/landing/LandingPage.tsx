import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Hero } from './Hero'
import { LandingFooter } from './LandingFooter'
import { LandingNav } from './LandingNav'
import {
  AssistantSection,
  CurrencyStrip,
  Features,
  FinalCta,
  HowItWorks,
  Security,
} from './sections'

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth()

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="flex min-h-svh flex-col bg-surface">
      <LandingNav />
      <main className="flex-1">
        <Hero />
        <CurrencyStrip />
        <HowItWorks />
        <Features />
        <AssistantSection />
        <Security />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  )
}
