import React, { useState, useEffect } from 'react'
import BottomNav from '../components/shared/BottomNav'
import Greetings from '../components/Greetings'
import { BsCashCoin } from 'react-icons/bs'
import { FaCoins } from 'react-icons/fa'
import { MdAccountBalanceWallet } from 'react-icons/md'
import MiniCard from '../components/MiniCard'
import  RecentOrders  from '../components/RecentOrders'
import PopularDishes from '../components/PopularDishes'
import EarningsModal from '../components/EarningsModal'
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore'
import { db } from '../firebase/config'

const Home = () => {
    const [showEarningsModal, setShowEarningsModal] = useState(false);
    const [totalEarnings, setTotalEarnings] = useState(0);
    const [paytapPoints, setPaytapPoints] = useState(0);
    const [cashPHP, setCashPHP] = useState(0);
    const [percentageChange, setPercentageChange] = useState(0);

    useEffect(() => {
        fetchTodayEarnings();
    }, []);

    const fetchTodayEarnings = async () => {
        try {
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            todayStart.setHours(0, 0, 0, 0);
            
            const yesterdayStart = new Date(todayStart);
            yesterdayStart.setDate(yesterdayStart.getDate() - 1);
            
            const todayEnd = new Date(now);
            
            const todayTimestamp = Timestamp.fromDate(todayStart);
            const todayEndTimestamp = Timestamp.fromDate(todayEnd);
            const yesterdayTimestamp = Timestamp.fromDate(yesterdayStart);
            const yesterdayEndTimestamp = Timestamp.fromDate(todayStart);

            const ordersRef = collection(db, 'orders');
            
            // Fetch today's orders
            let todayOrders;
            try {
                const todayQuery = query(
                    ordersRef,
                    where('createdAt', '>=', todayTimestamp),
                    where('createdAt', '<=', todayEndTimestamp),
                    where('status', '==', 'Completed')
                );
                todayOrders = await getDocs(todayQuery);
            } catch (error) {
                console.warn('Query with filters failed, fetching all orders:', error);
                const allOrders = await getDocs(ordersRef);
                todayOrders = allOrders;
            }

            // Fetch yesterday's orders
            let yesterdayOrders;
            try {
                const yesterdayQuery = query(
                    ordersRef,
                    where('createdAt', '>=', yesterdayTimestamp),
                    where('createdAt', '<', yesterdayEndTimestamp),
                    where('status', '==', 'Completed')
                );
                yesterdayOrders = await getDocs(yesterdayQuery);
            } catch (error) {
                console.warn('Query with filters failed, fetching all orders:', error);
                const allOrders = await getDocs(ordersRef);
                yesterdayOrders = allOrders;
            }

            // Calculate today's earnings
            let todayEarnings = 0;
            let todayPaytapPoints = 0;
            let todayCashPHP = 0;
            
            todayOrders.forEach((doc) => {
                const data = doc.data();
                const createdAt = data.createdAt;
                const paymentMethod = data.paymentMethod || '';
                
                if (createdAt) {
                    const orderDate = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
                    if (orderDate >= todayStart && orderDate <= now) {
                        if (data.status === 'Completed' || !data.status) {
                            if (data.totalAmount) {
                                todayEarnings += data.totalAmount;
                                // Breakdown by payment method
                                if (paymentMethod === 'gcash') {
                                    // 1 peso = 1 point
                                    todayPaytapPoints += Math.floor(data.totalAmount);
                                } else if (paymentMethod === 'cash') {
                                    todayCashPHP += data.totalAmount;
                                }
                            }
                        }
                    }
                } else if (data.status === 'Completed' || !data.status) {
                    if (data.totalAmount) {
                        todayEarnings += data.totalAmount;
                        // Breakdown by payment method
                        if (paymentMethod === 'gcash') {
                            // 1 peso = 1 point
                            todayPaytapPoints += Math.floor(data.totalAmount);
                        } else if (paymentMethod === 'cash') {
                            todayCashPHP += data.totalAmount;
                        }
                    }
                }
            });

            // Calculate yesterday's earnings
            let yesterdayEarnings = 0;
            yesterdayOrders.forEach((doc) => {
                const data = doc.data();
                const createdAt = data.createdAt;
                
                if (createdAt) {
                    const orderDate = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
                    if (orderDate >= yesterdayStart && orderDate < todayStart) {
                        if (data.status === 'Completed' || !data.status) {
                            if (data.totalAmount) {
                                yesterdayEarnings += data.totalAmount;
                            }
                        }
                    }
                } else if (data.status === 'Completed' || !data.status) {
                    // Skip orders without createdAt for yesterday calculation
                }
            });

            setTotalEarnings(todayEarnings);
            setPaytapPoints(todayPaytapPoints);
            setCashPHP(todayCashPHP);

            // Calculate percentage change
            if (yesterdayEarnings > 0) {
                const change = ((todayEarnings - yesterdayEarnings) / yesterdayEarnings) * 100;
                setPercentageChange(change);
            } else if (todayEarnings > 0) {
                setPercentageChange(100); // If no yesterday earnings but today has earnings
            } else {
                setPercentageChange(0);
            }
        } catch (error) {
            console.error('Error fetching today earnings:', error);
            setTotalEarnings(0);
            setPaytapPoints(0);
            setCashPHP(0);
            setPercentageChange(0);
        }
    };

    return (
        
        <section className='bg-[#1f1f1f] h-[calc(100vh-5rem)] overflow-hidden flex gap-3'>
          
            {/*Left Dive*/}
            <div className='flex-[3]'>
            <Greetings />
            <div className="flex items-center gap-4 w-full px-8 mt-8">
            <MiniCard 
                title="Total Earnings" 
                icon={<BsCashCoin />} 
                number={totalEarnings.toFixed(2)}
                footerNum={percentageChange.toFixed(1)}
                onIconClick={() => setShowEarningsModal(true)}
                cardType="earnings"
            />
            <MiniCard 
                title="PayTap Points" 
                icon={<FaCoins />} 
                number={paytapPoints.toLocaleString()}
                cardType="points"
            />
            <MiniCard 
                title="Cash" 
                icon={<MdAccountBalanceWallet />} 
                number={cashPHP.toFixed(2)}
                cardType="cash"
            />
            </div>
            <RecentOrders />
            </div>

            {/*Right Div*/}
            <div className='flex-[2]'>
                <PopularDishes />
            </div>

            {/* Earnings Modal */}
            <EarningsModal 
                isOpen={showEarningsModal}
                onClose={() => setShowEarningsModal(false)}
            />
            
            <BottomNav />
        </section>
    )
}

export default Home