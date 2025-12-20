
'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { 
  ChartBarIcon, 
  CurrencyRupeeIcon, 
  PresentationChartLineIcon,
  ArchiveBoxIcon,
  ArrowPathIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'
import dataService from '../lib/dataService'
import StatsCard from './StatsCard'
import FilterPanel from './FilterPanel'
import IPOCard from './IPOCard'
import GeminiIPOController from './GeminiIPOController'
import NotificationPanel from './NotificationPanel'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const [ipos, setIpos] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  
  // Filters state
  const [filters, setFilters] = useState({
    status: 'all',
    profitableOnly: false,
    minGMP: '',
    maxGMP: '',
    industry: 'all',
    boardType: 'all'
  })

  // Initial data fetch
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await dataService.getLatestIPOData()
      setIpos(Array.isArray(data) ? data : [])
      setLastUpdated(new Date().toLocaleTimeString())
      
      if (!data || data.length === 0) {
        // Optional: Check if backend is actually down to show better message
        try {
          const status = await dataService.getServiceStatus()
          if (!status) {
            setError('Backend service appears to be down. Please ensure the backend is running.')
          }
        } catch (e) {
          setError('Backend connection failed.')
        }
      }
    } catch (err) {
      console.error('Failed to fetch data:', err)
      setError('Failed to load IPO data. Please check backend connection.')
      setIpos([])
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      // Trigger backend refresh
      await dataService.refreshData()
      // Wait a bit for backend to process (or poll status)
      // For now, simple delay then refetch
      await new Promise(r => setTimeout(r, 2000))
      await fetchData()
      toast.success('Data refreshed successfully')
    } catch (err) {
      console.error('Refresh failed:', err)
      toast.error('Failed to refresh data')
    } finally {
      setRefreshing(false)
    }
  }

  // Filter logic
  const filteredIPOs = useMemo(() => {
    return ipos.filter(ipo => {
      // Status filter
      if (filters.status !== 'all' && ipo.status?.toLowerCase() !== filters.status.toLowerCase()) return false
      
      // Profitable filter
      if (filters.profitableOnly && !ipo.isProfitable && !ipo.is_profitable) return false
      
      // Board type filter
      if (filters.boardType !== 'all') {
        const type = ipo.boardType || ipo.board_type || 'Main Board'
        if (type.toLowerCase() !== filters.boardType.toLowerCase()) return false
      }
      
      // Industry filter
      if (filters.industry !== 'all') {
        const ind = ipo.industry || ipo.sector || 'Others'
        if (ind.toLowerCase() !== filters.industry.toLowerCase()) return false
      }
      
      // GMP Range
      const gmp = ipo.gmp || ipo.current_gmp || 0
      if (filters.minGMP && gmp < parseFloat(filters.minGMP)) return false
      if (filters.maxGMP && gmp > parseFloat(filters.maxGMP)) return false
      
      return true
    })
  }, [ipos, filters])

  // Statistics calculation
  const stats = useMemo(() => {
    try {
      if (!Array.isArray(filteredIPOs)) {
        return { total: 0, active: 0, profitable: 0, avgGMP: 0 }
      }
      
      const total = filteredIPOs.length
      const active = filteredIPOs.filter(i => i && ['open', 'upcoming'].includes((i.status || '').toLowerCase())).length
      const profitable = filteredIPOs.filter(i => i && (i.isProfitable || i.is_profitable)).length
      const avgGMP = total > 0 
        ? filteredIPOs.reduce((acc, curr) => acc + (curr ? (curr.gmp || curr.current_gmp || 0) : 0), 0) / total 
        : 0

      return {
        total,
        active,
        profitable,
        avgGMP: Math.round(avgGMP)
      }
    } catch (e) {
      console.error('Error calculating stats:', e)
      return { total: 0, active: 0, profitable: 0, avgGMP: 0 }
    }
  }, [filteredIPOs])

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">IPO Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Real-time market analysis & AI predictions
            {lastUpdated && <span className="ml-2">• Updated: {lastUpdated}</span>}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <NotificationPanel />
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error}
              </p>
              <p className="text-xs text-red-600 mt-1">
                Try starting the backend server with: <code className="bg-red-100 px-1 py-0.5 rounded">npm run backend</code>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Gemini Controller (Admin/Status view) */}
      <div className="mb-8">
        <GeminiIPOController />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total IPOs"
          value={stats.total}
          icon={ArchiveBoxIcon}
          color="blue"
        />
        <StatsCard
          title="Active IPOs"
          value={stats.active}
          icon={ChartBarIcon}
          color="green"
        />
        <StatsCard
          title="Profitable Opportunities"
          value={stats.profitable}
          icon={ArrowTrendingUpIcon}
          color="purple"
          change={stats.profitable > 0 ? stats.profitable : 0}
        />
        <StatsCard
          title="Average GMP"
          value={`₹${stats.avgGMP}`}
          icon={CurrencyRupeeIcon}
          color="yellow"
        />
      </div>

      {/* Filters */}
      <FilterPanel 
        filters={filters} 
        onFiltersChange={setFilters} 
      />

      {/* IPO Grid */}
      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading market data...</p>
        </div>
      ) : filteredIPOs.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredIPOs.map((ipo, index) => (
            <IPOCard key={ipo.id || index} ipo={ipo} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <PresentationChartLineIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No IPOs Found</h3>
          <p className="text-gray-500 mt-1">Try adjusting your filters or refresh the data.</p>
          <button
            onClick={() => setFilters({
              status: 'all',
              profitableOnly: false,
              minGMP: '',
              maxGMP: '',
              industry: 'all',
              boardType: 'all'
            })}
            className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  )
}

export default Dashboard
