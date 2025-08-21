import Sidebar from '../components/layout/Sidebar'
import { getCurrentUser } from '../lib/actions/auth_action'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  
  // Fallback user data if no user is found
  const userData = user ? {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email
  } : {
    firstName: 'Guest',
    lastName: 'User',
    email: 'guest@example.com'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar user={userData} />
      <main className="lg:ml-64 transition-all duration-300 ease-in-out">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}