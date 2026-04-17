"use client"

import { useState, useEffect, useRef } from 'react'
import { Inter } from 'next/font/google'
import { useRouter, usePathname } from 'next/navigation'
import { 
  HomeIcon, 
  BookOpenIcon, 
  ChartBarIcon, 
  UserIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'
import { SupportTicketModal } from '@/components/SupportTicketModal'

const inter = Inter({ subsets: ['latin'] })

interface DashboardLayoutProps {
  children: React.ReactNode
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [screenWidth, setScreenWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 768)
  const [showDropdown, setShowDropdown] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showSupportModal, setShowSupportModal] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Check if app is already installed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if running in standalone mode (installed PWA)
      if (window.matchMedia('(display-mode: standalone)').matches || 
          (window.navigator as any).standalone === true) {
        setIsInstalled(true)
      }

      // Listen for beforeinstallprompt event
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault()
        setDeferredPrompt(e as BeforeInstallPromptEvent)
      }

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

      // Listen for app installed event
      window.addEventListener('appinstalled', () => {
        setIsInstalled(true)
        setDeferredPrompt(null)
      })

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      }
    }
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback instructions for browsers that don't support beforeinstallprompt
      alert('To install this app:\n\n' +
        'Chrome/Edge: Click the menu (⋮) and select "Add to Home Screen"\n' +
        'Safari (iOS): Tap Share button and select "Add to Home Screen"\n' +
        'Firefox: Click the menu and select "Install"')
      setShowDropdown(false)
      return
    }

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user to respond
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setIsInstalled(true)
    }

    setDeferredPrompt(null)
    setShowDropdown(false)
  }

  const isMobile = screenWidth < 768
  const isActive = (path: string) => pathname === path

  return (
    <div className={`${inter.className} min-h-screen bg-gray-50 text-gray-900 w-full overflow-x-hidden`}>
      <header className="bg-white border-b border-gray-200 fixed top-0 w-full z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center max-w-full">
          <div className="flex items-center">
            <span className="text-blue-600 font-bold text-xl">eapcet<span className="text-gray-900">pro</span></span>
          </div>
          {!isMobile && (
            <nav className="flex items-center gap-6">
              <button 
                onClick={() => router.push('/dashboard')}
                className={`flex items-center gap-1 px-3 py-2 rounded-md transition ${
                  isActive('/dashboard') 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-900 hover:text-blue-600'
                }`}
              >
                <HomeIcon className="h-5 w-5" />
                <span>Home</span>
              </button>
              <button 
                onClick={() => router.push('/dashboard/tests')}
                className={`flex items-center gap-1 px-3 py-2 rounded-md transition ${
                  isActive('/dashboard/tests') 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-900 hover:text-blue-600'
                }`}
              >
                <BookOpenIcon className="h-5 w-5" />
                <span>Test Series</span>
              </button>
              <button 
                onClick={() => router.push('/dashboard/performance')}
                className={`flex items-center gap-1 px-3 py-2 rounded-md transition ${
                  isActive('/dashboard/performance') 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-900 hover:text-blue-600'
                }`}
              >
                <ChartBarIcon className="h-5 w-5" />
                <span>Performance</span>
              </button>
              <button 
                onClick={() => router.push('/dashboard/profile')}
                className={`flex items-center gap-1 px-3 py-2 rounded-md transition ${
                  isActive('/dashboard/profile') 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-900 hover:text-blue-600'
                }`}
              >
                <UserIcon className="h-5 w-5" />
                <span>Profile</span>
              </button>
            </nav>
          )}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowSupportModal(true)}
              className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
              aria-label="Support"
            >
              <ChatBubbleLeftRightIcon className="h-5 w-5" />
              <span className="text-sm font-medium">Support</span>
            </button>
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors relative"
                aria-label="Notifications"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              
              {showDropdown && (
                <div className={`absolute ${isMobile ? 'right-0' : 'right-0'} mt-2 w-56 sm:w-64 rounded-lg shadow-lg bg-white z-50`}>
                  <div className="py-1">
                    {!isInstalled ? (
                      <button
                        onClick={handleInstallClick}
                        className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span>Install as App</span>
                      </button>
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>App Installed</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-16 pb-20 w-full overflow-x-hidden">
        {children}
      </main>
      
      {/* Mobile navigation bar at bottom */}
      {isMobile && (
        <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 z-10">
          <div className="flex justify-around">
            <button 
              onClick={() => router.push('/dashboard')}
              className={`flex flex-col items-center py-2 px-4 transition ${
                isActive('/dashboard') ? 'text-blue-600' : 'text-gray-900'
              }`}
            >
              <HomeIcon className="h-6 w-6" />
              <span className="text-xs mt-1">Home</span>
            </button>
            <button 
              onClick={() => router.push('/dashboard/tests')}
              className={`flex flex-col items-center py-2 px-4 transition ${
                isActive('/dashboard/tests') ? 'text-blue-600' : 'text-gray-900'
              }`}
            >
              <BookOpenIcon className="h-6 w-6" />
              <span className="text-xs mt-1">Tests</span>
            </button>
            <button 
              onClick={() => router.push('/dashboard/performance')}
              className={`flex flex-col items-center py-2 px-4 transition ${
                isActive('/dashboard/performance') ? 'text-blue-600' : 'text-gray-900'
              }`}
            >
              <ChartBarIcon className="h-6 w-6" />
              <span className="text-xs mt-1">Performance</span>
            </button>
            <button 
              onClick={() => router.push('/dashboard/profile')}
              className={`flex flex-col items-center py-2 px-4 transition ${
                isActive('/dashboard/profile') ? 'text-blue-600' : 'text-gray-900'
              }`}
            >
              <UserIcon className="h-6 w-6" />
              <span className="text-xs mt-1">Profile</span>
            </button>
          </div>
        </nav>
      )}

      {/* Support Ticket Modal */}
      <SupportTicketModal 
        isOpen={showSupportModal} 
        onClose={() => setShowSupportModal(false)} 
      />
    </div>
  )
}

