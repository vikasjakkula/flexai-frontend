// Copyright 2025 varun
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//     https://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

"use client";

import { useState, Suspense } from 'react';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { testData } from '../data/testData';
import { Shimmer } from '@/components/Shimmer';
import { isFreeTest } from '@/utils/free-tests';

const inter = Inter({ subsets: ['latin'] });

function TestInstructionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const testId = searchParams.get('testId');
  const [language, setLanguage] = useState('English');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  const handleStartTest = async () => {
    if (!agreedToTerms) {
      return;
    }
    
    if (!testId) {
      return;
    }
    
    // Allow free tests without premium check
    if (isFreeTest(testId)) {
      router.push(`/test/take?testId=${testId}`);
      return;
    }
    
    // Check premium status before allowing test start
    try {
      const premiumResponse = await fetch('/api/auth/premium-check');
      const premiumData = await premiumResponse.json();
      
      if (!premiumData.isPremium) {
        // Redirect to paywall if not premium
        router.push('/onboarding/paywall');
        return;
      }
      
      // The test page will handle starting the attempt
      router.push(`/test/take?testId=${testId}`);
    } catch (error) {
      console.error('Error checking premium status:', error);
      // On error, redirect to paywall to be safe
      router.push('/onboarding/paywall');
    }
  };

  return (
    <div className={`${inter.className} min-h-screen bg-gray-50 text-gray-900`}>
      <header className="bg-white border-b border-gray-200 py-4">
        <div className="container mx-auto px-4 flex items-center">
          <div className="flex items-center gap-2">
            <span className="text-blue-600 font-bold text-xl">eapcet<span className="text-gray-900">pro</span></span>
          </div>
          <h1 className="ml-5 text-lg font-medium">{testData.title}</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between mb-4">
          <h2 className="text-xl font-bold mb-4 sm:mb-0">General Instructions:</h2>
          <div className="flex items-center">
            <span className="mr-2">View in:</span>
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="border border-gray-300 rounded-md p-2"
            >
              <option value="English">English</option>
              <option value="Telugu">Telugu</option>
              <option value="Hindi">Hindi</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
          <div className="mb-6">
            <p className="text-center font-semibold text-lg mb-4">Read the following instructions carefully.</p>
            
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-3 py-2 text-left text-xs sm:text-sm font-medium text-gray-500">SI No.</th>
                      <th className="px-3 py-2 text-left text-xs sm:text-sm font-medium text-gray-500">Section</th>
                      <th className="px-3 py-2 text-left text-xs sm:text-sm font-medium text-gray-500">Questions</th>
                      <th className="px-3 py-2 text-left text-xs sm:text-sm font-medium text-gray-500">Max Marks</th>
                      <th className="px-3 py-2 text-left text-xs sm:text-sm font-medium text-gray-500">-ve Marks</th>
                      <th className="px-3 py-2 text-left text-xs sm:text-sm font-medium text-gray-500">+ve Marks</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {testData.instructions.sectionInstructions.map((section, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2 text-xs sm:text-sm whitespace-nowrap">{index + 1}</td>
                        <td className="px-3 py-2 text-xs sm:text-sm whitespace-nowrap">{section.name}</td>
                        <td className="px-3 py-2 text-xs sm:text-sm whitespace-nowrap">{section.questions}</td>
                        <td className="px-3 py-2 text-xs sm:text-sm whitespace-nowrap">{section.maxMarks}</td>
                        <td className="px-3 py-2 text-xs sm:text-sm whitespace-nowrap">{section.negativeMarks}</td>
                        <td className="px-3 py-2 text-xs sm:text-sm whitespace-nowrap">{section.positiveMarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <ol className="list-decimal pl-4 sm:pl-6 space-y-3 sm:space-y-4 mt-6 text-sm sm:text-base">
              {testData.instructions.generalInstructions.map((instruction, index) => (
                <li key={index}>{instruction}</li>
              ))}
            </ol>
            
            <div className="mt-6 space-y-3 text-sm sm:text-base">
              <div className="flex items-center">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-500 mr-3 sm:mr-4"></div>
                <p>You have answered the question.</p>
              </div>
              <div className="flex items-center">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-red-500 mr-3 sm:mr-4"></div>
                <p>You have visited but not answered the question yet.</p>
              </div>
              <div className="flex items-center">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-yellow-500 mr-3 sm:mr-4"></div>
                <p>You have not answered the question but have marked for review.</p>
              </div>
              <div className="flex items-center">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-yellow-500 flex items-center justify-center mr-3 sm:mr-4">
                  <span className="text-green-800">✓</span>
                </div>
                <p>You have answered the question but have marked for review.</p>
              </div>
              <div className="flex items-center">
                <div className="w-5 h-5 sm:w-6 sm:h-6 border border-gray-300 mr-3 sm:mr-4"></div>
                <p>You have not visited the question yet.</p>
              </div>
            </div>
          </div>

          <div className="mt-8 sm:mt-10">
            <div>
              <p className="mb-2 text-sm sm:text-base">Choose your default language</p>
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full sm:w-auto border border-gray-300 rounded-md p-2 text-sm sm:text-base"
              >
                <option value="English">English</option>
                <option value="Telugu">Telugu</option>
                <option value="Hindi">Hindi</option>
              </select>
              <p className="text-xs sm:text-sm text-red-600 mt-1">Please note all questions will appear in your default language. This language can be changed for a particular question later on.</p>
            </div>

            <div className="mt-6 flex items-start sm:items-center">
              <input 
                type="checkbox" 
                id="terms" 
                checked={agreedToTerms}
                onChange={() => setAgreedToTerms(!agreedToTerms)}
                className="mt-1 sm:mt-0 mr-2 h-5 w-5"
              />
              <label htmlFor="terms" className="text-xs sm:text-sm">
                I have read and understood the instructions. All computer hardware allotted to me are in proper working condition. I declare that I am not in possession of /not wearing /not carrying any prohibited gadget like mobile phone, bluetooth devices etc. /any prohibited material with me into the Examination Hall. I agree that in case of not adhering to the instructions, I shall be liable to be debarred from this Test and/or to a disciplinary action, which may include ban from future Tests/Examinations.
              </label>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto bg-gray-200 text-gray-800 px-5 py-2 rounded-md hover:bg-gray-300 transition">
              ← Go back
            </button>
          </Link>
          <button 
            onClick={handleStartTest}
            disabled={!agreedToTerms}
            className={`w-full sm:w-auto px-5 py-2 rounded-md ${
              agreedToTerms ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            } transition`}
          >
            I am ready to begin
          </button>
        </div>
      </main>
    </div>
  );
}

export default function TestInstructionsPage() {
  return (
    <Suspense fallback={
      <div className={`${inter.className} min-h-screen bg-gray-50`}>
        <header className="bg-white border-b border-gray-200 py-4">
          <div className="container mx-auto px-4 flex items-center gap-2">
            <Shimmer height="h-6" width="w-32" />
            <Shimmer height="h-5" width="w-48" />
          </div>
        </header>
        <main className="container mx-auto px-4 py-6">
          <div className="max-w-4xl mx-auto">
            <Shimmer height="h-8" width="w-64" className="mb-6" />
            <div className="bg-white rounded-lg shadow-sm p-6">
              <Shimmer height="h-6" width="w-48" className="mb-4" />
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Shimmer key={i} height="h-4" width="w-full" />
                ))}
              </div>
              <div className="mt-6">
                <Shimmer height="h-32" width="w-full" rounded className="mb-4" />
                <Shimmer height="h-10" width="w-full" rounded />
              </div>
            </div>
          </div>
        </main>
      </div>
    }>
      <TestInstructionsContent />
    </Suspense>
  );
}
