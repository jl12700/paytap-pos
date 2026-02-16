import React, { useState } from 'react';
import { FaCheckDouble, FaCircle, FaClock, FaCheckCircle } from 'react-icons/fa';
import ReceiptModal from '../ReceiptModal';

const OrderListItem = ({ order }) => {
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
            month: 'short',
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
            <div 
                className='bg-[#262626] p-4 rounded-lg mb-3 hover:bg-[#2a2a2a] transition-colors cursor-pointer'
                onClick={() => setShowReceipt(true)}
            >
                <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-4 flex-1'>
                        <button className='bg-[#f6b100] p-3 text-lg font-bold rounded-lg flex-shrink-0'>
                            {getInitials(order.customerName)}
                        </button>
                        <div className='flex-1'>
                            <div className='flex items-center gap-4'>
                                <div>
                                    <h1 className='text-[#f5f5f5] text-lg font-semibold tracking-wide'>
                                        {order.customerName || 'Unknown'}
                                    </h1>
                                    <p className='text-[#ababab] text-sm'>{order.orderId || 'N/A'}</p>
                                </div>
                                <div className='flex items-center gap-4 text-sm text-[#ababab]'>
                                    <span>{formatDateTime(order.createdAt)}</span>
                                    <span>•</span>
                                    <span>{order.items?.length || 0} items</span>
                                    {order.paymentMethod && (
                                        <>
                                            <span>•</span>
                                            <span className='capitalize'>
                                                {order.paymentMethod === 'gcash' || order.paymentMethod === 'paytap' ? 'PayTap' : order.paymentMethod}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='flex items-center gap-6'>
                        <div className='text-right'>
                            <p className='text-[#f5f5f5] text-lg font-semibold'>₱{order.totalAmount?.toFixed(2) || '0.00'}</p>
                            <p className={`${getStatusColor(order.status)} px-2 py-1 rounded-lg text-xs mt-1 inline-block`}>
                                {getStatusIcon(order.status)}
                                {order.status || 'Pending'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <ReceiptModal
                isOpen={showReceipt}
                onClose={() => setShowReceipt(false)}
                order={order}
            />
        </>
    );
};

export default OrderListItem;

