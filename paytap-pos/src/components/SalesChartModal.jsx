import React, { useState } from 'react';
import { FaTimes, FaChartLine, FaChartBar } from 'react-icons/fa';
import SalesChart from './SalesChart';

const SalesChartModal = ({ isOpen, onClose, salesHistory, period }) => {
  const [chartType, setChartType] = useState('line'); // 'line' or 'bar'

  if (!isOpen) return null;

  // Calculate summary statistics
  const totalRevenue = salesHistory.reduce((sum, item) => sum + item.totalRevenue, 0);
  const totalOrders = salesHistory.reduce((sum, item) => sum + item.orderCount, 0);
  const averageRevenue = salesHistory.length > 0 ? totalRevenue / salesHistory.length : 0;
  const averageOrders = salesHistory.length > 0 ? totalOrders / salesHistory.length : 0;

  // Find best and worst performing periods
  const bestPeriod = salesHistory.length > 0 
    ? salesHistory.reduce((best, current) => 
        current.totalRevenue > best.totalRevenue ? current : best
      )
    : null;
  
  const worstPeriod = salesHistory.length > 0 
    ? salesHistory.reduce((worst, current) => 
        current.totalRevenue < worst.totalRevenue ? current : worst
      )
    : null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-[#1f1f1f] rounded-2xl shadow-lg w-full max-w-5xl mx-4 overflow-y-auto max-h-[90vh] relative">
        {/* Header */}
        <div className="sticky top-0 bg-[#1f1f1f] flex justify-between items-center px-6 py-4 border-b border-gray-700 z-10">
          <h2 className="text-2xl font-bold text-white">Sales Analytics</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl transition"
          >
            <FaTimes />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Chart Type Toggle */}
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setChartType('line')}
              className={`px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${
                chartType === 'line'
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#2a2a2a] text-gray-400 hover:bg-[#333]'
              }`}
            >
              <FaChartLine />
              Line Chart
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${
                chartType === 'bar'
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#2a2a2a] text-gray-400 hover:bg-[#333]'
              }`}
            >
              <FaChartBar />
              Bar Chart
            </button>
          </div>

          {/* Chart */}
          <SalesChart data={salesHistory} type={chartType} period={period} />

          {/* Summary Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#2a2a2a] rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Total Revenue</p>
              <p className="text-green-400 text-2xl font-bold">
                ₱{totalRevenue.toFixed(2)}
              </p>
            </div>
            <div className="bg-[#2a2a2a] rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Total Orders</p>
              <p className="text-white text-2xl font-bold">{totalOrders}</p>
            </div>
            <div className="bg-[#2a2a2a] rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Avg Revenue</p>
              <p className="text-blue-400 text-2xl font-bold">
                ₱{averageRevenue.toFixed(2)}
              </p>
            </div>
            <div className="bg-[#2a2a2a] rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Avg Orders</p>
              <p className="text-yellow-400 text-2xl font-bold">
                {averageOrders.toFixed(1)}
              </p>
            </div>
          </div>

          {/* Best & Worst Performance */}
          {bestPeriod && worstPeriod && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                <p className="text-green-400 text-sm mb-2 font-semibold">Best Performing Period</p>
                <p className="text-white text-lg font-bold mb-1">{bestPeriod.periodLabel}</p>
                <p className="text-green-400 text-xl font-bold">
                  ₱{bestPeriod.totalRevenue.toFixed(2)}
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  {bestPeriod.orderCount} {bestPeriod.orderCount === 1 ? 'order' : 'orders'}
                </p>
              </div>
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-400 text-sm mb-2 font-semibold">Worst Performing Period</p>
                <p className="text-white text-lg font-bold mb-1">{worstPeriod.periodLabel}</p>
                <p className="text-red-400 text-xl font-bold">
                  ₱{worstPeriod.totalRevenue.toFixed(2)}
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  {worstPeriod.orderCount} {worstPeriod.orderCount === 1 ? 'order' : 'orders'}
                </p>
              </div>
            </div>
          )}

          {/* Period Breakdown Table */}
          <div className="bg-[#2a2a2a] rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-white text-lg font-semibold">Period Breakdown</h3>
            </div>
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-[#1a1a1a] sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-3 text-gray-400 text-sm font-semibold">Period</th>
                    <th className="text-right px-4 py-3 text-gray-400 text-sm font-semibold">Orders</th>
                    <th className="text-right px-4 py-3 text-gray-400 text-sm font-semibold">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {salesHistory.slice(0, 20).map((item, index) => (
                    <tr key={item.periodKey} className="border-b border-gray-700 hover:bg-[#333] transition">
                      <td className="px-4 py-3 text-white">{item.periodLabel}</td>
                      <td className="px-4 py-3 text-gray-400 text-right">{item.orderCount}</td>
                      <td className="px-4 py-3 text-green-400 text-right font-semibold">
                        ₱{item.totalRevenue.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesChartModal;

