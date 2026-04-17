"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type SupportTicket = {
  id: string
  created_at: string
  name: string | null
  phone: string | null
  category: string
  subject: string | null
  message: string
  status: string
  priority: string | null
}

const API = {
  tickets: "/api/support-admin/tickets",
}

export default function SupportAdminPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [loginError, setLoginError] = useState("")
  const [loadingLogin, setLoadingLogin] = useState(false)

  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loadingTickets, setLoadingTickets] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "open" | "closed">("open")

  useEffect(() => {
    if (typeof window === "undefined") return
    const saved = window.localStorage.getItem("support_admin_auth")
    if (saved === "true") {
      setAuthenticated(true)
    }
  }, [])

  useEffect(() => {
    if (!authenticated) return
    fetchTickets()
  }, [authenticated])

  const fetchTickets = async () => {
    setLoadingTickets(true)
    try {
      const res = await fetch(API.tickets)
      if (!res.ok) {
        console.error("Failed to load tickets")
        return
      }
      const data = await res.json()
      setTickets(data.tickets ?? [])
    } catch (error) {
      console.error("Error loading tickets", error)
    } finally {
      setLoadingTickets(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")
    setLoadingLogin(true)
    try {
      if (password.trim() === "hello simple") {
        setAuthenticated(true)
        if (typeof window !== "undefined") {
          window.localStorage.setItem("support_admin_auth", "true")
        }
      } else {
        setLoginError("Invalid password")
      }
    } finally {
      setLoadingLogin(false)
    }
  }

  const handleLogout = () => {
    setAuthenticated(false)
    setPassword("")
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("support_admin_auth")
    }
  }

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id)
    try {
      const res = await fetch(API.tickets, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      })
      const data = await res.json()
      if (!res.ok) {
        console.error(data.error || "Failed to update ticket")
        return
      }

      setTickets((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: data.ticket.status } : t)),
      )
    } catch (error) {
      console.error("Error updating ticket", error)
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredTickets = tickets.filter((t) => {
    if (filter === "all") return true
    if (filter === "open") return t.status !== "closed"
    return t.status === "closed"
  })

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <Link href="/">
              <span className="text-blue-600 font-bold text-2xl">
                eapcet<span className="text-gray-900">pro</span>
              </span>
            </Link>
          </div>
          <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
            Support Admin
          </h2>
          <p className="mt-1 text-center text-sm text-gray-800">
            Enter the support admin password to continue
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
            <form className="space-y-6" onSubmit={handleLogin}>
              {loginError && (
                <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                  {loginError}
                </div>
              )}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-900"
                >
                  Password
                </label>
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
                disabled={loadingLogin}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loadingLogin ? "Checking..." : "Enter"}
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
        <div className="max-w-6xl mx-auto py-4 px-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <Link href="/" className="text-blue-600 font-bold text-2xl">
              eapcet<span className="text-gray-900">pro</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="ml-4 inline-flex items-center gap-1 text-sm text-gray-800 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
            <h1 className="text-lg font-semibold text-gray-900">
              Support Tickets
            </h1>
            <div className="flex items-center gap-2">
              <select
                value={filter}
                onChange={(e) =>
                  setFilter(e.target.value as "all" | "open" | "closed")
                }
                className="border border-gray-300 rounded-md px-2 py-1 text-xs text-gray-900 bg-white"
              >
                <option value="open">Open</option>
                <option value="all">All</option>
                <option value="closed">Closed</option>
              </select>
              <button
                type="button"
                onClick={fetchTickets}
                disabled={loadingTickets}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-900 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                {loadingTickets ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 sm:py-6 sm:px-4 space-y-4">
        {filteredTickets.length === 0 ? (
          <div className="bg-white rounded-xl shadow border border-gray-100 p-4 text-sm text-gray-800">
            {loadingTickets
              ? "Loading tickets..."
              : "No support tickets found for this filter."}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col gap-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {ticket.subject || "No subject"}
                      </p>
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        {ticket.category.replace("_", " ")}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border ${
                          ticket.status === "closed"
                            ? "bg-green-50 text-green-700 border-green-100"
                            : "bg-amber-50 text-amber-700 border-amber-100"
                        }`}
                      >
                        {ticket.status}
                      </span>
                      {ticket.priority && (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-gray-50 text-gray-700 border border-gray-100">
                          {ticket.priority}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-700">
                      {ticket.name || "Unknown name"}{" "}
                      {ticket.phone && (
                        <span className="text-gray-500">• {ticket.phone}</span>
                      )}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {new Date(ticket.created_at).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    {ticket.status !== "closed" ? (
                      <button
                        type="button"
                        onClick={() => updateStatus(ticket.id, "closed")}
                        disabled={updatingId === ticket.id}
                        className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                      >
                        {updatingId === ticket.id
                          ? "Closing..."
                          : "Mark as closed"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => updateStatus(ticket.id, "open")}
                        disabled={updatingId === ticket.id}
                        className="inline-flex items-center justify-center rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-800 hover:bg-gray-200 disabled:opacity-50"
                      >
                        {updatingId === ticket.id ? "Updating..." : "Reopen"}
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-900 whitespace-pre-wrap">
                  {ticket.message}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

