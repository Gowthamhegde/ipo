'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import bytezApiService from '../lib/bytezApiService'

// Stylish Navbar with new color scheme
function Navbar({ onShowDashboard }) {
  return (
    <nav className="bg-gradient-to-r from-dark-900 via-dark-800 to-primary-900 shadow-2xl sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-accent-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">💎</span>
              </div>
              <div className="ml-4">
                <span className="text-2xl font-bold bg-gradient-to-r from-primary-300 to-accent-300 bg-clip-text text-transparent">
                  IPO GMP Pro
                </span>
                <div className="text-xs text-primary-200 font-medium">AI-Powered Analysis</div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-6 text-primary-200">
              <span className="hover:text-white transition-colors cursor-pointer">Features</span>
              <span className="hover:text-white transition-colors cursor-pointer">About</span>
            </div>
            <button
              onClick={onShowDashboard}
              className="bg-gradient-to-r from-primary-500 to-accent-500 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:from-primary-600 hover:to-accent-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Launch Dashboard
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

function Hero({ onGetStarted }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-dark-900 via-primary-900 to-accent-900 min-h-screen flex items-center">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary-400/5 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="text-center">
          <div className="mb-8">
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-primary-500/20 text-primary-200 border border-primary-500/30">
              🚀 AI-Powered IPO Analysis
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-8">
            <span className="bg-gradient-to-r from-white via-primary-200 to-accent-200 bg-clip-text text-transparent">
              Smart IPO Analysis
            </span>
            <br />
            <span className="bg-gradient-to-r from-primary-300 to-accent-300 bg-clip-text text-transparent">
              with AI Intelligence
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-primary-100 mb-12 max-w-4xl mx-auto leading-relaxed">
            Discover profitable IPO opportunities with real-time Grey Market Premium data, 
            AI-powered predictions, and intelligent analysis from multiple trusted sources.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button
              onClick={onGetStarted}
              className="group bg-gradient-to-r from-primary-500 to-accent-500 text-white px-10 py-5 rounded-2xl text-lg font-bold hover:from-primary-600 hover:to-accent-600 transition-all duration-300 shadow-2xl hover:shadow-primary-500/25 transform hover:scale-105"
            >
              <span className="flex items-center gap-3">
                Start Analysis
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </span>
            </button>
            
            <button className="border-2 border-primary-400/50 text-primary-200 px-10 py-5 rounded-2xl text-lg font-semibold hover:bg-primary-500/10 hover:border-primary-400 transition-all duration-300">
              Watch Demo
            </button>
          </div>
          
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-300 mb-2">500+</div>
              <div className="text-primary-200 text-sm">IPOs Tracked</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent-300 mb-2">95%</div>
              <div className="text-primary-200 text-sm">AI Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-300 mb-2">Real-time</div>
              <div className="text-primary-200 text-sm">Updates</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent-300 mb-2">24/7</div>
              <div className="text-primary-200 text-sm">Monitoring</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function SimpleDashboard() {
  const [ipos, setIpos] = useState([])
  const [filteredIpos, setFilteredIpos] = useState([])
  const [stats, setStats] = useState({
    totalIpos: 0,
    activeIpos: 0,
    profitableIpos: 0,
    avgGMP: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [boardFilter, setBoardFilter] = useState('all') // 'all', 'mainboard', 'sme'
  const [liveStatus, setLiveStatus] = useState({ isLive: false, source: 'Loading...' })
  const [realTimeUpdates, setRealTimeUpdates] = useState({ updates: [] })

  // Fetch real IPO data using Bytez AI
  useEffect(() => {
    fetchIPOData()
  }, [])

  // Apply filter when board filter changes
  useEffect(() => {
    if (ipos.length > 0) {
      applyFilter()
    }
  }, [boardFilter])

  const fetchIPOData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get live analysis status and real-time updates
      const [status, ipoData, updates] = await Promise.all([
        bytezApiService.getLiveAnalysisStatus(),
        bytezApiService.fetchRealIPOData(),
        bytezApiService.getRealTimeUpdates()
      ])
      
      setLiveStatus(status)
      setRealTimeUpdates(updates)
      setIpos(ipoData)
      setLastUpdated(new Date().toLocaleTimeString())
      
      // Apply filtering locally
      applyFilter(ipoData, boardFilter)
      
    } catch (err) {
      setError('Failed to fetch IPO data. Please try again.')
      setLiveStatus({ isLive: false, source: 'Error', error: err.message })
    } finally {
      setLoading(false)
    }
  }, [boardFilter])

  // Apply board filter to IPOs (optimized for local filtering)
  const applyFilter = useCallback(async (ipoData = ipos, filter = boardFilter) => {
    const filtered = await bytezApiService.filterIPOsByBoard(filter)
    setFilteredIpos(filtered)
    
    // Calculate stats locally for better performance
    const filteredStats = {
      totalIpos: filtered.length,
      activeIpos: filtered.filter(ipo => ['Open', 'Upcoming'].includes(ipo.status)).length,
      profitableIpos: filtered.filter(ipo => ipo.isProfitable).length,
      avgGMP: filtered.length > 0 ? 
        parseFloat((filtered.reduce((sum, ipo) => sum + ipo.gmp, 0) / filtered.length).toFixed(2)) : 0,
      boardType: filter,
      lastUpdated: new Date().toISOString()
    }
    setStats(filteredStats)
  }, [ipos, boardFilter])

  // Handle filter change (optimized)
  const handleFilterChange = useCallback(async (newFilter) => {
    setBoardFilter(newFilter)
    if (ipos.length > 0) {
      await applyFilter(ipos, newFilter)
    }
  }, [ipos, applyFilter])

  const refreshData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 User requested data refresh...')
      
      // Force fresh data fetch
      const freshData = await bytezApiService.refreshAllData()
      
      // Update live status
      const status = await bytezApiService.getLiveAnalysisStatus()
      setLiveStatus(status)
      
      // Get fresh updates
      const updates = await bytezApiService.getRealTimeUpdates()
      setRealTimeUpdates(updates)
      
      setIpos(freshData)
      setLastUpdated(new Date().toLocaleTimeString())
      applyFilter(freshData, boardFilter)
      
      console.log(`✅ Refresh complete: ${freshData.length} IPOs loaded`)
      
    } catch (err) {
      console.error('❌ Refresh failed:', err)
      setError('Failed to refresh data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [boardFilter, applyFilter])



  const handleApplyIPO = useCallback((ipo) => {
    // Open Groww IPO page in new tab
    window.open(ipo.growwUrl, '_blank', 'noopener,noreferrer')
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-50 via-primary-50 to-accent-50">
      <div className="bg-gradient-to-r from-white/95 to-primary-50/95 backdrop-blur-sm shadow-xl border-b border-primary-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">💎</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-dark-800 to-primary-700 bg-clip-text text-transparent">
                    AI-Powered IPO Dashboard
                  </h1>
                  <p className="text-dark-600 mt-1 flex items-center gap-2">
                    Real-time analysis with Bytez AI
                    {lastUpdated && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-700 border border-success-200">
                        🟢 Updated: {lastUpdated}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-xl border ${
                liveStatus.isLive 
                  ? 'bg-success-100 border-success-200' 
                  : filteredIpos.length > 0
                    ? 'bg-primary-100 border-primary-200'
                    : 'bg-warning-100 border-warning-200'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  liveStatus.isLive 
                    ? 'bg-success-500 animate-pulse' 
                    : filteredIpos.length > 0
                      ? 'bg-primary-500 animate-pulse'
                      : 'bg-warning-500'
                }`}></span>
                <span className={`text-sm font-medium ${
                  liveStatus.isLive 
                    ? 'text-success-700' 
                    : filteredIpos.length > 0
                      ? 'text-primary-700'
                      : 'text-warning-700'
                }`}>
                  {liveStatus.isLive 
                    ? '🤖 Live ML Analysis' 
                    : filteredIpos.length > 0
                      ? '🔴 Live IPO Watch Data'
                      : '📊 No IPOs Available'
                  }
                </span>
              </div>
              
              <button
                onClick={refreshData}
                disabled={loading}
                className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-xl hover:from-primary-600 hover:to-accent-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
              >
                <span className={`text-lg ${loading ? 'animate-spin' : ''}`}>
                  {loading ? '⟳' : '🔄'}
                </span>
                <span className="font-semibold">
                  {loading ? 'Loading Real IPOs...' : 'Refresh IPO Data'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {useMemo(() => (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="bg-gradient-to-br from-white to-primary-50 rounded-2xl shadow-xl border border-primary-200/50 p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-dark-600 mb-2">Total IPOs</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                    {loading ? '...' : stats.totalIpos}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg">
                  <span className="text-2xl">📊</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-white to-success-50 rounded-2xl shadow-xl border border-success-200/50 p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-dark-600 mb-2">Active IPOs</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-success-600 to-success-700 bg-clip-text text-transparent">
                    {loading ? '...' : stats.activeIpos}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-success-500 to-success-600 text-white shadow-lg">
                  <span className="text-2xl">🚀</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-white to-accent-50 rounded-2xl shadow-xl border border-accent-200/50 p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-dark-600 mb-2">Profitable IPOs</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-accent-600 to-accent-700 bg-clip-text text-transparent">
                    {loading ? '...' : stats.profitableIpos}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-600 text-white shadow-lg">
                  <span className="text-2xl">💎</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-warning-50 rounded-2xl shadow-xl border border-warning-200/50 p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-dark-600 mb-2">Avg GMP</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-warning-600 to-warning-700 bg-clip-text text-transparent">
                    {loading ? '...' : `₹${stats.avgGMP}`}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-warning-500 to-warning-600 text-white shadow-lg">
                  <span className="text-2xl">💰</span>
                </div>
              </div>
            </div>
          </div>
        ), [loading, stats])}



        {/* Real-time Updates Section */}
        {realTimeUpdates.updates && realTimeUpdates.updates.length > 0 && (
          <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl shadow-xl border border-primary-200/50 p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-sm">🔴</span>
              </div>
              <div>
                <h3 className="text-lg font-bold bg-gradient-to-r from-primary-700 to-accent-700 bg-clip-text text-transparent">
                  Live Market Updates
                </h3>
                <p className="text-sm text-dark-600">Real-time IPO market information</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {realTimeUpdates.updates.slice(0, 3).map((update, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-primary-100">
                  <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-dark-800">
                      {update.company ? `${update.company}: ` : ''}{update.message || update.details || 'Market update available'}
                    </div>
                    {update.timestamp && (
                      <div className="text-xs text-dark-500 mt-1">
                        {new Date(update.timestamp).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-gradient-to-r from-danger-50 to-danger-100 border-2 border-danger-200 rounded-2xl p-6 mb-8 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-danger-500 to-danger-600 rounded-2xl flex items-center justify-center text-white text-xl">
                ⚠️
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-danger-800 mb-1">Data Fetch Error</h4>
                <p className="text-danger-700">{error}</p>
              </div>
              <button
                onClick={fetchIPOData}
                className="bg-gradient-to-r from-danger-500 to-danger-600 text-white px-6 py-3 rounded-2xl font-bold hover:from-danger-600 hover:to-danger-700 transition-all duration-300 shadow-lg"
              >
                🔄 Retry
              </button>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Filter Section */}
          <div className="bg-gradient-to-r from-white to-primary-50 rounded-2xl shadow-xl border border-primary-200/50 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-dark-800 to-primary-700 bg-clip-text text-transparent mb-2">
                  IPO Explorer
                </h2>
                <p className="text-dark-600 text-sm">
                  Filter and explore IPOs by board type • {loading ? '...' : filteredIpos.length} IPOs found
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-dark-700">Filter by Board:</span>
                <div className="flex bg-primary-100 rounded-xl p-1 border border-primary-200">
                  <button
                    onClick={() => handleFilterChange('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                      boardFilter === 'all'
                        ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg'
                        : 'text-primary-700 hover:text-primary-900 hover:bg-primary-200'
                    }`}
                  >
                    All IPOs
                  </button>
                  <button
                    onClick={() => handleFilterChange('mainboard')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                      boardFilter === 'mainboard'
                        ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg'
                        : 'text-primary-700 hover:text-primary-900 hover:bg-primary-200'
                    }`}
                  >
                    Main Board
                  </button>
                  <button
                    onClick={() => handleFilterChange('sme')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                      boardFilter === 'sme'
                        ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg'
                        : 'text-primary-700 hover:text-primary-900 hover:bg-primary-200'
                    }`}
                  >
                    SME
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-900">
              {boardFilter === 'all' ? 'All IPOs' : 
               boardFilter === 'mainboard' ? 'Main Board IPOs' : 'SME IPOs'} 
              ({loading ? '...' : filteredIpos.length})
            </h3>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gradient-to-br from-white to-primary-50 rounded-3xl shadow-xl border border-primary-200/50 p-8 animate-pulse">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                      <div className="h-6 bg-gradient-to-r from-primary-200 to-accent-200 rounded-xl w-3/4 mb-3"></div>
                      <div className="h-4 bg-primary-100 rounded-lg w-1/2 mb-2"></div>
                      <div className="h-3 bg-primary-100 rounded-lg w-1/3"></div>
                    </div>
                    <div className="w-16 h-8 bg-primary-200 rounded-2xl"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="h-16 bg-primary-100 rounded-2xl"></div>
                    <div className="h-16 bg-accent-100 rounded-2xl"></div>
                  </div>
                  <div className="h-20 bg-gradient-to-r from-dark-200 to-primary-200 rounded-2xl mb-6"></div>
                  <div className="h-12 bg-primary-200 rounded-2xl"></div>
                </div>
              ))}
            </div>
          ) : ipos.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-32 h-32 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
                <span className="text-6xl">🤖</span>
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-dark-800 to-primary-700 bg-clip-text text-transparent mb-4">
                AI is Fetching IPO Data
              </h3>
              <p className="text-dark-600 mb-8 max-w-md mx-auto">
                Our AI is analyzing current market data to bring you the latest IPO information.
              </p>
              <button
                onClick={fetchIPOData}
                className="bg-gradient-to-r from-primary-500 to-accent-500 text-white px-8 py-4 rounded-2xl font-bold hover:from-primary-600 hover:to-accent-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                🔄 Fetch Data
              </button>
            </div>
          ) : filteredIpos.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-accent-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">📊</span>
              </div>
              <h3 className="text-2xl font-bold text-dark-800 mb-4">No IPOs Currently Open</h3>
              <p className="text-dark-600 mb-6 max-w-md mx-auto">
                No IPOs are currently accepting applications. Check back later or refresh to get the latest IPO data from IPO Watch.
              </p>
              <button
                onClick={refreshData}
                disabled={loading}
                className="bg-gradient-to-r from-primary-500 to-accent-500 text-white px-8 py-3 rounded-2xl font-bold hover:from-primary-600 hover:to-accent-600 transition-all duration-300 shadow-lg disabled:opacity-50"
              >
                {loading ? '🔄 Checking IPO Watch...' : '🔄 Refresh from IPO Watch'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredIpos.map((ipo) => (
              <div key={ipo.id} className={`group relative bg-gradient-to-br from-white to-primary-50/30 rounded-3xl shadow-xl border-2 transition-all duration-500 hover:shadow-2xl hover:scale-105 ${
                ipo.isProfitable ? 'border-success-300/50 bg-gradient-to-br from-white to-success-50/30' : 'border-primary-200/50'
              }`}>
                {/* Board Type Badge */}
                <div className={`absolute -top-3 -left-3 px-4 py-2 rounded-2xl text-xs font-bold shadow-lg z-10 ${
                  ipo.boardType === 'SME' 
                    ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white' 
                    : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white'
                }`}>
                  {ipo.boardType === 'SME' ? '🏢 SME' : '🏛️ MAIN BOARD'}
                </div>

                {/* Profitable Badge */}
                {ipo.isProfitable && (
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-success-500 to-success-600 text-white px-4 py-2 rounded-2xl text-xs font-bold shadow-lg z-10">
                    💎 PROFITABLE
                  </div>
                )}
                
                <div className="p-8">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold bg-gradient-to-r from-dark-800 to-primary-700 bg-clip-text text-transparent mb-2">
                        {ipo.name}
                      </h3>
                      <p className="text-dark-600 font-medium">{ipo.company}</p>
                      <p className="text-sm text-dark-500 mt-1">{ipo.industry}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-4 py-2 rounded-2xl text-sm font-bold shadow-lg ${
                        ipo.status === 'Open' ? 'bg-gradient-to-r from-success-500 to-success-600 text-white' :
                        ipo.status === 'Upcoming' ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white' :
                        ipo.status === 'Closed' ? 'bg-gradient-to-r from-warning-500 to-warning-600 text-white' :
                        'bg-gradient-to-r from-dark-500 to-dark-600 text-white'
                      }`}>
                        {ipo.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-4 border border-primary-200/50">
                      <div className="text-xs font-bold text-primary-700 mb-2">PRICE BAND</div>
                      <div className="text-lg font-bold text-dark-800">{ipo.priceRange}</div>
                    </div>
                    <div className="bg-gradient-to-br from-accent-50 to-accent-100 rounded-2xl p-4 border border-accent-200/50">
                      <div className="text-xs font-bold text-accent-700 mb-2">ISSUE SIZE</div>
                      <div className="text-lg font-bold text-dark-800">₹{ipo.issueSize}Cr</div>
                    </div>
                  </div>

                  {/* GMP Section */}
                  <div className="bg-gradient-to-r from-dark-900 via-primary-900 to-accent-900 rounded-2xl p-6 mb-6 text-white">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <div className="text-3xl font-bold">₹{ipo.gmp}</div>
                        <div className={`text-lg font-bold ${
                          ipo.gmpPercent >= 0 ? 'text-success-300' : 'text-danger-300'
                        }`}>
                          {ipo.gmpPercent >= 0 ? '+' : ''}{ipo.gmpPercent}%
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-primary-200 mb-1">AI CONFIDENCE</div>
                        <div className={`text-lg font-bold ${
                          ipo.confidenceScore >= 0.8 ? 'text-success-300' :
                          ipo.confidenceScore >= 0.6 ? 'text-warning-300' : 'text-danger-300'
                        }`}>
                          {Math.round(ipo.confidenceScore * 100)}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-primary-200">
                      <span>
                        {ipo.source === 'realistic_data' 
                          ? '📊 Market Data' 
                          : ipo.source === 'backend_ml' 
                            ? '🤖 ML Backend'
                            : ipo.source === 'real_time_chatgpt' || ipo.source === 'text_parsed_chatgpt'
                              ? '🔴 Live IPO Watch'
                              : '📊 IPO Data'
                        }
                      </span>
                      <span>Lot: {ipo.lotSize}</span>
                    </div>
                    
                    {ipo.isRealTime && (
                      <div className="mt-2 text-xs text-primary-300 flex items-center gap-1">
                        <span className="w-1 h-1 bg-primary-300 rounded-full animate-pulse"></span>
                        Real-time data from IPO Watch
                      </div>
                    )}
                    

                  </div>

                  {/* ML Prediction Section */}
                  {ipo.hasMLPrediction && ipo.mlPrediction && (
                    <div className="bg-gradient-to-br from-success-50 to-success-100 rounded-2xl p-4 mb-6 border border-success-200/50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🧠</span>
                          <span className="text-sm font-bold text-success-700">ML PREDICTION</span>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-success-800">
                            {ipo.predictedGain >= 0 ? '+' : ''}{ipo.predictedGain}%
                          </div>
                          <div className="text-xs text-success-600">Expected Gain</div>
                        </div>
                      </div>
                      
                      {ipo.mlFactors && ipo.mlFactors.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-xs font-semibold text-success-700 mb-2">Key Factors:</div>
                          {ipo.mlFactors.slice(0, 2).map((factor, index) => (
                            <div key={index} className="flex items-center justify-between text-xs">
                              <span className="text-success-700">{factor.factor}</span>
                              <span className={`font-semibold ${
                                factor.impact === 'Positive' ? 'text-success-600' :
                                factor.impact === 'Negative' ? 'text-danger-600' : 'text-warning-600'
                              }`}>
                                {factor.impact}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Description */}
                  {ipo.description && (
                    <p className="text-sm text-dark-600 mb-6 leading-relaxed">
                      {ipo.description}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApplyIPO(ipo)}
                      className="flex-1 bg-gradient-to-r from-primary-500 to-accent-500 text-white py-4 px-6 rounded-2xl font-bold hover:from-primary-600 hover:to-accent-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
                    >
                      <span>🚀</span>
                      Apply on Groww
                    </button>
                    
                    <button className="px-6 py-4 border-2 border-primary-300 text-primary-700 rounded-2xl font-bold hover:bg-primary-50 transition-all duration-300 flex items-center justify-center">
                      <span>📊</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [showDashboard, setShowDashboard] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onShowDashboard={() => setShowDashboard(true)} />
      
      {showDashboard ? (
        <SimpleDashboard />
      ) : (
        <>
          <Hero onGetStarted={() => setShowDashboard(true)} />
          
          {/* Stats Section */}
          <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Trusted by Investors Across India
                </h2>
                <p className="text-lg text-gray-600">
                  Real-time data from multiple sources with AI-powered insights
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
                  <div className="text-gray-600">IPOs Tracked</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">95%</div>
                  <div className="text-gray-600">Accuracy Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-purple-600 mb-2">4</div>
                  <div className="text-gray-600">Data Sources</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-orange-600 mb-2">24/7</div>
                  <div className="text-gray-600">Monitoring</div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-16 gradient-bg">
            <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to Make Smarter IPO Investments?
              </h2>
              <p className="text-xl text-blue-100 mb-8">
                Join thousands of investors who trust our GMP analysis and notifications
              </p>
              <button
                onClick={() => setShowDashboard(true)}
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Start Analyzing IPOs
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  )
}