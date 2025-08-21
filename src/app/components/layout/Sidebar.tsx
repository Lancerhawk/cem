'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  HomeIcon, 
  BellIcon, 
  UserCircleIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { Briefcase } from 'lucide-react'

interface SidebarProps {
  user?: {
    firstName: string
    lastName: string
    email: string
  }
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Workflows', href: '/workflows', icon: Briefcase },
  { name: 'Notifications', href: '/notifications', icon: BellIcon },
]

export default function Sidebar({ user }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  const toggleMobile = () => setIsMobileOpen(!isMobileOpen)

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        router.push('/sign_in')
      } else {
        console.error('Logout failed')
        router.push('/sign_in')
      }
    } catch (error) {
      console.error('Logout error:', error)
      router.push('/sign_in')
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <>
      <div className="lg:hidden fixed top-4 left-4 z-[60]">
        <button
          onClick={toggleMobile}
          className="p-2 rounded-md bg-gray-800 text-white hover:bg-gray-700 transition-colors"
        >
          {isMobileOpen ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <Bars3Icon className="h-6 w-6" />
          )}
        </button>
      </div>

      <div className={`
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        w-64
        bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white shadow-xl
      `}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="font-bold text-lg text-white">CEM</span>
            </div>
          </div>

          <div className="p-4 border-b border-gray-700">
            <div>
              <p className="text-gray-400 text-sm">Welcome back,</p>
              <p className="text-white font-semibold text-lg">
                {user ? `${user.firstName} ${user.lastName}` : 'User'}
              </p>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }
                  `}
                  onClick={() => setIsMobileOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t border-gray-700 space-y-3">
            <Link
              href="/settings"
              className={`
                flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200
                text-gray-300 hover:bg-gray-700 hover:text-white
              `}
              onClick={() => setIsMobileOpen(false)}
            >
              <UserCircleIcon className="h-5 w-5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user ? `${user.firstName} ${user.lastName}` : 'User'}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {user?.email || 'user@example.com'}
                </p>
              </div>
            </Link>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={`
                w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200
                text-red-400 hover:bg-red-900/20 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              <ArrowLeftOnRectangleIcon className="h-5 w-5" />
              <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="hidden lg:block ml-64" />
    </>
  )
}
