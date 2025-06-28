import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const MembershipForm = () => {
  const { tier } = useParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [primaryTier, setPrimaryTier] = useState(tier || 'legacy-maker');
  const [familyMemberships, setFamilyMemberships] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const membershipOptions = ['legacy-maker', 'leader', 'supporter'];

  const addFamilyMembership = () => {
    setFamilyMemberships([...familyMemberships, 'legacy-maker']);
  };

  const updateFamilyMembershipTier = (index, newTier) => {
    const updated = [...familyMemberships];
    updated[index] = newTier;
    setFamilyMemberships(updated);
  };

  const removeFamilyMembership = (index) => {
    setFamilyMemberships(familyMemberships.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !phone) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    try {
      const memberships = [primaryTier, ...familyMemberships];
      await axios.post('https://membershiportal-c3069d3050e8.herokuapp.com/api/users', {
        name,
        email,
        phone,
        memberships
      });
      navigate('/checkout', { state: { memberships, name, email, phone } });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error registering. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-12 bg-[#FFFFFF] min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-center text-[#CF066C] mb-6">Enter Your Details</h2>
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
              <label className="block text-[#CF066C] font-medium">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CF066C]"
                required
              />
            </div>
            <div>
              <label className="block text-[#CF066C] font-medium">Your Membership</label>
              <select
                value={primaryTier}
                onChange={(e) => setPrimaryTier(e.target.value)}
                className="w-full p-2 mt-1 border border-gray-300 rounded-md"
              >
                {membershipOptions.map((option) => (
                  <option key={option} value={option}>{option.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[#CF066C] font-medium">Family Memberships</label>
              {familyMemberships.map((tier, index) => (
                <div key={index} className="flex space-x-2 mt-2">
                  <select
                    value={tier}
                    onChange={(e) => updateFamilyMembershipTier(index, e.target.value)}
                    className="p-2 border border-gray-300 rounded-md"
                  >
                    {membershipOptions.map((option) => (
                      <option key={option} value={option}>{option.toUpperCase()}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeFamilyMembership(index)}
                    className="p-2 text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                onClick={addFamilyMembership}
                className="mt-2 p-2 bg-[#CF066C] text-white rounded-md hover:bg-[#fff] hover:text-[#CF066C] transition"
              >
                Add Family Membership
              </button>
            </div>
            <button
              style={{ border: "1px solid #CF066C" }}
              onClick={handleSubmit}
              className="w-full py-2 mt-4 bg-[#CF066C] text-white rounded-full hover:bg-[#fff] hover:text-[#CF066C] transition duration-300 font-semibold"
            >
              Proceed to Payment
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MembershipForm;