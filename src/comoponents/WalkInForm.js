import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "react-toastify";

const WalkInForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [numHours, setNumHours] = useState(1);
  const [numParticipants, setNumParticipants] = useState(1);
  const [numNonParticipatingAdults, setNumNonParticipatingAdults] = useState(0);
  const [selectedDate, setSelectedDate] = useState("");
  const [acknowledgementChecked, setAcknowledgementChecked] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const navigate = useNavigate();

  const totalPrice = (
    numHours * 7 + 
    numHours * 3.5 * (numParticipants - 1) + 
    2.5 * (numNonParticipatingAdults >= 1 ? 1 : 0) + 
    1 * Math.max(0, numNonParticipatingAdults - 1)
  ).toFixed(2);

  const isFormValid = name && email && phone && selectedDate && acknowledgementChecked && termsChecked && numParticipants >= 1;

  const handlePayNow = async () => {
    if (!isFormValid) {
      toast.error("Please fill all fields and agree to terms.");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post("https://membership-latest-d577860ce51a.herokuapp.com/api/walk-in", {
        name, email, phone, tier: "walk-in", numHours, numParticipants, numNonParticipatingAdults, selectedDate
      });
      if (response.data.error) {
        toast.error(response.data.error);
        setLoading(false);
        return;
      }
      const totalAmount = parseFloat(totalPrice) * 100;
      navigate("/checkout", { state: { tier: "walk-in", name, email, phone, totalAmountInCents: totalAmount } });
    } catch (err) {
      toast.error("Error registering walk-in.");
    } finally {
      setLoading(false);
    }
  };

  const handlePayAtCounter = async () => {
    if (!isFormValid) {
      toast.error("Please fill all fields and agree to terms.");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post("https://membership-latest-d577860ce51a.herokuapp.com/api/walk-in", {
        name, email, phone, tier: "walk-in", paymentMethod: "cash", numHours, numParticipants, numNonParticipatingAdults, selectedDate
      });
      if (response.data.error) {
        toast.error(response.data.error);
        setLoading(false);
        return;
      }
      setShowMessage(`Please pay $${totalPrice} at the counter for ${numHours} hour(s), ${numParticipants} participant(s), and ${numNonParticipatingAdults} non-participating adult(s).`);
      toast.success("Registered! Pay at counter.");
    } catch (err) {
      toast.error("Error registering walk-in.");
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
        {/* <QRCodeCanvas value={window.location.href} className="mx-auto mb-4" /> */}
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
            <div className="flex align-end justify-around">
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
              <label className="block text-[#CF066C] font-medium">Number of Hours</label>
              <input type="number" value={numHours} onChange={(e) => setNumHours(Math.max(1, parseInt(e.target.value || 1)))} min="1" className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CF066C]" />
            </div>
             </div>
             <div className="flex align-end justify-between">

            <div>
              <label className="block text-[#CF066C] font-medium">Number of Participants</label>
              <input  type="number" value={numParticipants} onChange={(e) => setNumParticipants(Math.max(1, parseInt(e.target.value || 1)))} min="1" className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CF066C]" />
            </div>
            <div>
              <label className="block text-[#CF066C] font-medium">Number of Non-Participating Adults</label>
              <input type="number" value={numNonParticipatingAdults} onChange={(e) => setNumNonParticipatingAdults(Math.max(0, parseInt(e.target.value || 0)))} min="0" className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CF066C] ml-1" />
            </div>
             </div>
            <div className="">
              <input type="checkbox" checked={acknowledgementChecked} onChange={(e) => setAcknowledgementChecked(e.target.checked)} className="mr-2" />
              <label className="text-sm text-gray-600">As non-participating adults, we acknowledge that we cannot use the arcade and gaming facilities. We are here just for supervision.</label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" checked={termsChecked} onChange={(e) => setTermsChecked(e.target.checked)} className="mr-2" />
              <label className="text-sm text-gray-600">I agree to the <a href="https://docs.google.com/document/d/1QwyB1eZ9yHKCul-bnP5G9JYj8GNAC5-v8h7HnVyqcyw/edit?usp=sharing" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Terms and Conditions</a>.</label>
            </div>
            <p className="text-[#CF066C] font-medium">Total Price: ${totalPrice}</p>
            <button disabled={!isFormValid || loading} onClick={handlePayNow} className="w-full py-2 mt-4 bg-[#CF066C] text-white rounded-full hover:bg-[#EDEC25] hover:text-[#CF066C] transition duration-300 font-semibold cursor-pointer">Pay Now</button>
            <button disabled={!isFormValid || loading} onClick={handlePayAtCounter} className="w-full py-2 mt-4 bg-[#EDEC25] text-[#CF066C] rounded-full hover:bg-[#CF066C] hover:text-white transition duration-300 font-semibold cursor-pointer">Pay at Counter</button>
            {showMessage && <div className="mt-4 p-4 bg-green-100 text-green-700 rounded">{showMessage}</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default WalkInForm;
