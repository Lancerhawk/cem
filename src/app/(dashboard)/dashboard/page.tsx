

'use client'

import { useRouter } from 'next/navigation'
import { BriefcaseIcon, ArrowRightIcon, CalendarIcon, ChartBarIcon, BellIcon } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()

  const handleGoToWorkflows = () => {
    router.push('/workflows')
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h1>
        <p className="text-gray-600">
          Welcome to your CEM Management Dashboard. Here you can manage your projects, view analytics, and stay updated with notifications.
        </p>
      </div>

      {/* Coming Soon Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm p-8 text-center">
        <div className="text-6xl mb-4">🚀</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Dashboard Features Coming Soon!</h2>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          We're working hard to bring you amazing dashboard features including project analytics, 
          performance metrics, team insights, and much more. Stay tuned for updates!
        </p>
      </div>

      {/* Workflows Button */}
      <div className="bg-white rounded-lg shadow-sm p-6 text-center">
        <button
          onClick={handleGoToWorkflows}
          className="group p-6 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-all duration-200 hover:shadow-lg hover:scale-105"
        >
          <div className="flex items-center justify-center gap-3">
            <BriefcaseIcon className="h-8 w-8" />
            <div className="text-left">
              <h3 className="font-semibold text-lg">Go to Workflows</h3>
              <p className="text-blue-100 text-sm">Manage your projects and tasks</p>
            </div>
            <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>
    </div>
  )
}
