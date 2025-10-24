import React, { useState, useEffect } from "react";
import { FaSearch, FaUserCircle, FaBell } from "react-icons/fa";
import logo from "../../assets/images/logo.png";

const Header = () => {
  const [pointBalance, setPointBalance] = useState(100); // Default point balance

  useEffect(() => {
    // Example: Fetch point balance dynamically later (e.g., from Firestore or context)
    // setPointBalance(fetchedBalance);
  }, []);

  return (
    <header className="flex justify-between items-center py-4 px-8 bg-[#1a1a1a]">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <img src={logo} className="h-8 w-8" alt="restro logo" />
        <h1 className="text-lg font-semibold text-[#f5f5f5]">Canteen</h1>
      </div>

      {/* Search and Point Balance */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-4 bg-[#1f1f1f] rounded-[20px] px-5 py-2 w-[400px]">
          <FaSearch className="text-[#f5f5f5]" />
          <input
            type="text"
            placeholder="Search"
            className="bg-[#1f1f1f] outline-none text-[#f5f5f5] w-full"
          />
        </div>

        {/* Point Balance */}
        <div className="bg-[#2a2a2a] px-4 py-2 rounded-[20px] flex flex-col items-center justify-center text-center">
          <p className="text-gray-400 text-xs">Points</p>
          <p className="text-yellow-400 font-bold text-lg">{pointBalance.toLocaleString()}</p>
        </div>
      </div>

      {/* Logged User Details */}
      <div className="flex items-center gap-4">
        <div className="bg-[#1f1f1f] rounded-[15x] p-3 cursor-pointer">
          <FaBell className="text-[#f5f5f5] text-2xl" />
        </div>
        <div className="flex items-center gap-3 cursor-pointer">
          <FaUserCircle className="text-[#f5f5f5] text-4xl" />
          <div className="flex flex-col items-start">
            <h1 className="text-md text-[#f5f5f5] font-semibold">John Veneracion</h1>
            <p className="text-xs text-[#ababab] font-medium">Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
