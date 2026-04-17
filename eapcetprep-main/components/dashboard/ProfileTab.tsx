"use client"

import React, { useState } from 'react';
import { User, Phone, Shield, Award, ChevronRight, Lock, Edit2, Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProfileTab({
  userData,
  isPremium,
}: {
  userData: any;
  isPremium: boolean;
}) {
  const router = useRouter();
  const [editingPrefs, setEditingPrefs] = useState(false);
  const [examType, setExamType] = useState<string>(userData?.exam_type || '');
  const [field, setField] = useState<string>(userData?.field || 'engineering');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  if (!userData) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const name = userData.name || 'Student';
  const phone = userData.phone || '';
  const initial = name.charAt(0).toUpperCase();
  const isPremiumActive = userData.is_premium && userData.premium_until && new Date(userData.premium_until) > new Date();
  const memberSince = userData.created_at
    ? new Date(userData.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  const planTier = userData.plan_tier || 'FREE';
  const daysLeft = userData.premium_until && new Date(userData.premium_until) > new Date()
    ? Math.ceil((new Date(userData.premium_until).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const handleSavePrefs = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch('/api/auth/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exam_type: examType, field }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setEditingPrefs(false);
    } catch {
      setSaveError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelPrefs = () => {
    setExamType(userData?.exam_type || '');
    setField(userData?.field || 'engineering');
    setSaveError('');
    setEditingPrefs(false);
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Profile card */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0">
          {initial}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{name}</h2>
          {phone && <p className="text-gray-500 text-sm font-medium">{phone}</p>}
        </div>
      </div>

      {/* Exam Preferences */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <span className="text-base">🎓</span>
            Exam Preferences
          </h3>
          {!editingPrefs ? (
            <button
              onClick={() => setEditingPrefs(true)}
              className="flex items-center gap-1.5 text-indigo-600 text-sm font-semibold hover:text-indigo-700 transition"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSavePrefs}
                disabled={saving}
                className="flex items-center gap-1 text-green-600 text-sm font-semibold hover:text-green-700 disabled:opacity-50 transition"
              >
                <Check className="w-3.5 h-3.5" />
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={handleCancelPrefs}
                className="flex items-center gap-1 text-gray-500 text-sm font-semibold hover:text-gray-700 transition"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="p-4 space-y-4">
          {/* Exam type */}
          <div>
            <p className="text-xs text-gray-500 font-medium mb-2">Preparing for</p>
            {editingPrefs ? (
              <div className="flex gap-2">
                {(['TS EAPCET', 'AP EAPCET'] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setExamType(opt)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border-2 transition ${
                      examType === opt
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900">
                  {examType || <span className="text-gray-400 font-normal">Not set</span>}
                </span>
              </div>
            )}
          </div>

          {/* Stream */}
          <div>
            <p className="text-xs text-gray-500 font-medium mb-2">Stream</p>
            {editingPrefs ? (
              <div className="flex gap-2">
                {([
                  { label: '⚙️ Engineering', value: 'engineering' },
                  { label: '🩺 Medical', value: 'medical' },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setField(opt.value)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border-2 transition ${
                      field === opt.value
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900 capitalize">
                  {field === 'medical' ? '🩺 Medical' : field === 'engineering' ? '⚙️ Engineering' : <span className="text-gray-400 font-normal">Not set</span>}
                </span>
              </div>
            )}
          </div>

          {saveError && (
            <p className="text-sm text-red-600">{saveError}</p>
          )}
        </div>
      </div>

      {/* Personal information */}
      {phone && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              Personal Information
            </h3>
          </div>
          <div className="p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3 text-gray-600">
                <Phone className="w-4 h-4" />
                <span className="text-sm font-medium">Phone</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{phone}</span>
            </div>
          </div>
        </div>
      )}

      {/* Account details */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-gray-500" />
            Account Details
          </h3>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">Membership Status</span>
            <span className={`text-sm font-bold px-2 py-1 rounded ${isPremiumActive ? 'text-indigo-900 bg-indigo-100' : 'text-gray-900 bg-gray-100'}`}>
              {isPremiumActive
                ? (planTier === 'BASIC' ? 'Basic' : planTier === 'PRO' ? 'Pro' : 'Premium')
                : 'Free'}
            </span>
          </div>

          {isPremiumActive && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Plan Type</span>
                <span className="text-sm font-bold text-gray-900">{planTier}</span>
              </div>
              {userData.premium_until && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Valid Until</span>
                  <span className="text-sm font-bold text-gray-900">
                    {new Date(userData.premium_until).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
              )}
              {daysLeft !== null && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Days Remaining</span>
                  <span className="text-sm font-bold text-gray-900">{daysLeft} days</span>
                </div>
              )}
              {planTier === 'BASIC' && (
                <Link href="/subscriptions/manage" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium block">
                  Manage Subscription →
                </Link>
              )}
            </>
          )}

          {!isPremiumActive && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Plan Type</span>
              <span className="text-sm font-bold text-gray-900">FREE</span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">Tests Taken</span>
            <span className="text-sm font-bold text-gray-900">{userData.tests_taken || 0}</span>
          </div>

          {memberSince && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Member Since</span>
              <span className="text-sm font-bold text-gray-900">{memberSince}</span>
            </div>
          )}
        </div>
      </div>

      {/* Premium upgrade CTA */}
      {!isPremiumActive && (
        <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Award className="w-24 h-24 text-indigo-600" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-indigo-900 text-lg">Premium Required</h3>
            </div>
            <p className="text-indigo-700 text-sm mb-5 leading-relaxed pr-8">
              Upgrade to premium to access all test series, advanced analytics, and exclusive features.
            </p>
            <button
              onClick={() => router.push('/onboarding/paywall')}
              className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg shadow-sm hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              Upgrade to Premium
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
