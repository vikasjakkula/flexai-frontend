import React from 'react';
import Footer from '../components/Footer';
// TODO: Replace with real user data from context or props
const user = {
  name: 'John Doe',
  age: 25,
  phone: '+91-9876543210',
  email: 'johndoe@gmail.com',
  password: '********',
  paymentId: 'pay_QpP4BZpynCWerf', // or null if not paid
};

const Profile = () => {
  // Get today's date and day
  const today = new Date();
  const dateString = today.toLocaleDateString();
  const dayString = today.toLocaleDateString(undefined, { weekday: 'long' });

  return (
    <div className="flex flex-col min-h-screen bg-blue-50">
      <div className="flex flex-col items-center justify-center flex-1 py-12">
        {/* Big SVG */}
        <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide-user text-blue-600 mb-4"><path d="M19 90v-8a16 16 0 0 0-16-16H13a16 16 0 0 0-16 16v8"/><circle cx="48" cy="28" r="24"/></svg>
        <div className="text-2xl font-bold mb-6">User's Info</div>
        <div className="w-full max-w-md bg-white rounded-xl shadow p-6 space-y-4">
          <div><span className="font-semibold">Name:</span> {user.name}</div>
          <div><span className="font-semibold">Date and Day:</span> {dateString} ({dayString})</div>
          <div><span className="font-semibold">Age:</span> {user.age}</div>
          <div><span className="font-semibold">Phone No:</span> {user.phone}</div>
          <div><span className="font-semibold">Gmail Account:</span> {user.email}</div>
          <div><span className="font-semibold">Password:</span> {user.password}</div>
          <div>
            <span className="font-semibold">Payment:</span>
            {user.paymentId
              ? <> Payment Success! Razorpay ID: {user.paymentId}</>
              : <> - </>}
          </div>
        </div>
        <button
          className="mt-8 text-red-600 font-bold text-lg hover:underline"
          onClick={() => {/* TODO: Add logout logic */}}
        >
          Logout
        </button>
      </div>
      <Footer />
    </div>
  );
};

export default Profile; 