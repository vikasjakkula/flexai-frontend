"use client"

import { useState, useEffect } from 'react'
import { XMarkIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface PwaInstallModalProps {
  isOpen: boolean
  onClose: () => void
  onInstalled: () => void
}

export function PwaInstallModal({ isOpen, onClose, onInstalled }: PwaInstallModalProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    // Check if already installed
    const checkInstalled = () => {
      if (typeof window !== 'undefined') {
        // Check if running in standalone mode (installed PWA)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
            (window.navigator as any).standalone === true ||
            window.matchMedia('(display-mode: fullscreen)').matches ||
            window.matchMedia('(display-mode: minimal-ui)').matches
        
        // Also check if launched from home screen (iOS)
        const isIOSStandalone = (window.navigator as any).standalone === true
        
        if (isStandalone || isIOSStandalone) {
          setIsInstalled(true)
          return true
        }
      }
      return false
    }

    // Check periodically if installed
    const checkInterval = setInterval(() => {
      if (checkInstalled()) {
        clearInterval(checkInterval)
        handlePwaInstalled()
      }
    }, 1000)

    if (checkInstalled()) {
      clearInterval(checkInterval)
      handlePwaInstalled()
      return
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
      handlePwaInstalled()
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.addEventListener('appinstalled', handleAppInstalled)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        window.removeEventListener('appinstalled', handleAppInstalled)
      }
      if (checkInterval) {
        clearInterval(checkInterval)
      }
    }
  }, [isOpen])

  const handlePwaInstalled = async () => {
    // This is called when user clicks "I've installed the app"
    // The onInstalled callback will handle updating Supabase
    onInstalled()
    onClose()
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show the install prompt
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        // User accepted, wait for appinstalled event
        setDeferredPrompt(null)
      } else {
        // User dismissed
        setDeferredPrompt(null)
      }
    } else {
      // Show manual installation instructions
      // This will be handled by the instructions in the modal
    }
  }

  if (!isOpen) return null

  const isIOS = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)
  const isAndroid = typeof window !== 'undefined' && /Android/.test(navigator.userAgent)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Install Web App</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="px-6 py-4">
          <div className="text-center mb-6">
            <DevicePhoneMobileIcon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Unlock Free Tests
            </h3>
            <p className="text-sm text-gray-600">
              Install our web app to access free tests and get the best experience!
            </p>
          </div>

          {deferredPrompt ? (
            <div className="space-y-4">
              <button
                onClick={handleInstallClick}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition"
              >
                Install Now
              </button>
              <p className="text-xs text-gray-500 text-center">
                Click the button above to install the app
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-3">Installation Instructions:</h4>
                
                {isIOS ? (
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                    <li>Tap the <strong>Share</strong> button at the bottom of your screen</li>
                    <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                    <li>Tap <strong>"Add"</strong> in the top right corner</li>
                    <li>Return here and refresh the page</li>
                  </ol>
                ) : isAndroid ? (
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                    <li>Tap the <strong>Menu</strong> button (three dots) in your browser</li>
                    <li>Select <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong></li>
                    <li>Tap <strong>"Add"</strong> or <strong>"Install"</strong></li>
                    <li>Return here and refresh the page</li>
                  </ol>
                ) : (
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                    <li>Look for the install icon in your browser's address bar</li>
                    <li>Click on it and select <strong>"Install"</strong></li>
                    <li>Or use the browser menu to find "Install" option</li>
                    <li>Return here and refresh the page</li>
                  </ol>
                )}
              </div>

              <button
                onClick={handlePwaInstalled}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition"
              >
                I've Installed the App
              </button>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              After installation, refresh this page to unlock free tests
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

