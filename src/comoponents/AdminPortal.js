import React, { useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";

const AdminPortal = () => {
  const [phone, setPhone] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const handleSearch = async () => {
    try {
      const res = await axios.get(
        `https://membershiportal-c3069d3050e8.herokuapp.com/api/admin/user?phone=${phone}`
      );
      setSelectedUser(res.data);
      setIsModalOpen(true);
    } catch (err) {
      toast.error("User not found");
    }
  };

  const checkVisit = async () => {
    const now = new Date();
    const lastCheck = new Date(selectedUser.lastCheck);
    const hoursDiff = (now - lastCheck) / (1000 * 60 * 60);

    if (hoursDiff > 24 && selectedUser.visitsLeft > 0) {
      try {
        await axios.post("https://membershiportal-c3069d3050e8.herokuapp.com/api/check-visit", {
          userId: selectedUser._id,
        });
        toast.success("Visit deducted successfully!");
        const res = await axios.get(
          `https://membershiportal-c3069d3050e8.herokuapp.com/api/admin/user?phone=${phone}`
        );
        setSelectedUser(res.data);
      } catch (err) {
        toast.error("Error deducting visit.");
      }
    } else {
      toast.info("No visit deduction needed.");
    }
  };

  const confirmCashPayment = async () => {
    try {
      await axios.post("https://membershiportal-c3069d3050e8.herokuapp.com/api/confirm-cash-payment", {
        userId: selectedUser._id,
      });
      toast.success("Cash payment confirmed!");
      const res = await axios.get(
        `https://membershiportal-c3069d3050e8.herokuapp.com/api/admin/user?phone=${phone}`
      );
      setSelectedUser(res.data);
    } catch (err) {
      toast.error("Error confirming payment.");
    }
  };

  return (
    <div className="container mx-auto py-12 bg-[#FFFFFF] min-h-screen">
      <h2 className="text-3xl font-bold text-center text-[#CF066C] mb-6">
        Admin Portal
      </h2>
      <div className="mt-8 max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="space-y-4">
          <div>
            <label className="block text-[#CF066C] font-medium">
              Enter Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CF066C]"
            />
          </div>
          <button
            onClick={handleSearch}
            className="mt-4 w-full py-2 bg-[#CF066C] text-white rounded-full hover:bg-[#EDEC25] hover:text-[#CF066C] transition"
          >
            Search
          </button>
        </div>
        {isModalOpen && selectedUser && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md overflow-y-scroll">
              <h3 className="text-2xl font-bold text-[#CF066C] mb-4">
                User Details
              </h3>
              {selectedUser.tier === "walk-in" &&
                selectedUser.paymentStatus === "pending" && (
                  <div className="mt-4">
                    <label>
                      <input type="checkbox" onChange={confirmCashPayment} />{" "}
                      Cash Paid
                    </label>
                  </div>
                )}
              <p>
                <strong>Name:</strong> {selectedUser.name}
              </p>
              <p>
                <strong>Status:</strong> {selectedUser.paymentStatus}
              </p>
              <p>
                <strong>Tier:</strong> {selectedUser.tier}
              </p>
              <p>
                <strong>Visits Left:</strong> {selectedUser.visitsLeft}
              </p>
              <p>
                <strong>Expiry:</strong>{" "}
                {new Date(selectedUser.expiry).toLocaleDateString()}
              </p>
              {selectedUser.tier !== "walk-in" && selectedUser.photo && (
                <img
                  src={selectedUser.photo}
                  alt=""
                  className="w-24 h-24 rounded-full mt-2"
                />
              )}
              {selectedUser.tier === "walk-in" && (
                <p>
                  <strong>Total Passes:</strong> {selectedUser.numAdults || 0} adults,{" "}
                  {selectedUser.numChildren || 0} children
                </p>
              )}
              <h4 className="mt-4 font-bold">Family Members</h4>
              {selectedUser.family.map((member, idx) => (
                <div key={idx}>
                  <p>
                    <strong>Name:</strong> {member.name}
                  </p>
                  <p>
                    <strong>Email:</strong> {member.email}
                  </p>
                  <p>
                    <strong>Phone:</strong> {member.phone}
                  </p>
                  {member.photo && (
                    <img
                      src={member.photo}
                      alt={member.name}
                      className="w-16 h-16 rounded-full"
                    />
                  )}
                </div>
              ))}
              <button
                onClick={checkVisit}
                className="mt-4 px-4 py-2 bg-[#CF066C] text-white rounded-md"
              >
                Check Visit
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="mt-4 ml-4 px-4 py-2 bg-[#CF066C] text-white rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPortal;