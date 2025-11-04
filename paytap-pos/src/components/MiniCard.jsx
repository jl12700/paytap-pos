import React from 'react'

const MiniCard = ({title, icon, number, footerNum, onIconClick, fullWidth}) => {
    return (
        <div className={`bg-[#1a1a1a] py-5 px-5 rounded-lg ${fullWidth ? 'w-full' : 'w-[50%]'}`}>
            <div className='flex items-start justify-between'>
            <h1 className='text-[#f5f5f5] text-lg font-semibold tracking-wide'>
            {title}</h1>
            <button 
                onClick={onIconClick || undefined}
                className={`${title === "Total Earnings" ? "bg-[#02ca3a]" : "bg-[#f6b100]"} p-3 rounded-lg text-[#f5f5f5] text-2xl hover:opacity-80 transition-opacity ${onIconClick ? 'cursor-pointer' : 'cursor-default'}`}
            >
                {icon}
            </button>
        </div>
        <div>
            <h1 className='text-[#f5f5f5] text-4xl font-bold mt-5'>{title === "Total Earnings" ? `₱${number}` : number}</h1>
            {title === "Total Earnings" && footerNum !== undefined && (
                <h1 className='text-[#f5f5f5] text-lg mt-2'>
                    <span className={parseFloat(footerNum) >= 0 ? 'text-[#02ca3a]' : 'text-red-500'}>
                        {parseFloat(footerNum) >= 0 ? '+' : ''}{footerNum}%
                    </span>
                    {' '}than yesterday
                </h1>
            )}
            {title !== "Total Earnings" && footerNum !== undefined && (
                <h1 className='text-[#f5f5f5] text-lg mt-2'><span className='text-[#02ca3a]'>{footerNum}%</span> than yesterday</h1>
            )}
        </div>
        </div>
    )
}

export default MiniCard