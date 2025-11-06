import React, { useState } from 'react';
import { FaHome } from 'react-icons/fa';
import { MdOutlineReorder } from 'react-icons/md';
import { SiConvertio } from "react-icons/si";
import { CiCircleMore } from 'react-icons/ci';
import { BiSolidDish } from 'react-icons/bi';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCustomer } from '../../redux/slices/customerSlice';
import Modal from './Modal';
import Conversion from '../../pages/Conversion'; // ✅ import your popup component
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

  // Determine active state based on current location
  const isHomeActive = location.pathname === "/";
  const isOrdersActive = location.pathname === "/orders";
  const isMenuActive = location.pathname === "/menu";
  const isConversionActive = isConversionOpen;
  const isMenuManagerActive = isMenuManagerOpen;

  return (
    <div className='fixed bottom-0 left-0 right-0 bg-[#262626] p-2 h-16 flex justify-around z-50'>
      {/* Home */}
      <button 
        onClick={() => navigate("/")} 
        className={`flex items-center justify-center w-[200px] rounded-[20px] transition ${
          isHomeActive 
            ? 'text-[#f5f5f5] bg-[#343434]' 
            : 'text-[#ababab] hover:text-[#f5f5f5]'
        }`}
      >
        <FaHome className="inline mr-2" /> Home
      </button>

      {/* Sales Tracking */}
      <button 
        onClick={() => navigate("/orders")} 
        className={`flex items-center justify-center w-[200px] rounded-[20px] transition ${
          isOrdersActive 
            ? 'text-[#f5f5f5] bg-[#343434]' 
            : 'text-[#ababab] hover:text-[#f5f5f5]'
        }`}
      >
        <MdOutlineReorder className="inline mr-2" /> <p>Sales Tracking</p>
      </button>

      {/* Request Conversion — opens popup instead of routing */}
      <button 
        onClick={() => setIsConversionOpen(true)} 
        className={`flex items-center justify-center w-[200px] rounded-[20px] transition ${
          isConversionActive 
            ? 'text-[#f5f5f5] bg-[#343434]' 
            : 'text-[#ababab] hover:text-[#f5f5f5]'
        }`}
      >
        <SiConvertio className="inline mr-2" /> <p>Request Conversion</p>
      </button>

      {/* Menu Management */}
      <button 
        onClick={() => setIsMenuManagerOpen(true)}
        className={`flex items-center justify-center w-[200px] rounded-[20px] transition ${
          isMenuManagerActive 
            ? 'text-[#f5f5f5] bg-[#343434]' 
            : 'text-[#ababab] hover:text-[#f5f5f5]'
        }`}
      >
        <CiCircleMore className="inline mr-2" /> <p>Menu Management</p>
      </button>

      {/* Floating Create Order Button */}
      <button
        disabled={location.pathname === "/menu"}
        onClick={() => setIsModalOpen(true)}
        className='absolute bottom-5 bg-[#F6B100] text-[#f5f5f5] rounded-full p-3 items-center'
      >
        <BiSolidDish size={30} />
      </button>

      {/* Order Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Order">
        <div>
          <label className='block text-[#ababab] mb-2 text-sm font-medium'>Customer Name</label>
          <div className='flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f]'>
            <input 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              type="text" 
              placeholder='Enter customer name' 
              className='bg-transparent flex-1 text-white focus:outline-none'
            />
          </div>
        </div>

        <button 
          onClick={handleCreateOrder}
          className='w-full bg-[#F6B100] text-[#f5f5f5] rounded-lg py-3 mt-8 hover:bg-yellow-700'
        >
          Create Order
        </button>
      </Modal>

      {/* ✅ Conversion Popup (always accessible) */}
      <Conversion
        show={isConversionOpen}
        onClose={() => setIsConversionOpen(false)}
      />

      {/* Menu Manager Modal */}
      <SimpleMenuManager
        isOpen={isMenuManagerOpen}
        onClose={() => setIsMenuManagerOpen(false)}
      />
    </div>
  );
};

export default BottomNav;
