import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";

const AdminPortal = () => {
  const [phone, setPhone] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [walkInBookings, setWalkInBookings] = useState([]);
  const [showBookingsModal, setShowBookingsModal] = useState(false); // Renamed for clarity

  // Fetch all walk-in bookings when component mounts
  useEffect(() => {
    const fetchWalkInBookings = async () => {
      try {
        const res = await axios.get(
          "https://membership-new-07a345e01ba7.herokuapp.com/api/admin/walk-ins",
        );
        setWalkInBookings(res.data);
      } catch (err) {
        toast.error("Failed to fetch walk-in bookings");
      }
    };
    fetchWalkInBookings();
  }, [showBookingsModal]);

  const handleSearch = async () => {
    try {
      const res = await axios.get(
        `https://membership-new-07a345e01ba7.herokuapp.com/api/admin/user?phone=${phone}`,
      );
      setSelectedUser(res.data);
      setIsModalOpen(true);
    } catch (err) {
      toast.error("User not found");
    }
  };

  const checkVisit = async () => {
    try {
      await axios.post(
        "https://membership-new-07a345e01ba7.herokuapp.com/api/check-visit",
        {
          userId: selectedUser._id,
        },
      );
      toast.success("Visit checked successfully!");
      const res = await axios.get(
        `https://membership-new-07a345e01ba7.herokuapp.com/api/admin/user?phone=${phone}`,
      );
      setSelectedUser(res.data);
    } catch (err) {
      toast.error("Error checking visit.");
    }
  };

  const confirmCashPayment = async (
    membershipId,
    isFamily = false,
    familyMemberId,
  ) => {
    try {
      await axios.post(
        "https://membership-new-07a345e01ba7.herokuapp.com/api/confirm-cash-payment",
        {
          userId: selectedUser._id,
          membershipId: isFamily ? familyMemberId : membershipId,
          isFamily,
        },
      );
      toast.success("Cash payment confirmed!");
      const res = await axios.get(
        `https://membership-new-07a345e01ba7.herokuapp.com/api/admin/user?phone=${phone}`,
      );
      setSelectedUser(res.data);
    } catch (err) {
      toast.error("Error confirming payment.");
    }
  };

  const handleDeleteUser = async () => {
    try {
      await axios.delete(
        "https://membership-new-07a345e01ba7.herokuapp.com/api/admin/delete-user",
        {
          data: { userId: selectedUser._id },
        },
      );
      toast.success("User deleted successfully!");
      setIsModalOpen(false);
      setSelectedUser(null);
    } catch (err) {
      toast.error("Error deleting user");
    }
  };

  return (
    <div className="relative container mx-auto py-12 bg-[#FFFFFF] min-h-screen">
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
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg overflow-y-auto max-h-[80vh]">
              <h3 className="text-2xl font-bold text-[#CF066C] mb-4">
                Primary Member Details
              </h3>

              <div className="mb-4 space-y-2">
                <p>
                  <strong>Total Members:</strong>{" "}
                  {1 + (selectedUser.family ? selectedUser.family.length : 0)}
                </p>
                <p>
                  <strong>Total Memberships:</strong>{" "}
                  {selectedUser.memberships
                    ? selectedUser.memberships.length
                    : 0}
                </p>
                <p>
                  <strong>Name:</strong> {selectedUser.name}
                </p>
                <p>
                  <strong>Phone:</strong> {selectedUser.phone}
                </p>

                {selectedUser.photo && (
                  <img
                    src={selectedUser.photo}
                    alt="Primary Member"
                    className="w-24 h-24 rounded-full mt-2"
                  />
                )}
              </div>

              <h4 className="text-xl font-bold text-[#CF066C] mb-2">
                Memberships
              </h4>

              {selectedUser.memberships
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // Newest first
                .map((m, idx) => (
                  <div key={idx} className="mt-4 border-t pt-4">
                    <p>
                      <strong>Membership Type:</strong> {m.tier}
                    </p>
                    {m.tier === "walk-in" && (
                      <>
                        <p>
                          <strong>Number of Adults:</strong> {m?.numAdults || 0}
                        </p>
                        <p>
                          <strong>Number of Children:</strong>{" "}
                          {m?.numChildren || 0}
                        </p>
                        {m.paymentStatus === "pending" && (
                          <p>
                            <strong>Total Amount Due:</strong> $
                            {(m.numAdults * 7 + m.numChildren * 3.5).toFixed(2)}
                          </p>
                        )}
                      </>
                    )}
                    <p>
                      <strong>Booking Date:</strong>{" "}
                      {new Date(m.createdAt).toLocaleDateString()}
                    </p>
                    <p>
                      <strong>Expiry Date:</strong>{" "}
                      {new Date(m.expiry).toLocaleDateString("en-GB", {
                        timeZone: "UTC",
                      })}
                    </p>
                    {/* <p>
                      <strong>Visits Left:</strong>{" "}
                      {m.visitsLeft === Infinity
                        ? "Unlimited"
                        : m.visitsLeft === 0
                        ? "Maxed Out"
                        : m.visitsLeft}
                    </p> */}
                    <p
                      className={`${
                        m.paymentStatus === "active"
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      <strong>Payment:</strong>{" "}
                      {m.paymentStatus === "active" ? "Done" : "Pending"}
                    </p>

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

              <h4 className="text-xl font-bold text-[#CF066C] mt-6 mb-2">
                Family Members
              </h4>

              {selectedUser.family && selectedUser.family.length > 0 ? (
                selectedUser.family.map((member, idx) => (
                  <div key={idx} className="mb-4 border-t pt-4">
                    <p>
                      <strong>Name:</strong> {member.name}
                    </p>
                    <p>
                      <strong>Relationship:</strong> {member.relationship}
                    </p>
                    {member.photo && (
                      <img
                        src={member.photo}
                        alt={member.name}
                        className="w-16 h-16 rounded-full mt-2"
                      />
                    )}
                    <p>
                      <strong>Membership Type:</strong> {member.tier}
                    </p>
                    {member.tier === "walk-in" && (
                      <>
                        <p>
                          <strong>Booking Date:</strong>{" "}
                          {new Date(member.createdAt).toLocaleDateString()}
                        </p>
                        <p>
                          <strong>Expiry Date:</strong>{" "}
                          {new Date(member.expiry).toLocaleDateString("en-GB", {
                            timeZone: "UTC",
                          })}
                        </p>
                      </>
                    )}
                    <p>
                      <strong>Visits Left:</strong>{" "}
                      {member.visitsLeft === Infinity
                        ? "Unlimited"
                        : member.visitsLeft === 0
                        ? "Maxed Out"
                        : member.visitsLeft}
                    </p>
                    <p
                      className={`${
                        member.paymentStatus === "active"
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      <strong>Payment:</strong>{" "}
                      {member.paymentStatus === "active" ? "Done" : "Pending"}
                    </p>
                    {member.paymentStatus === "pending" && (
                      <button
                        onClick={() =>
                          confirmCashPayment(null, true, member._id)
                        }
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
      {/* Right column - Walk-in Bookings */}
      <button
        onClick={() => setShowBookingsModal(true)}
        className="px-4 py-2 bg-[#CF066C] text-white rounded-full hover:bg-[#EDEC25] hover:text-[#CF066C] transition absolute top-4 right-4"
      >
        Show All Walk-in Bookings
      </button>
      {/* Walk-in Bookings Modal */}
      {showBookingsModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-6xl w-full max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-[#CF066C]">
                Walk-in Bookings (Newest First)
              </h3>
              <button
                onClick={() => setShowBookingsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {walkInBookings.length === 0 ? (
              <p className="text-gray-500">No walk-in bookings found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Booking Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expiry
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Adults/Children
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount Due
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {[...walkInBookings]
                      .sort(
                        (a, b) =>
                          new Date(b.membership.createdAt) -
                          new Date(a.membership.createdAt),
                      )
                      .map((booking) => (
                        <tr key={booking._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {booking.user.photo && (
                                <div className="flex-shrink-0 h-10 w-10">
                                  <img
                                    className="h-10 w-10 rounded-full"
                                    src={booking.user.photo}
                                    alt={booking.user.name}
                                  />
                                </div>
                              )}
                              <div className="ml-2">
                                <div className="text-sm font-medium text-gray-900">
                                  {booking.user.name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {booking.user.phone}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(
                              booking.membership.createdAt,
                            ).toLocaleDateString()}
                            <div className="text-xs text-gray-400">
                              {new Date(
                                booking.membership.createdAt,
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(
                              booking.membership.expiry,
                            ).toLocaleDateString("en-GB")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {booking.membership.numAdults} /{" "}
                            {booking.membership.numChildren}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            $
                            {(
                              booking.membership.numAdults * 7 +
                              booking.membership.numChildren * 3.5
                            ).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                booking.membership.paymentStatus === "active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {booking.membership.paymentStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPortal;
