import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';

import { toast } from 'react-toastify';

const stripePromise = loadStripe('pk_live_51KbKQBBQRG3WrNBR9JwkMRfjBiPPF6XQ0IBbgEaWT6wm2dr2hEOl0JTEJTsHrM9YtYCWpWaH0JZGgBMFpA3mrPGV00OVR3gxo5');


const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const location = useLocation();
  const navigate = useNavigate();
  const { tier, name, email, phone } = location.state || {};
  const prices = { 'legacy-maker': 35, 'leader': 20, 'supporter': 8, 'walk-in': 7 };
  const price = prices[tier];
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: elements.getElement(CardElement),
    });

    if (error) {
      console.error('Error creating payment method:', error); // Debugging log
      toast.error(error.message);
      return;
    }

    setLoading(true);

    try {
      await axios.post('https://membershiportal-c3069d3050e8.herokuapp.com/api/payment', {
        paymentMethodId: paymentMethod.id,
        amount: price * 100,
        tier,
        name,
        email,
        phone,
      });
      navigate('/thank-you');
    } catch (err) {
      toast.error('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-12 bg-[#FFFFFF] min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-center text-[#CF066C] mb-6">Checkout - {tier?.toUpperCase()}</h2>
        {loading ? (
          <div className="flex justify-center items-center">
            <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full border-pink-600 border-r-transparent"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <CardElement className="p-2 border border-gray-300 rounded-md" />
            <button
              style={{ border: '1px solid #CF066C' }}
              onClick={handleSubmit}
              disabled={!stripe || loading}
              className="w-full py-2 mt-4 bg-[#CF066C] text-white rounded-full hover:bg-[#fff] hover:text-[#CF066C] transition duration-300 font-semibold"
            >
              Pay ${price}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const Checkout = () => (
  <Elements stripe={stripePromise}>
    <CheckoutForm />
  </Elements>
);

export default Checkout;