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
    try {
      await axios.post("https://membershiportal-c3069d3050e8.herokuapp.com/api/check-visit", {
        userId: selectedUser._id,
      });
      toast.success("Visit checked successfully!");
      const res = await axios.get(
        `https://membershiportal-c3069d3050e8.herokuapp.com/api/admin/user?phone=${phone}`
      );
      setSelectedUser(res.data);
    } catch (err) {
      toast.error("Error checking visit.");
    }
  };

  const confirmCashPayment = async (membershipId, isFamily = false, familyMemberId) => {
    try {
      await axios.post("https://membershiportal-c3069d3050e8.herokuapp.com/api/confirm-cash-payment", {
        userId: selectedUser._id,
        membershipId: isFamily ? familyMemberId : membershipId,
        isFamily,
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

  const handleDeleteUser = async () => {
    try {
      await axios.delete("https://membershiportal-c3069d3050e8.herokuapp.com/api/admin/delete-user", {
        data: { userId: selectedUser._id },
      });
      toast.success("User deleted successfully!");
      setIsModalOpen(false);
      setSelectedUser(null);
    } catch (err) {
      toast.error("Error deleting user");
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
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg overflow-y-auto max-h-[80vh]">
              <h3 className="text-2xl font-bold text-[#CF066C] mb-4">
                Primary Member Details
              </h3>
              <div className="mb-4">
                <p><strong>Total Members:</strong> {1 + (selectedUser.family ? selectedUser.family.length : 0)}</p>
                <p><strong>Name:</strong> {selectedUser.name}</p>
                <p><strong>Phone:</strong> {selectedUser.phone}</p>
                {selectedUser.photo && (
                  <img
                    src={selectedUser.photo}
                    alt="Primary Member"
                    className="w-24 h-24 rounded-full mt-2"
                  />
                )}
                {selectedUser.memberships.map((m, idx) => (
                  <div key={idx} className="mt-2">
                    <p><strong>Membership Type:</strong> {m.tier}</p>
                    {m.tier === "walk-in" && (
                      <>
                        <p><strong>Number of Adults:</strong> {selectedUser.numAdults}</p>
                        <p><strong>Number of Children:</strong> {selectedUser.numChildren}</p>
                        {m.paymentStatus === "pending" && (
                          <p><strong>Total Amount Due:</strong> ${(selectedUser.numAdults * 7 + selectedUser.numChildren * 3.5).toFixed(2)}</p>
                        )}
                        <p><strong>Booking Date:</strong> {new Date(m.createdAt).toLocaleDateString()}</p>
                        <p><strong>Expiry Date:</strong> {new Date(m.expiry).toLocaleDateString('en-GB', { timeZone: 'UTC' })}</p>
                      </>
                    )}
                    <p><strong>Visits Left:</strong> {m.visitsLeft === Infinity ? "Unlimited" : m.visitsLeft === 0 ? "Maxed Out" : m.visitsLeft}</p>
                    {m.paymentStatus === "active" ? (
                      <p className="text-green-500"><strong>Payment:</strong> Done</p>
                    ) : (
                      <p className="text-red-500"><strong>Payment:</strong> Pending</p>
                    )}
                    {m.tier === "walk-in" && m.paymentStatus === "pending" && (
                      <button
                        onClick={() => confirmCashPayment(m._id)}
                        className="mt-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition"
                      >
                        Mark as Paid
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <h4 className="text-xl font-bold text-[#CF066C] mb-4">Family Members</h4>
              {selectedUser.family && selectedUser.family.length > 0 ? (
                selectedUser.family.map((member, idx) => (
                  <div key={idx} className="mb-4 border-t pt-4">
                    <p><strong>Name:</strong> {member.name}</p>
                    <p><strong>Relationship:</strong> {member.relationship}</p>
                    {member.photo && (
                      <img
                        src={member.photo}
                        alt={member.name}
                        className="w-16 h-16 rounded-full mt-2"
                      />
                    )}
                    <p><strong>Membership Type:</strong> {member.tier}</p>
                    {member.tier === "walk-in" && (
                      <>
                        <p><strong>Booking Date:</strong> {new Date(member.createdAt).toLocaleDateString()}</p>
                        <p><strong>Expiry Date:</strong> {new Date(member.expiry).toLocaleDateString('en-GB', { timeZone: 'UTC' })}</p>
                      </>
                    )}
                    <p><strong>Visits Left:</strong> {member.visitsLeft === Infinity ? "Unlimited" : member.visitsLeft === 0 ? "Maxed Out" : member.visitsLeft}</p>
                    {member.paymentStatus === "active" ? (
                      <p className="text-green-500"><strong>Payment:</strong> Done</p>
                    ) : (
                      <p className="text-red-500"><strong>Payment:</strong> Pending</p>
                    )}
                    {member.paymentStatus === "pending" && (
                      <button
                        onClick={() => confirmCashPayment(null, true, member._id)}
                        className="mt-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition"
                      >
                        Mark as Paid
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p>No family members found.</p>
              )}

              <div className="mt-6 flex space-x-4 w-full">
                <button
                  onClick={checkVisit}
                  className="px-4 py-2 bg-[#CF066C] text-white rounded-md hover:bg-[#EDEC25] hover:text-[#CF066C] transition"
                >
                  Check Visit
                </button>
                {selectedUser.paymentStatus === "expired" && (
                  <button
                    onClick={handleDeleteUser}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                  >
                    Delete User
                  </button>
                )}
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-[#CF066C] text-white rounded-md hover:bg-[#EDEC25] hover:text-[#CF066C] transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPortal;