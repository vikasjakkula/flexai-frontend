'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  CurrencyRupeeIcon,
  UserGroupIcon,
  ShoppingCartIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowRightOnRectangleIcon,
  ArrowPathIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline'

const API = {
  verify: '/api/affiliate-admin/verify',
  login: '/api/affiliate-admin/login',
  sales: '/api/affiliate-admin/sales',
  affiliates: '/api/affiliate-admin/affiliates',
  unattributed: '/api/affiliate-admin/unattributed',
  attribute: '/api/affiliate-admin/attribute',
  affiliateStatus: (id: string) => `/api/affiliate-admin/affiliates/${id}`,
  saleStatus: (id: string) => `/api/affiliate-admin/sales/${id}`
}

type Sale = {
  id: string
  affiliate_id: string
  order_id: string
  amount: number
  commission_amount: number
  status: 'pending' | 'paid'
  created_at: string
  affiliates?: { affiliate_code: string } | null
}

type Affiliate = {
  id: string
  affiliate_code: string
  coupon_code?: string | null
  payment_method: string
  payment_details: Record<string, unknown>
  status: 'pending' | 'active' | 'suspended'
  commission_rate_first: number
  commission_rate_second: number
  pending_amount: number
  paid_amount: number
  created_at: string
  affiliate_users?: { name?: string; phone?: string; email?: string } | null
}

type UnattributedOrder = {
  id: string
  user_id: string
  amount: number
  created_at: string
  razorpay_order_id?: string
}

