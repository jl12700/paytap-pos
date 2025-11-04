import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SalesChart = ({ data, type = 'line', period = 'daily' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-[#2a2a2a] rounded-lg p-8 text-center">
        <p className="text-gray-400">No data available for chart</p>
      </div>
    );
  }

  // Format data for charts
  const chartData = data.map((item) => ({
    period: item.periodLabel,
    revenue: parseFloat(item.totalRevenue.toFixed(2)),
    orders: item.orderCount,
  }));

  // Limit to last 30 days for daily, 12 weeks for weekly, 12 months for monthly
  const maxItems = period === 'daily' ? 30 : period === 'weekly' ? 12 : 12;
  const limitedData = chartData.slice(0, maxItems).reverse(); // Reverse to show oldest to newest

  return (
    <div className="bg-[#2a2a2a] rounded-lg p-6">
      <ResponsiveContainer width="100%" height={300}>
        {type === 'line' ? (
          <LineChart data={limitedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="period" 
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              tickFormatter={(value) => `₱${value.toLocaleString()}`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1a1a', 
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#f5f5f5'
              }}
              formatter={(value, name) => [
                name === 'revenue' ? `₱${parseFloat(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : value,
                name === 'revenue' ? 'Revenue' : 'Orders'
              ]}
            />
            <Legend 
              wrapperStyle={{ color: '#9ca3af' }}
              formatter={(value) => value === 'revenue' ? 'Revenue' : 'Orders'}
            />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
              name="revenue"
            />
          </LineChart>
        ) : (
          <BarChart data={limitedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="period" 
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              tickFormatter={(value) => `₱${value.toLocaleString()}`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1a1a', 
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#f5f5f5'
              }}
              formatter={(value, name) => [
                name === 'revenue' ? `₱${parseFloat(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : value,
                name === 'revenue' ? 'Revenue' : 'Orders'
              ]}
            />
            <Legend 
              wrapperStyle={{ color: '#9ca3af' }}
              formatter={(value) => value === 'revenue' ? 'Revenue' : 'Orders'}
            />
            <Bar dataKey="revenue" fill="#10b981" name="revenue" radius={[8, 8, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default SalesChart;

