import React, { useState, useEffect } from 'react';
import { User, Phone, Shield, Calendar, Award, ChevronRight, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ProfileTab() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'varun123024@gmail.com')
        .single();
        
      if (data) {
        setUser(data);
      }
      setLoading(false);
    }
    fetchUser();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading profile...</div>;
  }

  const name = user?.name || 'Varun';
  const phone = user?.phone || '7799882456';
  const initial = name.charAt(0).toUpperCase();
  const isPremium = user?.is_premium;
  const planTier = user?.plan_tier || 'FREE';
  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '28 February 2026';

  return (
    <div className="space-y-6 pb-24">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-2xl font-bold">
          {initial}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{name}</h2>
          <p className="text-gray-500 font-medium">{phone}</p>
        </div>
      </div>

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
            <span className={`text-sm font-bold px-2 py-1 rounded ${isPremium ? 'text-indigo-900 bg-indigo-100' : 'text-gray-900 bg-gray-100'}`}>
              {isPremium ? 'Premium' : 'Free'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">Plan Type</span>
            <span className="text-sm font-bold text-gray-900">{planTier}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">Member Since</span>
            <span className="text-sm font-bold text-gray-900">{memberSince}</span>
          </div>
        </div>
      </div>

      {!isPremium && (
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
            <button className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg shadow-sm hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
              Upgrade to Premium
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
