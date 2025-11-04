import React, { useState, useEffect } from 'react'
import BottomNav from '../components/shared/BottomNav'
import OrderCard from '../components/orders/OrderCard'
import OrderListItem from '../components/orders/OrderListItem'
import BackButton from '../components/shared/BackButton'
import SalesChart from '../components/SalesChart'
import SalesChartModal from '../components/SalesChartModal'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase/config'
import { FaList, FaTh, FaCalendarAlt, FaSortAmountDown, FaChartLine, FaChartBar } from 'react-icons/fa'

const Orders = () => {
    const [viewMode, setViewMode] = useState("cards"); // "cards" or "list"
    const [sortBy, setSortBy] = useState("dateDesc"); // "dateDesc", "dateAsc", "amountDesc", "amountAsc"
    const [activeTab, setActiveTab] = useState("orders"); // "orders" or "history"
    const [historyPeriod, setHistoryPeriod] = useState("daily"); // "daily", "weekly", "monthly"
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [salesHistory, setSalesHistory] = useState([]);
    const [showChartModal, setShowChartModal] = useState(false);
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

    const calculateSalesHistory = () => {
        const history = [];
        const ordersByPeriod = {};

        // Group orders by period
        orders.forEach(order => {
            if (!order.createdAt || !order.totalAmount) return;
            
            const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
            let periodKey = '';
            let periodLabel = '';

            if (historyPeriod === 'daily') {
                // Daily: YYYY-MM-DD format, show day of month
                const year = orderDate.getFullYear();
                const month = orderDate.getMonth() + 1;
                const day = orderDate.getDate();
                periodKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                periodLabel = `${orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
            } else if (historyPeriod === 'weekly') {
                // Weekly: Year-Week format
                const year = orderDate.getFullYear();
                const week = getWeekNumber(orderDate);
                periodKey = `${year}-W${String(week).padStart(2, '0')}`;
                const weekStart = getWeekStart(orderDate);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                periodLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
            } else if (historyPeriod === 'monthly') {
                // Monthly: YYYY-MM format
                const year = orderDate.getFullYear();
                const month = orderDate.getMonth() + 1;
                periodKey = `${year}-${String(month).padStart(2, '0')}`;
                periodLabel = orderDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            }

            if (!ordersByPeriod[periodKey]) {
                ordersByPeriod[periodKey] = {
                    periodKey,
                    periodLabel,
                    orders: [],
                    totalRevenue: 0,
                    orderCount: 0,
                    date: orderDate
                };
            }

            ordersByPeriod[periodKey].orders.push(order);
            ordersByPeriod[periodKey].totalRevenue += order.totalAmount || 0;
            ordersByPeriod[periodKey].orderCount += 1;
        });

        // Convert to array and sort by date (newest first)
        const historyArray = Object.values(ordersByPeriod).sort((a, b) => {
            return b.date - a.date;
        });

        setSalesHistory(historyArray);
    };

    // Helper function to get week number
    const getWeekNumber = (date) => {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    };

    // Helper function to get week start (Monday)
    const getWeekStart = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        return new Date(d.setDate(diff));
    };

    useEffect(() => {
        if (activeTab === 'history') {
            calculateSalesHistory();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orders, historyPeriod, activeTab]);

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
                {activeTab === 'orders' && (
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
                )}
            </div>

            {/* Tabs */}
            <div className='flex items-center gap-2 px-10 py-3 border-b border-gray-700 bg-[#1a1a1a]'>
                <button
                    onClick={() => setActiveTab("orders")}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                        activeTab === "orders"
                            ? "bg-blue-600 text-white"
                            : "bg-[#2a2a2a] text-gray-400 hover:bg-[#333]"
                    }`}
                >
                    All Orders
                </button>
                <button
                    onClick={() => setActiveTab("history")}
                    className={`px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${
                        activeTab === "history"
                            ? "bg-blue-600 text-white"
                            : "bg-[#2a2a2a] text-gray-400 hover:bg-[#333]"
                    }`}
                >
                    <FaChartLine />
                    Sales History
                </button>
            </div>

            {/* History Period Tabs */}
            {activeTab === 'history' && (
                <div className='flex items-center gap-2 px-10 py-3 border-b border-gray-700 bg-[#1a1a1a]'>
                    <button
                        onClick={() => setHistoryPeriod("daily")}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${
                            historyPeriod === "daily"
                                ? "bg-green-600 text-white"
                                : "bg-[#2a2a2a] text-gray-400 hover:bg-[#333]"
                        }`}
                    >
                        Daily Sales
                    </button>
                    <button
                        onClick={() => setHistoryPeriod("weekly")}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${
                            historyPeriod === "weekly"
                                ? "bg-green-600 text-white"
                                : "bg-[#2a2a2a] text-gray-400 hover:bg-[#333]"
                        }`}
                    >
                        Weekly Sales
                    </button>
                    <button
                        onClick={() => setHistoryPeriod("monthly")}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${
                            historyPeriod === "monthly"
                                ? "bg-green-600 text-white"
                                : "bg-[#2a2a2a] text-gray-400 hover:bg-[#333]"
                        }`}
                    >
                        Monthly Sales
                    </button>
                </div>
            )}

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

            {/* Sort - Only show for orders tab */}
            {activeTab === 'orders' && (
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
            )}

            {/* Content Display */}
            <div className='flex-1 overflow-y-auto px-10 py-4'>
                {loading ? (
                    <div className='text-center py-8'>
                        <p className='text-gray-400'>Loading orders...</p>
                    </div>
                ) : activeTab === 'history' ? (
                    // Sales History View
                    salesHistory.length === 0 ? (
                        <div className='text-center py-8'>
                            <p className='text-gray-400'>No sales history found.</p>
                        </div>
                    ) : (
                        <div className='space-y-6'>
                            {/* Chart Section */}
                            <div className='bg-[#1a1a1a] rounded-lg p-4'>
                                <div className='flex items-center justify-between mb-4'>
                                    <h3 className='text-[#f5f5f5] text-xl font-semibold flex items-center gap-2'>
                                        <FaChartLine className='text-blue-400' />
                                        Revenue Trend
                                    </h3>
                                    <button
                                        onClick={() => setShowChartModal(true)}
                                        className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition flex items-center gap-2'
                                    >
                                        <FaChartBar />
                                        View Detailed Analytics
                                    </button>
                                </div>
                                <SalesChart data={salesHistory} type='line' period={historyPeriod} />
                            </div>

                            {/* History List */}
                            <div className='space-y-4'>
                                <h3 className='text-[#f5f5f5] text-lg font-semibold'>Period Breakdown</h3>
                                {salesHistory.map((period, index) => (
                                    <div
                                        key={period.periodKey}
                                        className='bg-[#262626] rounded-lg p-4 hover:bg-[#2a2a2a] transition-colors'
                                    >
                                        <div className='flex items-center justify-between'>
                                            <div className='flex-1'>
                                                <div className='flex items-center gap-3 mb-2'>
                                                    <FaCalendarAlt className='text-blue-400' />
                                                    <h3 className='text-[#f5f5f5] text-lg font-semibold'>
                                                        {period.periodLabel}
                                                    </h3>
                                                </div>
                                                <div className='flex items-center gap-4 text-sm text-gray-400 ml-8'>
                                                    <span>{period.orderCount} {period.orderCount === 1 ? 'order' : 'orders'}</span>
                                                </div>
                                            </div>
                                            <div className='text-right'>
                                                <p className='text-green-400 text-2xl font-bold'>
                                                    ₱{period.totalRevenue.toFixed(2)}
                                                </p>
                                                <p className='text-gray-400 text-sm'>Revenue</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                ) : (
                    // Orders View
                    sortedOrders.length === 0 ? (
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
                    )
                )}
            </div>

            {/* Sales Chart Modal */}
            <SalesChartModal
                isOpen={showChartModal}
                onClose={() => setShowChartModal(false)}
                salesHistory={salesHistory}
                period={historyPeriod}
            />

            <BottomNav />
        </section>
    )
}

export default Orders