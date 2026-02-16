import React, { useState, useEffect } from 'react'
import {FaSearch} from "react-icons/fa";
import { collection, getDocs, query, where, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import RecentOrdersModal from './RecentOrdersModal';
import ReceiptModal from './ReceiptModal';
import { auth } from '../firebase/config';

const RecentOrders = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showViewAllModal, setShowViewAllModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showReceipt, setShowReceipt] = useState(false);

    useEffect(() => {
        fetchTodayOrders();
    }, []);

    const fetchTodayOrders = async () => {
        setLoading(true);
        try {
            // ✅ Get current vendor
            const currentVendor = auth.currentUser;
            
            if (!currentVendor) {
                console.error('No vendor logged in');
                setOrders([]);
                setLoading(false);
                return;
            }

            console.log('📍 Fetching orders for vendor:', currentVendor.uid);

            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            todayStart.setHours(0, 0, 0, 0);

            const startTimestamp = Timestamp.fromDate(todayStart);
            const endTimestamp = Timestamp.fromDate(now);

            const ordersRef = collection(db, 'orders');
            
            // ✅ Query with vendor filter
            let querySnapshot;
            try {
                const q = query(
                    ordersRef,
                    where('vendorId', '==', currentVendor.uid),  // ✅ FILTER BY VENDOR
                    where('createdAt', '>=', startTimestamp),
                    where('createdAt', '<=', endTimestamp),
                    orderBy('createdAt', 'desc')
                );
                querySnapshot = await getDocs(q);
                console.log('✅ Orders fetched with vendor filter:', querySnapshot.size);
            } catch (error) {
                console.warn('Query with filters failed, trying simpler query:', error);
                // Fallback: fetch all vendor orders (without date filter)
                const fallbackQuery = query(
                    ordersRef,
                    where('vendorId', '==', currentVendor.uid),
                    orderBy('createdAt', 'desc')
                );
                querySnapshot = await getDocs(fallbackQuery);
            }

            const ordersList = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const createdAt = data.createdAt;
                
                // If we had to use fallback query, filter by date manually
                if (createdAt) {
                    const orderDate = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
                    if (orderDate >= todayStart && orderDate <= now) {
                        ordersList.push({
                            id: doc.id,
                            ...data
                        });
                    }
                } else {
                    // Include orders without createdAt
                    ordersList.push({
                        id: doc.id,
                        ...data
                    });
                }
            });

            console.log('📦 Total orders for this vendor today:', ordersList.length);
            setOrders(ordersList);
        } catch (error) {
            console.error('Error fetching vendor orders:', error);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = orders.filter(order => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        const customerName = (order.customerName || '').toLowerCase();
        const orderId = (order.orderId || '').toLowerCase();
        return customerName.includes(query) || orderId.includes(query);
    });

    const handleViewReceipt = (order) => {
        setSelectedOrder(order);
        setShowReceipt(true);
    };

    const getInitials = (name) => {
        if (!name) return '??';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <>
        <div className='px-8 mt-6'>
            <div className='bg-[#1a1a1a] w-full h-[450px] rounded-lg'>
                <div className='flex justify-between items-center px-6 py-4'>
                    <h1 className='text-[#f5f5f5] text-lg font-semibold tracking-wide'>Recent Orders</h1>
                    <button 
                        onClick={() => setShowViewAllModal(true)}
                        className='text-[#025cca] text-sm font-semibold hover:underline'
                    >
                        View All
                    </button>
                </div>
                <div className="flex items-center gap-4 bg-[#1f1f1f] rounded-[20px] px-6 py-4 mx-6">
                    <FaSearch className="text-[#f5f5f5]" />
                    <input
                        type="text"
                        placeholder="Search by name or order number"
                        className="bg-[#1f1f1f] outline-none text-[#f5f5f5] flex-1"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                {/*Order List*/}
                <div className='mt-4 px-6 overflow-y-scroll h-[300px] scrollbar-hide'>
                    {loading ? (
                        <div className="text-center py-8">
                            <p className="text-gray-400">Loading orders...</p>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-400">
                                {searchQuery ? 'No orders found matching your search.' : 'No orders for today.'}
                            </p>
                        </div>
                    ) : (
                        filteredOrders.map((order) => (
                            <div key={order.id} className='flex items-center gap-5 mb-3'>
                                <button className='bg-[#f6b100] p-3 text-xl font-bold rounded-lg'>
                                    {getInitials(order.customerName)}
                                </button>
                                <div className='flex items-center justify-between w-[100%]'>
                                    <div className='flex flex-col items-start gap-1'>
                                        <h1 className='text-[#f5f5f5] text-lg font-semibold tracking-wide'>
                                            {order.customerName || 'Unknown'}
                                        </h1>
                                        <p className='text-[#ababab] text-sm'>
                                            {order.items?.length || 0} Items
                                        </p>
                                    </div>
                                    <div>
                                        <h1 className='text-[#f6b100] font-semibold border border-[#f6b100] rounded-lg p-1 px-2 text-sm'>
                                            {order.orderId || 'N/A'}
                                        </h1>
                                    </div>
                                    <button
                                        onClick={() => handleViewReceipt(order)}
                                        className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-sm'
                                    >
                                        Receipt
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>  
        </div>

        {/* View All Modal */}
        <RecentOrdersModal
            isOpen={showViewAllModal}
            onClose={() => setShowViewAllModal(false)}
        />

        {/* Receipt Modal */}
        <ReceiptModal
            isOpen={showReceipt}
            onClose={() => {
                setShowReceipt(false);
                setSelectedOrder(null);
            }}
            order={selectedOrder}
        />
        </>
    )
}

export default RecentOrders