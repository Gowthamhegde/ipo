'use client'

import { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  DollarSign, 
  Users, 
  AlertCircle,
  Filter,
  Refresh,
  Bell,
  BarChart3
} from 'lucide-react'
import IPOCard from './IPOCard'
import FilterPanel from './FilterPanel'
import StatsCard from './StatsCard'
import { mockIPOs, mockStats } from '@/lib/mockData'
import toast from 'react-hot-toast'

export default function IPODashboard() {
  const [ipos, setIpos] = useState(mockIPOs)
  const [filteredIpos, setFilteredIpos] = useState(mockIPOs)
  const [stats, setStats] = useState(mockStats)
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    status: 'all',
    minGMP: 0,
    maxGMP: 1000,
    industry: 'all',
    profitableOnly: false
  })

  useEffect(() => {
    applyFilters()
  }, [filters, ipos])

  const applyFilters = () => {
    let filtered = [...ipos]

    if (filters.status !== 'all') {
      filtered = filtered.filter(ipo => ipo.status === filters.status)
    }

    if (filters.industry !== 'all') {
      filtered = filtered.filter(ipo => ipo.industry === filters.industry)
    }

    if (filters.profitableOnly) {
      filtered = filtered.filter(ipo => ipo.isProfitable)
    }

    filtered = filtered.filter(ipo => 
      ipo.currentGMP >= filters.minGMP && ipo.currentGMP <= filters.maxGMP
    )

    setFilteredIpos(filtered)
  }

  const refreshData = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Update mock data with slight variations
      const updatedIpos = ipos.map(ipo => ({
        ...ipo,
        currentGMP: ipo.currentGMP + (Math.random() - 0.5) * 10,
        gmpPercentage: ipo.gmpPercentage + (Math.random() - 0.5) * 2,
        confidenceScore: Math.min(1, Math.max(0, ipo.confidenceScore + (Math.random() - 0.5) * 0.1))
      }))
      
      setIpos(updatedIpos)
      toast.success('Data refreshed successfully!')
    } catch (error) {
      toast.error('Failed to refresh data')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-green-600 bg-green-100'
      case 'upcoming': return 'text-blue-600 bg-blue-100'
      case 'closed': return 'text-orange-600 bg-orange-100'
      case 'listed': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">IPO Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Real-time IPO analysis with GMP tracking and predictions
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="h-4 w-4" />
                Filters
              </button>
              
              <button
                onClick={refreshData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Refresh className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Bell className="h-4 w-4" />
                Alerts
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total IPOs"
            value={stats.totalIpos}
            icon={<BarChart3 className="h-6 w-6" />}
            color="blue"
          />
          <StatsCard
            title="Active IPOs"
            value={stats.activeIpos}
            icon={<TrendingUp className="h-6 w-6" />}
            color="green"
          />
          <StatsCard
            title="Profitable IPOs"
            value={stats.profitableIpos}
            icon={<DollarSign className="h-6 w-6" />}
            color="purple"
          />
          <StatsCard
            title="Avg GMP"
            value={`₹${stats.avgGMP}`}
            icon={<TrendingUp className="h-6 w-6" />}
            color="orange"
          />
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mb-8">
            <FilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              onClose={() => setShowFilters(false)}
            />
          </div>
        )}

        {/* IPO Grid */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              IPO List ({filteredIpos.length})
            </h2>
            
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-100 rounded-full"></div>
                <span>Profitable</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-100 rounded-full"></div>
                <span>Not Profitable</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : filteredIpos.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No IPOs Found</h3>
              <p className="text-gray-500">
                Try adjusting your filters to see more results.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredIpos.map((ipo) => (
                <IPOCard key={ipo.id} ipo={ipo} />
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-12 bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Bell className="h-5 w-5 text-blue-600" />
              <div className="text-left">
                <div className="font-medium text-gray-900">Setup Notifications</div>
                <div className="text-sm text-gray-500">Configure your alert preferences</div>
              </div>
            </button>
            
            <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <BarChart3 className="h-5 w-5 text-green-600" />
              <div className="text-left">
                <div className="font-medium text-gray-900">View Analytics</div>
                <div className="text-sm text-gray-500">Detailed performance insights</div>
              </div>
            </button>
            
            <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Users className="h-5 w-5 text-purple-600" />
              <div className="text-left">
                <div className="font-medium text-gray-900">Portfolio Tracking</div>
                <div className="text-sm text-gray-500">Track your IPO investments</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}