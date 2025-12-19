'use client'

import React, { useState, useEffect } from 'react'
import { 
  SparklesIcon,
  PlayIcon,
  StopIcon,
  ArrowPathIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  KeyIcon,
  CogIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const GeminiIPOController = () => {
  const [geminiStatus, setGeminiStatus] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [apiKey, setApiKey] = useState('')
  const [showApiKeyInput, setShowApiKeyInput] = useState(false)
  const [ipoData, setIpoData] = useState([])
  const [marketSentiment, setMarketSentiment] = useState(null)
  const [dailyUpdatesEnabled, setDailyUpdatesEnabled] = useState(false)

  useEffect(() => {
    checkGeminiStatus()
    
    // Auto-refresh every 2 minutes
    const interval = setInterval(() => {
      checkGeminiStatus()
    }, 120000)

    return () => clearInterval(interval)
  }, [])

  const checkGeminiStatus = async () => {
    try {
      const response = await fetch('/api/gemini-ipo/status')
      const data = await response.json()
      setGeminiStatus(data.service)
      setDailyUpdatesEnabled(data.service?.daily_updates_running || false)
      setLastUpdate(new Date().toLocaleTimeString())
    } catch (error) {
      console.error('Error checking Gemini status:', error)
    }
  }

  const initializeGemini = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/gemini-ipo/initialize', { method: 'POST' })
      const data = await response.json()
      
      if (response.ok && data.status === 'initialized') {
        toast.success('Gemini AI service initialized successfully!')
        checkGeminiStatus()
      } else {
        toast.error(data.message || 'Failed to initialize Gemini service')
      }
    } catch (error) {
      toast.error('Error initializing Gemini service')
      console.error('Error initializing Gemini:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const testConnection = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/gemini-ipo/test-connection')
      const data = await response.json()
      
      if (data.status === 'success') {
        toast.success('Gemini AI connection successful!')
      } else {
        toast.error(`Connection failed: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      toast.error('Error testing connection')
      console.error('Error testing connection:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchIPOData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/gemini-ipo/ipos')
      const data = await response.json()
      
      if (response.ok) {
        setIpoData(data.data)
        toast.success(`Fetched ${data.count} IPOs from Gemini AI!`)
      } else {
        toast.error('Failed to fetch IPO data')
      }
    } catch (error) {
      toast.error('Error fetching IPO data')
      console.error('Error fetching IPO data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getMarketSentiment = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/gemini-ipo/market-sentiment')
      const data = await response.json()
      
      if (response.ok && data.status === 'success') {
        setMarketSentiment(data.data)
        toast.success('Market sentiment updated!')
      } else {
        toast.error('Failed to get market sentiment')
      }
    } catch (error) {
      toast.error('Error getting market sentiment')
      console.error('Error getting market sentiment:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const startDailyUpdates = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/gemini-ipo/start-daily-updates', { method: 'POST' })
      const data = await response.json()
      
      if (response.ok) {
        toast.success('Daily automatic updates started (9 AM IST)!')
        setDailyUpdatesEnabled(true)
        checkGeminiStatus()
      } else {
        toast.error(data.message || 'Failed to start daily updates')
      }
    } catch (error) {
      toast.error('Error starting daily updates')
      console.error('Error starting daily updates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const stopDailyUpdates = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/gemini-ipo/stop-daily-updates', { method: 'POST' })
      const data = await response.json()
      
      if (response.ok) {
        toast.success('Daily automatic updates stopped')
        setDailyUpdatesEnabled(false)
        checkGeminiStatus()
      } else {
        toast.error(data.message || 'Failed to stop daily updates')
      }
    } catch (error) {
      toast.error('Error stopping daily updates')
      console.error('Error stopping daily updates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const forceUpdate = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/gemini-ipo/force-update', { method: 'POST' })
      const data = await response.json()
      
      if (response.ok) {
        toast.success(`Force update complete! Found ${data.count} IPOs from web search`)
        setIpoData(data.data)
        checkGeminiStatus()
      } else {
        toast.error('Failed to force update')
      }
    } catch (error) {
      toast.error('Error in force update')
      console.error('Error in force update:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveApiKey = () => {
    if (apiKey.trim()) {
      // In a real app, you'd save this securely
      localStorage.setItem('gemini_api_key', apiKey)
      toast.success('API key saved! Please restart the backend to use it.')
      setShowApiKeyInput(false)
    } else {
      toast.error('Please enter a valid API key')
    }
  }

  const getStatusColor = (isInitialized, hasApiKey) => {
    if (isInitialized && hasApiKey) return 'text-green-600'
    if (hasApiKey) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getStatusIcon = (isInitialized, hasApiKey) => {
    if (isInitialized && hasApiKey) {
      return <CheckCircleIcon className="h-5 w-5 text-green-600" />
    }
    return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
  }

  const getSentimentColor = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case 'bullish': return 'text-green-600 bg-green-100'
      case 'bearish': return 'text-red-600 bg-red-100'
      case 'neutral': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <SparklesIcon className="h-8 w-8 text-purple-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gemini AI IPO Controller</h2>
            <p className="text-gray-600">AI-powered real-time IPO data fetching</p>
          </div>
        </div>
        
        {lastUpdate && (
          <div className="flex items-center text-sm text-gray-500">
            <ClockIcon className="h-4 w-4 mr-1" />
            Last updated: {lastUpdate}
          </div>
        )}
      </div>

      {/* Service Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            {geminiStatus && getStatusIcon(geminiStatus.is_initialized, geminiStatus.has_api_key)}
            <span className="ml-2">Gemini AI Status</span>
          </h3>
          
          {geminiStatus ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Service:</span>
                <span className={getStatusColor(geminiStatus.is_initialized, geminiStatus.has_api_key)}>
                  {geminiStatus.is_initialized ? 'Initialized' : 'Not Initialized'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>API Key:</span>
                <span className={geminiStatus.has_api_key ? 'text-green-600' : 'text-red-600'}>
                  {geminiStatus.has_api_key ? 'Configured' : 'Missing'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Daily Updates:</span>
                <span className={dailyUpdatesEnabled ? 'text-green-600' : 'text-gray-600'}>
                  {dailyUpdatesEnabled ? 'Running (9 AM IST)' : 'Stopped'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Last Daily Update:</span>
                <span className="text-sm">{geminiStatus.last_daily_update ? new Date(geminiStatus.last_daily_update).toLocaleString() : 'Never'}</span>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">Loading...</div>
          )}
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">IPO Data</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Total IPOs:</span>
              <span className="font-medium">{ipoData.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Profitable:</span>
              <span className="font-medium text-green-600">
                {ipoData.filter(ipo => ipo.isProfitable || ipo.is_profitable).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Data Source:</span>
              <span className="font-medium text-purple-600">Gemini AI</span>
            </div>
          </div>
        </div>
      </div>

      {/* Market Sentiment */}
      {marketSentiment && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3">Market Sentiment</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getSentimentColor(marketSentiment.sentiment)}`}>
                {marketSentiment.sentiment}
              </div>
              <p className="text-xs text-gray-600 mt-1">Overall Sentiment</p>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{marketSentiment.investorAppetite}</div>
              <p className="text-xs text-gray-600">Investor Appetite</p>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">{Math.round(marketSentiment.confidence * 100)}%</div>
              <p className="text-xs text-gray-600">Confidence</p>
            </div>
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        {!geminiStatus?.has_api_key && (
          <button
            onClick={() => setShowApiKeyInput(!showApiKeyInput)}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <KeyIcon className="h-4 w-4 mr-2" />
            Configure API Key
          </button>
        )}

        <button
          onClick={initializeGemini}
          disabled={isLoading || !geminiStatus?.has_api_key}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PlayIcon className="h-4 w-4 mr-2" />
          Initialize Service
        </button>

        <button
          onClick={testConnection}
          disabled={isLoading || !geminiStatus?.is_initialized}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CogIcon className="h-4 w-4 mr-2" />
          Test Connection
        </button>

        <button
          onClick={fetchIPOData}
          disabled={isLoading || !geminiStatus?.is_initialized}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChartBarIcon className="h-4 w-4 mr-2" />
          Fetch IPO Data
        </button>

        <button
          onClick={getMarketSentiment}
          disabled={isLoading || !geminiStatus?.is_initialized}
          className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SparklesIcon className="h-4 w-4 mr-2" />
          Market Sentiment
        </button>

        <button
          onClick={forceUpdate}
          disabled={isLoading || !geminiStatus?.is_initialized}
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Force Web Update
        </button>

        {!dailyUpdatesEnabled ? (
          <button
            onClick={startDailyUpdates}
            disabled={isLoading || !geminiStatus?.is_initialized}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ClockIcon className="h-4 w-4 mr-2" />
            Start Daily Updates
          </button>
        ) : (
          <button
            onClick={stopDailyUpdates}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <StopIcon className="h-4 w-4 mr-2" />
            Stop Daily Updates
          </button>
        )}
      </div>

      {/* API Key Input */}
      {showApiKeyInput && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-yellow-800 mb-2">Configure Gemini API Key</h4>
          <p className="text-sm text-yellow-700 mb-3">
            Get your API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a>
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Gemini API key"
              className="flex-1 px-3 py-2 border border-yellow-300 rounded focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
            <button
              onClick={saveApiKey}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Recent IPO Data */}
      {ipoData.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Recent IPO Data from Gemini AI</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price Range
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GMP
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Industry
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ipoData.slice(0, 10).map((ipo, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {ipo.company || ipo.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ipo.priceRange || ipo.price_range}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`font-semibold ${(ipo.gmp || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{ipo.gmp || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        ipo.status === 'Open' ? 'bg-green-100 text-green-800' :
                        ipo.status === 'Upcoming' ? 'bg-blue-100 text-blue-800' :
                        ipo.status === 'Closed' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {ipo.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ipo.industry}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default GeminiIPOController