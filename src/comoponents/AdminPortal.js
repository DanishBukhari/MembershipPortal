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
  const [tick, setTick] = useState(Date.now());
  console.log(activeSessions)

  // Fetch all walk-in bookings
  useEffect(() => {
    const fetchWalkInBookings = async () => {
      try {
        const res = await axios.get("https://membership-latest-d577860ce51a.herokuapp.com/api/admin/walk-ins");
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
    selectedUser.memberships.forEach((m) => {
      if (m.sessionStart) {
        sessions[`primary-${m._id}`] = {
          sessionStart: m.sessionStart,
          sessionMaxHours: m.sessionMaxHours,
          tier: m.tier,
          name: selectedUser.name,
        };
      }
    });
    selectedUser.family.forEach((f) => {
      if (f.sessionStart) {
        sessions[`family-${f._id}`] = {
          sessionStart: f.sessionStart,
          sessionMaxHours: f.sessionMaxHours,
          tier: f.tier,
          name: f.name,
        };
      }
    });
    setActiveSessions(sessions);
    setSelectedBookings({ primary: [], family: [] });
  }, [selectedUser]);

  // Real-time tick for timers
  useEffect(() => {
    const interval = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = async () => {
    try {
      const res = await axios.get(
        `https://membership-latest-d577860ce51a.herokuapp.com/api/admin/user?phone=${phone}`,
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
      const res = await axios.post("https://membership-latest-d577860ce51a.herokuapp.com/api/check-visit", {
        userId: selectedUser._id,
        membershipIds: selectedBookings.primary,
        familyIds: selectedBookings.family,
      });
      if (res.data.success) {
        toast.success("Visit processed successfully!");
        const newSessions = {};
        res.data.sessions.forEach((session) => {
          newSessions[session.isFamily ? `family-${session.id}` : `primary-${session.id}`] = {
            sessionStart: session.sessionStart,
            sessionMaxHours: session.sessionMaxHours,
            tier: session.tier,
            name: session.name || selectedUser.name,
          };
        });
        setActiveSessions((prev) => ({ ...prev, ...newSessions }));
      } else {
        toast.error(res.data.message);
        if (res.data.errors) {
          res.data.errors.forEach(err => toast.error(err));
        }
      }
      const refreshRes = await axios.get(
        `https://membership-latest-d577860ce51a.herokuapp.com/api/admin/user?phone=${phone}`,
      );
      setSelectedUser(refreshRes.data);
    } catch (err) {
      if (err.response && err.response.status === 400) {
        toast.error(err.response.data.message);
        if (err.response.data.errors) {
          err.response.data.errors.forEach(e => toast.error(e));
        }
      } else {
        toast.error("Error processing visit.");
      }
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
      await axios.post("https://membership-latest-d577860ce51a.herokuapp.com/api/confirm-cash-payment", {
        userId: selectedUser._id,
        membershipId: isFamily ? familyMemberId : membershipId,
        isFamily,
      });
      toast.success("Cash payment confirmed!");
      const res = await axios.get(
        `https://membership-latest-d577860ce51a.herokuapp.com/api/admin/user?phone=${phone}`,
      );
      setSelectedUser(res.data);
    } catch (err) {
      toast.error("Error confirming payment.");
    }
  };

  const handleDeleteUser = async () => {
    try {
      await axios.delete("https://membership-latest-d577860ce51a.herokuapp.com/api/admin/delete-user", {
        data: { userId: selectedUser._id },
      });
      toast.success("User deleted successfully!");
      setIsModalOpen(false);
      setSelectedUser(null);
    } catch (err) {
      toast.error("Error deleting user");
    }
  };

  const refreshUser = async () => {
    try {
      const res = await axios.get(
        `https://membership-latest-d577860ce51a.herokuapp.com/api/admin/user?phone=${phone}`,
      );
      setSelectedUser(res.data);
      toast.success("Status updated");
    } catch (err) {
      toast.error("Error refreshing user");
    }
  };

  const calculateRemainingTime = (sessionStart, sessionMaxHours) => {
    if (!sessionStart) return null;
    if (sessionMaxHours === null) return "Unlimited";
    const timePassed = tick - new Date(sessionStart).getTime();
    const totalMs = (sessionMaxHours || 1) * 3600000;
    const remainingMs = totalMs - timePassed;
    if (remainingMs <= 0) return "Expired";
    const dur = dayjs.duration(remainingMs);
    const mins = String(dur.minutes()).padStart(2, "0");
    const secs = String(dur.seconds()).padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const getRemainingColor = (sessionStart, sessionMaxHours) => {
    if (sessionMaxHours === null || calculateRemainingTime(sessionStart, sessionMaxHours) === "Unlimited") return "green-600";
    const timePassed = tick - new Date(sessionStart).getTime();
    const totalMs = (sessionMaxHours || 1) * 3600000;
    const remainingMs = totalMs - timePassed;
    return remainingMs <= 0 ? "red-600" : remainingMs <= 600000 ? "yellow-600" : "green-600";
  };

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

  const isBookingSelected = (type, id) => {
    return selectedBookings[type].includes(id);
  };

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
              className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring[#CF066C]"
            />
          </div>
          <button
            onClick={handleSearch}
            className="mt-4 w-full py-2 text-white rounded-full bg-[#CF066C] hover:bg-[#EDEC25] hover:text-[#000] transition"
          >
            Search Customer
          </button>
          <button
            onClick={() => setShowBookingsModal(true)}
            className="mt-4 w-full py-2 bg-[#EDEC25] text-dark rounded-full bg-[#EDEC25] hover:bg-[#CF066C] hover:text-[#FFF] transition"
          >
            View Today's Bookings
          </button>
        </div>
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
                  className="w-16 h-16 rounded-full mr-4 border-2 border[#CF066C]"
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
            {selectedUser.memberships && Array.isArray(selectedUser.memberships) && selectedUser.memberships.length > 0 ? (
              selectedUser.memberships
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map((m, idx) => (
                  <div
                    key={idx}
                    className={`mt-4 border rounded-lg p-4 ${isBookingSelected("primary", m._id)
                      ? "border[#CF066C] bg-rose-50"
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
                          className="mt-1 mr-3 h-5 w-5 text-[#CF066C] rounded focus:ring[#CF066C]"
                        />
                        <div>
                          <p className="font-semibold">{m.tier.toUpperCase()}</p>
                          <p className="text-sm">
                            <span className="text-gray-600">Hours Left:</span>{" "}
                            {m.hoursLeft === Number.MAX_SAFE_INTEGER
                              ? "Unlimited"
                              : m.hoursLeft <= 0
                                ? "Maxed Out"
                                : m.hoursLeft}
                          </p>
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
                              {dayjs.utc(m.sessionStart).format("h:mm A")} on{" "}
                              {dayjs.utc(m.sessionStart).format("DD/MM/YYYY")}
                            </p>
                            <p className={`text-${getRemainingColor(m.sessionStart, m.sessionMaxHours)} font-bold`}>
                              Time Remaining: {calculateRemainingTime(m.sessionStart, m.sessionMaxHours)}
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
                    <div className="mt-2 pl-8">
                      <h5 className="text-sm font-bold text-[#CF066C]">Assigned Days</h5>
                      {m.assignedDays.length === 0 ? <p className="text-xs text-gray-500">No assignments</p> : 
                      <ul className="text-xs list-disc pl-4">
                        {m.assignedDays.filter(a => a.assignedHours > 0).map((a, i) => (
                          <li key={i}>{new Date(a.day).toLocaleDateString("en-GB")}: {a.assignedHours} hours</li>
                        ))}
                      </ul>
                      }
                    </div>
                    <div className="mt-2 pl-8">
                      <h5 className="text-sm font-bold text-[#CF066C]">Days Visited</h5>
                      {m.visitedDays.length === 0 ? <p className="text-xs text-gray-500">No visits recorded</p> : 
                      <ul className="text-xs list-disc pl-4">
                        {m.visitedDays.slice(0, m.tier === "leader" ? 5 : m.tier === "supporter" ? 3 : Infinity).map((v, i) => (
                          <li key={i}>
                            {i + 1 === 1 ? "First" : i + 1 === 2 ? "Second" : `${i + 1}th`} visit at: {new Date(v.startTime).toLocaleTimeString("en-GB")} on {new Date(v.day).toLocaleDateString("en-GB")}
                          </li>
                        ))}
                      </ul>
                      }
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-gray-500 text-center py-4">
                No memberships found
              </p>
            )}
            <h4 className="text-xl font-bold text-[#CF066C] mt-6 mb-3 border-b pb-2">
              Family Members
            </h4>
            {selectedUser.family && selectedUser.family.length > 0 ? (
              selectedUser.family.map((member, idx) => (
                <div
                  key={idx}
                  className={`mt-4 border rounded-lg p-4 ${isBookingSelected("family", member._id)
                    ? "border[#CF066C] bg-rose-50"
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
                      className="mt-1 mr-3 h-5 w-5 text-[#CF066C] rounded focus:ring[#CF066C]"
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
                          <p className="text-sm">{member.tier.toUpperCase()}</p>
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
                                  .format("h:mm A")} on{" "}
                                {dayjs.utc(member.sessionStart).format("DD/MM/YYYY")}
                              </p>
                              <p className={`text-${getRemainingColor(member.sessionStart, member.sessionMaxHours)} font-bold`}>
                                Time Remaining: {calculateRemainingTime(member.sessionStart, member.sessionMaxHours)}
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
                  <div className="mt-2">
                    <h5 className="text-sm font-bold text-[#CF066C]">Assigned Days</h5>
                    {member.assignedDays.length === 0 ? <p className="text-xs text-gray-500">No assignments</p> : 
                      <ul className="text-xs list-disc pl-4">
                        {member.assignedDays.filter(a => a.assignedHours > 0).map((a, i) => (
                          <li key={i}>{new Date(a.day).toLocaleDateString("en-GB")}: {a.assignedHours} hours</li>
                        ))}
                      </ul>
                    }
                  </div>
                  <div className="mt-2">
                    <h5 className="text-sm font-bold text-[#CF066C]">Days Visited</h5>
                    {member.visitedDays.length === 0 ? <p className="text-xs text-gray-500">No visits recorded</p> : 
                      <ul className="text-xs list-disc pl-4">
                        {member.visitedDays.slice(0, member.tier === "leader" ? 5 : member.tier === "supporter" ? 3 : Infinity).map((v, i) => (
                          <li key={i}>
                            {i + 1 === 1 ? "First" : i + 1 === 2 ? "Second" : `${i + 1}th`} visit at: {new Date(v.startTime).toLocaleTimeString("en-GB")} on {new Date(v.day).toLocaleDateString("en-GB")}
                          </li>
                        ))}
                      </ul>
                    }
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
                className={`px-4 py-2 rounded-md transition ${isCheckingIn || !hasSelectedBookings()
                  ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                  : "bg-[#CF066C] text-white hover:bg-[#EDEC25] hover:text-[#CF066C]"
                  }`}
              >
                {isCheckingIn
                  ? "Processing..."
                  : `Check Selected (${selectedBookings.primary.length +
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
                onClick={refreshUser}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
              >
                Refresh Status
              </button>
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
            {walkInBookings.length > 0 ? (
              <table className="min-w-full table-auto border border-gray-300">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="px-4 py-2 border-b">Name</th>
                    <th className="px-4 py-2 border-b">Phone</th>
                    <th className="px-4 py-2 border-b">Tier</th>
                    <th className="px-4 py-2 border-b">Status</th>
                    <th className="px-4 py-2 border-b">Expiry</th>
                    <th className="px-4 py-2 border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {walkInBookings.map((booking, idx) => (
                    <tr key={idx} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2 border-b">{booking.name}</td>
                      <td className="px-4 py-2 border-b">{booking.phone}</td>
                      <td className="px-4 py-2 border-b">{booking.tier.toUpperCase()}</td>
                      <td className="px-4 py-2 border-b">
                        {booking.paymentStatus === "active" ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Paid
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 border-b">
                        {new Date(booking.expiry).toLocaleDateString("en-GB", {
                          timeZone: "UTC",
                        })}
                      </td>
                      <td className="px-4 py-2 border-b">
                        {booking.paymentStatus === "pending" && (
                          <button
                            onClick={() =>
                              confirmCashPayment(
                                booking.isFamily ? null : booking.membershipId,
                                booking.isFamily,
                                booking.isFamily ? booking.membershipId : null
                              )
                            }
                            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition text-sm"
                          >
                            Confirm Payment
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No walk-in bookings for today
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPortal;