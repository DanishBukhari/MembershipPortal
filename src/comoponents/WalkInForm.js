import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react';
import { toast } from "react-toastify";

const WalkInForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const navigate = useNavigate();

  const handlePayNow = async () => {
    setLoading(true);
    try {
      await axios.post('https://membershiportal-c3069d3050e8.herokuapp.com/api/walk-in', { name, email, phone, tier: 'walk-in' });
      navigate('/checkout', { state: { tier: 'walk-in', name, email, phone } });
    } catch (err) {
      toast.error('Error registering walk-in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayAtCounter = async () => {
    setLoading(true);
    try {
      await axios.post('https://membershiportal-c3069d3050e8.herokuapp.com/api/walk-in', { name, email, phone, tier: 'walk-in', paymentMethod: 'cash' });
      setShowMessage(true);
      toast.success('Registered! Please pay at the counter.');
    } catch (err) {
      toast.error('Error registering walk-in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-12 bg-[#FFFFFF] min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-center text-[#CF066C] mb-6">Walk-In Registration</h2>
        <QRCodeCanvas value={window.location.href} className="mx-auto mb-4" />
        {loading ? (
          <div className="flex justify-center items-center">
            <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full border-pink-600 border-r-transparent"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-[#CF066C] font-medium">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CF066C]"
                required
              />
            </div>
            <div>
              <label className="block text-[#CF066C] font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CF066C]"
                required
              />
            </div>
            <div>
              <label className="block text-[#CF066C] font-medium">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CF066C]"
                required
              />
            </div>
            <button
              style={{ border: "1px solid #CF066C" }}
              onClick={handlePayNow}
              className="w-full py-2 mt-4 bg-[#CF066C] text-white rounded-full hover:bg-[#fff] hover:text-[#CF066C] transition duration-300 font-semibold"
            >
              Pay Now ($7)
            </button>
            <button
              style={{ border: "1px solid #CF066C" }}
              onClick={handlePayAtCounter}
              className="w-full py-2 mt-4 bg-[#EDEC25] text-[#CF066C] rounded-full hover:bg-[#CF066C] hover:text-white transition duration-300 font-semibold"
            >
              Pay at Counter
            </button>
            {showMessage && (
              <div className="mt-4 p-4 bg-green-100 text-green-700 rounded">
                Please go ahead to pay at the counter.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WalkInForm;