'use client'

import { Inter } from 'next/font/google'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export default function PrivacyPolicy() {
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
        <h1 className="text-3xl md:text-4xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-gray-700 mb-4">
              At eapcetpro, we are committed to protecting your privacy. This Privacy Policy explains how we collect, 
              use, disclose, and safeguard your information when you use our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            <h3 className="text-xl font-semibold mb-3 mt-4">Personal Information</h3>
            <p className="text-gray-700 mb-4">We may collect the following personal information:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Name and contact information (phone number, email address)</li>
              <li>Account credentials (username, password)</li>
              <li>Payment information (processed securely through Razorpay)</li>
              <li>Educational information (year of study, state)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-4">Usage Information</h3>
            <p className="text-gray-700 mb-4">We automatically collect information about how you use our service:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Test attempts and results</li>
              <li>Performance analytics and scores</li>
              <li>Device information (browser type, operating system)</li>
              <li>IP address and location data</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Provide, maintain, and improve our services</li>
              <li>Process payments and manage subscriptions</li>
              <li>Personalize your experience and provide analytics</li>
              <li>Send you important updates and notifications</li>
              <li>Detect and prevent fraud or abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Data Storage and Security</h2>
            <p className="text-gray-700 mb-4">
              We implement appropriate technical and organizational measures to protect your personal information. 
              Your data is stored securely using industry-standard encryption and security practices. However, no 
              method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Data Sharing and Disclosure</h2>
            <p className="text-gray-700 mb-4">We do not sell your personal information. We may share your information with:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Payment processors:</strong> Razorpay for payment processing</li>
              <li><strong>Service providers:</strong> Third-party services that help us operate our platform</li>
              <li><strong>Legal requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Cookies and Tracking Technologies</h2>
            <p className="text-gray-700 mb-4">
              We use cookies and similar technologies to enhance your experience, analyze usage patterns, and 
              provide personalized content. You can control cookies through your browser settings, but this may 
              affect the functionality of our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Your Rights</h2>
            <p className="text-gray-700 mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Access and receive a copy of your personal data</li>
              <li>Correct inaccurate or incomplete information</li>
              <li>Request deletion of your personal data</li>
              <li>Object to processing of your personal data</li>
              <li>Withdraw consent where processing is based on consent</li>
            </ul>
            <p className="text-gray-700 mt-4">
              To exercise these rights, please contact us on WhatsApp: +91 9182607873
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Children's Privacy</h2>
            <p className="text-gray-700 mb-4">
              Our service is intended for students preparing for EAMCET. If you are under 18, please ensure you 
              have parental consent before using our service or providing personal information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Changes to This Privacy Policy</h2>
            <p className="text-gray-700 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
              the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about this Privacy Policy, please contact us at:
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




