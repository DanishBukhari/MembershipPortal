import React from 'react';
import { Link } from 'react-router-dom';

const Membership = () => {
  return (
    <section className="bg-[#FFFFFF] py-12 min-h-screen">
      <div className="container mx-auto text-center">
        <h1 className="text-4xl font-bold uppercase text-[#CF066C]">LEGACY HUB PRICE LIST</h1>
        <h2 className="text-xl font-bold uppercase text-[#CF066C] mt-2">MEMBERSHIP OPTIONS</h2>
        <div className="mt-4">
          <span className="text-2xl italic font-bold text-[#EDEC25]">YOU ME AND THE COMMUNITY</span>
          <span className="block text-sm text-[#CF066C]">A different way of life</span>
        </div>
        <div className="mt-4 text-center text-[#CF066C] font-bold">
          <p>*50% off on 2+ memberships</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
          <div className="tier flex flex-col items-center justify-between p-6 bg-white rounded-lg shadow-lg">
            <h3 className="text-2xl font-bold uppercase text-[#CF066C]">LEGACY MAKER</h3>
            <p className="text-base text-[#CF066C] text-center mt-2">
              Unlimited access to Legacy Hub (excluding workshops). Perfect for those who want to dive in fully and make the most of everything we offer.
            </p>
            <div className="price-badge flex flex-col items-center justify-center w-24 h-24 rounded-full bg-[#CF066C] text-white mt-4">
              <span className="text-3xl font-bold">$35</span>
              <span className="text-sm text-[#EDEC25]">per week</span>
            </div>
            <Link style={{border: "1px solid #CF066C"}} to="/form/legacy-maker" className="mt-4 px-6 py-2 bg-[#CF066C] text-white rounded-full hover:bg-[#fff] hover:text-[#CF066C] transition">Get Membership</Link>
          </div>

          <div className="tier flex flex-col items-center justify-between p-6 bg-white rounded-lg shadow-lg">
            <h3 className="text-2xl font-bold uppercase text-[#CF066C]">LEADER</h3>
            <p className="text-base text-[#CF066C] text-center mt-2">
              5 x 1 hour session use per week. Ideal for those looking to stay engaged and take on a leadership role in our community.
            </p>
            <div className="price-badge flex flex-col items-center justify-center w-24 h-24 rounded-full bg-[#CF066C] text-white mt-4">
              <span className="text-3xl font-bold">$20</span>
              <span className="text-sm text-[#EDEC25]">per week</span>
            </div>
            <Link style={{border: "1px solid #CF066C"}} to="/form/leader" className="mt-4 px-6 py-2 bg-[#CF066C] text-white rounded-full hover:bg-[#fff] hover:text-[#CF066C] transition">Get Membership</Link>
          </div>

          <div className="tier flex flex-col items-center justify-between p-6 bg-white rounded-lg shadow-lg">
            <h3 className="text-2xl font-bold uppercase text-[#CF066C]">SUPPORTER</h3>
            <p className="text-base text-[#CF066C] text-center mt-2">
              2 x 1 hour sessions per week, additional sessions at $5 each. A great option for those who want to participate while enjoying flexible use of our space.
            </p>
            <div className="price-badge flex flex-col items-center justify-center w-24 h-24 rounded-full bg-[#CF066C] text-white mt-4">
              <span className="text-3xl font-bold">$8</span>
              <span className="text-sm text-[#EDEC25]">per week</span>
            </div>
            <Link style={{border: "1px solid #CF066C"}} to="/form/supporter" className="mt-4 px-6 py-2 bg-[#CF066C] text-white rounded-full hover:bg-[#fff] hover:text-[#CF066C] transition">Get Membership</Link>
          </div>
        </div>

        <div className="walk-in-rates mt-12 p-6 bg-white rounded-lg shadow-lg">
          <h3 className="text-2xl font-bold uppercase text-[#CF066C] text-center">WALK-IN RATES</h3>
          <ul className="list-disc pl-6 text-[#CF066C] mt-4 text-left max-w-md mx-auto">
            <li>Entry: $7 per hour</li>
            <li>Students & Pensioners: $3 per hour</li>
            <li>Non-participating Parents/Guardians:</li>
            <ul className="list-disc pl-6">
              <li>First guardian: $2.50</li>
              <li>Second guardian: $1</li>
            </ul>
            <li>Family Entry: Additional children: $3.50 each</li>
          </ul>
          <Link style={{border: "1px solid #CF066C"}} to="/walk-in" className="mt-4 inline-block px-6 py-2 bg-[#CF066C] text-white rounded-full hover:bg-[#fff] hover:text-[#CF066C] transition">Get Walk-In QR Code</Link>
        </div>
      </div>
    </section>
  );
};

export default Membership;