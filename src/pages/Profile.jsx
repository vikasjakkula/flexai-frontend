import React, { useState } from 'react';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';

const AlertDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmClass = '',
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{description}</p>
        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition"
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-semibold transition ${confirmClass}`}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

const Profile = () => {
  // Get today's date and day
  const today = new Date();
  const dateString = today.toLocaleDateString();
  const dayString = today.toLocaleDateString(undefined, { weekday: 'long' });

  // Get user from AuthContext (Google login)
  const { user } = useAuth() || {};

  // Use Google user if available, else fallback
  const displayUser = {
    name: user?.displayName || '',
    age: '', // You may want to store age in your DB, Google doesn't provide it
    phone: '', // Same as above
    email: user?.email || '',
    password: '',
    paymentId: '',
    photoURL: user?.photoURL || '', // Google profile image
  };

  // AlertDialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  // Dummy handlers for demonstration
  const handleEditProfile = () => {
    // TODO: Implement edit profile logic
    // For now, just close dialog
  };

  const handleLogout = () => {
    // TODO: Implement logout logic
    // For now, just close dialog
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="flex flex-col items-center justify-center flex-1 py-12 px-4">
        {/* Profile Header with Google DP */}
        <div className="relative mb-8">
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur opacity-20"></div>
          <div className="relative bg-white rounded-full p-2 shadow-xl flex items-center justify-center w-32 h-32">
            {user?.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt={user.user_metadata?.name || user.email}
                className="w-28 h-28 rounded-full object-cover border-4 border-blue-200 shadow-lg"
                referrerPolicy="no-referrer"
              />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="80"
                height="80"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide-user text-blue-600"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            )}
          </div>
        </div>

        {/* User Name from Google */}
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          {user?.user_metadata?.name || user.email}
        </h1>
        <p className="text-gray-600 mb-8 text-center">Your personal information and account details</p>

        {/* Profile Card */}
        <div className="w-full max-w-2xl bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
            <h2 className="text-2xl font-bold text-white">Account Information</h2>
            <p className="text-blue-100 mt-1">Last updated: {dateString}</p>
          </div>

          {/* Card Content */}
          <div className="p-8 space-y-6">
            {/* Personal Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500 uppercase tracking-wider">Full Name</label>
                <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-blue-500">
                  <p className="text-gray-900 font-semibold">{displayUser.name}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500 uppercase tracking-wider">Age</label>
                <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-green-500">
                  <p className="text-gray-900 font-semibold">{displayUser.age} years old</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500 uppercase tracking-wider">Phone Number</label>
                <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-orange-500">
                  <p className="text-gray-900 font-semibold">{displayUser.phone}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500 uppercase tracking-wider">Today's Date</label>
                <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-purple-500">
                  <p className="text-gray-900 font-semibold">{dateString}</p>
                  <p className="text-gray-600 text-sm">{dayString}</p>
                </div>
              </div>
            </div>

            {/* Email Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500 uppercase tracking-wider">Email Address</label>
              <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-blue-500 flex items-center">
                <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-900 font-semibold">{displayUser.email}</p>
              </div>
            </div>

            {/* Password Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500 uppercase tracking-wider">Password</label>
              <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-gray-500 flex items-center">
                <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-gray-900 font-semibold">{displayUser.password}</p>
              </div>
            </div>

            {/* Payment Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500 uppercase tracking-wider">Payment Status</label>
              <div className={`rounded-lg p-4 border-l-4 ${displayUser.paymentId ? 'bg-green-50 border-green-500' : 'bg-yellow-50 border-yellow-500'}`}>
                {displayUser.paymentId ? (
                  <div className="flex items-center">
                    <svg className="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-green-800 font-semibold">Payment Successful!</p>
                      <p className="text-green-600 text-sm">Razorpay ID: {displayUser.paymentId}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <svg className="w-6 h-6 text-yellow-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                      <p className="text-yellow-800 font-semibold">Payment Pending</p>
                      <p className="text-yellow-600 text-sm">Complete your payment to access premium features</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <button
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            onClick={() => setEditDialogOpen(true)}
          >
            Edit Profile
          </button>
          <button
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            onClick={() => setLogoutDialogOpen(true)}
          >
            Logout
          </button>
        </div>
        {/* Edit Profile AlertDialog */}
        <AlertDialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          onConfirm={handleEditProfile}
          title="Edit Profile"
          description="Are you sure you want to edit your profile? This action may allow you to update your personal information."
          confirmText="Proceed"
          cancelText="Cancel"
          confirmClass="bg-blue-600 hover:bg-blue-700 text-white"
        />
        {/* Logout AlertDialog */}
        <AlertDialog
          open={logoutDialogOpen}
          onClose={() => setLogoutDialogOpen(false)}
          onConfirm={handleLogout}
          title="Logout"
          description="Are you sure you want to logout from your account?"
          confirmText="Logout"
          cancelText="Cancel"
          confirmClass="bg-red-600 hover:bg-red-700 text-white"
        />
      </div>
      <Footer />
    </div>
  );
};

export default Profile;