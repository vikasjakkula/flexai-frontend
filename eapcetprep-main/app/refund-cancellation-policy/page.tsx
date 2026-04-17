'use client'

import { Inter } from 'next/font/google'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export default function RefundCancellationPolicy() {
  return (
    <div className={`${inter.className} min-h-screen bg-white text-gray-900`}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl py-4 flex justify-between items-center">
          <Link href="/" className="text-blue-600 font-bold text-xl">
            eapcet<span className="text-gray-900">pro</span>
          </Link>
          <Link href="/" className="text-gray-600 hover:text-blue-600 text-sm md:text-base">
            Back to Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 md:px-8 max-w-4xl py-8 md:py-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-6">Refund & Cancellation Policy</h1>
        <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. General Policy</h2>
            <p className="text-gray-700 mb-4">
              At eapcetpro, we are committed to providing quality educational services. Due to the digital nature 
              of our products and services, we have a limited refund policy as outlined below.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Refund Eligibility</h2>
            <p className="text-gray-700 mb-4">
              Refunds may be considered in the following circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Technical Issues:</strong> If you are unable to access the service due to technical problems on our end that persist for more than 48 hours</li>
              <li><strong>Duplicate Payment:</strong> If you accidentally make a duplicate payment for the same subscription</li>
              <li><strong>Service Not Provided:</strong> If we fail to deliver the service you paid for</li>
              <li><strong>Within 7 Days:</strong> Refund requests made within 7 days of purchase, provided you have not used more than 10% of the service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Non-Refundable Situations</h2>
            <p className="text-gray-700 mb-4">Refunds will NOT be provided in the following cases:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Change of mind after purchase</li>
              <li>Dissatisfaction with test content or difficulty level</li>
              <li>If you have completed multiple tests or used a significant portion of the service</li>
              <li>Account suspension due to violation of terms and conditions</li>
              <li>Expired subscription period</li>
              <li>Refund requests made after 7 days of purchase</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Refund Process</h2>
            <p className="text-gray-700 mb-4">To request a refund:</p>
            <ol className="list-decimal pl-6 space-y-2 text-gray-700">
              <li>Contact our support team on WhatsApp: +91 9182607873</li>
              <li>Provide your account details and order/transaction ID</li>
              <li>Explain the reason for the refund request</li>
              <li>Our team will review your request within 3-5 business days</li>
              <li>If approved, the refund will be processed to your original payment method within 7-14 business days</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Cancellation Policy</h2>
            <h3 className="text-xl font-semibold mb-3 mt-4">Subscription Cancellation</h3>
            <p className="text-gray-700 mb-4">
              Since our service operates on a one-time payment model, there is no recurring subscription to cancel. 
              Your access continues for the duration you paid for (1 month, 3 months, 6 months, or 1 year).
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4">Account Cancellation</h3>
            <p className="text-gray-700 mb-4">
              You may request to close your account at any time by contacting support. Note that:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Closing your account will immediately revoke your access to all premium features</li>
              <li>All your data and test history will be deleted permanently</li>
              <li>No refund will be provided for the remaining subscription period</li>
              <li>Account closure is irreversible</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Refund Method</h2>
            <p className="text-gray-700 mb-4">
              Refunds will be processed to the original payment method used during purchase:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Credit/Debit card payments: Refunded to the same card (7-14 business days)</li>
              <li>UPI payments: Refunded to the same UPI ID (3-5 business days)</li>
              <li>Net banking: Refunded to the same bank account (5-10 business days)</li>
              <li>Wallet payments: Refunded to the same wallet (3-7 business days)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Processing Time</h2>
            <p className="text-gray-700 mb-4">
              Refund requests are typically processed within 3-5 business days after approval. The actual credit 
              to your account may take additional time depending on your bank or payment provider (typically 7-14 
              business days).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Contact for Refunds</h2>
            <p className="text-gray-700 mb-4">
              For any refund-related queries or requests, please contact:
            </p>
            <ul className="list-none pl-0 space-y-2 text-gray-700">
              <li>WhatsApp: +91 9182607873</li>
              <li>Subject: "Refund Request - [Your Registered Phone Number]"</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Changes to This Policy</h2>
            <p className="text-gray-700 mb-4">
              We reserve the right to modify this Refund & Cancellation Policy at any time. Any changes will be 
              effective immediately upon posting on this page. Continued use of our service after changes constitutes 
              acceptance of the modified policy.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-16">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl py-6">
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} eapcetpro. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}














