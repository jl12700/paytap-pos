import React, { useState, useEffect } from 'react'
import BottomNav from '../components/shared/BottomNav'
import OrderCard from '../components/orders/OrderCard'
import OrderListItem from '../components/orders/OrderListItem'
import ReceiptModal from '../components/ReceiptModal'
import BackButton from '../components/shared/BackButton'
import SalesChart from '../components/SalesChart'
import SalesChartModal from '../components/SalesChartModal'
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore'
import { db } from '../firebase/config'
import { auth } from '../firebase/config'
import { FaList, FaTh, FaCalendarAlt, FaSortAmountDown, FaChartLine, FaChartBar, FaPrint, FaFileInvoice, FaCheckCircle, FaClock, FaCheckDouble, FaCircle } from 'react-icons/fa'

const Orders = () => {
    const [viewMode, setViewMode] = useState("table");
    const [sortBy, setSortBy] = useState("dateDesc");
    const [activeTab, setActiveTab] = useState("orders");
    const [historyPeriod, setHistoryPeriod] = useState("daily");
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [salesHistory, setSalesHistory] = useState([]);
    const [showChartModal, setShowChartModal] = useState(false);
    const [vendorInfo, setVendorInfo] = useState(null);
    const [expandedPeriod, setExpandedPeriod] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showReceipt, setShowReceipt] = useState(false);
    const [stats, setStats] = useState({
        totalOrders: 0,
        totalRevenue: 0,
        completedOrders: 0,
        pendingOrders: 0
    });

    useEffect(() => {
        fetchOrders();
        fetchVendorInfo();
    }, []);

    const fetchVendorInfo = async () => {
        try {
            const currentVendor = auth.currentUser;
            if (!currentVendor) return;

            const vendorDoc = await getDocs(query(
                collection(db, 'vendors'),
                where('__name__', '==', currentVendor.uid)
            ));

            if (!vendorDoc.empty) {
                setVendorInfo(vendorDoc.docs[0].data());
            }
        } catch (error) {
            console.error('Error fetching vendor info:', error);
        }
    };

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const currentVendor = auth.currentUser;
            
            if (!currentVendor) {
                console.error('No vendor logged in');
                setOrders([]);
                setLoading(false);
                return;
            }

            console.log('📍 Fetching orders for vendor:', currentVendor.uid);

            const ordersRef = collection(db, 'orders');
            const q = query(
                ordersRef,
                where('vendorId', '==', currentVendor.uid),
                orderBy('createdAt', 'desc')
            );

            const querySnapshot = await getDocs(q);

            const ordersList = [];
            querySnapshot.forEach((doc) => {
                ordersList.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            console.log('📦 Total orders for this vendor:', ordersList.length);
            setOrders(ordersList);
            calculateStats(ordersList);
        } catch (error) {
            console.error('Error fetching vendor orders:', error);
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

        orders.forEach(order => {
            if (!order.createdAt || !order.totalAmount) return;
            
            const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
            let periodKey = '';
            let periodLabel = '';

            if (historyPeriod === 'daily') {
                const year = orderDate.getFullYear();
                const month = orderDate.getMonth() + 1;
                const day = orderDate.getDate();
                periodKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                periodLabel = `${orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
            } else if (historyPeriod === 'weekly') {
                const year = orderDate.getFullYear();
                const week = getWeekNumber(orderDate);
                periodKey = `${year}-W${String(week).padStart(2, '0')}`;
                const weekStart = getWeekStart(orderDate);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                periodLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
            } else if (historyPeriod === 'monthly') {
                const year = orderDate.getFullYear();
                const month = orderDate.getMonth() + 1;
                periodKey = `${year}-${String(month).padStart(2, '0')}`;
                periodLabel = orderDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            } else if (historyPeriod === 'yearly') {
                const year = orderDate.getFullYear();
                periodKey = `${year}`;
                periodLabel = `${year}`;
            }

            if (!ordersByPeriod[periodKey]) {
                ordersByPeriod[periodKey] = {
                    periodKey,
                    periodLabel,
                    orders: [],
                    totalRevenue: 0,
                    orderCount: 0,
                    date: orderDate,
                    storeNames: new Set() // Track unique store names
                };
            }

            ordersByPeriod[periodKey].orders.push(order);
            ordersByPeriod[periodKey].totalRevenue += order.totalAmount || 0;
            ordersByPeriod[periodKey].orderCount += 1;
            
            // Add store name from order (where students buy)
            if (order.businessName) {
                ordersByPeriod[periodKey].storeNames.add(order.businessName);
            }
        });

        const historyArray = Object.values(ordersByPeriod).map(item => ({
            ...item,
            storeNames: Array.from(item.storeNames) // Convert Set to Array
        })).sort((a, b) => {
            return b.date - a.date;
        });

        setSalesHistory(historyArray);
    };

    const getWeekNumber = (date) => {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    };

    const getWeekStart = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    };

    useEffect(() => {
        if (activeTab === 'history') {
            calculateSalesHistory();
        }
    }, [orders, historyPeriod, activeTab]);

    // ✅ End of Day Sales Report
    const printEndOfDayReport = () => {
        const currentVendor = auth.currentUser;
        const businessName = vendorInfo?.businessName || 'PayTap POS';
        const location = vendorInfo?.location || 'N/A';
        const vendorEmail = currentVendor?.email || 'N/A';
        
        // Get today's orders only
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const todayOrders = orders.filter(order => {
            if (!order.createdAt) return false;
            const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
            // Only include orders from today (between today 00:00 and tomorrow 00:00)
            return orderDate >= today && orderDate < tomorrow;
        });

        // Show alert if no transactions today
        if (todayOrders.length === 0) {
            alert('No transactions found for today.');
            return;
        }

        // Calculate totals
        let cashTotal = 0;
        let gcashTotal = 0;
        let totalSales = 0;
        let completedCount = 0;
        let cancelledCount = 0;

        todayOrders.forEach(order => {
            if (order.status?.toLowerCase() === 'completed') {
                completedCount++;
                totalSales += order.totalAmount || 0;
                
                if (order.paymentMethod === 'cash') {
                    cashTotal += order.totalAmount || 0;
                } else if (order.paymentMethod === 'gcash') {
                    gcashTotal += order.totalAmount || 0;
                }
            } else {
                cancelledCount++;
            }
        });

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>End of Day Report - ${today.toLocaleDateString()}</title>
                <style>
                    @media print {
                        @page { margin: 1cm; }
                        body { margin: 0; padding: 20px; }
                    }
                    * { box-sizing: border-box; }
                    body {
                        font-family: 'Segoe UI', Arial, sans-serif;
                        padding: 30px;
                        background: white;
                        color: #000;
                        max-width: 900px;
                        margin: 0 auto;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                        border-bottom: 3px solid #000;
                        padding-bottom: 20px;
                    }
                    .header h1 {
                        margin: 0 0 10px 0;
                        font-size: 28px;
                        color: #000;
                        font-weight: bold;
                    }
                    .header .business-name {
                        font-size: 20px;
                        font-weight: bold;
                        margin: 10px 0;
                        color: #333;
                    }
                    .header p {
                        margin: 5px 0;
                        color: #666;
                        font-size: 13px;
                    }
                    .report-info {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 10px;
                        margin-bottom: 30px;
                        background: #f8f8f8;
                        padding: 15px;
                        border-radius: 5px;
                    }
                    .report-info div {
                        font-size: 13px;
                    }
                    .report-info strong {
                        color: #000;
                    }
                    .summary-section {
                        margin-bottom: 30px;
                    }
                    .summary-section h2 {
                        font-size: 18px;
                        margin-bottom: 15px;
                        color: #000;
                        border-bottom: 2px solid #ddd;
                        padding-bottom: 8px;
                    }
                    .summary-grid {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 15px;
                        margin-bottom: 20px;
                    }
                    .summary-card {
                        background: #f0f0f0;
                        padding: 15px;
                        border-radius: 5px;
                        border-left: 4px solid #333;
                    }
                    .summary-card h3 {
                        margin: 0 0 8px 0;
                        font-size: 12px;
                        color: #666;
                        font-weight: normal;
                        text-transform: uppercase;
                    }
                    .summary-card p {
                        margin: 0;
                        font-size: 24px;
                        font-weight: bold;
                        color: #000;
                    }
                    .summary-card.highlight {
                        background: #e8f5e9;
                        border-left-color: #4caf50;
                    }
                    .summary-card.highlight p {
                        color: #2e7d32;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 30px;
                        font-size: 12px;
                    }
                    th {
                        background: #000;
                        color: white;
                        padding: 12px 8px;
                        text-align: left;
                        font-weight: bold;
                        font-size: 11px;
                        text-transform: uppercase;
                    }
                    td {
                        padding: 10px 8px;
                        border-bottom: 1px solid #ddd;
                        vertical-align: top;
                    }
                    tr:nth-child(even) {
                        background: #f9f9f9;
                    }
                    .total-row {
                        font-weight: bold;
                        background: #e8f5e9 !important;
                        border-top: 2px solid #4caf50;
                    }
                    .total-row td {
                        padding: 15px 8px;
                        font-size: 14px;
                    }
                    .payment-breakdown {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 15px;
                        margin: 20px 0;
                    }
                    .payment-card {
                        background: #f5f5f5;
                        padding: 15px;
                        border-radius: 5px;
                        text-align: center;
                    }
                    .payment-card h3 {
                        margin: 0 0 10px 0;
                        font-size: 13px;
                        color: #666;
                        text-transform: uppercase;
                    }
                    .payment-card p {
                        margin: 0;
                        font-size: 22px;
                        font-weight: bold;
                        color: #000;
                    }
                    .items-list {
                        font-size: 11px;
                        color: #666;
                    }
                    .items-list div {
                        padding: 2px 0;
                    }
                    .items-list div:last-child {
                        border-bottom: none;
                    }
                    .footer {
                        margin-top: 40px;
                        padding-top: 20px;
                        border-top: 2px solid #ddd;
                        text-align: center;
                    }
                    .signatures {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 30px;
                        margin: 30px 0;
                    }
                    .signature-box {
                        text-align: center;
                        padding: 20px;
                    }
                    .signature-line {
                        border-top: 2px solid #000;
                        margin: 50px 0 10px 0;
                    }
                    .signature-label {
                        font-size: 12px;
                        color: #666;
                        text-transform: uppercase;
                    }
                    .print-date {
                        text-align: right;
                        margin-bottom: 20px;
                        font-size: 11px;
                        color: #999;
                    }
                    .status-badge {
                        display: inline-block;
                        padding: 4px 8px;
                        border-radius: 3px;
                        font-size: 10px;
                        font-weight: bold;
                    }
                    .status-completed {
                        background: #e8f5e9;
                        color: #2e7d32;
                    }
                    .status-pending {
                        background: #fff3e0;
                        color: #e65100;
                    }
                </style>
            </head>
            <body>
                <div class="print-date">Report Generated: ${new Date().toLocaleString()}</div>
                
                <div class="header">
                    <h1>END OF DAY SALES REPORT</h1>
                    <div class="business-name">${businessName}</div>
                    <p>${location}</p>
                    <p>Contact: ${vendorEmail}</p>
                </div>
                
                <div class="report-info">
                    <div><strong>Report Date:</strong> ${today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    <div><strong>Report Time:</strong> ${new Date().toLocaleTimeString()}</div>
                    <div><strong>Reporting Period:</strong> 12:00 AM - 11:59 PM</div>
                    <div><strong>Prepared By:</strong> ${vendorEmail}</div>
                </div>

                <div class="summary-section">
                    <h2>📊 Daily Summary</h2>
                    <div class="summary-grid">
                        <div class="summary-card highlight">
                            <h3>Total Sales</h3>
                            <p>₱${totalSales.toFixed(2)}</p>
                        </div>
                        <div class="summary-card">
                            <h3>Total Transactions</h3>
                            <p>${completedCount}</p>
                        </div>
                        <div class="summary-card">
                            <h3>Average Transaction</h3>
                            <p>₱${completedCount > 0 ? (totalSales / completedCount).toFixed(2) : '0.00'}</p>
                        </div>
                        <div class="summary-card">
                            <h3>Cancelled Orders</h3>
                            <p>${cancelledCount}</p>
                        </div>
                    </div>
                </div>

                <div class="summary-section">
                    <h2>💳 Payment Method Breakdown</h2>
                    <div class="payment-breakdown">
                        <div class="payment-card">
                            <h3>Cash Payments</h3>
                            <p>₱${cashTotal.toFixed(2)}</p>
                        </div>
                        <div class="payment-card">
                            <h3>PayTap/GCash Payments</h3>
                            <p>₱${gcashTotal.toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                <div class="summary-section">
                    <h2>📝 Transaction Details</h2>
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 8%;">Time</th>
                                <th style="width: 10%;">Order ID</th>
                                <th style="width: 12%;">Customer</th>
                                <th style="width: 12%;">Store Name</th>
                                <th style="width: 30%;">Items Ordered</th>
                                <th style="width: 8%;">Payment</th>
                                <th style="width: 8%;">Status</th>
                                <th style="width: 12%; text-align: right;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${todayOrders.length > 0 ? todayOrders.map(order => {
                                const orderTime = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
                                const statusClass = order.status?.toLowerCase() === 'completed' ? 'status-completed' : 'status-pending';
                                
                                // Detailed items list with individual prices and quantities
                                const itemsList = order.items?.map(item => {
                                    const itemTotal = (item.price || 0) * (item.qty || 0);
                                    return `
                                        <div style="padding: 4px 0; border-bottom: 1px solid #eee;">
                                            <strong>${item.name || 'N/A'}</strong><br>
                                            <span style="font-size: 10px; color: #666;">
                                                Price: ₱${(item.price || 0).toFixed(2)} × Qty: ${item.qty || 0} = ₱${itemTotal.toFixed(2)}
                                            </span>
                                        </div>
                                    `;
                                }).join('') || '<div style="color: #999;">No items</div>';
                                
                                return `
                                    <tr>
                                        <td style="font-size: 11px;">${orderTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</td>
                                        <td><strong style="font-size: 11px;">${order.orderId || (order.id ? order.id.substring(0, 8) : 'N/A')}</strong></td>
                                        <td style="font-size: 11px;">${order.customerName || 'Walk-in'}</td>
                                        <td style="font-size: 11px;">${order.businessName || 'N/A'}</td>
                                        <td>
                                            <div class="items-list" style="max-height: 150px; overflow-y: auto;">
                                                ${itemsList}
                                            </div>
                                        </td>
                                        <td style="text-transform: uppercase; font-size: 11px;">${order.paymentMethod || 'N/A'}</td>
                                        <td><span class="status-badge ${statusClass}">${order.status || 'Pending'}</span></td>
                                        <td style="text-align: right;"><strong>₱${(order.totalAmount || 0).toFixed(2)}</strong></td>
                                    </tr>
                                `;
                            }).join('') : '<tr><td colspan="8" style="text-align: center; padding: 30px;">No transactions today</td></tr>'}
                            <tr class="total-row">
                                <td colspan="7" style="text-align: right;"><strong>TOTAL SALES:</strong></td>
                                <td style="text-align: right;"><strong>₱${totalSales.toFixed(2)}</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="signatures">
                    <div class="signature-box">
                        <div class="signature-line"></div>
                        <div class="signature-label">Cashier / Prepared By</div>
                    </div>
                    <div class="signature-box">
                        <div class="signature-line"></div>
                        <div class="signature-label">Manager / Verified By</div>
                    </div>
                </div>

                <div class="footer">
                    <p style="margin: 0; font-size: 12px; color: #666;">This is a computer-generated document. No signature is required.</p>
                    <p style="margin: 5px 0 0 0; font-size: 11px; color: #999;">PayTap POS System © ${new Date().getFullYear()}</p>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        
        setTimeout(() => {
            printWindow.print();
        }, 250);
    };

    // Updated period sales report to show store name and detailed table
    const printPeriodSalesReport = () => {
        if (salesHistory.length === 0) {
            alert('No sales data available to print.');
            return;
        }

        const currentVendor = auth.currentUser;
        const businessName = vendorInfo?.businessName || 'PayTap POS';
        const location = vendorInfo?.location || 'N/A';
        const vendorEmail = currentVendor?.email || 'N/A';

        const totalRevenue = salesHistory.reduce((sum, item) => sum + item.totalRevenue, 0);
        const totalOrders = salesHistory.reduce((sum, item) => sum + item.orderCount, 0);

        const periodLabels = {
            daily: 'Daily Sales Report',
            weekly: 'Weekly Sales Report',
            monthly: 'Monthly Sales Report',
            yearly: 'Yearly Sales Report'
        };
        const periodLabel = periodLabels[historyPeriod] || 'Sales History';

        // Flatten all orders from all periods for detailed transaction table
        const allOrders = salesHistory.flatMap(item => item.orders);

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${periodLabel} - ${businessName}</title>
                <style>
                    @media print {
                        @page { margin: 1cm; }
                        body { margin: 0; padding: 20px; }
                    }
                    body {
                        font-family: 'Segoe UI', Arial, sans-serif;
                        padding: 20px;
                        background: white;
                        color: black;
                        max-width: 1200px;
                        margin: 0 auto;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                        border-bottom: 3px solid #000;
                        padding-bottom: 20px;
                    }
                    .header h1 {
                        margin: 0 0 10px 0;
                        font-size: 28px;
                        color: #000;
                        font-weight: bold;
                    }
                    .header .business-name {
                        font-size: 20px;
                        font-weight: bold;
                        margin: 10px 0;
                        color: #333;
                    }
                    .header p {
                        margin: 5px 0;
                        color: #666;
                        font-size: 13px;
                    }
                    .summary-section {
                        margin-bottom: 30px;
                        background: #f8f8f8;
                        padding: 15px;
                        border-radius: 5px;
                    }
                    .summary-section h2 {
                        font-size: 18px;
                        margin-bottom: 15px;
                        color: #000;
                        border-bottom: 2px solid #ddd;
                        padding-bottom: 8px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 30px;
                        font-size: 12px;
                    }
                    th {
                        background: #000;
                        color: white;
                        padding: 12px 8px;
                        text-align: left;
                        font-weight: bold;
                        font-size: 11px;
                        text-transform: uppercase;
                    }
                    td {
                        padding: 10px 8px;
                        border-bottom: 1px solid #ddd;
                        vertical-align: top;
                    }
                    tr:nth-child(even) {
                        background: #f9f9f9;
                    }
                    .total-row {
                        font-weight: bold;
                        background: #e8f5e9 !important;
                        border-top: 2px solid #4caf50;
                    }
                    .total-row td {
                        padding: 15px 8px;
                        font-size: 14px;
                    }
                    .items-list {
                        font-size: 11px;
                        color: #666;
                    }
                    .items-list div {
                        padding: 4px 0;
                        border-bottom: 1px solid #eee;
                    }
                    .items-list div:last-child {
                        border-bottom: none;
                    }
                    .status-badge {
                        display: inline-block;
                        padding: 4px 8px;
                        border-radius: 3px;
                        font-size: 10px;
                        font-weight: bold;
                    }
                    .status-completed {
                        background: #e8f5e9;
                        color: #2e7d32;
                    }
                    .status-pending {
                        background: #fff3e0;
                        color: #e65100;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${periodLabel}</h1>
                    <div class="business-name">${businessName}</div>
                    <p>${location}</p>
                    <p>Contact: ${vendorEmail}</p>
                    <p>Generated: ${new Date().toLocaleString()}</p>
                </div>
                
                <div class="summary-section">
                    <h2>📊 Period Summary</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Period</th>
                                <th>Store Name</th>
                                <th style="text-align: right;">Orders</th>
                                <th style="text-align: right;">Revenue</th>
                                <th style="text-align: right;">Avg Order</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${salesHistory.map(item => `
                                <tr>
                                    <td>${item.periodLabel}</td>
                                    <td>${item.storeNames && item.storeNames.length > 0 ? (item.storeNames.length === 1 ? item.storeNames[0] : `${item.storeNames[0]} (+${item.storeNames.length - 1} more)`) : 'N/A'}</td>
                                    <td style="text-align: right;">${item.orderCount}</td>
                                    <td style="text-align: right;">₱${item.totalRevenue.toFixed(2)}</td>
                                    <td style="text-align: right;">₱${(item.totalRevenue / item.orderCount).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                            <tr class="total-row">
                                <td colspan="2"><strong>Total</strong></td>
                                <td style="text-align: right;"><strong>${totalOrders}</strong></td>
                                <td style="text-align: right;"><strong>₱${totalRevenue.toFixed(2)}</strong></td>
                                <td style="text-align: right;"><strong>₱${(totalRevenue / totalOrders).toFixed(2)}</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="summary-section">
                    <h2>📝 Detailed Transaction History</h2>
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 8%;">Date/Time</th>
                                <th style="width: 10%;">Order ID</th>
                                <th style="width: 12%;">Customer</th>
                                <th style="width: 12%;">Store Name</th>
                                <th style="width: 30%;">Items Ordered</th>
                                <th style="width: 8%;">Payment</th>
                                <th style="width: 8%;">Status</th>
                                <th style="width: 12%; text-align: right;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${allOrders.length > 0 ? allOrders.map(order => {
                                const orderTime = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
                                const statusClass = order.status?.toLowerCase() === 'completed' ? 'status-completed' : 'status-pending';
                                
                                // Detailed items list
                                const itemsList = order.items?.map(item => {
                                    const itemTotal = (item.price || 0) * (item.qty || 0);
                                    return `
                                        <div>
                                            <strong>${item.name || 'N/A'}</strong><br>
                                            <span style="font-size: 10px; color: #666;">
                                                Price: ₱${(item.price || 0).toFixed(2)} × Qty: ${item.qty || 0} = ₱${itemTotal.toFixed(2)}
                                            </span>
                                        </div>
                                    `;
                                }).join('') || '<div style="color: #999;">No items</div>';
                                
                                return `
                                    <tr>
                                        <td style="font-size: 11px;">${orderTime.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                        <td><strong style="font-size: 11px;">${order.orderId || (order.id ? order.id.substring(0, 8) : 'N/A')}</strong></td>
                                        <td style="font-size: 11px;">${order.customerName || 'Walk-in'}</td>
                                        <td style="font-size: 11px;">${order.businessName || 'N/A'}</td>
                                        <td>
                                            <div class="items-list" style="max-height: 150px; overflow-y: auto;">
                                                ${itemsList}
                                            </div>
                                        </td>
                                        <td style="text-transform: uppercase; font-size: 11px;">${order.paymentMethod || 'N/A'}</td>
                                        <td><span class="status-badge ${statusClass}">${order.status || 'Pending'}</span></td>
                                        <td style="text-align: right;"><strong>₱${(order.totalAmount || 0).toFixed(2)}</strong></td>
                                    </tr>
                                `;
                            }).join('') : '<tr><td colspan="8" style="text-align: center; padding: 30px;">No transactions available</td></tr>'}
                            <tr class="total-row">
                                <td colspan="7" style="text-align: right;"><strong>TOTAL:</strong></td>
                                <td style="text-align: right;"><strong>₱${totalRevenue.toFixed(2)}</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        
        setTimeout(() => {
            printWindow.print();
        }, 250);
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
                
                {activeTab === 'orders' && (
                    <div className='flex items-center gap-2'>
                        <button
                            onClick={() => setViewMode("table")}
                            className={`p-2 rounded-lg ${viewMode === "table" ? 'bg-blue-600 text-white' : 'bg-[#2a2a2a] text-gray-400'}`}
                            title="Table View"
                        >
                            <FaList />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-2 rounded-lg ${viewMode === "list" ? 'bg-blue-600 text-white' : 'bg-[#2a2a2a] text-gray-400'}`}
                            title="List View"
                        >
                            <FaTh />
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
                    Orders
                </button>
                <button
                    onClick={() => setActiveTab("history")}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                        activeTab === "history"
                            ? "bg-blue-600 text-white"
                            : "bg-[#2a2a2a] text-gray-400 hover:bg-[#333]"
                    }`}
                >
                    Sales History
                </button>
            </div>

            {/* Main Content */}
            <div className='flex-1 overflow-y-auto px-10 py-6'>
                {activeTab === 'orders' ? (
                    <>
                        {/* Stats Cards */}
                        <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
                            <div className='bg-[#2a2a2a] p-4 rounded-lg border border-gray-700'>
                                <p className='text-gray-400 text-sm'>Total Orders</p>
                                <p className='text-white text-2xl font-bold'>{stats.totalOrders}</p>
                            </div>
                            <div className='bg-[#2a2a2a] p-4 rounded-lg border border-gray-700'>
                                <p className='text-gray-400 text-sm'>Total Revenue</p>
                                <p className='text-white text-2xl font-bold'>₱{stats.totalRevenue.toFixed(2)}</p>
                            </div>
                            <div className='bg-[#2a2a2a] p-4 rounded-lg border border-gray-700'>
                                <p className='text-gray-400 text-sm'>Completed</p>
                                <p className='text-green-500 text-2xl font-bold'>{stats.completedOrders}</p>
                            </div>
                            <div className='bg-[#2a2a2a] p-4 rounded-lg border border-gray-700'>
                                <p className='text-gray-400 text-sm'>Pending</p>
                                <p className='text-yellow-500 text-2xl font-bold'>{stats.pendingOrders}</p>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className='flex items-center justify-between mb-6'>
                            <div className='flex items-center gap-2'>
                                <FaSortAmountDown className='text-gray-400' />
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className='bg-[#2a2a2a] text-white px-4 py-2 rounded-lg border border-gray-700'
                                >
                                    <option value="dateDesc">Newest First</option>
                                    <option value="dateAsc">Oldest First</option>
                                    <option value="amountDesc">Highest Amount</option>
                                    <option value="amountAsc">Lowest Amount</option>
                                </select>
                            </div>

                            <button
                                onClick={printEndOfDayReport}
                                className='flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition'
                            >
                                <FaFileInvoice />
                                End of Day Report
                            </button>
                        </div>

                        {/* Orders Display */}
                        {loading ? (
                            <div className='text-center text-gray-400 py-20'>
                                <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
                                <p className='mt-4'>Loading orders...</p>
                            </div>
                        ) : sortedOrders.length === 0 ? (
                            <div className='text-center text-gray-400 py-20'>
                                <p className='text-xl'>No orders found</p>
                            </div>
                        ) : viewMode === "table" ? (
                            <div className='bg-[#2a2a2a] rounded-lg border border-gray-700 overflow-hidden'>
                                <div className='overflow-x-auto'>
                                    <table className='w-full'>
                                        <thead className='bg-[#1a1a1a]'>
                                            <tr>
                                                <th className='text-left text-gray-400 font-semibold px-6 py-4 border-b border-gray-700'>Date/Time</th>
                                                <th className='text-left text-gray-400 font-semibold px-6 py-4 border-b border-gray-700'>Order ID</th>
                                                <th className='text-left text-gray-400 font-semibold px-6 py-4 border-b border-gray-700'>Customer</th>
                                                <th className='text-left text-gray-400 font-semibold px-6 py-4 border-b border-gray-700'>Store Name</th>
                                                <th className='text-left text-gray-400 font-semibold px-6 py-4 border-b border-gray-700'>Items</th>
                                                <th className='text-left text-gray-400 font-semibold px-6 py-4 border-b border-gray-700'>Payment</th>
                                                <th className='text-left text-gray-400 font-semibold px-6 py-4 border-b border-gray-700'>Status</th>
                                                <th className='text-right text-gray-400 font-semibold px-6 py-4 border-b border-gray-700'>Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sortedOrders.map(order => {
                                                const orderTime = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
                                                const getStatusColor = (status) => {
                                                    switch (status?.toLowerCase()) {
                                                        case 'completed':
                                                            return 'bg-green-900 text-green-300';
                                                        case 'pending':
                                                        case 'in progress':
                                                            return 'bg-yellow-900 text-yellow-300';
                                                        case 'ready':
                                                            return 'bg-blue-900 text-blue-300';
                                                        default:
                                                            return 'bg-gray-700 text-gray-300';
                                                    }
                                                };
                                                const getStatusIcon = (status) => {
                                                    switch (status?.toLowerCase()) {
                                                        case 'completed':
                                                            return <FaCheckCircle className='inline mr-1' />;
                                                        case 'pending':
                                                        case 'in progress':
                                                            return <FaClock className='inline mr-1' />;
                                                        case 'ready':
                                                            return <FaCheckDouble className='inline mr-1' />;
                                                        default:
                                                            return <FaCircle className='inline mr-1' />;
                                                    }
                                                };
                                                return (
                                                    <tr 
                                                        key={order.id} 
                                                        className='hover:bg-[#333] transition cursor-pointer'
                                                        onClick={() => {
                                                            setSelectedOrder(order);
                                                            setShowReceipt(true);
                                                        }}
                                                    >
                                                        <td className='px-6 py-4 text-white border-b border-gray-800 text-sm'>
                                                            {orderTime.toLocaleString('en-US', { 
                                                                month: 'short', 
                                                                day: 'numeric', 
                                                                year: 'numeric',
                                                                hour: '2-digit', 
                                                                minute: '2-digit' 
                                                            })}
                                                        </td>
                                                        <td className='px-6 py-4 text-white border-b border-gray-800'>
                                                            <strong className='text-sm'>{order.orderId || order.id?.substring(0, 8) || 'N/A'}</strong>
                                                        </td>
                                                        <td className='px-6 py-4 text-white border-b border-gray-800 text-sm'>
                                                            {order.customerName || 'Walk-in'}
                                                        </td>
                                                        <td className='px-6 py-4 text-white border-b border-gray-800 text-sm'>
                                                            {order.businessName || 'N/A'}
                                                        </td>
                                                        <td className='px-6 py-4 text-gray-300 border-b border-gray-800 text-sm'>
                                                            <div className='max-w-xs'>
                                                                {order.items?.map((item, idx) => (
                                                                    <div key={idx} className='text-xs mb-1'>
                                                                        {item.name} (x{item.qty}) - ₱{(item.price * item.qty).toFixed(2)}
                                                                    </div>
                                                                )) || 'N/A'}
                                                            </div>
                                                        </td>
                                                        <td className='px-6 py-4 text-gray-300 border-b border-gray-800 text-sm capitalize'>
                                                            {order.paymentMethod === 'gcash' ? 'GCash' : order.paymentMethod === 'cash' ? 'Cash' : order.paymentMethod || 'N/A'}
                                                        </td>
                                                        <td className='px-6 py-4 border-b border-gray-800'>
                                                            <span className={`px-2 py-1 rounded text-xs ${getStatusColor(order.status)}`}>
                                                                {getStatusIcon(order.status)}
                                                                {order.status || 'Pending'}
                                                            </span>
                                                        </td>
                                                        <td className='px-6 py-4 text-right text-green-400 font-semibold border-b border-gray-800'>
                                                            ₱{(order.totalAmount || 0).toFixed(2)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        {sortedOrders.length > 0 && (
                                            <tfoot className='bg-[#1a1a1a]'>
                                                <tr>
                                                    <td colSpan="7" className='px-6 py-4 text-white font-bold border-t-2 border-blue-600 text-right'>
                                                        TOTAL
                                                    </td>
                                                    <td className='px-6 py-4 text-right text-green-400 font-bold border-t-2 border-blue-600'>
                                                        ₱{stats.totalRevenue.toFixed(2)}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        )}
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className='space-y-2'>
                                {sortedOrders.map(order => (
                                    <OrderListItem key={order.id} order={order} />
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        {/* Sales History */}
                        <div className='mb-6'>
                            <div className='flex items-center justify-between mb-4'>
                                <div className='flex items-center gap-2'>
                                    <FaCalendarAlt className='text-gray-400' />
                                    <select
                                        value={historyPeriod}
                                        onChange={(e) => setHistoryPeriod(e.target.value)}
                                        className='bg-[#2a2a2a] text-white px-4 py-2 rounded-lg border border-gray-700'
                                    >
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="yearly">Yearly</option>
                                    </select>
                                </div>

                                <div className='flex items-center gap-2'>
                                    <button
                                        onClick={() => setShowChartModal(true)}
                                        className='flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition'
                                    >
                                        <FaChartLine />
                                        View Chart
                                    </button>
                                    <button
                                        onClick={printPeriodSalesReport}
                                        className='flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition'
                                    >
                                        <FaPrint />
                                        Print Report
                                    </button>
                                </div>
                            </div>

                            {/* Store Info Banner */}
                            {vendorInfo && (
                                <div className='bg-gradient-to-r from-blue-900 to-purple-900 p-4 rounded-lg mb-6 border border-blue-700'>
                                    <div className='flex items-center justify-between'>
                                        <div>
                                            <h3 className='text-white text-lg font-bold'>{vendorInfo.businessName}</h3>
                                            <p className='text-gray-300 text-sm'>{vendorInfo.location}</p>
                                        </div>
                                        <div className='text-right'>
                                            <p className='text-gray-300 text-sm'>Total Sales Periods</p>
                                            <p className='text-white text-2xl font-bold'>{salesHistory.length}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Sales History Table */}
                            <div className='bg-[#2a2a2a] rounded-lg border border-gray-700 overflow-hidden'>
                                <div className='overflow-x-auto'>
                                    <table className='w-full'>
                                        <thead className='bg-[#1a1a1a]'>
                                            <tr>
                                                <th className='text-left text-gray-400 font-semibold px-6 py-4 border-b border-gray-700' style={{width: '5%'}}></th>
                                                <th className='text-left text-gray-400 font-semibold px-6 py-4 border-b border-gray-700'>Period</th>
                                                <th className='text-left text-gray-400 font-semibold px-6 py-4 border-b border-gray-700'>Store Name</th>
                                                <th className='text-right text-gray-400 font-semibold px-6 py-4 border-b border-gray-700'>Orders</th>
                                                <th className='text-right text-gray-400 font-semibold px-6 py-4 border-b border-gray-700'>Revenue</th>
                                                <th className='text-right text-gray-400 font-semibold px-6 py-4 border-b border-gray-700'>Avg Order</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {salesHistory.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" className='text-center text-gray-400 py-12'>
                                                        No sales data available for this period
                                                    </td>
                                                </tr>
                                            ) : (
                                                salesHistory.map((item, index) => (
                                                    <React.Fragment key={index}>
                                                        <tr className='hover:bg-[#333] transition cursor-pointer' onClick={() => setExpandedPeriod(expandedPeriod === index ? null : index)}>
                                                            <td className='px-6 py-4 text-white border-b border-gray-800'>
                                                                <span className='text-blue-400 font-bold'>{expandedPeriod === index ? '▼' : '▶'}</span>
                                                            </td>
                                                            <td className='px-6 py-4 text-white border-b border-gray-800'>
                                                                {item.periodLabel}
                                                            </td>
                                                            <td className='px-6 py-4 text-white border-b border-gray-800'>
                                                                {item.storeNames && item.storeNames.length > 0 
                                                                    ? (item.storeNames.length === 1 
                                                                        ? item.storeNames[0] 
                                                                        : `${item.storeNames[0]} (+${item.storeNames.length - 1} more)`)
                                                                    : 'N/A'}
                                                            </td>
                                                            <td className='px-6 py-4 text-right text-white border-b border-gray-800'>
                                                                <span className='bg-blue-600 px-3 py-1 rounded-full text-sm'>
                                                                    {item.orderCount}
                                                                </span>
                                                            </td>
                                                            <td className='px-6 py-4 text-right text-green-400 font-semibold border-b border-gray-800'>
                                                                ₱{item.totalRevenue.toFixed(2)}
                                                            </td>
                                                            <td className='px-6 py-4 text-right text-gray-300 border-b border-gray-800'>
                                                                ₱{(item.totalRevenue / item.orderCount).toFixed(2)}
                                                            </td>
                                                        </tr>
                                                        {expandedPeriod === index && (
                                                            <tr>
                                                                <td colSpan="6" className='px-6 py-4 bg-[#1a1a1a] border-b border-gray-800'>
                                                                    <div className='mt-4'>
                                                                        <h3 className='text-white font-semibold text-lg mb-4'>Transaction Details</h3>
                                                                        <div className='overflow-x-auto'>
                                                                            <table className='w-full'>
                                                                                <thead className='bg-[#2a2a2a]'>
                                                                                    <tr>
                                                                                        <th className='text-left text-gray-400 font-semibold px-4 py-3 border-b border-gray-700'>Time</th>
                                                                                        <th className='text-left text-gray-400 font-semibold px-4 py-3 border-b border-gray-700'>Order ID</th>
                                                                                        <th className='text-left text-gray-400 font-semibold px-4 py-3 border-b border-gray-700'>Customer</th>
                                                                                        <th className='text-left text-gray-400 font-semibold px-4 py-3 border-b border-gray-700'>Store Name</th>
                                                                                        <th className='text-left text-gray-400 font-semibold px-4 py-3 border-b border-gray-700'>Items</th>
                                                                                        <th className='text-left text-gray-400 font-semibold px-4 py-3 border-b border-gray-700'>Payment</th>
                                                                                        <th className='text-left text-gray-400 font-semibold px-4 py-3 border-b border-gray-700'>Status</th>
                                                                                        <th className='text-right text-gray-400 font-semibold px-4 py-3 border-b border-gray-700'>Amount</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                    {item.orders.map((order, orderIndex) => {
                                                                                        const orderTime = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
                                                                                        return (
                                                                                            <tr key={orderIndex} className='hover:bg-[#333] transition'>
                                                                                                <td className='px-4 py-3 text-gray-300 border-b border-gray-800 text-sm'>
                                                                                                    {orderTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                                                                </td>
                                                                                                <td className='px-4 py-3 text-white border-b border-gray-800 text-sm'>
                                                                                                    <strong>{order.orderId || order.id?.substring(0, 8) || 'N/A'}</strong>
                                                                                                </td>
                                                                                                <td className='px-4 py-3 text-white border-b border-gray-800 text-sm'>
                                                                                                    {order.customerName || 'Walk-in'}
                                                                                                </td>
                                                                                                <td className='px-4 py-3 text-white border-b border-gray-800 text-sm'>
                                                                                                    {order.businessName || 'N/A'}
                                                                                                </td>
                                                                                                <td className='px-4 py-3 text-gray-300 border-b border-gray-800 text-sm'>
                                                                                                    <div className='max-w-xs'>
                                                                                                        {order.items?.map((item, idx) => (
                                                                                                            <div key={idx} className='text-xs'>
                                                                                                                {item.name} (x{item.qty}) - ₱{(item.price * item.qty).toFixed(2)}
                                                                                                            </div>
                                                                                                        )) || 'N/A'}
                                                                                                    </div>
                                                                                                </td>
                                                                                                <td className='px-4 py-3 text-gray-300 border-b border-gray-800 text-sm capitalize'>
                                                                                                    {order.paymentMethod || 'N/A'}
                                                                                                </td>
                                                                                                <td className='px-4 py-3 border-b border-gray-800'>
                                                                                                    <span className={`px-2 py-1 rounded text-xs ${
                                                                                                        order.status?.toLowerCase() === 'completed' 
                                                                                                            ? 'bg-green-900 text-green-300' 
                                                                                                            : 'bg-yellow-900 text-yellow-300'
                                                                                                    }`}>
                                                                                                        {order.status || 'Pending'}
                                                                                                    </span>
                                                                                                </td>
                                                                                                <td className='px-4 py-3 text-right text-green-400 font-semibold border-b border-gray-800 text-sm'>
                                                                                                    ₱{(order.totalAmount || 0).toFixed(2)}
                                                                                                </td>
                                                                                            </tr>
                                                                                        );
                                                                                    })}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                ))
                                            )}
                                        </tbody>
                                        {salesHistory.length > 0 && (
                                            <tfoot className='bg-[#1a1a1a]'>
                                                <tr>
                                                    <td colSpan="3" className='px-6 py-4 text-white font-bold border-t-2 border-blue-600'>
                                                        TOTAL
                                                    </td>
                                                    <td className='px-6 py-4 text-right text-white font-bold border-t-2 border-blue-600'>
                                                        {salesHistory.reduce((sum, item) => sum + item.orderCount, 0)}
                                                    </td>
                                                    <td className='px-6 py-4 text-right text-green-400 font-bold border-t-2 border-blue-600'>
                                                        ₱{salesHistory.reduce((sum, item) => sum + item.totalRevenue, 0).toFixed(2)}
                                                    </td>
                                                    <td className='px-6 py-4 text-right text-gray-300 font-bold border-t-2 border-blue-600'>
                                                        ₱{(
                                                            salesHistory.reduce((sum, item) => sum + item.totalRevenue, 0) /
                                                            salesHistory.reduce((sum, item) => sum + item.orderCount, 0)
                                                        ).toFixed(2)}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        )}
                                    </table>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Chart Modal */}
            {showChartModal && (
                <SalesChartModal
                    salesData={salesHistory}
                    period={historyPeriod}
                    onClose={() => setShowChartModal(false)}
                />
            )}

            {/* Receipt Modal */}
            {selectedOrder && (
                <ReceiptModal
                    isOpen={showReceipt}
                    onClose={() => {
                        setShowReceipt(false);
                        setSelectedOrder(null);
                    }}
                    order={selectedOrder}
                />
            )}

            <BottomNav />
        </section>
    );
};

export default Orders;