export default function AffiliateAdminPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loading, setLoading] = useState(false)

  const [sales, setSales] = useState<Sale[]>([])
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [unattributed, setUnattributed] = useState<UnattributedOrder[]>([])
  const [dataLoading, setDataLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [attributeOrderId, setAttributeOrderId] = useState('')
  const [attributeAffiliateId, setAttributeAffiliateId] = useState('')
  const [attributing, setAttributing] = useState(false)

  const checkAuth = useCallback(async () => {
    const res = await fetch(API.verify)
    if (res.ok) {
      const data = await res.json()
      setAuthenticated(data.authenticated === true)
    } else {
      setAuthenticated(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    setLoading(true)
    try {
      const res = await fetch(API.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })
      const data = await res.json()
      if (!res.ok) {
        setLoginError(data.error || 'Invalid password')
        return
      }
      setAuthenticated(true)
    } catch {
      setLoginError('Request failed')
    } finally {
      setLoading(false)
    }
  }

  const fetchData = useCallback(async () => {
    setDataLoading(true)
    try {
      const [salesRes, affiliatesRes, unattributedRes] = await Promise.all([
        fetch(API.sales),
        fetch(API.affiliates),
        fetch(API.unattributed)
      ])
      if (salesRes.ok) {
        const d = await salesRes.json()
        setSales(d.sales ?? [])
      }
      if (affiliatesRes.ok) {
        const d = await affiliatesRes.json()
        setAffiliates(d.affiliates ?? [])
      }
      if (unattributedRes.ok) {
        const d = await unattributedRes.json()
        setUnattributed(d.orders ?? [])
      }
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: 'Failed to load data' })
    } finally {
      setDataLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authenticated) fetchData()
  }, [authenticated, fetchData])

  const updateAffiliateStatus = async (id: string, status: 'pending' | 'active' | 'suspended') => {
    try {
      const res = await fetch(API.affiliateStatus(id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (!res.ok) {
        const d = await res.json()
        setMessage({ type: 'error', text: d.error || 'Update failed' })
        return
      }
      setMessage({ type: 'success', text: 'Status updated' })
      fetchData()
    } catch {
      setMessage({ type: 'error', text: 'Request failed' })
    }
  }

  const updateSaleStatus = async (saleId: string, status: 'pending' | 'paid') => {
    try {
      const res = await fetch(API.saleStatus(saleId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (!res.ok) {
        const d = await res.json()
        setMessage({ type: 'error', text: d.error || 'Update failed' })
        return
      }
      setMessage({ type: 'success', text: 'Commission status updated' })
      fetchData()
    } catch {
      setMessage({ type: 'error', text: 'Request failed' })
    }
  }

  const handleAttribute = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!attributeOrderId || !attributeAffiliateId) {
      setMessage({ type: 'error', text: 'Select an order and an affiliate' })
      return
    }
    setAttributing(true)
    setMessage(null)
    try {
      const res = await fetch(API.attribute, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: attributeOrderId, affiliateId: attributeAffiliateId })
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Attribute failed' })
        return
      }
      setMessage({ type: 'success', text: `Attributed. Commission: ₹${data.commission_amount ?? 0}` })
      setAttributeOrderId('')
      setAttributeAffiliateId('')
      fetchData()
    } catch {
      setMessage({ type: 'error', text: 'Request failed' })
    } finally {
      setAttributing(false)
    }
  }

  const logout = () => {
    document.cookie = 'affiliate_admin=; path=/; max-age=0'
    setAuthenticated(false)
  }

  const formatDate = (s: string) => new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  const formatMoney = (n: number) => `₹${n}`

  if (authenticated === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-800">Loading...</div>
      </div>
    )
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <Link href="/"><span className="text-blue-600 font-bold text-2xl">eapcet<span className="text-gray-900">pro</span></span></Link>
          </div>
          <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">Affiliate Admin</h2>
          <p className="mt-1 text-center text-sm text-gray-800">Enter password to continue</p>
        </div>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
            <form className="space-y-6" onSubmit={handleLogin}>
              {loginError && (
                <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{loginError}</div>
              )}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-900">Password</label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                    placeholder="Password"
                    autoFocus
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Checking...' : 'Enter'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto py-4 px-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <Link href="/" className="text-blue-600 font-bold text-2xl">eapcet<span className="text-gray-900">pro</span></Link>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1 text-sm text-gray-800 hover:text-gray-900"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" /> Logout
            </button>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Affiliate Admin</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:py-6 sm:px-6 space-y-6">
        {message && (
          <div className={`rounded-lg border px-4 py-3 text-sm ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            {message.text}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => fetchData()}
            disabled={dataLoading}
            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-900 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 ${dataLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {/* Unattributed sales – attribute to affiliate */}
        <section className="bg-white rounded-xl shadow border border-gray-100 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <ExclamationCircleIcon className="h-5 w-5 text-amber-500" />
            Unattributed sales ({unattributed.length})
          </h2>
          {unattributed.length === 0 ? (
            <p className="text-sm text-gray-800">No completed orders without an affiliate.</p>
          ) : (
            <>
              <form onSubmit={handleAttribute} className="flex flex-wrap items-end gap-3 mb-4">
                <div className="flex-1 min-w-[180px]">
                  <label className="block text-xs font-medium text-gray-800 mb-1">Order</label>
                  <select
                    value={attributeOrderId}
                    onChange={(e) => setAttributeOrderId(e.target.value)}
                    className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm text-gray-900"
                  >
                    <option value="">Select order</option>
                    {unattributed.map((o) => (
                      <option key={o.id} value={o.id}>
                        {formatMoney(o.amount)} – {formatDate(o.created_at)} ({o.id.slice(0, 8)})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 min-w-[180px]">
                  <label className="block text-xs font-medium text-gray-800 mb-1">Attribute to affiliate</label>
                  <select
                    value={attributeAffiliateId}
                    onChange={(e) => setAttributeAffiliateId(e.target.value)}
                    className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm text-gray-900"
                  >
                    <option value="">Select affiliate</option>
                    {affiliates.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.affiliate_code} {a.affiliate_users?.name ? `– ${a.affiliate_users.name}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={attributing || !attributeOrderId || !attributeAffiliateId}
                  className="py-2 px-4 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {attributing ? 'Attributing...' : 'Attribute'}
                </button>
              </form>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm text-gray-900">
                  <thead><tr className="text-left text-gray-800"><th className="py-2 pr-4">Order ID</th><th className="py-2 pr-4">Amount</th><th className="py-2">Date</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {unattributed.map((o) => (
                      <tr key={o.id}><td className="py-2 pr-4 font-mono text-xs">{o.id.slice(0, 8)}…</td><td className="py-2 pr-4">{formatMoney(o.amount)}</td><td className="py-2">{formatDate(o.created_at)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        {/* All sales */}
        <section className="bg-white rounded-xl shadow border border-gray-100 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <ShoppingCartIcon className="h-5 w-5 text-blue-600" />
            All sales ({sales.length})
          </h2>
          {dataLoading && sales.length === 0 ? (
            <p className="text-sm text-gray-800">Loading...</p>
          ) : sales.length === 0 ? (
            <p className="text-sm text-gray-800">No sales yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm text-gray-900">
                <thead>
                  <tr className="text-left text-gray-800">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Affiliate</th>
                    <th className="py-2 pr-4">Amount</th>
                    <th className="py-2 pr-4">Commission</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sales.map((s) => (
                    <tr key={s.id}>
                      <td className="py-2 pr-4">{formatDate(s.created_at)}</td>
                      <td className="py-2 pr-4">{(s.affiliates as { affiliate_code?: string } | null)?.affiliate_code ?? s.affiliate_id.slice(0, 8)}</td>
                      <td className="py-2 pr-4">{formatMoney(s.amount)}</td>
                      <td className="py-2 pr-4">{formatMoney(s.commission_amount)}</td>
                      <td className="py-2 pr-4">
                        <span className={s.status === 'paid' ? 'text-green-600' : 'text-amber-600'}>{s.status}</span>
                      </td>
                      <td className="py-2">
                        {s.status === 'pending' ? (
                          <button type="button" onClick={() => updateSaleStatus(s.id, 'paid')} className="text-blue-600 hover:underline text-xs">Mark paid</button>
                        ) : (
                          <button type="button" onClick={() => updateSaleStatus(s.id, 'pending')} className="text-gray-700 hover:underline text-xs">Mark pending</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Affiliates & payouts */}
        <section className="bg-white rounded-xl shadow border border-gray-100 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <UserGroupIcon className="h-5 w-5 text-blue-600" />
            Affiliates & payouts ({affiliates.length})
          </h2>
          {dataLoading && affiliates.length === 0 ? (
            <p className="text-sm text-gray-800">Loading...</p>
          ) : affiliates.length === 0 ? (
            <p className="text-sm text-gray-800">No affiliates yet.</p>
          ) : (
            <div className="overflow-x-auto space-y-4">
              {affiliates.map((a) => (
                <div key={a.id} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div>
                      <span className="font-medium text-gray-900">{a.affiliate_code}</span>
                      {a.affiliate_users?.name && <span className="text-gray-700 ml-2">– {a.affiliate_users.name}</span>}
                      {a.affiliate_users?.phone && <span className="text-gray-600 text-xs ml-2">{a.affiliate_users.phone}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        a.status === 'active' ? 'bg-green-100 text-green-800' :
                        a.status === 'suspended' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {a.status}
                      </span>
                      <select
                        value={a.status}
                        onChange={(e) => updateAffiliateStatus(a.id, e.target.value as 'pending' | 'active' | 'suspended')}
                        className="text-xs border border-gray-300 rounded py-1 px-2 text-gray-900"
                      >
                        <option value="pending">pending</option>
                        <option value="active">active</option>
                        <option value="suspended">suspended</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span className="flex items-center gap-1 text-amber-600">
                      <ClockIcon className="h-4 w-4" /> Pending: {formatMoney(a.pending_amount)}
                    </span>
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircleIcon className="h-4 w-4" /> Paid: {formatMoney(a.paid_amount)}
                    </span>
                    <span className="text-gray-700">Rates: {a.commission_rate_first}% / {a.commission_rate_second}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
