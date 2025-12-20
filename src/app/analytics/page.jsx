'use client'

import React, { useState, useEffect } from 'react'
import { 
  ChartBarIcon,
  ArrowTrendingUpIcon as TrendingUpIcon,
  ArrowTrendingDownIcon as TrendingDownIcon,
  CurrencyRupeeIcon,
  CalendarIcon,
  UsersIcon,
  BellIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline'
import GMPChart from '../../components/GMPChart'
import StatsCard from '../../components/StatsCard'
import Navbar from '../../components/Navbar'
import toast from 'react-hot-toast'

const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7d')
  const [selectedMetric, setSelectedMetric] = useState('gmp_trends')

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      
      console.log('🤖 Fetching analytics - Gemini AI Primary Mode')
      
      // Try to get market sentiment from Gemini AI first
      let geminiSentiment = null
      try {
        const sentimentResponse = await fetch('/api/gemini-ipo/market-sentiment')
        if (sentimentResponse.ok) {
          const sentimentData = await sentimentResponse.json()
          if (sentimentData.status === 'success') {
            geminiSentiment = sentimentData.data
            console.log('✅ Got market sentiment from Gemini AI')
          }
        }
      } catch (error) {
        console.warn('Failed to get Gemini sentiment:', error.message)
      }

      // Try to fetch real analytics data from backend
      const response = await fetch(`/api/analytics/stats?range=${timeRange}`)
      if (response.ok) {
        const data = await response.json()
        
        // Enhance with Gemini sentiment if available
        if (geminiSentiment) {
          data.geminiSentiment = geminiSentiment
          data.aiEnhanced = true
        }
        
        setAnalytics(data)
        toast.success('Analytics loaded with AI insights!')
      } else {
        // Generate mock analytics data enhanced with Gemini sentiment
        const mockData = generateMockAnalytics()
        if (geminiSentiment) {
          mockData.geminiSentiment = geminiSentiment
          mockData.aiEnhanced = true
          toast.success('Analytics loaded with Gemini AI market sentiment!')
        } else {
          toast.info('Using sample analytics data - configure Gemini AI for real insights')
        }
        setAnalytics(mockData)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      const mockData = generateMockAnalytics()
      setAnalytics(mockData)
      toast.error('Failed to load analytics - showing sample data')
    } finally {
      setLoading(false)
    }
  }

  const generateMockAnalytics = () => {
    const now = new Date()
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90

    // Generate GMP trend data
    const gmpTrends = []
    for (let i = days; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      gmpTrends.push({
        date: date.toISOString().split('T')[0],
        avgGMP: Math.floor(Math.random() * 100) + 20,
        totalIPOs: Math.floor(Math.random() * 10) + 15,
        profitableIPOs: Math.floor(Math.random() * 8) + 5
      })
    }

    // Generate sector performance
    const sectors = ['Technology', 'Healthcare', 'Finance', 'Energy', 'Manufacturing', 'FMCG']
    const sectorPerformance = sectors.map(sector => ({
      sector,
      avgGMP: Math.floor(Math.random() * 150) + 10,
      totalIPOs: Math.floor(Math.random() * 20) + 5,
      successRate: Math.floor(Math.random() * 40) + 60,
      totalValue: Math.floor(Math.random() * 50000) + 10000
    }))

    // Generate performance metrics
    const performanceMetrics = {
      totalIPOs: 156,
      activeIPOs: 23,
      profitableIPOs: 89,
      avgGMP: 67.5,
      avgGMPPercent: 15.2,
      totalMarketValue: 2450000,
      successRate: 72.3,
      topPerformer: 'TechCorp Solutions IPO',
      topPerformerGMP: 185
    }

    // Generate recent activity
    const recentActivity = [
      { type: 'ipo_opened', message: 'Green Energy Ltd IPO opened for subscription', time: '2 hours ago' },
      { type: 'gmp_update', message: 'FinTech Innovations GMP increased to ₹85', time: '4 hours ago' },
      { type: 'ipo_closed', message: 'Healthcare Plus IPO subscription closed', time: '6 hours ago' },
      { type: 'listing', message: 'Digital Media Co listed with 45% gains', time: '1 day ago' },
      { type: 'gmp_alert', message: 'Smart Logistics GMP crossed ₹100', time: '1 day ago' }
    ]

    return {
      gmpTrends,
      sectorPerformance,
      performanceMetrics,
      recentActivity,
      lastUpdated: now.toISOString()
    }
  }

  const getChangeIcon = (change) => {
    if (change > 0) return <ArrowUpIcon className="h-4 w-4 text-green-600" />
    if (change < 0) return <ArrowDownIcon className="h-4 w-4 text-red-600" />
    return null
  }

  const getChangeColor = (change) => {
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Comprehensive IPO market analysis and insights
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              
              <button
                onClick={fetchAnalytics}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {analytics && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatsCard
                title="Total IPOs"
                value={analytics.performanceMetrics.totalIPOs}
                change={+12}
                icon={ChartBarIcon}
                color="blue"
              />
              
              <StatsCard
                title="Active IPOs"
                value={analytics.performanceMetrics.activeIPOs}
                change={+3}
                icon={CalendarIcon}
                color="green"
              />
              
              <StatsCard
                title="Avg GMP"
                value={`₹${analytics.performanceMetrics.avgGMP}`}
                change={+8.5}
                icon={TrendingUpIcon}
                color="emerald"
              />
              
              <StatsCard
                title="Success Rate"
                value={`${analytics.performanceMetrics.successRate}%`}
                change={+2.1}
                icon={TrendingUpIcon}
                color="purple"
              />
            </div>

            {/* Gemini AI Market Sentiment */}
            {analytics?.geminiSentiment && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg shadow p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <span className="text-2xl mr-2">🤖</span>
                    Gemini AI Market Insights
                  </h3>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                    AI Powered
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className={`inline-block px-4 py-2 rounded-full text-lg font-bold ${
                      analytics.geminiSentiment.sentiment === 'Bullish' ? 'bg-green-100 text-green-800' :
                      analytics.geminiSentiment.sentiment === 'Bearish' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {analytics.geminiSentiment.sentiment}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">Market Sentiment</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {analytics.geminiSentiment.investorAppetite}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">Investor Appetite</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.round(analytics.geminiSentiment.confidence * 100)}%
                    </div>
                    <p className="text-sm text-gray-600 mt-2">AI Confidence</p>
                  </div>
                </div>
                
                <div className="mt-4 p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Market Trends:</strong> {analytics.geminiSentiment.trends}
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    <strong>Outlook:</strong> {analytics.geminiSentiment.outlook}
                  </p>
                </div>
              </div>
            )}

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* GMP Trends Chart */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">GMP Trends</h3>
                  <select
                    value={selectedMetric}
                    onChange={(e) => setSelectedMetric(e.target.value)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="gmp_trends">Average GMP</option>
                    <option value="ipo_count">IPO Count</option>
                    <option value="profitable_ratio">Profitable Ratio</option>
                  </select>
                </div>
                
                <GMPChart 
                  data={analytics.gmpTrends} 
                  metric={selectedMetric}
                  height={300}
                />
              </div>

              {/* Sector Performance */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Sector Performance</h3>
                
                <div className="space-y-4">
                  {analytics.sectorPerformance.slice(0, 6).map((sector, index) => (
                    <div key={sector.sector} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">{sector.sector}</span>
                          <span className="text-sm text-gray-600">₹{sector.avgGMP}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(sector.avgGMP / 200) * 100}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-gray-500">{sector.totalIPOs} IPOs</span>
                          <span className="text-xs text-gray-500">{sector.successRate}% success</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Detailed Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Market Overview */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Market Overview</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Market Value</span>
                    <span className="font-semibold">₹{(analytics.performanceMetrics.totalMarketValue / 100000).toFixed(1)}L</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Average GMP %</span>
                    <span className="font-semibold">{analytics.performanceMetrics.avgGMPPercent}%</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Profitable IPOs</span>
                    <span className="font-semibold text-green-600">{analytics.performanceMetrics.profitableIPOs}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Top Performer</span>
                    <span className="font-semibold text-blue-600 text-sm">{analytics.performanceMetrics.topPerformer}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Top GMP</span>
                    <span className="font-semibold text-emerald-600">₹{analytics.performanceMetrics.topPerformerGMP}</span>
                  </div>
                </div>
              </div>

              {/* Performance Breakdown */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Breakdown</h3>
                
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-1">
                      {((analytics.performanceMetrics.profitableIPOs / analytics.performanceMetrics.totalIPOs) * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Profitable IPOs</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-semibold text-green-600">{analytics.performanceMetrics.profitableIPOs}</div>
                      <div className="text-xs text-gray-600">Profitable</div>
                    </div>
                    
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-lg font-semibold text-red-600">
                        {analytics.performanceMetrics.totalIPOs - analytics.performanceMetrics.profitableIPOs}
                      </div>
                      <div className="text-xs text-gray-600">Loss Making</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
                
                <div className="space-y-4">
                  {analytics.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className={`p-1 rounded-full ${
                        activity.type === 'ipo_opened' ? 'bg-green-100' :
                        activity.type === 'gmp_update' ? 'bg-blue-100' :
                        activity.type === 'ipo_closed' ? 'bg-orange-100' :
                        activity.type === 'listing' ? 'bg-purple-100' :
                        'bg-yellow-100'
                      }`}>
                        {activity.type === 'ipo_opened' && <CalendarIcon className="h-4 w-4 text-green-600" />}
                        {activity.type === 'gmp_update' && <TrendingUpIcon className="h-4 w-4 text-blue-600" />}
                        {activity.type === 'ipo_closed' && <CalendarIcon className="h-4 w-4 text-orange-600" />}
                        {activity.type === 'listing' && <ChartBarIcon className="h-4 w-4 text-purple-600" />}
                        {activity.type === 'gmp_alert' && <BellIcon className="h-4 w-4 text-yellow-600" />}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Last Updated */}
            <div className="text-center text-sm text-gray-500">
              Last updated: {new Date(analytics.lastUpdated).toLocaleString()}
            </div>
          </>
        )}
      </div>
    </div>
    </>
  )
}

export default AnalyticsPage