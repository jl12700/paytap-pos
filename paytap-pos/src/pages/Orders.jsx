import React, { useState, useEffect } from 'react'
import BottomNav from '../components/shared/BottomNav'
import OrderCard from '../components/orders/OrderCard'
import OrderListItem from '../components/orders/OrderListItem'
import BackButton from '../components/shared/BackButton'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase/config'
import { FaList, FaTh, FaCalendarAlt, FaSortAmountDown } from 'react-icons/fa'

const Orders = () => {
    const [viewMode, setViewMode] = useState("cards"); // "cards" or "list"
    const [sortBy, setSortBy] = useState("dateDesc"); // "dateDesc", "dateAsc", "amountDesc", "amountAsc"
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalOrders: 0,
        totalRevenue: 0,
        completedOrders: 0,
        pendingOrders: 0
    });

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const ordersRef = collection(db, 'orders');
            const querySnapshot = await getDocs(ordersRef);

            const ordersList = [];
            querySnapshot.forEach((doc) => {
                ordersList.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            // Sort by createdAt descending by default
            ordersList.sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
                return dateB - dateA;
            });

            setOrders(ordersList);
            calculateStats(ordersList);
        } catch (error) {
            console.error('Error fetching orders:', error);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (ordersList) => {
        const stats = {
            totalOrders: ordersList.length,
            totalRevenue: 0,
            completedOrders: 0,
            pendingOrders: 0
        };

        ordersList.forEach(order => {
            if (order.totalAmount) {
                stats.totalRevenue += order.totalAmount;
            }
            if (order.status?.toLowerCase() === 'completed') {
                stats.completedOrders++;
            } else {
                stats.pendingOrders++;
            }
        });

        setStats(stats);
    };

    const sortedOrders = [...orders].sort((a, b) => {
        switch (sortBy) {
            case "dateDesc":
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
                return dateB - dateA;
            case "dateAsc":
                const dateA2 = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
                const dateB2 = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
                return dateA2 - dateB2;
            case "amountDesc":
                return (b.totalAmount || 0) - (a.totalAmount || 0);
            case "amountAsc":
                return (a.totalAmount || 0) - (b.totalAmount || 0);
            default:
                return 0;
        }
    });

    return (
        <section className='bg-[#1f1f1f] h-[calc(100vh-5rem)] overflow-hidden flex flex-col'>
            {/* Header */}
            <div className='flex items-center justify-between px-10 py-4 border-b border-gray-700'>
                <div className='flex items-center gap-4'> 
                    <BackButton />
                    <h1 className='text-[#f5f5f5] text-2xl font-bold tracking-wider'>Sales Tracking</h1>
                </div>
                
                {/* View Toggle */}
                <div className='flex items-center gap-2'>
                    <button
                        onClick={() => setViewMode("cards")}
                        className={`p-2 rounded-lg ${viewMode === "cards" ? 'bg-blue-600 text-white' : 'bg-[#2a2a2a] text-gray-400'}`}
                    >
                        <FaTh />
                    </button>
                    <button
                        onClick={() => setViewMode("list")}
                        className={`p-2 rounded-lg ${viewMode === "list" ? 'bg-blue-600 text-white' : 'bg-[#2a2a2a] text-gray-400'}`}
                    >
                        <FaList />
                    </button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className='px-10 py-4 bg-[#1a1a1a] border-b border-gray-700'>
                <div className='grid grid-cols-4 gap-4'>
                    <div className='bg-[#2a2a2a] rounded-lg p-3'>
                        <p className='text-gray-400 text-sm'>Total Orders</p>
                        <p className='text-white text-xl font-bold'>{stats.totalOrders}</p>
                    </div>
                    <div className='bg-[#2a2a2a] rounded-lg p-3'>
                        <p className='text-gray-400 text-sm'>Total Revenue</p>
                        <p className='text-green-400 text-xl font-bold'>₱{stats.totalRevenue.toFixed(2)}</p>
                    </div>
                    <div className='bg-[#2a2a2a] rounded-lg p-3'>
                        <p className='text-gray-400 text-sm'>Completed</p>
                        <p className='text-green-400 text-xl font-bold'>{stats.completedOrders}</p>
                    </div>
                    <div className='bg-[#2a2a2a] rounded-lg p-3'>
                        <p className='text-gray-400 text-sm'>Pending</p>
                        <p className='text-yellow-400 text-xl font-bold'>{stats.pendingOrders}</p>
                    </div>
                </div>
            </div>

            {/* Sort */}
            <div className='flex items-center justify-end px-10 py-4 border-b border-gray-700'>
                {/* Sort By */}
                <div className='flex items-center gap-2'>
                    <FaSortAmountDown className='text-gray-400' />
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className='bg-[#2a2a2a] text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    >
                        <option value="dateDesc">Newest First</option>
                        <option value="dateAsc">Oldest First</option>
                        <option value="amountDesc">Highest Amount</option>
                        <option value="amountAsc">Lowest Amount</option>
                    </select>
                </div>
            </div>

            {/* Orders Display */}
            <div className='flex-1 overflow-y-auto px-10 py-4'>
                {loading ? (
                    <div className='text-center py-8'>
                        <p className='text-gray-400'>Loading orders...</p>
                    </div>
                ) : sortedOrders.length === 0 ? (
                    <div className='text-center py-8'>
                        <p className='text-gray-400'>No orders found.</p>
                    </div>
                ) : viewMode === "cards" ? (
                    <div className='flex flex-wrap gap-6'>
                        {sortedOrders.map((order) => (
                            <OrderCard key={order.id} order={order} />
                        ))}
                    </div>
                ) : (
                    <div className='space-y-3'>
                        {sortedOrders.map((order) => (
                            <OrderListItem key={order.id} order={order} />
                        ))}
                    </div>
                )}
            </div>

            <BottomNav />
        </section>
    )
}

export default Orders