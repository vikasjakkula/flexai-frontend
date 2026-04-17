/**
 * PWA Detection Utilities
 * Detects PWA installation status directly from the device/browser
 * This is more reliable than database checks since it reflects actual device state
 */

/**
 * Check if PWA is installed by detecting standalone display mode
 * Uses the same logic as DashboardLayout notification icon
 * This works across all platforms (iOS, Android, Desktop)
 */
export function isPwaInstalled(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  // Use exact same logic as DashboardLayout notification icon
  // Check if running in standalone mode (installed PWA)
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true
}

/**
 * Hook to detect PWA installation status with real-time updates
 * Returns current installation status and a function to check again
 */
export function usePwaDetection() {
  if (typeof window === 'undefined') {
    return { isInstalled: false, checkInstalled: () => false }
  }

  return {
    isInstalled: isPwaInstalled(),
    checkInstalled: isPwaInstalled
  }
}

/**
 * Update Supabase with PWA installation status (for tracking purposes)
 * This is separate from detection - we detect from device, track in database
 */
export async function updatePwaInstalledStatus(installed: boolean): Promise<boolean> {
  try {
    const response = await fetch('/api/user/update-pwa-installed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pwa_installed: installed }),
    })

    return response.ok
  } catch (error) {
    console.error('Error updating PWA installation status:', error)
    return false
  }
}

