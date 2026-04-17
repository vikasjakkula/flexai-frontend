import React, { useState, useEffect } from 'react';
import { FileText, PlayCircle } from 'lucide-react';
import { getTests } from '../lib/dataStore';

export default function MockTab({ setActiveMockTest }: { setActiveMockTest?: (test: {id: string | number, title: string}) => void }) {
  const [activeRegion, setActiveRegion] = useState('AP');
  const [activeYear, setActiveYear] = useState('2025');
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTests() {
      setLoading(true);
      const data = await getTests();
      if (data) {
        setTests(data);
      }
      setLoading(false);
    }
    fetchTests();
  }, []);

  const years = Array.from(new Set(tests.map(t => t.year?.toString()).filter(Boolean))).sort().reverse();
  const displayYears = years.length > 0 ? years : ['2025', '2024', '2023', '2022', '2021'];

  const filteredTests = tests.filter(t => t.state === activeRegion && t.year?.toString() === activeYear.toString());

  return (
    <div className="space-y-6 pb-24">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Mock Tests</h2>
      
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {['AP', 'TS'].map(region => (
            <button
              key={region}
              onClick={() => setActiveRegion(region)}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${
                activeRegion === region 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {region} EAPCET
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {displayYears.map(year => (
            <button
              key={year as string}
              onClick={() => setActiveYear(year as string)}
              className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                activeYear === year 
                  ? 'bg-gray-900 text-white shadow-sm' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {year as string}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-xl border-dashed">
            <p className="text-gray-500 font-medium">Loading tests...</p>
          </div>
        ) : filteredTests.length > 0 ? filteredTests.map((test) => (
          <div 
            key={test.test_id} 
            className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:border-indigo-300 transition-colors cursor-pointer group flex flex-col gap-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-base mb-1">{test.test_name}</h4>
                  <p className="text-xs text-gray-500 font-medium">{new Date(test.test_date).toLocaleDateString()} • Shift {test.shift}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Questions</p>
                  <p className="text-sm font-semibold text-gray-900">160</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Duration</p>
                  <p className="text-sm font-semibold text-gray-900">180m</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveMockTest?.({ id: test.test_id, title: test.test_name })}
                className="flex items-center gap-2 text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <PlayCircle className="w-4 h-4" />
                Start Test
              </button>
            </div>
          </div>
        )) : (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-xl border-dashed">
            <p className="text-gray-500 font-medium">No mock tests available for {activeYear}</p>
          </div>
        )}
      </div>
    </div>
  );
}
