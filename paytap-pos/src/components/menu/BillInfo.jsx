import React from 'react'
import { useSelector } from 'react-redux'
import {getTotalPrice} from '../../redux/slices/cartSlice'

const BillInfo = () => {

  const cartData = useSelector(state => state.cart);
  const total = useSelector(getTotalPrice);
  const taxRate = 5.25;
  const tax = (total * taxRate) / 100;
  const totalPriceWithTax = total + tax;

  return (
    <> 
    <div className='flex items-center justify-between px-5 mt-2'>
        <p className='text-xs text-[#ababab] font-medium mt-2'>Items({cartData.length})</p>
        <h1 className='text-[#f5f5f5] text-md font-bold'>₱ {total.toFixed(2)}</h1>
    </div>
    <div className='flex items-center justify-between px-5 mt-2'>
        <p className='text-xs text-[#ababab] font-medium mt-2'>Tax(5.25%)</p>
        <h1 className='text-[#f5f5f5] text-md font-bold'>₱ {tax.toFixed(2)}</h1>
    </div>
    <div className='flex items-center justify-between px-5 mt-2'>
        <p className='text-xs text-[#ababab] font-medium mt-2'>Total With Tax</p>
        <h1 className='text-[#f5f5f5] text-md font-bold'>₱ {totalPriceWithTax.toFixed(2)}</h1>
    </div>
    <div className='flex items-center gap-3 px-5 mt-4'>
        <button className='bg-[#1f1f1f] px-4 py-3 w-full text-[#f5f5f5] font-semibold'>Cash</button>
        <button className='px-4 py-3 w-full bg-[#06861e] text-[#f5f5f5] font-semibold'>Paytap</button>
    </div>
    <div className='flex items-center gap-3 px-5 mt-4'>
        <button className='bg-[#f6b100] px-4 py-3 w-full rounded-lg text-[#1f1f1f] font-semibold text-lg'>Place Order</button>
    </div>
    </>
  )
}

export default BillInfo