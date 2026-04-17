'use client'

import { useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function RefPage() {
  const params = useParams<{ code: string }>()
  const code = params.code
  const router = useRouter()
  const recorded = useRef(false)

  useEffect(() => {
    if (!code || recorded.current) return
    recorded.current = true

    const recordVisit = async () => {
      try {
        const response = await fetch('/api/affiliate/record-visit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ affiliate_code: code }),
        })

        if (!response.ok) {
          console.error('Failed to record affiliate visit')
          return
        }

        const data = await response.json()
        if (data.affiliate_id) {
          localStorage.setItem('affiliate_id', data.affiliate_id)
          localStorage.setItem('affiliate_timestamp', Date.now().toString())
        }
        router.push('/')
      } catch (error) {
        console.error('Error recording visit:', error)
        router.push('/')
      }
    }

    recordVisit()
  }, [code, router])

  return null
} 