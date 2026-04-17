"use client"

import { ReactNode, useState } from 'react'
import { Headset, Home, BookOpen, FileText, BarChart3 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { SupportTicketModal } from '@/components/SupportTicketModal'

interface NewDashboardShellProps {
  children: ReactNode
  userName?: string
}

export function NewDashboardShell({ children, userName }: NewDashboardShellProps) {
  const router = useRouter()
  const [showSupportModal, setShowSupportModal] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center font-sans">
      <div className="w-full max-w-md bg-white min-h-screen shadow-xl relative pb-24 overflow-x-hidden">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-gray-100 bg-white sticky top-0 z-20">
          <div className="font-bold text-xl text-indigo-600 tracking-tight">eapcetpro</div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSupportModal(true)}
              className="flex items-center gap-1.5 text-sm font-bold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Headset className="w-4 h-4" />
              Support
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center border border-indigo-100 hover:bg-indigo-100 transition-colors"
            >
              {userName?.charAt(0)?.toUpperCase() || 'U'}
            </button>
          </div>
        </header>

        {/* Content */}
        {children}

        {/* Bottom Navigation */}
        <nav
          className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-200 px-6 py-2 flex justify-between items-center z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"
          style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
        >
          {[
            { icon: Home, label: 'Home' },
            { icon: BookOpen, label: 'Chapter wise' },
            { icon: FileText, label: 'Mock tests' },
            { icon: BarChart3, label: 'Performance' },
          ].map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.label}
                onClick={() => router.push('/dashboard')}
                className="flex flex-col items-center gap-1 min-w-[64px] py-2 text-gray-400 hover:text-gray-600"
              >
                <div className="p-1.5 rounded-lg">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-semibold">{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      <SupportTicketModal
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
      />
    </div>
  )
}
