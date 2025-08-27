import React from 'react'
import { FaNotesMedical } from 'react-icons/fa'
import { RiDeleteBin2Fill } from "react-icons/ri";
import { useDispatch, useSelector } from 'react-redux';

const CartInfo = () => {
   
   const cartData = useSelector((state) => state.cart);
   const scrolLRef = useRef();
   const dispatchEvent = useDispatch();

   useEffect(() => {
      if(scrolLRef.current){
         scrolLRef.current.scrollTo({
            top: scrolLRef.current.scrollHeight,
            behavior: "smooth"
         })
      }

   },[cartData]);

   const handleRemove = (itemId) => {
      dispatchEvent(removeItem(itemId));
   }

  return (
       <div className='px-4 py-2'>
                    <h1 className='text-[#e4e4e4] font-semibold tracking-wide'>
                        Order Details
                    </h1>
                    <div className='mt-4 overflow-y-scroll scrollbar-hide h-[380px]' ref={scrolLRef}>

                     {cartData.length === 0 ? (
                        <p className="text-[#ababab] text-sm flex justify-enter 
                        items-center h-[380px]">Your cart is empty</p>
                     ) : cartData.map((item) => {
                        return (
                        <div className='bg-[#1f1f1f] rounded-lg px-4 py-4 mb-2'>
                        <div className='flex items-center justify-between'>
                           <h1 className='text-[#ababab] font-semibold tracking-wide text-md'>
                            {item.name}
                           </h1>
                           <p className='text-[#ababab] font-semibold'>x{item.quantity}</p>
                           </div>
                           <div className='flex items-center justify-between mt-3'>
                             <div className='flex items-center gap-3'>
                                <RiDeleteBin2Fill  
                                onClick={() => handleRemove(item.id)}
                                className="text-[#ababab] cursor-pointer" size={20}/>
                                <FaNotesMedical  className="text-[#ababab] cursor-pointer" size={20}/>
                             </div>
                             <p className='text-[#f5f5f5] text-md font-bold'>₱{item.price}</p>
                           </div>
                        </div>
                        )
                     })}
                     
                        
                    </div>
                    
                </div>
  )
}

export default CartInfo