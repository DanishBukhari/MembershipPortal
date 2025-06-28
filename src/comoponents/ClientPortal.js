import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Stripe from "stripe";

const stripe = new Stripe(
  process.env.REACT_APP_STRIPE_SECRET_KEY)

const ClientPortal = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("home");
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [address, setAddress] = useState("");
  const [age, setAge] = useState("");
  const [family, setFamily] = useState([]);
  const [familyMembersToAdd, setFamilyMembersToAdd] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [familyMember, setFamilyMember] = useState({
    name: "",
    age: "",
    relationship: "",
    photo: null,
    tier: "supporter",
  });
  const [editFamilyMember, setEditFamilyMember] = useState(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [subscription, setSubscription] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [prices, setPrices] = useState({});

  const tierOrder = ["supporter", "leader", "legacy-maker"];

  const getStripePriceId = (tier, isDiscounted = false) => {
    const priceMap = {
      "legacy-maker": {
        full: "price_1ReTLmBQRG3WrNBRzfsYqcLa",
        discounted: "price_1ReTaABQRG3WrNBRYO5r0WXb",
      },
      leader: {
        full: "price_1ReTN8BQRG3WrNBRrarZEwBU",
        discounted: "price_1ReTYtBQRG3WrNBRmHQ5uhM7",
      },
      supporter: {
        full: "price_1ReTPxBQRG3WrNBRVtCCZMwX",
        discounted: "price_1ReTXSBQRG3WrNBRDsi504MZ",
      },
    };
    return isDiscounted ? priceMap[tier].discounted : priceMap[tier].full;
  };
  
  useEffect(() => {
    const fetchPrices = async () => {
        try {
          const priceIds = [
            getStripePriceId("supporter"),
            getStripePriceId("supporter", true),
            getStripePriceId("leader"),
            getStripePriceId("leader", true),
            getStripePriceId("legacy-maker"),
            getStripePriceId("legacy-maker", true),
          ];
          const pricePromises = priceIds.map((id) => stripe.prices.retrieve(id));
          const priceData = await Promise.all(pricePromises);
          const priceMap = {};
          priceData.forEach((price) => {
            const tier = price.nickname || price.product.name;
            const isDiscounted = price.id.includes("discounted");
            priceMap[price.id] = {
              amount: price.unit_amount / 100,
              currency: price.currency,
              tier,
              isDiscounted,
            };
          });
          setPrices(priceMap);
        } catch (err) {
          console.error("Error fetching prices:", err);
          toast.error("Failed to load subscription prices.");
        }
      };
    if (token) {
      axios
        .get("https://membershiportal-c3069d3050e8.herokuapp.com/api/user", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          console.log("User data fetched:", res.data);
          setUser(res.data);
          setAddress(res.data.address || "");
          setAge(res.data.age || "");
          setFamily(res.data.family || []);
          setPhoto(res.data.photo || null);
          if (!res.data.profileComplete) {
            setShowProfileCompletion(true);
            setFamilyMembersToAdd(
              res.data.familyTiers.map((tier) => ({
                tier,
                name: "",
                relationship: "",
                photo: null,
              }))
            );
          }
          fetchSubscription(token);
          fetchInvoices(token);
          fetchPrices();
        })
        .catch((err) => {
          console.error(err);
          if (err.response?.status === 401) {
            localStorage.removeItem("token");
            navigate("/login");
          }
        });
    } else {
      navigate("/login");
    }
  }, [navigate, token]);

  const getPrice = (tier, isPrimary) => {
    const priceId = getStripePriceId(tier, !isPrimary);
    const price = prices[priceId];
    return price ? price.amount : 0;
  };

  const fetchSubscription = async (tokenValue) => {
    try {
      const res = await axios.get(
        "https://membershiportal-c3069d3050e8.herokuapp.com/api/subscription",
        {
          headers: { Authorization: `Bearer ${tokenValue}` },
        }
      );
      setSubscription(res.data);
    } catch (err) {
      console.error("Error fetching subscription:", err);
    }
  };

  const fetchInvoices = async (tokenValue) => {
    try {
      const res = await axios.get(
        "https://membershiportal-c3069d3050e8.herokuapp.com/api/invoices",
        {
          headers: { Authorization: `Bearer ${tokenValue}` },
        }
      );
      setInvoices(res.data.data);
    } catch (err) {
      console.error("Error fetching invoices:", err);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("photo", file);
    try {
      const res = await axios.post(
        "https://membershiportal-c3069d3050e8.herokuapp.com/api/upload-photo",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setPhoto(res.data.photoUrl);
      toast.success("Photo uploaded successfully!");
    } catch (err) {
      toast.error("Error uploading photo.");
    }
  };

  const handleFamilyPhotoUpload = async (e, index) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("photo", file);
    try {
      const res = await axios.post(
        "https://membershiportal-c3069d3050e8.herokuapp.com/api/upload-photo",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      if (index === -1) {
        setFamilyMember({ ...familyMember, photo: res.data.photoUrl });
      } else if (index === -2) {
        setEditFamilyMember({ ...editFamilyMember, photo: res.data.photoUrl });
      } else {
        const updatedMembers = [...familyMembersToAdd];
        updatedMembers[index].photo = res.data.photoUrl;
        setFamilyMembersToAdd(updatedMembers);
      }
      toast.success("Photo uploaded successfully!");
    } catch (err) {
      toast.error("Error uploading photo.");
    }
  };

  const updateProfile = async () => {
    if (
      familyMembersToAdd.some((m) => !m.name || !m.relationship || !m.photo)
    ) {
      toast.error("All fields for family members are required.");
      return;
    }
    try {
      await axios.put(
        "https://membershiportal-c3069d3050e8.herokuapp.com/api/user",
        {
          email: user.email,
          photo,
          address,
          age,
          profileComplete: true,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      for (const member of familyMembersToAdd) {
        await axios.post(
          "https://membershiportal-c3069d3050e8.herokuapp.com/api/family",
          {
            name: member.name,
            relationship: member.relationship,
            photo: member.photo,
            tier: member.tier,
            userId: user._id,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }
      setShowProfileCompletion(false);
      toast.success("Profile updated successfully!");
      const res = await axios.get(
        "https://membershiportal-c3069d3050e8.herokuapp.com/api/user",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUser(res.data);
      setFamily(res.data.family);
    } catch (err) {
      toast.error("Error updating profile.");
    }
  };

  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    try {
      await axios.post(
        "https://membershiportal-c3069d3050e8.herokuapp.com/api/change-password",
        {
          currentPassword,
          newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error("Error changing password.");
    }
  };

  const addFamilyMember = async () => {
    if (
      !familyMember.name ||
      !familyMember.relationship ||
      !familyMember.photo
    ) {
      toast.error("All fields are required.");
      return;
    }
    try {
      const res = await axios.post(
        "https://membershiportal-c3069d3050e8.herokuapp.com/api/family",
        {
          ...familyMember,
          userId: user._id,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setFamily([...family, res.data]);
      toast.success("Family member added successfully!");
      closeModal();
    } catch (err) {
      toast.error("Error adding family member.");
    }
  };

  const updateFamilyMember = async () => {
    if (
      !editFamilyMember.name ||
      !editFamilyMember.relationship ||
      !editFamilyMember.photo
    ) {
      toast.error("All fields are required.");
      return;
    }
    try {
      const res = await axios.put(
        "https://membershiportal-c3069d3050e8.herokuapp.com/api/family",
        {
          ...editFamilyMember,
          userId: user._id,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const updatedFamily = family.map((member) =>
        member._id === editFamilyMember._id ? res.data : member
      );
      setFamily(updatedFamily);
      toast.success("Family member updated successfully!");
      closeEditModal();
    } catch (err) {
      toast.error("Error updating family member.");
    }
  };

  const changeTier = async (currentTier, newTier, memberId) => {
    try {
      const response = await axios.post(
        "https://membershiportal-c3069d3050e8.herokuapp.com/api/subscription/change-tier",
        { currentTier, newTier, memberId },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data.success) {
        toast.success("Tier changed successfully!");
        const userRes = await axios.get(
          "https://membershiportal-c3069d3050e8.herokuapp.com/api/user",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setUser(userRes.data);
        setFamily(userRes.data.family);
        fetchSubscription(token);
        closeSubscriptionModal();
      } else {
        throw new Error("Failed to change tier");
      }
    } catch (error) {
      console.error("Change tier error:", error);
      toast.error("Error changing tier: " + (error.response?.data?.error || error.message));
    }
  };

  const cancelMemberSubscription = async (member) => {
    if (
      window.confirm(
        `Are you sure you want to cancel the subscription for ${member.name}? ${
          member.isPrimary ? "This will cancel the entire subscription." : ""
        }`
      )
    ) {
      try {
        await axios.post(
          "https://membershiportal-c3069d3050e8.herokuapp.com/api/subscription/cancel-member",
          {
            memberId: member.isPrimary ? null : member.id,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        toast.success(`Subscription cancelled for ${member.name}.`);
        const res = await axios.get(
          "https://membershiportal-c3069d3050e8.herokuapp.com/api/user",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setUser(res.data);
        setFamily(res.data.family);
        fetchSubscription(token);
        closeSubscriptionModal();
      } catch (err) {
        toast.error("Error cancelling member subscription.");
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setFamilyMember({
      name: "",
      age: "",
      relationship: "",
      photo: null,
      tier: "supporter",
    });
  };

  const openEditModal = (member) => {
    setEditFamilyMember(member);
    setIsEditModalOpen(true);
  };
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditFamilyMember(null);
  };

  const openSubscriptionModal = (member) => {
    setSelectedMember(member);
    setIsSubscriptionModalOpen(true);
  };

  const closeSubscriptionModal = () => {
    setIsSubscriptionModalOpen(false);
    setSelectedMember(null);
  };

  if (!user) return <div className="text-center py-12">Loading...</div>;

  const allMembers = [
    ...(user.memberships.length > 0
      ? [
          {
            id: user._id,
            name: user.name,
            tier: user.memberships[0].tier,
            isPrimary: true,
          },
        ]
      : []),
    ...family.map((member) => ({
      id: member._id,
      name: member.name,
      tier: member.tier,
      isPrimary: false,
    })),
  ];

  return (
    <div className="flex min-h-screen bg-[#FFFFFF]">
      <aside className="w-60 p-6 bg-gray-200 flex flex-col items-start">
        <img src="cropped-logo.png" alt="Logo" className="mb-6 mx-auto w-24" />
        <nav className="w-full">
          <ul>
            <li>
              <button
                onClick={() => setActiveTab("home")}
                className={`block w-full text-left py-2 px-4 ${
                  activeTab === "home"
                    ? "bg-[#CF066C] text-white"
                    : "bg-gray-200"
                } rounded-md mb-5`}
              >
                Home
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab("profile")}
                className={`block w-full text-left py-2 px-4 ${
                  activeTab === "profile"
                    ? "bg-[#CF066C] text-white"
                    : "bg-gray-200"
                } rounded-md mb-5`}
              >
                Profile
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab("settings")}
                className={`block w-full text-left py-2 px-4 ${
                  activeTab === "settings"
                    ? "bg-[#CF066C] text-white"
                    : "bg-gray-200"
                } rounded-md mb-5`}
              >
                Settings
              </button>
            </li>
          </ul>
        </nav>
      </aside>
      <main className="flex-1 p-6">
        <button
          onClick={handleLogout}
          className="fixed bottom-4 left-4 py-2 px-4 bg-red-500 text-white rounded-md hover:bg-red-600 transition w-24"
        >
          Logout
        </button>
        {showProfileCompletion && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div
              className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg overflow-y-auto"
              style={{ height: "80vh" }}
            >
              <h3 className="text-2xl font-bold text-[#CF066C] mb-4">
                Welcome {user.name.split(" ")[0]}! Let's Complete Your Profile
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[#CF066C] font-medium">
                    Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className=" сынtext-[#CF066C] font-medium">
                    Upload Photo
                  </label>
                  <input
                    type="file"
                    onChange={handlePhotoUpload}
                    className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                    required
                  />
                  {photo && (
                    <img
                      src={photo}
                      alt="Profile"
                      className="mt-2 w-24 h-24 rounded-md"
                    />
                  )}
                </div>
                {familyMembersToAdd.map((member, index) => (
                  <div key={index} className="border-t pt-4">
                    <h4 className="text-lg font-bold text-[#CF066C] mb-2">
                      Family Member {index + 1} - {member.tier.toUpperCase()}
                    </h4>
                    <div>
                      <label className="block text-[#CF066C] font-medium">
                        Name
                      </label>
                      <input
                        type="text"
                        value={member.name}
                        onChange={(e) => {
                          const updatedMembers = [...familyMembersToAdd];
                          updatedMembers[index].name = e.target.value;
                          setFamilyMembersToAdd(updatedMembers);
                        }}
                        className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[#CF066C] font-medium">
                        Relationship
                      </label>
                      <input
                        type="text"
                        value={member.relationship}
                        onChange={(e) => {
                          const updatedMembers = [...familyMembersToAdd];
                          updatedMembers[index].relationship = e.target.value;
                          setFamilyMembersToAdd(updatedMembers);
                        }}
                        className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[#CF066C] font-medium">
                        Upload Photo
                      </label>
                      <input
                        type="file"
                        onChange={(e) => handleFamilyPhotoUpload(e, index)}
                        className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                        required
                      />
                      {member.photo && (
                        <img
                          src={member.photo}
                          alt="Family Member"
                          className="mt-2 w-16 h-16 rounded-md"
                        />
                      )}
                    </div>
                  </div>
                ))}
                <button
                  onClick={updateProfile}
                  className="w-full py-2 bg-[#CF066C] text-white rounded-md hover:bg-[#fff] hover:text-[#CF066C] transition duration-300 font-semibold"
                  style={{ border: "1px solid #CF066C" }}
                >
                  Save Profile
                </button>
              </div>
            </div>
          </div>
        )}
        {activeTab === "home" && (
          <div>
            <h3 className="text-xl font-bold text-[#CF066C] mb-4">
              Primary Member
            </h3>
            <div className="mb-4">
              <p>
                <strong>Name:</strong> {user.name}
              </p>
              <p>
                <strong>Email:</strong> {user.email}
              </p>
              <p>
                <strong>Phone:</strong> {user.phone}
              </p>
              <p>
                <strong>Address:</strong> {address || "Not provided"}
              </p>
              {user.photo && (
                <img
                  src={user.photo}
                  alt="Profile"
                  className="w-24 h-24 rounded-md mt-2"
                />
              )}
              {user.memberships.map((m, idx) => (
                <div key={idx} className="mt-2">
                  <p>
                    <strong>Tier:</strong> {m.tier.toUpperCase()}
                  </p>
                  <p>
                    <strong>Visits Left:</strong>{" "}
                    {m.visitsLeft === Infinity
                      ? "Unlimited"
                      : m.visitsLeft === 0
                      ? "Maxed Out"
                      : m.visitsLeft}
                  </p>
                  {m.tier === "walk-in" && m.expiry && (
                    <p>
                      <strong>Expiry:</strong>{" "}
                      {new Date(m.expiry).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <h3 className="text-xl font-bold text-[#CF066C] mb-2">
              Family Members
            </h3>
            {family.length > 0 ? (
              family.map((member, idx) => (
                <div key={idx} className="mt-2 border-t pt-2">
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
                      className="w-16 h-16 rounded-md mt-2"
                    />
                  )}
                  <p>
                    <strong>Tier:</strong> {member.tier.toUpperCase()}
                  </p>
                  <p>
                    <strong>Visits Left:</strong>{" "}
                    {member.visitsLeft === Infinity
                      ? "Unlimited"
                      : member.visitsLeft === 0
                      ? "Maxed Out"
                      : member.visitsLeft}
                  </p>
                  {member.tier === "walk-in" && member.expiry && (
                    <p>
                      <strong>Expiry:</strong>{" "}
                      {new Date(member.expiry).toLocaleDateString()}
                    </p>
                  )}
                  <button
                    onClick={() => openEditModal(member)}
                    className="mt-2 px-4 py-1 bg-[#5EBAFF] text-white rounded-md hover:bg-[#4CA7E6] transition"
                  >
                    Edit
                  </button>
                </div>
              ))
            ) : (
              <p>No family members added yet.</p>
            )}
            <button
              onClick={openModal}
              className="mt-4 w-80 py-2 bg-[#5EBAFF] text-white rounded-md hover:bg-[#4CA7E6] transition"
            >
              Add Family Member (50% Off)
            </button>
          </div>
        )}
        {activeTab === "profile" && (
          <div>
            <h3 className="text-xl font-bold text-[#CF066C] mb-4">
              Update Profile
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[#CF066C] font-medium">Name</label>
                <input
                  type="text"
                  value={user.name}
                  disabled
                  className="w-80 p-2 mt-1 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-[#CF066C] font-medium">
                  Email
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-80 p-2 mt-1 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-[#CF066C] font-medium">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-80 p-2 mt-1 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-[#CF066C] font-medium">
                  Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-80 p-2 mt-1 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-[#CF066C] font-medium">
                  Upload Photo
                </label>
                <input
                  type="file"
                  onChange={handlePhotoUpload}
                  className="w-80 p-2 mt-1 border border-gray-300 rounded-md"
                />
                {photo && (
                  <img
                    src={photo}
                    alt="Profile"
                    className="mt-2 w-24 h-24 rounded-md"
                  />
                )}
              </div>
              <button
                onClick={updateProfile}
                className="w-80 py-2 bg-[#CF066C] text-white rounded-md hover:bg-[#fff] hover:text-[#CF066C] transition duration-300 font-semibold"
                style={{ border: "1px solid #CF066C" }}
              >
                Update Profile
              </button>
            </div>
            <h3 className="text-xl font-bold text-[#CF066C] mt-6 mb-4">
              Change Password
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[#CF066C] font-medium">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-80 p-2 mt-1 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-[#CF066C] font-medium">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-80 p-2 mt-1 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-[#CF066C] font-medium">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-80 p-2 mt-1 border border-gray-300 rounded-md"
                />
              </div>
              <button
                onClick={changePassword}
                className="w-80 py-2 bg-[#CF066C] text-white rounded-md hover:bg-[#fff] hover:text-[#CF066C] transition duration-300 font-semibold"
                style={{ border: "1px solid #CF066C" }}
              >
                Change Password
              </button>
            </div>
          </div>
        )}
        {activeTab === "settings" && (
          <div>
            <h3 className="text-xl font-bold text-[#CF066C] mb-4">Settings</h3>
            {subscription ? (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-[#CF066C] mb-4">
                  Subscriptions
                </h4>
                <div className="grid gap-4">
                  {allMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 bg-gray-100 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                    >
                      <div>
                        <p className="text-base font-medium text-gray-800">
                          <strong>{member.name}</strong>{" "}
                          {member.isPrimary ? "(Primary)" : ""}
                        </p>
                        <p className="text-sm text-gray-600">
                          Tier: {member.tier.toUpperCase()}
                        </p>
                      </div>
                      <button
                        onClick={() => openSubscriptionModal(member)}
                        className="px-4 py-2 bg-[#5EBAFF] text-white rounded-md hover:bg-[#4CA7E6] transition font-semibold"
                      >
                        Change Subscription
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-red-500">
                Your subscription has been canceled. Please contact support to
                reactivate.
              </p>
            )}
            <h4 className="text-lg font-semibold text-[#CF066C] mb-2">
              Invoices
            </h4>
            {invoices.map((invoice, idx) => (
              <div key={idx} className="mb-2">
                <p>
                  <strong>Date:</strong>{" "}
                  {new Date(invoice.created * 1000).toLocaleDateString()}
                </p>
                <p>
                  <strong>Amount:</strong> $
                  {(invoice.amount_paid / 100).toFixed(2)} AUD
                </p>
                <a
                  href={invoice.hosted_invoice_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#CF066C] underline"
                >
                  View Invoice
                </a>
              </div>
            ))}
          </div>
        )}
      </main>
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-2xl font-bold text-[#CF066C] mb-4">
              Add Family Member (50% Off)
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[#CF066C] font-medium">Name</label>
                <input
                  type="text"
                  value={familyMember.name}
                  onChange={(e) =>
                    setFamilyMember({ ...familyMember, name: e.target.value })
                  }
                  className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-[#CF066C] font-medium">Age</label>
                <input
                  type="number"
                  value={familyMember.age}
                  onChange={(e) =>
                    setFamilyMember({ ...familyMember, age: e.target.value })
                  }
                  className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-[#CF066C] font-medium">
                  Relationship
                </label>
                <input
                  type="text"
                  value={familyMember.relationship}
                  onChange={(e) =>
                    setFamilyMember({
                      ...familyMember,
                      relationship: e.target.value,
                    })
                  }
                  className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-[#CF066C] font-medium">Tier</label>
                <select
                  value={familyMember.tier}
                  onChange={(e) =>
                    setFamilyMember({ ...familyMember, tier: e.target.value })
                  }
                  className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                >
                  <option value="supporter">Supporter</option>
                  <option value="leader">Leader</option>
                  <option value="legacy-maker">Legacy Maker</option>
                </select>
              </div>
              <div>
                <label className="block text-[#CF066C] font-medium">
                  Upload Photo
                </label>
                <input
                  type="file"
                  onChange={(e) => handleFamilyPhotoUpload(e, -1)}
                  className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                  required
                />
                {familyMember.photo && (
                  <img
                    src={familyMember.photo}
                    alt="Family Member"
                    className="mt-2 w-16 h-16 rounded-md"
                  />
                )}
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-300 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={addFamilyMember}
                  className="px-4 py-2 bg-[#CF066C] text-white rounded-md"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {isEditModalOpen && editFamilyMember && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-2xl font-bold text-[#CF066C] mb-4">
              Edit Family Member
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[#CF066C] font-medium">Name</label>
                <input
                  type="text"
                  value={editFamilyMember.name}
                  onChange={(e) =>
                    setEditFamilyMember({
                      ...editFamilyMember,
                      name: e.target.value,
                    })
                  }
                  className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-[#CF066C] font-medium">
                  Relationship
                </label>
                <input
                  type="text"
                  value={editFamilyMember.relationship}
                  onChange={(e) =>
                    setEditFamilyMember({
                      ...editFamilyMember,
                      relationship: e.target.value,
                    })
                  }
                  className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-[#CF066C] font-medium">Tier</label>
                <select
                  value={editFamilyMember.tier}
                  onChange={(e) =>
                    setEditFamilyMember({
                      ...editFamilyMember,
                      tier: e.target.value,
                    })
                  }
                  className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                >
                  <option value="supporter">Supporter</option>
                  <option value="leader">Leader</option>
                  <option value="legacy-maker">Legacy Maker</option>
                </select>
              </div>
              <div>
                <label className="block text-[#CF066C] font-medium">
                  Upload Photo
                </label>
                <input
                  type="file"
                  onChange={(e) => handleFamilyPhotoUpload(e, -2)}
                  className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                />
                {editFamilyMember.photo && (
                  <img
                    src={editFamilyMember.photo}
                    alt="Family Member"
                    className="mt-2 w-16 h-16 rounded-md"
                  />
                )}
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={closeEditModal}
                  className="px-4 py-2 bg-gray-300 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={updateFamilyMember}
                  className="px-4 py-2 bg-[#CF066C] text-white rounded-md"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {isSubscriptionModalOpen && selectedMember && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-3xl transform transition-all duration-300 scale-100 hover:scale-105">
            <h3 className="text-3xl font-bold text-[#CF066C] mb-6 text-center">
              Manage Subscription for {selectedMember.name}
            </h3>
            {selectedMember.tier ? (
              <div className="flex justify-between items-start">
                <div className="w-1/3 pr-4">
                  <h4 className="text-lg font-semibold text-[#CF066C] mb-3">
                    Downgrade Options
                  </h4>
                  {tierOrder.slice(0, tierOrder.indexOf(selectedMember.tier))
                    .length > 0 ? (
                    tierOrder
                      .slice(0, tierOrder.indexOf(selectedMember.tier))
                      .map((tier) => (
                        <div
                          key={tier}
                          className="mb-3 bg-gray-50 p-3 rounded-lg shadow-sm hover:bg-gray-100 transition"
                        >
                          <p className="text-sm font-medium text-gray-800">
                            {tier.toUpperCase()}
                          </p>
                          <p className="text-sm text-gray-600">
                            ${getPrice(tier, selectedMember.isPrimary)}/month
                          </p>
                          <button
                            onClick={() =>
                              changeTier(
                                selectedMember.tier,
                                tier,
                                selectedMember.isPrimary
                                  ? null
                                  : selectedMember.id
                              )
                            }
                            className="mt-2 w-full px-3 py-1 bg-[#5EBAFF] text-white rounded-md hover:bg-[#4CA7E6] transition text-sm font-semibold"
                          >
                            Downgrade
                          </button>
                        </div>
                      ))
                  ) : (
                    <p className="text-sm text-gray-500">
                      No downgrade options available.
                    </p>
                  )}
                </div>
                <div className="w-1/3 px-4 border-x border-gray-200">
                  <h4 className="text-lg font-semibold text-[#CF066C] mb-3 text-center">
                    Current Subscription
                  </h4>
                  <div className="bg-[#CF066C] text-white p-4 rounded-lg shadow-md">
                    <p className="text-lg font-bold">
                      {selectedMember.tier.toUpperCase()}
                    </p>
                    <p className="text-base">
                      ${getPrice(selectedMember.tier, selectedMember.isPrimary)}
                      /month
                    </p>
                  </div>
                </div>
                <div className="w-1/3 pl-4">
                  <h4 className="text-lg font-semibold text-[#CF066C] mb-3">
                    Upgrade Options
                  </h4>
                  {tierOrder.slice(tierOrder.indexOf(selectedMember.tier) + 1)
                    .length > 0 ? (
                    tierOrder
                      .slice(tierOrder.indexOf(selectedMember.tier) + 1)
                      .map((tier) => (
                        <div
                          key={tier}
                          className="mb-3 bg-gray-50 p-3 rounded-lg shadow-sm hover:bg-gray-100 transition"
                        >
                          <p className="text-sm font-medium text-gray-800">
                            {tier.toUpperCase()}
                          </p>
                          <p className="text-sm text-gray-600">
                            ${getPrice(tier, selectedMember.isPrimary)}/month
                          </p>
                          <button
                            onClick={() =>
                              changeTier(
                                selectedMember.tier,
                                tier,
                                selectedMember.isPrimary
                                  ? null
                                  : selectedMember.id
                              )
                            }
                            className="mt-2 w-full px-3 py-1 bg-[#5 YeatsBAFF] text-white rounded-md hover:bg-[#4CA7E6] transition text-sm font-semibold"
                          >
                            Upgrade
                          </button>
                        </div>
                      ))
                  ) : (
                    <p className="text-sm text-gray-500">
                      No upgrade options available.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500">
                No current subscription.
              </p>
            )}
            <div className="mt-6 flex justify-center space-x-4">
              {selectedMember.tier && (
                <button
                  onClick={() => cancelMemberSubscription(selectedMember)}
                  className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition font-semibold"
                >
                  Cancel Subscription
                </button>
              )}
              <button
                onClick={closeSubscriptionModal}
                className="px-6 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientPortal;