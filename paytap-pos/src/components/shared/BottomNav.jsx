import React, { useState } from 'react';
import { FaHome, FaQuestionCircle } from 'react-icons/fa';
import { MdOutlineReorder } from 'react-icons/md';
import { SiConvertio } from "react-icons/si";
import { CiCircleMore } from 'react-icons/ci';
import { BiSolidDish } from 'react-icons/bi';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCustomer } from '../../redux/slices/customerSlice';
import Modal from './Modal';
import Conversion from '../../pages/Conversion';
import SimpleMenuManager from '../SimpleMenuManager';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConversionOpen, setIsConversionOpen] = useState(false);
  const [isMenuManagerOpen, setIsMenuManagerOpen] = useState(false);
  const [name, setName] = useState('');

  const handleCreateOrder = () => {
    if (name.trim()) {
      dispatch(setCustomer({ name }));
      navigate("/menu");
      setIsModalOpen(false);
    }
  };

  // Active state detection
  const isHomeActive = location.pathname === "/";
  const isOrdersActive = location.pathname === "/orders";
  const isMenuActive = location.pathname === "/menu";
  const isContactSupportActive = location.pathname === "/contact-support";

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#1e1e1e] border-t border-gray-700 z-50 shadow-2xl pb-[env(safe-area-inset-bottom)]">
      <div className="w-full h-20 flex items-center justify-center">
        <div className="flex items-center justify-center w-full gap-8 px-4">
          {/* Left Side */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate("/")}
              className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all duration-200 ${
                isHomeActive
                  ? 'bg-[#343434] text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
              }`}
            >
              <FaHome className="text-3xl" />
              <span className="font-semibold text-lg">Home</span>
            </button>

            <button
              onClick={() => navigate("/orders")}
              className={`flex items-center gap-3 px-10 py-3 rounded-xl transition-all duration-200 ${
                isOrdersActive
                  ? 'bg-[#343434] text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
              }`}
            >
              <MdOutlineReorder className="text-3xl" />
              <span className="font-semibold text-lg">Sales Tracking</span>
            </button>
          </div>

          {/* Center - Create Order */}
          <div className="flex items-center justify-center">
            <button
              disabled={isMenuActive}
              onClick={() => setIsModalOpen(true)}
              title="Create Order"
              className={`flex items-center justify-center rounded-full p-4 transition-all duration-200 shadow-lg ${
                isMenuActive
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-[#F6B100] text-white hover:bg-yellow-600 hover:scale-105'
              }`}
            >
              <BiSolidDish size={38} />
            </button>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsConversionOpen(true)}
              className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all duration-200 ${
                isConversionOpen
                  ? 'bg-[#343434] text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
              }`}
            >
              <SiConvertio className="text-3xl" />
              <span className="font-semibold text-lg">Conversion</span>
            </button>

            <button
              onClick={() => setIsMenuManagerOpen(true)}
              className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all duration-200 ${
                isMenuManagerOpen
                  ? 'bg-[#343434] text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
              }`}
            >
              <CiCircleMore className="text-3xl" />
              <span className="font-semibold text-lg">Menu</span>
            </button>

            <button
              onClick={() => navigate("/contact-support")}
              className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all duration-200 ${
                isContactSupportActive
                  ? 'bg-[#343434] text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
              }`}
            >
              <FaQuestionCircle className="text-3xl" />
              <span className="font-semibold text-lg">Support</span>
            </button>
          </div>
        </div>
      </div>

      {/* Create Order Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Order">
        <div>
          <label className="block text-gray-400 mb-2 text-sm font-medium">Customer Name</label>
          <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f] border border-gray-700">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              placeholder="Enter customer name"
              className="bg-transparent flex-1 text-white placeholder-gray-500 focus:outline-none"
            />
          </div>
        </div>

        <button
          onClick={handleCreateOrder}
          className="w-full bg-[#F6B100] text-white rounded-lg py-3 mt-6 hover:bg-yellow-700 transition"
        >
          Create Order
        </button>
      </Modal>

      {/* Conversion Modal */}
      <Conversion show={isConversionOpen} onClose={() => setIsConversionOpen(false)} />

      {/* Menu Manager Modal */}
      <SimpleMenuManager isOpen={isMenuManagerOpen} onClose={() => setIsMenuManagerOpen(false)} />
    </div>
  );
};

export default BottomNav;