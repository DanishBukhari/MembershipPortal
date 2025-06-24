import React from "react";
// import {  useEffect, useState } from 'react-router-dom';
import axios from "axios";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const ClientPortal = () => {
  const [user, setUser] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [address, setAddress] = useState("");
  const [family, setFamily] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [familyMember, setFamilyMember] = useState({
    name: "",
    email: "",
    phone: "",
    photo: null,
  });

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios
        .get("https://membershiportal-c3069d3050e8.herokuapp.com/api/user", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setUser(res.data);
          setAddress(res.data.address || "");
          setFamily(res.data.family || []);
        })
        .catch((err) => {
          console.error(err);
          if (err.response?.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "/login";
          }
        });
    } else {
      window.location.href = "/login";
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFamilyMember({ ...familyMember, [name]: value });
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
      toast.error("Error uploading photo. Please try again.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleFamilyPhotoUpload = async (e) => {
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
      setFamilyMember({ ...familyMember, photo: res.data.photoUrl });
    } catch (err) {
      toast.error("Error uploading photo. Please try again.");
    }
  };

  const addFamilyMember = async () => {
    try {
      const res = await axios.post("https://membershiportal-c3069d3050e8.herokuapp.com/api/family", {
        ...familyMember,
        userId: user._id,
        tier: user.tier,
      });
      setFamily([...family, res.data]);
      toast.success("Family member added successfully!");
      closeModal();
    } catch (err) {
      toast.error("Error adding family member. Please try again.");
    }
  };

  const renewSubscription = async (userId, familyMemberId = null) => {
    try {
      const res = await axios.post("https://membershiportal-c3069d3050e8.herokuapp.com/api/renew", {
        userId,
        familyMemberId
      });
      if (res.data.success) {
        toast.success("Subscription renewed successfully!");
        // Refresh user data
        const token = localStorage.getItem("token");
        const userRes = await axios.get("https://membershiportal-c3069d3050e8.herokuapp.com/api/user", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(userRes.data);
        setFamily(userRes.data.family || []);
      }
    } catch (err) {
      toast.error("Failed to renew subscription.");
    }
  };

  const updateProfile = async () => {
    try {
      await axios.put("https://membershiportal-c3069d3050e8.herokuapp.com/api/user", {
        email: user.email,
        photo,
        address,
      });
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error("Error updating profile. Please try again.");
    }
  };

  if (!user) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="container mx-auto py-12 bg-[#FFFFFF] min-h-screen">
      <h2 className="text-3xl font-bold text-center text-[#CF066C] mb-6">
        Client Portal
      </h2>
      <div className="mt-8 max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <p className="text-[#CF066C]">
          <strong>Tier:</strong> {user.tier}
        </p>
        <p className="text-[#CF066C]">
          <strong>Visits Left:</strong> {user.visitsLeft}
        </p>
        <button
          onClick={() => renewSubscription(user._id)}
          className="mt-2 w-full py-2 bg-[#5EBAFF] text-white rounded-full hover:bg-[#4CA7E6] transition"
        >
          Renew My Subscription
        </button>
        <div className="mt-4">
          <label className="block text-[#CF066C] font-medium">
            Upload Photo
          </label>
          <input
            type="file"
            onChange={handlePhotoUpload}
            className="w-full p-2 mt-1 border border-gray-300 rounded-md"
          />
          {photo && (
            <img
              src={photo}
              alt="Profile"
              className="mt-2 w-24 h-24 rounded-full"
            />
          )}
        </div>
        <div className="mt-4">
          <label className="block text-[#CF066C] font-medium">Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CF066C]"
          />
        </div>
        <button
          style={{ border: "1px solid #CF066C" }}
          onClick={updateProfile}
          className="w-full py-2 mt-4 bg-[#CF066C] text-white rounded-full hover:bg-[#fff] hover:text-[#CF066C] transition duration-300 font-semibold"
        >
          Update Profile
        </button>
        <h3 className="mt-6 text-xl font-bold text-[#CF066C]">
          Family Members
        </h3>
        {family.map((member, idx) => (
          <div key={idx} className="mt-2">
            <p className="text-[#CF066C]">
              {member.name} - {member.email}
            </p>
            <button
              onClick={() => renewSubscription(user._id, member._id)}
              className="mt-1 w-full py-1 bg-[#5EBAFF] text-white rounded-full hover:bg-[#4CA7E6] transition"
            >
              Renew
            </button>
          </div>
        ))}
        <button
          onClick={openModal}
          className="mt-4 w-full py-2 bg-[#5EBAFF] text-white rounded-full hover:bg-[#4CA7E6] transition"
        >
          Add Family Member (50% Off)
        </button>

        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
              <h3 className="text-2xl font-bold text-[#CF066C] mb-4">
                Add Family Member
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[#CF066C] font-medium">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={familyMember.name}
                    onChange={handleInputChange}
                    className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-[#CF066C] font-medium">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={familyMember.email}
                    onChange={handleInputChange}
                    className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-[#CF066C] font-medium">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={familyMember.phone}
                    onChange={handleInputChange}
                    className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-[#CF066C] font-medium">
                    Upload Photo
                  </label>
                  <input
                    type="file"
                    onChange={handleFamilyPhotoUpload}
                    className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                  />
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
        <button
          onClick={handleLogout}
          className="mt-4 w-full py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default ClientPortal;
