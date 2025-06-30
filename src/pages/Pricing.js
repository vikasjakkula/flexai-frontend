import React, { useState, useEffect } from 'react';
import LoadingPage from '../components/LoadingPage'; // Adjust path if needed
import { createClient } from "@supabase/supabase-js";

const supabase = createClient("https://gywajswoztldhjdwepkv.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5d2Fqc3dvenRsZGhqZHdlcGt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NDI3OTIsImV4cCI6MjA2NDExODc5Mn0.W1K-UrncnN57sC5xqjwKE2OWc2WHvQqIQh0F-nCSFQI");

const handlePayment = async () => {
  const res = await fetch("http://localhost:5000/api/createOrder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: 900 }),
  });
  const data = await res.json();

  const options = {
    key: "YOUR_RAZORPAY_KEY_ID", // Replace with your Razorpay Key
    amount: 900 * 100,
    currency: "INR",
    name: "FLEX.AI",
    description: "Complete Building Series Package",
    order_id: data.orderId,
    handler: async function (response) {
      alert("Payment Success! Razorpay ID: " + response.razorpay_payment_id);
      // Get user info from Supabase
      const user = await supabase.auth.getUser();
      // Store payment in Supabase
      await supabase.from("payments").insert({
        user_id: user.data.user.id,
        razorpay_order_id: response.razorpay_order_id,
        payment_status: "paid",
        amount: 900,
      });
    },
    theme: { color: "#3399cc" },
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
};

const Pricing = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const timer = setTimeout(() => setLoading(false), 1000);
    // Dynamically load Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      clearTimeout(timer);
      document.body.removeChild(script);
    };
  }, []);

  if (loading) return <LoadingPage />;

  const cardStyle = {
    background: 'white',
    borderRadius: '1.5rem',
    boxShadow: '0 4px 24px rgba(27,157,243,0.10)',
    fontFamily: 'Raleway, Arial, sans-serif',
    textAlign: 'center',
    maxWidth: '480px',
    margin: '2rem auto',
    overflow: 'hidden',
  };

  const headerStyle = {
    background: '#1b9df3',
    color: 'white',
    padding: '2rem 1.5rem 1rem 1.5rem',
    textAlign: 'center',
    fontWeight: 700,
    fontSize: '1.4rem',
  };

  const subHeaderStyle = {
    color: 'white',
    fontWeight: 400,
    fontSize: '1rem',
    marginTop: '0.5rem',
  };

  const priceRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    fontSize: '2.2rem',
    fontWeight: 700,
    margin: '2rem 0 1rem 0',
  };

  const oldPriceStyle = {
    textDecoration: 'line-through',
    color: '#888',
    fontSize: '1.2rem',
    fontWeight: 500,
  };

  const discountStyle = {
    background: '#d4f7d4',
    color: '#1bbf3f',
    fontWeight: 700,
    fontSize: '1rem',
    borderRadius: '0.5rem',
    padding: '0.2rem 0.7rem',
    marginLeft: '0.5rem',
  };

  const featureListStyle = {
    listStyle: 'none',
    padding: 0,
    margin: '1.5rem 0',
    color: '#222',
    fontSize: '1.08rem',
  };

  const featureItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.7rem',
    marginBottom: '0.7rem',
  };

  const checkStyle = {
    color: '#1bbf3f',
    fontWeight: 900,
    fontSize: '1.3rem',
  };

  const razorpayStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#222',
    fontSize: '1rem',
    margin: '0.5rem 0 1rem 0',
    justifyContent: 'center',
    opacity: 0.7,
  };

  return (
    <div style={{ background: '#f4fafd', minHeight: '100vh', padding: '2rem 0' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ color: '#1b9df3', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>Pricing</div>
        <div style={{ fontWeight: 900, fontSize: '2.2rem', fontFamily: 'Raleway, Arial, sans-serif', marginBottom: '0.5rem' }}>
          Affordable / Buyable
        </div>
        <div style={{ color: '#444', fontSize: '1.1rem', marginBottom: '1.5rem' }}>
          Get complete access to our flex.ai at a special discount price.
        </div>
      </div>

      <div style={cardStyle}>
        <div style={headerStyle}>
          Complete Building Series Package
          <div style={subHeaderStyle}>Everything you need her impression</div>
        </div>

        <div style={{ padding: '2rem 1.5rem 1.5rem 1.5rem' }}>
          <div style={priceRowStyle}>
            <span>₹900</span>
            <span style={oldPriceStyle}>₹2500</span>
            <span style={discountStyle}>55% off</span>
          </div>

          <ul style={featureListStyle}>
            <li style={featureItemStyle}><span style={checkStyle}>✔</span> Full access to FLEX.AI</li>
            <li style={featureItemStyle}><span style={checkStyle}>✔</span> Detailed performance analytics</li>
            <li style={featureItemStyle}><span style={checkStyle}>✔</span> Valid Until You Get Your Dream Body!</li>
          </ul>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', margin: '1.5rem 0 0.5rem 0' }}>
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                borderRadius: '0.7rem',
                padding: '1rem',
                fontWeight: 700,
                fontSize: '1.1rem',
                width: '100%',
                cursor: 'pointer',
                boxShadow: '0 2px 8px #1b9df355',
                background: '#FFFDF7',
                color: '#222',
                gap: '0.8rem'
              }}
              onClick={handlePayment}
            >
              <img src="cards.svg" alt="Cards" style={{ height: '1.7rem', marginRight: '0.7rem' }} />
              Debit Card / Credit Card
            </button>

            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                borderRadius: '0.7rem',
                padding: '1rem',
                fontWeight: 700,
                fontSize: '1.1rem',
                width: '100%',
                cursor: 'pointer',
                boxShadow: '0 2px 8px #1b9df355',
                background: '#FFFDF7',
                color: '#222',
                gap: '0.8rem'
              }}
              onClick={handlePayment}
            >
              <img src="UPI.png" alt="UPI" style={{ height: '1.7rem', marginRight: '0.7rem' }} />
              Pay with UPI
            </button>
          </div>

          <div style={razorpayStyle}>
            <img src="razorpay.svg" alt="Razorpay" style={{ height: '2.2rem', verticalAlign: 'middle', marginRight: '0.5rem' }} />
          </div>

          <div style={razorpayStyle}>
            <span>Secure payment by Razorpay</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
