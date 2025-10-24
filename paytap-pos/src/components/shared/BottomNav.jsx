import React, { useState } from 'react'
import { FaHome } from 'react-icons/fa'
import { MdOutlineReorder } from 'react-icons/md'
import { SiConvertio } from "react-icons/si"
import { CiCircleMore} from 'react-icons/ci'
import { BiSolidDish } from 'react-icons/bi'
import { useNavigate } from 'react-router-dom'
import Modal from './Modal'

const BottomNav = () => {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [name, setName] = useState();

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);
    

    return (
        <div className='fixed bottom-0 left-0 right-0 bg-[#262626] p-2 h-16 flex justify-around'>
            <button onClick={() => navigate("/")} className='flex items-center justify-center text-[#f5f5f5] bg-[#343434] w-[200px] rounded-[20px]'><FaHome className="inline mr-2 size={20}" />Home</button>
            <button onClick={() => navigate("/orders")} className='flex items-center justify-center text-[#ababab] w-[200px]'><MdOutlineReorder className="inline mr-2 size={20}" /><p>Sales Tracking</p></button>
            <button onClick={() => navigate("/conversion")} className='flex items-center justify-center text-[#ababab] w-[200px]'><SiConvertio className="inline mr-2 size={20}" /><p>Request Conversion</p></button>
            <button className='flex items-center justify-center text-[#ababab] w-[200px]'><CiCircleMore className="inline mr-2 size={20}" /><p>More</p></button>
        
            <button
            disabled={location.pathname === "/menu"} 
            onClick={openModal}
            className='absolute bottom-5 bg-[#F6B100] text-[#f5f5f5] rounded-full p-3 items=center'>
                <BiSolidDish size={30} />
            </button>

            <Modal isOpen={isModalOpen} onClose={closeModal} title="Create Order">
                <div>
                    <label className='block text-[#ababab] mb-2 text-sm font-medium'>Customer Name</label>
                    <div className='flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f]'>
                        <input value={name} onChange={(e) => setName(e.target.value)} type="text" name="" placeholder='Enter customer name' id="" className='bg-transparent flex-1 text-white focus:outline-none'/>
                    </div>
                </div>
        
                <button onClick={() => navigate("/menu")}className='w-full bg-[#F6B100] text-[#f5f5f5] rounded-lg py-3 mt-8 hover:bg-yellow-700'>
                    Create Order
                </button>
            </Modal>
        </div>
    )
}

export default BottomNav;