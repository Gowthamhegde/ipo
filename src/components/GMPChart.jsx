import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

const GMPChart = ({ data, metric = 'avgGMP', height = 300 }) => {
  // Process data for the chart
  const processData = () => {
    if (!data || !Array.isArray(data)) {
      return [];
    }

    return data.map(item => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      avgGMP: item.avgGMP || 0,
      totalIPOs: item.totalIPOs || 0,
      profitableIPOs: item.profitableIPOs || 0,
      profitableRatio: item.totalIPOs > 0 ? (item.profitableIPOs / item.totalIPOs) * 100 : 0
    }));
  };

  const chartData = processData();

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300" style={{ height }}>
        <div className="text-center">
          <div className="text-gray-400 text-4xl mb-2">📊</div>
          <p className="text-gray-500">No data available for chart</p>
        </div>
      </div>
    );
  }

  const getDataKey = () => {
    switch (metric) {
      case 'ipo_count': return 'totalIPOs';
      case 'profitable_ratio': return 'profitableRatio';
      default: return 'avgGMP';
    }
  };

  const getYAxisFormatter = () => {
    switch (metric) {
      case 'ipo_count': return (value) => `${value}`;
      case 'profitable_ratio': return (value) => `${value}%`;
      default: return (value) => `₹${value}`;
    }
  };

  const getTooltipFormatter = () => {
    switch (metric) {
      case 'ipo_count': return (value) => [`${value}`, 'IPO Count'];
      case 'profitable_ratio': return (value) => [`${value.toFixed(1)}%`, 'Profitable Ratio'];
      default: return (value) => [`₹${value}`, 'Average GMP'];
    }
  };

  const getLineColor = () => {
    switch (metric) {
      case 'ipo_count': return '#10b981';
      case 'profitable_ratio': return '#8b5cf6';
      default: return '#3b82f6';
    }
  };

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            stroke="#666"
            fontSize={12}
          />
          <YAxis 
            stroke="#666"
            fontSize={12}
            tickFormatter={getYAxisFormatter()}
          />
          <Tooltip 
            formatter={getTooltipFormatter()}
            labelFormatter={(label) => `Date: ${label}`}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Line 
            type="monotone" 
            dataKey={getDataKey()} 
            stroke={getLineColor()} 
            strokeWidth={3}
            dot={{ fill: getLineColor(), strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: getLineColor(), strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default GMPChart