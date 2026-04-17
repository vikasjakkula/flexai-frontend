'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline'

interface SupportTicketModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SupportTicketModal({ isOpen, onClose }: SupportTicketModalProps) {
  const [formData, setFormData] = useState({
    category: '',
    subject: '',
    message: ''
  })
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const categories = [
    { value: 'technical_issue', label: 'Technical Issue' },
    { value: 'test_issue', label: 'Test Issue' },
    { value: 'feature_request', label: 'Feature Request' },
    { value: 'general_support', label: 'General Support' }
  ]

  const selectedCategoryLabel = categories.find(cat => cat.value === formData.category)?.label || 'Select a category'

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({ category: '', subject: '', message: '' })
      setErrors({})
      setSuccess(false)
      setShowCategoryDropdown(false)
    }
  }, [isOpen])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.category-dropdown')) {
        setShowCategoryDropdown(false)
      }
    }

    if (showCategoryDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCategoryDropdown])

  const handleCategorySelect = (value: string) => {
    setFormData({ ...formData, category: value })
    setShowCategoryDropdown(false)
    if (errors.category) {
      setErrors({ ...errors, category: '' })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.category) {
      newErrors.category = 'Please select a category'
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required'
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const response = await fetch('/api/support/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category: formData.category,
          subject: formData.subject.trim() || null,
          message: formData.message.trim()
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit support ticket')
      }

      setSuccess(true)
      // Reset form
      setFormData({ category: '', subject: '', message: '' })
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setSuccess(false)
        onClose()
      }, 2000)
    } catch (error) {
      setErrors({ 
        submit: error instanceof Error ? error.message : 'Failed to submit support ticket. Please try again.' 
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Submit Support Ticket</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            aria-label="Close"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="px-4 sm:px-6 py-4">
          {success ? (
            <div className="text-center py-8">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ticket Submitted Successfully!</h3>
              <p className="text-sm text-gray-600">
                We've received your support ticket and will get back to you soon.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {errors.submit}
                </div>
              )}

              <div className="category-dropdown">
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base text-left flex items-center justify-between ${
                      errors.category ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <span className={formData.category ? 'text-gray-900' : 'text-gray-500'}>
                      {selectedCategoryLabel}
                    </span>
                    <ChevronDownIcon 
                      className={`h-5 w-5 text-gray-400 transition-transform ${showCategoryDropdown ? 'transform rotate-180' : ''}`}
                    />
                  </button>
                  
                  {showCategoryDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                      {categories.map((category) => (
                        <button
                          key={category.value}
                          type="button"
                          onClick={() => handleCategorySelect(category.value)}
                          className={`w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors ${
                            formData.category === category.value ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
                          } ${category.value === categories[0].value ? 'rounded-t-md' : ''} ${
                            category.value === categories[categories.length - 1].value ? 'rounded-b-md' : ''
                          }`}
                        >
                          {category.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                )}
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Subject <span className="text-gray-500 text-xs">(Optional)</span>
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 text-gray-900 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base ${
                    errors.subject ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Brief description of your issue (optional)"
                />
                {errors.subject && (
                  <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
                )}
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 text-gray-900 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base resize-none ${
                    errors.message ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Please provide detailed information about your issue..."
                />
                {errors.message && (
                  <p className="mt-1 text-sm text-red-600">{errors.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Minimum 10 characters required
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </span>
                  ) : (
                    'Submit Ticket'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
