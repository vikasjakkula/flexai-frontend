'use client'

import { Inter } from 'next/font/google'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export default function TermsAndConditions() {
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
        <h1 className="text-3xl md:text-4xl font-bold mb-6">Terms and Conditions</h1>
        <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 mb-4">
              By accessing and using eapcetpro, you accept and agree to be bound by the terms and provision of this agreement. 
              If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Service Description</h2>
            <p className="text-gray-700 mb-4">
              eapcetpro provides an online platform for EAMCET test preparation, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Access to previous year question papers</li>
              <li>Mock test series</li>
              <li>Performance analytics and tracking</li>
              <li>Subject-wise practice tests</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            <p className="text-gray-700 mb-4">
              To access premium features, you must create an account. You agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Subscription and Payment</h2>
            <p className="text-gray-700 mb-4">
              Our service requires a one-time payment to access premium features. By making a payment, you agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Pay the specified amount for your chosen subscription plan</li>
              <li>Provide accurate payment information</li>
              <li>Understand that payments are processed through Razorpay</li>
              <li>Accept that all fees are non-refundable except as specified in our refund policy</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Use of Service</h2>
            <p className="text-gray-700 mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Share your account credentials with others</li>
              <li>Attempt to hack, reverse engineer, or compromise the platform</li>
              <li>Use automated scripts or bots to access the service</li>
              <li>Copy, redistribute, or sell content from our platform</li>
              <li>Use the service for any illegal or unauthorized purpose</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property</h2>
            <p className="text-gray-700 mb-4">
              All content, features, and functionality on eapcetpro, including but not limited to text, graphics, logos, 
              questions, and software, are the exclusive property of eapcetpro and are protected by copyright, trademark, 
              and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Limitation of Liability</h2>
            <p className="text-gray-700 mb-4">
              eapcetpro shall not be liable for any indirect, incidental, special, consequential, or punitive damages 
              resulting from your use of or inability to use the service. We do not guarantee that the service will 
              meet your specific requirements or that it will be uninterrupted, secure, or error-free.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Modification of Terms</h2>
            <p className="text-gray-700 mb-4">
              We reserve the right to modify these terms at any time. Continued use of the service after changes 
              constitutes acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Termination</h2>
            <p className="text-gray-700 mb-4">
              We reserve the right to terminate or suspend your account and access to the service at our sole discretion, 
              without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, 
              or third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Contact Information</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about these Terms and Conditions, please contact us at:
            </p>
            <ul className="list-none pl-0 space-y-2 text-gray-700">
              <li>WhatsApp: +91 9182607873</li>
            </ul>
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




