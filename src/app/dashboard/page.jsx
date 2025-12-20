'use client'

import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  ArrowTrendingUpIcon as TrendingUpIcon, 
  CurrencyRupeeIcon, 
  CalendarIcon,
  ArrowPathIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import Navbar from '../../components/Navbar';

// Simple API service
const apiService = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  
  async get(endpoint) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
  
  async post(endpoint, data) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
};

// Mock data for development
const mockIPOs = [
  {
    id: 1,
    name: "Tata Technologies",
    price: "₹500",
    gmp: "₹85",
    gmpPercentage: 17,
    status: "Open",
    listingDate: "2024-01-15",
    isProfitable: true,
    industry: "Technology"
  },
  {
    id: 2,
    name: "IREDA",
    price: "₹32",
    gmp: "₹12",
    gmpPercentage: 37.5,
    status: "Upcoming",
    listingDate: "2024-01-20",
    isProfitable: true,
    industry: "Energy"
  },
  {
    id: 3,
    name: "Nexus Select Trust",
    price: "₹100",
    gmp: "₹5",
    gmpPercentage: 5,
    status: "Closed",
    listingDate: "2024-01-10",
    isProfitable: false,
    industry: "Real Estate"
  }
];

function StatsCard({ title, value, icon: Icon, color, change }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <p className="text-sm text-green-600 mt-1">
              +{change} from last week
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color] || colorClasses.blue}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function IPOCard({ ipo }) {
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProfitabilityColor = (isProfitable) => {
    return isProfitable ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{ipo.name}</h3>
          <p className="text-sm text-gray-500">{ipo.industry}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ipo.status)}`}>
          {ipo.status}
        </span>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Price Band:</span>
          <span className="text-sm font-medium">{ipo.price}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">GMP:</span>
          <span className={`text-sm font-medium ${getProfitabilityColor(ipo.isProfitable)}`}>
            {ipo.gmp} ({ipo.gmpPercentage}%)
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Listing Date:</span>
          <span className="text-sm font-medium">{ipo.listingDate}</span>
        </div>
        
        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${getProfitabilityColor(ipo.isProfitable)}`}>
              {ipo.isProfitable ? '✓ Profitable' : '✗ Not Profitable'}
            </span>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View Details →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [ipos, setIpos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchIPOData();
  }, []);

  const fetchIPOData = async () => {
    setLoading(true);
    try {
      // Try to fetch from API, fallback to mock data
      try {
        const data = await apiService.get('/api/realtime-ipo/latest-data');
        if (data && data.data && Array.isArray(data.data)) {
          setIpos(data.data);
        } else {
          throw new Error('Invalid API response');
        }
      } catch (apiError) {
        console.warn('API not available, using mock data:', apiError.message);
        setIpos(mockIPOs);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching IPO data:', err);
      setError('Failed to load IPO data');
      setIpos(mockIPOs); // Fallback to mock data
    } finally {
      setLoading(false);
    }
  };

  const filteredIPOs = ipos.filter(ipo => {
    const matchesFilter = filter === 'all' || 
      (filter === 'profitable' && ipo.isProfitable) ||
      (filter === 'open' && ipo.status.toLowerCase() === 'open') ||
      (filter === 'upcoming' && ipo.status.toLowerCase() === 'upcoming');
    
    const matchesSearch = ipo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ipo.industry.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: ipos.length,
    profitable: ipos.filter(ipo => ipo.isProfitable).length,
    open: ipos.filter(ipo => ipo.status.toLowerCase() === 'open').length,
    avgGMP: ipos.length > 0 ? Math.round(ipos.reduce((acc, ipo) => acc + ipo.gmpPercentage, 0) / ipos.length) : 0
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <SparklesIcon className="h-8 w-8 text-blue-600" />
                IPO Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Real-time IPO analysis and market insights</p>
            </div>
            
            <button
              onClick={fetchIPOData}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Refresh Data
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total IPOs"
            value={stats.total}
            icon={ChartBarIcon}
            color="blue"
          />
          <StatsCard
            title="Profitable IPOs"
            value={stats.profitable}
            icon={TrendingUpIcon}
            color="green"
            change={stats.profitable}
          />
          <StatsCard
            title="Open IPOs"
            value={stats.open}
            icon={CalendarIcon}
            color="yellow"
          />
          <StatsCard
            title="Avg GMP"
            value={`${stats.avgGMP}%`}
            icon={CurrencyRupeeIcon}
            color="purple"
          />
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search IPOs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All IPOs</option>
                <option value="profitable">Profitable Only</option>
                <option value="open">Open IPOs</option>
                <option value="upcoming">Upcoming IPOs</option>
              </select>
            </div>
          </div>
        </div>

        {/* IPO Grid */}
        {filteredIPOs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIPOs.map((ipo) => (
              <IPOCard key={ipo.id} ipo={ipo} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No IPOs Found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>
    </div>
    </>
  );
}