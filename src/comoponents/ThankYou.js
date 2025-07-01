import React from "react";
import { Link, useLocation } from "react-router-dom";

const ThankYou = () => {
  const location = useLocation();
  const isWalkIn = location.state?.isWalkIn;

  return (
    <div className="container mx-auto py-12 bg-[#FFFFFF] min-h-screen text-center flex items-center justify-center">
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-[#CF066C] mb-4">Thank You!</h2>
        {isWalkIn ? (
          <p className="text-[#CF066C] mb-4">
            Thankyou! Your walk-pass has been activated. Please check your email
            for confirmation (Check your promotions or spam folder if not in
            inbox)
          </p>
        ) : (
          <>
            <p className="text-[#CF066C] mb-4">
              Your payment was successful. Please check your email (including
              spam and promotions).
            </p>

            <Link
              style={{ border: "1px solid #CF066C" }}
              to="/login"
              className="inline-block px-6 py-2 bg-[#CF066C] text-white rounded-full hover:bg-[#fff] hover:text-[#CF066C] transition duration-300 font-semibold"
            >
              Go to Client Portal
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default ThankYou;
