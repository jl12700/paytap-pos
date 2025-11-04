import React from 'react'
import { FaCheckDouble, FaCircle, FaClock, FaCheckCircle } from 'react-icons/fa'
import ReceiptModal from '../ReceiptModal';
import { useState } from 'react';

const OrderCard = ({ order }) => {
    const [showReceipt, setShowReceipt] = useState(false);

    if (!order) return null;

    const getInitials = (name) => {
        if (!name) return '??';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const formatDateTime = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
                return 'text-green-600 bg-[#2e4a40]';
            case 'pending':
            case 'in progress':
                return 'text-yellow-600 bg-yellow-900/30';
            case 'ready':
                return 'text-blue-600 bg-blue-900/30';
            default:
                return 'text-gray-600 bg-gray-700';
        }
    };

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
                return <FaCheckCircle className='inline mr-2' />;
            case 'pending':
            case 'in progress':
                return <FaClock className='inline mr-2' />;
            case 'ready':
                return <FaCheckDouble className='inline mr-2' />;
            default:
                return <FaCircle className='inline mr-2' />;
        }
    };

    return (
        <>
            <div className='w-[500px] bg-[#262626] p-4 rounded-lg mb-4 hover:bg-[#2a2a2a] transition-colors cursor-pointer' onClick={() => setShowReceipt(true)}>
                <div className='flex items-center gap-5'>
                    <button className='bg-[#f6b100] p-3 text-xl font-bold rounded-lg'>
                        {getInitials(order.customerName)}
                    </button>
                    <div className='flex items-center justify-between w-[100%]'>
                        <div className='flex flex-col items-start gap-1'>
                            <h1 className='text-[#f5f5f5] text-lg font-semibold tracking-wide'>
                                {order.customerName || 'Unknown'}
                            </h1>
                            <p className='text-[#ababab] text-sm'>{order.orderId || 'N/A'}</p>
                        </div>
                        <div className='flex flex-col items-end gap-2'>
                            <p className={`${getStatusColor(order.status)} px-2 py-1 rounded-lg text-sm`}>
                                {getStatusIcon(order.status)}
                                {order.status || 'Pending'}
                            </p>
                            <p className='text-[#ababab] text-sm'>
                                <FaCircle className={`inline mr-2 ${order.status === 'Completed' ? 'text-green-600' : order.status === 'Ready' ? 'text-blue-600' : 'text-yellow-600'}`} />
                                {order.status === 'Completed' ? 'Completed' : order.status === 'Ready' ? 'Ready to serve' : 'In progress'}
                            </p>
                        </div>
                    </div>
                </div>
                <div className='flex justify-between items-center mt-4 text-[#ababab]'>
                    <p>{formatDateTime(order.createdAt)}</p>
                    <p>{order.items?.length || 0} items</p>
                </div>
                <hr className='w-full mt-4 border-t border-gray-500'/>
                <div className='flex items-center justify-between mt-4'>
                    <h1 className='text-[#f5f5f5] text-lg font-semibold'>Total</h1>
                    <p className='text-[#f5f5f5] text-lg font-semibold'>₱{order.totalAmount?.toFixed(2) || '0.00'}</p>
                </div>
                {order.paymentMethod && (
                    <div className='flex items-center justify-between mt-2'>
                        <p className='text-[#ababab] text-sm'>Payment:</p>
                        <p className='text-[#ababab] text-sm capitalize'>
                            {order.paymentMethod === 'gcash' || order.paymentMethod === 'paytap' ? 'PayTap' : order.paymentMethod}
                        </p>
                    </div>
                )}
            </div>

            <ReceiptModal
                isOpen={showReceipt}
                onClose={() => setShowReceipt(false)}
                order={order}
            />
        </>
    );
}

export default OrderCard