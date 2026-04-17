'use client'

import { useState, useEffect } from 'react'
import { Inter } from 'next/font/google'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ClipboardDocumentIcon, 
  ClipboardDocumentCheckIcon,
  EyeIcon,
  CurrencyRupeeIcon,
  ShoppingCartIcon,
  ShareIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { Shimmer } from '@/components/Shimmer'

const inter = Inter({ subsets: ['latin'] })

interface Stats {
  totalVisits: number
  totalSales: number
  totalCommission: number
  pendingCommission: number
  paidCommission: number
  conversionRate: number
}

interface RecentSale {
  amount: number
  commission: number
  status: string
  createdAt: string
}

export default function AffiliateDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [affiliateCode, setAffiliateCode] = useState('')
  const [stats, setStats] = useState<Stats>({
    totalVisits: 0,
    totalSales: 0,
    totalCommission: 0,
    pendingCommission: 0,
    paidCommission: 0,
    conversionRate: 0
  })
  const [recentSales, setRecentSales] = useState<RecentSale[]>([])
  const [copySuccess, setCopySuccess] = useState(false)
  const [shareMenuOpen, setShareMenuOpen] = useState(false)

  useEffect(() => {
    checkAuthAndFetch()
  }, [])

  const checkAuthAndFetch = async () => {
    try {
      // Check if affiliate is authenticated
      const authResponse = await fetch('/api/affiliate/auth/check-session')
      const authData = await authResponse.json()

      if (!authData.authenticated) {
        router.push('/affiliate/auth/login')
        return
      }

      // Fetch affiliate details
      await fetchAffiliateDetails()
    } catch (error) {
      console.error('Error checking auth:', error)
      router.push('/affiliate/auth/login')
    }
  }

  const fetchAffiliateDetails = async () => {
    try {
      const response = await fetch('/api/affiliate/details')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch affiliate details')
      }

      setAffiliateCode(data.affiliateCode)
      setStats(data.stats)
      setRecentSales(data.recentSales || [])
    } catch (error) {
      console.error('Error fetching affiliate details:', error)
      setError(error instanceof Error ? error.message : 'Failed to load affiliate details')
      // If not registered as affiliate, redirect to registration
      if ((error as any)?.message?.includes('not registered')) {
        router.push('/affiliate/register')
      }
    } finally {
      setLoading(false)
    }
  }

  const getAffiliateLink = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/?ref=${affiliateCode}`
    }
    return ''
  }

  const copyToClipboard = async () => {
    const link = getAffiliateLink()
    if (!link) return
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link)
        setCopySuccess(true)
        setTimeout(() => setCopySuccess(false), 2000)
        return
      }
      // Fallback for insecure context or older browsers
      const textArea = document.createElement('textarea')
      textArea.value = link
      textArea.style.position = 'fixed'
      textArea.style.left = '-9999px'
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const shareLink = async (platform: string) => {
    const link = getAffiliateLink()
    const text = `Check out eapcetpro - The best EAPCET preparation platform! Use my link: ${link}`
    
    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    } else if (platform === 'telegram') {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent('Check out eapcetpro!')}`, '_blank')
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank')
    }
    setShareMenuOpen(false)
  }

  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (shareMenuOpen && !target.closest('.share-menu-container')) {
        setShareMenuOpen(false)
      }
    }

    if (shareMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [shareMenuOpen])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className={`min-h-screen bg-gray-50 ${inter.className}`}>
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto py-4 px-4 flex items-center justify-between">
            <Shimmer height="h-8" width="w-32" />
            <Shimmer height="h-6" width="w-48" />
          </div>
        </header>
        <main className="max-w-7xl mx-auto p-4 sm:py-8 sm:px-6">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6">
            <Shimmer height="h-6" width="w-40" className="mb-4" />
            <Shimmer height="h-12" width="w-full" rounded className="mb-2" />
            <Shimmer height="h-10" width="w-32" rounded />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                <div className="flex items-center mb-4">
                  <Shimmer height="h-12" width="w-12" rounded className="mr-4" />
                  <div className="flex-1">
                    <Shimmer height="h-4" width="w-24" className="mb-2" />
                    <Shimmer height="h-6" width="w-20" />
                  </div>
                </div>
                <Shimmer height="h-3" width="w-full" />
              </div>
            ))}
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 ${inter.className}`}>
        <div className="text-red-600 text-center">{error}</div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${inter.className}`}>
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto py-4 px-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <Link href="/" className="flex items-center">
              <span className="text-blue-600 font-bold text-2xl">eapcet<span className="text-gray-900">pro</span></span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 text-center sm:text-left">
              Affiliate Dashboard
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:py-8 sm:px-6">
        {/* Affiliate Link Section */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 border border-gray-100">
          <div className="w-full">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ShareIcon className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0" />
              Your Affiliate Link
            </h2>
            <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:space-x-3">
              <div className="flex-grow">
                <div className="relative">
                  <input
                    type="text"
                    value={getAffiliateLink()}
                    readOnly
                    className="block w-full rounded-lg border border-gray-300 py-3 px-4 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base bg-gray-50"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 sm:px-6 py-3 border border-transparent text-sm sm:text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  {copySuccess ? (
                    <>
                      <ClipboardDocumentCheckIcon className="h-5 w-5 mr-2" />
                      <span className="hidden sm:inline">Copied!</span>
                    </>
                  ) : (
                    <>
                      <ClipboardDocumentIcon className="h-5 w-5 mr-2" />
                      <span className="hidden sm:inline">Copy</span>
                      <span className="sm:hidden">Copy</span>
                    </>
                  )}
                </button>
                <div className="relative share-menu-container">
                  <button
                    type="button"
                    onClick={() => setShareMenuOpen(!shareMenuOpen)}
                    className="inline-flex items-center justify-center px-4 sm:px-6 py-3 border border-gray-300 text-sm sm:text-base font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                  >
                    <ShareIcon className="h-5 w-5" />
                  </button>
                  {shareMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                      <div className="py-1">
                        <button
                          onClick={() => shareLink('whatsapp')}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          WhatsApp
                        </button>
                        <button
                          onClick={() => shareLink('telegram')}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Telegram
                        </button>
                        <button
                          onClick={() => shareLink('twitter')}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Twitter
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-sm text-gray-700 flex items-start">
                <CurrencyRupeeIcon className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-blue-600" />
                <span>
                  <strong className="text-blue-900">Earn commission</strong> on every successful referral.
                  Commissions are paid weekly. Share your link and start earning today!
                </span>
              </p>
            </div>
          </div>
        </div>


        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
          {/* Total Visits */}
          <div className="bg-white overflow-hidden rounded-xl shadow-lg border border-gray-100">
            <div className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-lg bg-blue-100 p-3">
                  <EyeIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4 flex-1">
                  <dt className="text-sm font-medium text-gray-500">Total Visits</dt>
                  <dd className="mt-1 text-2xl font-bold text-gray-900">
                    {stats.totalVisits.toLocaleString()}
                  </dd>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 border-t border-gray-100">
              <div className="text-xs sm:text-sm text-gray-500">
                People who clicked your link
              </div>
            </div>
          </div>

          {/* Total Sales */}
          <div className="bg-white overflow-hidden rounded-xl shadow-lg border border-gray-100">
            <div className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-lg bg-green-100 p-3">
                  <ShoppingCartIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4 flex-1">
                  <dt className="text-sm font-medium text-gray-500">Total Sales</dt>
                  <dd className="mt-1 text-2xl font-bold text-gray-900">
                    {stats.totalSales.toLocaleString()}
                  </dd>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 border-t border-gray-100">
              <div className="text-xs sm:text-sm text-gray-500">
                Successful purchases
              </div>
            </div>
          </div>

          {/* Conversion Rate */}
          <div className="bg-white overflow-hidden rounded-xl shadow-lg border border-gray-100">
            <div className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-lg bg-purple-100 p-3">
                  <ChartBarIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4 flex-1">
                  <dt className="text-sm font-medium text-gray-500">Conversion Rate</dt>
                  <dd className="mt-1 text-2xl font-bold text-gray-900">
                    {stats.conversionRate.toFixed(1)}%
                  </dd>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 border-t border-gray-100">
              <div className="text-xs sm:text-sm text-gray-500">
                Visits to sales ratio
              </div>
            </div>
          </div>

          {/* Total Commission */}
          <div className="bg-white overflow-hidden rounded-xl shadow-lg border border-gray-100">
            <div className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-lg bg-yellow-100 p-3">
                  <CurrencyRupeeIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4 flex-1">
                  <dt className="text-sm font-medium text-gray-500">Total Commission</dt>
                  <dd className="mt-1 text-2xl font-bold text-gray-900">
                    ₹{stats.totalCommission.toLocaleString('en-IN', { 
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    })}
                  </dd>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 border-t border-gray-100">
              <div className="text-xs sm:text-sm text-gray-500">
                All-time earnings
              </div>
            </div>
          </div>

          {/* Pending Commission */}
          <div className="bg-white overflow-hidden rounded-xl shadow-lg border border-gray-100">
            <div className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-lg bg-orange-100 p-3">
                  <ClockIcon className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4 flex-1">
                  <dt className="text-sm font-medium text-gray-500">Pending</dt>
                  <dd className="mt-1 text-2xl font-bold text-gray-900">
                    ₹{stats.pendingCommission.toLocaleString('en-IN', { 
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    })}
                  </dd>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 border-t border-gray-100">
              <div className="text-xs sm:text-sm text-gray-500">
                Awaiting payment
              </div>
            </div>
          </div>

          {/* Paid Commission */}
          <div className="bg-white overflow-hidden rounded-xl shadow-lg border border-gray-100">
            <div className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-lg bg-green-100 p-3">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4 flex-1">
                  <dt className="text-sm font-medium text-gray-500">Paid</dt>
                  <dd className="mt-1 text-2xl font-bold text-gray-900">
                    ₹{stats.paidCommission.toLocaleString('en-IN', { 
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    })}
                  </dd>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 border-t border-gray-100">
              <div className="text-xs sm:text-sm text-gray-500">
                Already received
              </div>
            </div>
          </div>
        </div>

        {/* Recent Sales */}
        {recentSales.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ShoppingCartIcon className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0" />
              Recent Sales
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commission
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentSales.map((sale, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(sale.createdAt)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        ₹{sale.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                        ₹{sale.commission.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          sale.status === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {sale.status === 'paid' ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
} 