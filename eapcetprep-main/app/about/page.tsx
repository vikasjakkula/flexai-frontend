'use client'

import { Inter } from 'next/font/google'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export default function About() {
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
        <h1 className="text-3xl md:text-4xl font-bold mb-6">About Us</h1>

        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Who We Are</h2>
            <p className="text-gray-700 mb-4">
              eapcetpro is a comprehensive online test preparation platform dedicated to helping students excel in 
              the TS and AP EAMCET examinations. We understand the challenges students face while preparing for these 
              competitive exams and have created a platform that makes preparation efficient, effective, and accessible.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
            <p className="text-gray-700 mb-4">
              Our mission is to democratize quality EAMCET preparation by providing students with access to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Comprehensive previous year question papers</li>
              <li>Realistic mock tests that simulate the actual exam environment</li>
              <li>Detailed performance analytics to identify strengths and weaknesses</li>
              <li>Personalized study insights to optimize preparation strategies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">What We Offer</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-2">Previous Year Papers</h3>
                <p className="text-gray-700">
                  Access to a vast collection of previous year EAMCET papers from 2015 onwards, helping you 
                  understand exam patterns and question types.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Mock Test Series</h3>
                <p className="text-gray-700">
                  Full-length mock tests designed to replicate the actual exam experience, complete with 
                  time constraints and detailed solutions.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Performance Analytics</h3>
                <p className="text-gray-700">
                  Advanced analytics that track your progress across mathematics, physics, and chemistry, 
                  providing insights into your performance trends and areas for improvement.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Rank Prediction</h3>
                <p className="text-gray-700">
                  Our marks vs rank predictor helps you understand your potential rank based on your test 
                  performance, giving you realistic expectations for the actual exam.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Our Values</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Excellence:</strong> We strive to provide the highest quality content and user experience</li>
              <li><strong>Accessibility:</strong> Making quality education accessible to all students, regardless of their location</li>
              <li><strong>Innovation:</strong> Continuously improving our platform with the latest technology and educational insights</li>
              <li><strong>Student Success:</strong> Your success is our success - we're committed to helping you achieve your goals</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Why Choose eapcetpro?</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Extensive collection of authentic previous year papers</li>
              <li>Real exam-like testing environment with proper time management</li>
              <li>Comprehensive analytics to track your improvement</li>
              <li>Affordable one-time payment with no recurring subscriptions</li>
              <li>Mobile-friendly platform accessible anytime, anywhere</li>
              <li>Regular updates with new content and features</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Our Impact</h2>
            <p className="text-gray-700 mb-4">
              Since our launch, we've helped thousands of students prepare effectively for their EAMCET exams. 
              Our platform has:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Provided access to 120+ question papers</li>
              <li>Enabled students to attempt thousands of practice tests</li>
              <li>Helped students improve their scores through detailed analytics</li>
              <li>Created a supportive community of learners</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Get in Touch</h2>
            <p className="text-gray-700 mb-4">
              We'd love to hear from you! Whether you have questions, suggestions, or feedback, please don't 
              hesitate to reach out:
            </p>
            <ul className="list-none pl-0 space-y-2 text-gray-700">
              <li>WhatsApp: +91 9182607873</li>
              <li>
                <Link href="/contact" className="text-blue-600 hover:underline">
                  Contact Us Page
                </Link>
              </li>
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




