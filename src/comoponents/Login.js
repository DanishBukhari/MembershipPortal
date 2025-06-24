import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('https://membershiportal-c3069d3050e8.herokuapp.com/api/login', { email, password });
      localStorage.setItem('token', res.data.token);
      toast.success('Logged in successfully!');
      navigate('/portal');
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error('Invalid credentials');
      } else {
        toast.error('Login failed. Please try again.');
      }
    }
  };

  return (
    <div className="container mx-auto py-12 bg-[#FFFFFF] min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-center text-[#CF066C] mb-6">Login to Client Portal</h2>
        <div className="space-y-4">
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
            <label className="block text-[#CF066C] font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CF066C]"
              required
            />
          </div>
          <button style={{border: "1px solid #CF066C"}}
            onClick={handleSubmit}
            className="w-full py-2 mt-4 bg-[#CF066C] text-white rounded-full hover:bg-[#fff] hover:text-[#CF066C] transition duration-300 font-semibold"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;