import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "react-toastify";

const WalkInForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [numAdults, setNumAdults] = useState(1);
  const [numChildren, setNumChildren] = useState(0);
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const navigate = useNavigate();

  const totalPrice = (numAdults * 7 + numChildren * 3.5).toFixed(2);

  const handlePayNow = async () => {
    if (!name || !email || !phone || !selectedDate) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure all the information is correct?",
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const response = await axios.post(
        "https://membership-new-07a345e01ba7.herokuapp.com/api/walk-in",
        {
          name,
          email,
          phone,
          tier: "walk-in",
          numAdults,
          numChildren,
          selectedDate,
        },
      );

      if (response.data.error) {
        toast.error(response.data.error);
        setLoading(false);
        return;
      }

      const totalAmount = (numAdults * 7 + numChildren * 3.5) * 100;
      navigate("/checkout", {
        state: {
          tier: "walk-in",
          name,
          email,
          phone,
          totalAmountInCents: totalAmount,
        },
      });
    } catch (err) {
      toast.error("Error registering walk-in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePayAtCounter = async () => {
    if (!name || !email || !phone || !selectedDate) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure all the information is correct?",
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const response = await axios.post(
        "https://membership-new-07a345e01ba7.herokuapp.com/api/walk-in",
        {
          name,
          email,
          phone,
          tier: "walk-in",
          paymentMethod: "cash",
          numAdults,
          numChildren,
          selectedDate,
        },
      );

      if (response.data.error) {
        toast.error(response.data.error);
        setLoading(false);
        return;
      }

      setShowMessage(
        `Please pay $${totalPrice} at the counter for ${numAdults} adult(s) and ${numChildren} child(ren).`,
      );
      toast.success("Registered! Please pay at the counter.");
    } catch (err) {
      toast.error("Error registering walk-in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-12 bg-[#FFFFFF] min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-center text-[#CF066C] mb-6">
          Walk-In Registration
        </h2>
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
              <label className="block text-[#CF066C] font-medium">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CF066C]"
                required
              />
            </div>
            <div>
              <label className="block text-[#CF066C] font-medium">
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CF066C]"
                required
              />
            </div>
            <div>
              <label className="block text-[#CF066C] font-medium">
                Number of Adults
              </label>
              <input
                type="number"
                value={numAdults}
                onChange={(e) =>
                  setNumAdults(Math.max(1, parseInt(e.target.value)))
                }
                min="1"
                className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CF066C]"
              />
            </div>
            <div>
              <label className="block text-[#CF066C] font-medium">
                Number of Children
              </label>
              <input
                type="number"
                value={numChildren}
                onChange={(e) =>
                  setNumChildren(Math.max(0, parseInt(e.target.value)))
                }
                min="0"
                className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CF066C]"
              />
            </div>
            <p className="text-[#CF066C] font-medium">
              Total Price: ${totalPrice}
            </p>
            <button
              style={{ border: "1px solid #CF066C" }}
              onClick={handlePayNow}
              className="w-full py-2 mt-4 bg-[#CF066C] text-white rounded-full hover:bg-[#fff] hover:text-[#CF066C] transition duration-300 font-semibold"
            >
              Pay Now
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
                {showMessage}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WalkInForm;
