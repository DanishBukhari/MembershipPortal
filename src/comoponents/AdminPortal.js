import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import duration from "dayjs/plugin/duration";

dayjs.extend(utc);
dayjs.extend(duration);

const AdminPortal = () => {
  const [phone, setPhone] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [walkInBookings, setWalkInBookings] = useState([]);
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [activeSessions, setActiveSessions] = useState({});
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [selectedBookings, setSelectedBookings] = useState({
    primary: [],
    family: [],
  });

  // Fetch all walk-in bookings
  useEffect(() => {
    const fetchWalkInBookings = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/admin/walk-ins");
        setWalkInBookings(res.data);
      } catch (err) {
        toast.error("Failed to fetch walk-in bookings");
      }
    };
    fetchWalkInBookings();
  }, [showBookingsModal]);

  // Track active sessions
  useEffect(() => {
    if (!selectedUser) return;

    const sessions = {};

    // Primary memberships
    selectedUser.memberships.forEach((m, idx) => {
      if (m.tier === "walk-in" && m.sessionStart) {
        sessions[`primary-${idx}`] = m.sessionStart;
      }
    });

    // Family members
    selectedUser.family.forEach((f, idx) => {
      if (f.tier === "walk-in" && f.sessionStart) {
        sessions[`family-${idx}`] = f.sessionStart;
      }
    });

    setActiveSessions(sessions);

    // Reset selected bookings when user changes
    setSelectedBookings({ primary: [], family: [] });
  }, [selectedUser]);

  const handleSearch = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/admin/user?phone=${phone}`,
      );
      setSelectedUser(res.data);
      setIsModalOpen(true);
    } catch (err) {
      toast.error("User not found");
    }
  };

  const checkVisit = async () => {
    try {
      setIsCheckingIn(true);

      // Send only selected bookings to backend
      await axios.post("http://localhost:5000/api/check-visit", {
        userId: selectedUser._id,
        membershipIds: selectedBookings.primary,
        familyIds: selectedBookings.family,
      });

      toast.success("Visit processed successfully!");

      // Refresh user data
      const res = await axios.get(
        `http://localhost:5000/api/admin/user?phone=${phone}`,
      );
      setSelectedUser(res.data);
    } catch (err) {
      toast.error("Error processing visit.");
    } finally {
      setIsCheckingIn(false);
    }
  };

  const confirmCashPayment = async (
    membershipId,
    isFamily = false,
    familyMemberId,
  ) => {
    try {
      await axios.post("http://localhost:5000/api/confirm-cash-payment", {
        userId: selectedUser._id,
        membershipId: isFamily ? familyMemberId : membershipId,
        isFamily,
      });
      toast.success("Cash payment confirmed!");

      // Refresh user data
      const res = await axios.get(
        `http://localhost:5000/api/admin/user?phone=${phone}`,
      );
      setSelectedUser(res.data);
    } catch (err) {
      toast.error("Error confirming payment.");
    }
  };

  const handleDeleteUser = async () => {
    try {
      await axios.delete("http://localhost:5000/api/admin/delete-user", {
        data: { userId: selectedUser._id },
      });
      toast.success("User deleted successfully!");
      setIsModalOpen(false);
      setSelectedUser(null);
    } catch (err) {
      toast.error("Error deleting user");
    }
  };

  // Calculate time remaining for a session
  const calculateTimeRemaining = (sessionStart) => {
    if (!sessionStart) return null;

    const start = dayjs.utc(sessionStart);
    const now = dayjs.utc();
    const end = start.add(1, "hour");
    const diff = end.diff(now);

    if (diff <= 0) return "Expired";

    const dur = dayjs.duration(diff);
    const hours = dur.hours();
    const mins = dur.minutes();
    const secs = dur.seconds();

    return `${hours > 0 ? hours + "h " : ""}${mins}m ${secs}s`;
  };

  // Get session status badge
  const getSessionBadge = (sessionStart) => {
    if (!sessionStart) return null;

    const start = dayjs.utc(sessionStart);
    const now = dayjs.utc();
    const diff = now.diff(start);

    if (diff > 3600000) {
      return (
        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
          Expired
        </span>
      );
    }

    return (
      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
        Active
      </span>
    );
  };

  // Toggle booking selection
  const toggleBookingSelection = (type, id) => {
    setSelectedBookings((prev) => {
      const currentList = prev[type];
      if (currentList.includes(id)) {
        return {
          ...prev,
          [type]: currentList.filter((item) => item !== id),
        };
      } else {
        return {
          ...prev,
          [type]: [...currentList, id],
        };
      }
    });
  };

  // Check if a booking is selected
  const isBookingSelected = (type, id) => {
    return selectedBookings[type].includes(id);
  };

  // Check if any bookings are selected
  const hasSelectedBookings = () => {
    return (
      selectedBookings.primary.length > 0 || selectedBookings.family.length > 0
    );
  };

  return (
    <div className="relative container mx-auto py-12 bg-[#FFFFFF] min-h-screen">
      <h2 className="text-3xl font-bold text-center text-[#CF066C] mb-6">
        Admin Portal
      </h2>

      <div className="mt-8 max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="space-y-4 flex flex-col">
          <div>
            <label className="block text-[#CF066C] font-medium">
              Enter Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter customer phone number"
              className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CF066C]"
            />
          </div>
          <button
            onClick={handleSearch}
            className="mt-4 w-full py-2 bg-[#CF066C] text-white rounded-full hover:bg-[#EDEC25] hover:text-[#CF066C] transition"
          >
            Search Customer
          </button>
          <button
            onClick={() => setShowBookingsModal(true)}
            className="mt-4 w-full py-2 bg-[#EDEC25] text-dark rounded-full hover:bg-[#EDEC25] hover:text-[#CF066C] transition"
          >
            View Today's Bookings
          </button>
        </div>

        {isModalOpen && selectedUser && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg overflow-y-auto max-h-[80vh]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-[#CF066C]">
                  {selectedUser.name}'s Profile
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
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

              <div className="flex items-center mb-6">
                {selectedUser.photo && (
                  <img
                    src={selectedUser.photo}
                    alt="Primary Member"
                    className="w-16 h-16 rounded-full mr-4 border-2 border-[#CF066C]"
                  />
                )}
                <div>
                  <p className="font-semibold">{selectedUser.name}</p>
                  <p className="text-gray-600">{selectedUser.phone}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Total Members</p>
                  <p className="font-bold text-lg">
                    {1 + (selectedUser.family ? selectedUser.family.length : 0)}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Selected Bookings</p>
                  <p className="font-bold text-lg">
                    {selectedBookings.primary.length +
                      selectedBookings.family.length}
                  </p>
                </div>
              </div>

              <h4 className="text-xl font-bold text-[#CF066C] mb-3 border-b pb-2">
                Memberships
              </h4>

              {selectedUser.memberships
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map((m, idx) => (
                  <div
                    key={idx}
                    className={`mt-4 border rounded-lg p-4 ${
                      isBookingSelected("primary", m._id)
                        ? "border-[#CF066C] bg-rose-50"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          checked={isBookingSelected("primary", m._id)}
                          onChange={() =>
                            toggleBookingSelection("primary", m._id)
                          }
                          className="mt-1 mr-3 h-5 w-5 text-[#CF066C] rounded focus:ring-[#CF066C]"
                        />
                        <div>
                          <p className="font-semibold">{m.tier}</p>
                          {m.tier === "walk-in" && (
                            <div className="mt-1">
                              <p className="text-sm">
                                <span className="text-gray-600">Adults:</span>{" "}
                                {m?.numAdults || 0}
                              </p>
                              <p className="text-sm">
                                <span className="text-gray-600">Children:</span>{" "}
                                {m?.numChildren || 0}
                              </p>
                              <p className="text-sm">
                                <span className="text-gray-600">Total:</span> $
                                {(
                                  m?.numAdults * 7 +
                                  m?.numChildren * 3.5
                                ).toFixed(2)}
                              </p>
                              <p className="text-sm mt-2">
                                <span className="text-gray-600">
                                  Visits Left:
                                </span>{" "}
                                {m.visitsLeft === Number.MAX_SAFE_INTEGER
                                  ? "Unlimited"
                                  : m.visitsLeft <= 0
                                  ? "Maxed Out"
                                  : m.visitsLeft}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm">
                          {new Date(m.createdAt).toLocaleDateString()}
                        </p>
                        <div className="mt-1">
                          {m.paymentStatus === "active" ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              Paid
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                              {m.paymentStatus}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {m.tier === "walk-in" && (
                      <div className="mt-3 pl-8">
                        <div className="flex justify-between items-center">
                          <p className="text-sm">
                            <span className="text-gray-600">Expires:</span>{" "}
                            {new Date(m.expiry).toLocaleDateString("en-GB", {
                              timeZone: "UTC",
                            })}
                          </p>

                          {m.sessionStart && getSessionBadge(m.sessionStart)}
                        </div>

                        {m.sessionStart && (
                          <div className="mt-2 bg-blue-50 p-2 rounded">
                            <p className="text-xs text-gray-600">
                              Session started at
                            </p>
                            <p className="font-medium">
                              {dayjs.utc(m.sessionStart).format("h:mm A")}
                            </p>
                            <p className="text-xs mt-1">
                              <span className="text-gray-600">
                                Time remaining:
                              </span>{" "}
                              <span className="font-medium">
                                {calculateTimeRemaining(m.sessionStart)}
                              </span>
                            </p>
                          </div>
                        )}

                        {m.paymentStatus === "pending" && (
                          <button
                            onClick={() => confirmCashPayment(m._id)}
                            className="mt-3 w-full py-1 bg-green-500 text-white rounded hover:bg-green-600 transition text-sm"
                          >
                            Confirm Payment
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}

              <h4 className="text-xl font-bold text-[#CF066C] mt-6 mb-3 border-b pb-2">
                Family Members
              </h4>

              {selectedUser.family && selectedUser.family.length > 0 ? (
                selectedUser.family.map((member, idx) => (
                  <div
                    key={idx}
                    className={`mt-4 border rounded-lg p-4 ${
                      isBookingSelected("family", member._id)
                        ? "border-[#CF066C] bg-rose-50"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        checked={isBookingSelected("family", member._id)}
                        onChange={() =>
                          toggleBookingSelection("family", member._id)
                        }
                        className="mt-1 mr-3 h-5 w-5 text-[#CF066C] rounded focus:ring-[#CF066C]"
                      />

                      {member.photo && (
                        <img
                          src={member.photo}
                          alt={member.name}
                          className="w-12 h-12 rounded-full mr-3 border border-gray-300"
                        />
                      )}

                      <div className="flex-1">
                        <div className="flex justify-between">
                          <div>
                            <p className="font-semibold">{member.name}</p>
                            <p className="text-sm text-gray-600">
                              {member.relationship}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-sm">{member.tier}</p>
                            {member.paymentStatus === "active" ? (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                Paid
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                Pending
                              </span>
                            )}
                          </div>
                        </div>

                        {member.tier === "walk-in" && (
                          <div className="mt-3">
                            <div className="flex justify-between items-center">
                              <p className="text-sm">
                                <span className="text-gray-600">Expires:</span>{" "}
                                {new Date(member.expiry).toLocaleDateString(
                                  "en-GB",
                                  {
                                    timeZone: "UTC",
                                  },
                                )}
                              </p>

                              {member.sessionStart &&
                                getSessionBadge(member.sessionStart)}
                            </div>

                            {member.sessionStart && (
                              <div className="mt-2 bg-blue-50 p-2 rounded">
                                <p className="text-xs text-gray-600">
                                  Session started at
                                </p>
                                <p className="font-medium">
                                  {dayjs
                                    .utc(member.sessionStart)
                                    .format("h:mm A")}
                                </p>
                                <p className="text-xs mt-1">
                                  <span className="text-gray-600">
                                    Time remaining:
                                  </span>{" "}
                                  <span className="font-medium">
                                    {calculateTimeRemaining(
                                      member.sessionStart,
                                    )}
                                  </span>
                                </p>
                              </div>
                            )}

                            {member.paymentStatus === "pending" && (
                              <button
                                onClick={() =>
                                  confirmCashPayment(null, true, member._id)
                                }
                                className="mt-3 w-full py-1 bg-green-500 text-white rounded hover:bg-green-600 transition text-sm"
                              >
                                Confirm Payment
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No family members found
                </p>
              )}

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={checkVisit}
                  disabled={isCheckingIn || !hasSelectedBookings()}
                  className={`px-4 py-2 rounded-md transition ${
                    isCheckingIn || !hasSelectedBookings()
                      ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                      : "bg-[#CF066C] text-white hover:bg-[#EDEC25] hover:text-[#CF066C]"
                  }`}
                >
                  {isCheckingIn
                    ? "Processing..."
                    : `Check Selected (${
                        selectedBookings.primary.length +
                        selectedBookings.family.length
                      })`}
                </button>

                {selectedUser.paymentStatus === "expired" && (
                  <button
                    onClick={handleDeleteUser}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                  >
                    Delete Account
                  </button>
                )}

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Walk-in Bookings Modal */}
      {showBookingsModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-6xl w-full max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-[#CF066C]">
                Today's Walk-in Bookings
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
              <div className="text-center py-10">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 mx-auto text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <p className="mt-4 text-gray-500">No bookings for today</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Booking Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment
                      </th>
                      {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th> */}
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
                          <td className="px-6 py-4">
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
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {booking.user.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {booking.user.phone}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {new Date(
                                booking.membership.createdAt,
                              ).toLocaleDateString()}
                              <span className="text-xs text-gray-500 ml-2">
                                {new Date(
                                  booking.membership.createdAt,
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">
                              Adults: {booking.membership.numAdults}
                              <span className="mx-1">•</span>
                              Children: {booking.membership.numChildren}
                            </div>
                            <div className="text-sm">
                              Expires:{" "}
                              {new Date(
                                booking.membership.expiry,
                              ).toLocaleDateString("en-GB")}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold">
                              $
                              {(
                                booking.membership.numAdults * 7 +
                                booking.membership.numChildren * 3.5
                              ).toFixed(2)}
                            </div>
                            <div className="mt-1">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  booking.membership.paymentStatus === "active"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {booking.membership.paymentStatus}
                              </span>
                            </div>
                          </td>
                          {/* <td className="px-6 py-4">
                            <button
                              onClick={() => {
                                setPhone(booking.user.phone);
                                setShowBookingsModal(false);
                                setTimeout(handleSearch, 300);
                              }}
                              className="text-sm text-[#CF066C] hover:underline"
                            >
                              View Details
                            </button>
                          </td> */}
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
