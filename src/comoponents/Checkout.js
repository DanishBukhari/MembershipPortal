import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import axios from "axios";
import { loadStripe } from "@stripe/stripe-js";
import { toast } from "react-toastify";

const stripePromise = loadStripe(
  "pk_live_51RMH4RJqz3pkKu5cBJJH50Y8rSjriu5mqphdLqmadhdyRpzlnglSNHk5YBwLPNWNtvNpTWREI38bX3nLkt9HS1bL00ntBWq6fF",
  // "pk_test_51KbKQBBQRG3WrNBRg6dlmV8aHWW6klNx70cds5tQZPDYCjVwPrMf1K8xpw6l1DnmxNIximiyM1JjHNyN2koFDy9R00dpSL0aHy",
);

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const location = useLocation();
  const navigate = useNavigate();
  const { memberships, name, email, phone, totalAmountInCents, tier } =
    location.state || {};
  const prices = { "legacy-maker": 35, leader: 20, supporter: 8, "walk-in": 7 };
  const [loading, setLoading] = useState(false);

  // Calculate total price: for memberships, first at full price, others at 50% off; for walk-ins, use totalAmountInCents
  const totalPrice =
    memberships && memberships.length > 0
      ? memberships
          .reduce((total, tier, index) => {
            const basePrice = prices[tier];
            const price = index === 0 ? basePrice : basePrice * 0.5;
            return total + price;
          }, 0)
          .toFixed(2)
      : typeof totalAmountInCents === "number"
      ? (totalAmountInCents / 100).toFixed(2)
      : "0.00";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: "card",
      card: elements.getElement(CardElement),
    });

    if (error) {
      console.error("Error creating payment method:", error);
      toast.error(error.message);
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        "https://membership-latest-d577860ce51a.herokuapp.com/api/payment",
        {
          paymentMethodId: paymentMethod.id,
          memberships: memberships || ["walk-in"], // Default to ['walk-in'] if no memberships
          name,
          email,
          phone,
        },
      );
      navigate("/thank-you", { state: { isWalkIn: tier === "walk-in" } });
    } catch (err) {
      toast.error("Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-12 bg-[#FFFFFF] min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-center text-[#CF066C] mb-6">
          Checkout
        </h2>
        <div className="mb-4">
          {tier === "walk-in" ? (
            <p className="text-[#CF066C]">Walk-in Pass</p>
          ) : (
            memberships &&
            memberships.map((tier, index) => (
              <p key={index} className="text-[#CF066C]">
                {index === 0
                  ? "Primary Membership"
                  : `Family Membership ${index}`}
                : {tier.toUpperCase()}
              </p>
            ))
          )}
          <p className="text-[#CF066C] font-bold">
            Total: ${totalPrice}{" "}
            {/* {tier !== "walk-in" ? "(recurring daily for testing)" : ""} */}
          </p>
        </div>
        {loading ? (
          <div className="flex justify-center items-center">
            <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full border-pink-600 border-r-transparent"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <CardElement
              options={{ hidePostalCode: true }}
              className="p-2 border border-gray-300 rounded-md"
            />
            <button
              style={{ border: "1px solid #CF066C" }}
              onClick={handleSubmit}
              disabled={!stripe || loading}
              className="w-full py-2 mt-4 bg-[#CF066C] text-white rounded-full hover:bg-[#fff] hover:text-[#CF066C] transition duration-300 font-semibold"
            >
              Pay ${totalPrice}
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
