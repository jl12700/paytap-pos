import React from 'react'

const CustomerInfo = () => {
    return (
       <div className='flex items-counter justify-between px-4 py-3'>
                    <div className='flex flex-col items-start'>
                        <hi className="text-md text-[#f5f5f5] font-semibold tracking-wide" >Customer Name</hi>
                        <p className='text-xs text-[#ababab] font-medium mt-1'>Order # 101</p>
                        <p className='text-xs text-[#ababab] font-medium mt-2'>January 19, 2025 05:54 PM</p>   
                    </div>
                    <button className='bg-[#f6b100] p-3 text-xl font-bold rounded-lg'>CN</button>
                </div>                
    )
}

export default CustomerInfo