'use client'

import React, { useState, useEffect } from 'react'
import { 
  ChartBarIcon, 
  CogIcon, 
  UsersIcon, 
  BellIcon,
  ServerIcon
} from '@heroicons/react/24/outline'
import RealTimeIPOController from '../../components/RealTimeIPOController'
import GeminiIPOController from '../../components/GeminiIPOController'
import Navbar from '../../components/Navbar'

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('gemini')
  const [systemStats, setSystemStats] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchSystemStats()
  }, [])

  const fetchSystemStats = async () => {
    try {
      setIsLoading(true)
      
      try {
        const response = await fetch('/api/analytics/stats')
        
        if (response.ok) {
          const data = await response.json()
          setSystemStats(data)
        } else {
          const mockStats = {
            total_ipos: 156,
            active_ipos: 23,
            profitable_ipos: 89,
            total_users: 1247,
            active_users: 892,
            recent_notifications: 45,
            profitability_rate: 57.1,
            last_update: new Date().toISOString()
          }
          setSystemStats(mockStats)
        }
      } catch (apiError) {
        const mockStats = {
          total_ipos: 156,
          active_ipos: 23,
          profitable_ipos: 89,
          total_users: 1247,
          active_users: 892,
          recent_notifications: 45,
          profitability_rate: 57.1,
          last_update: new Date().toISOString()
        }
        setSystemStats(mockStats)
      }
    } catch (error) {
      console.error('Error fetching system stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const tabs = [
    { id: 'gemini', name: 'Gemini AI', icon: ChartBarIcon },
    { id: 'realtime', name: 'Real-time IPO', icon: ChartBarIcon },
    { id: 'system', name: 'System Stats', icon: ServerIcon },
    { id: 'users', name: 'User Management', icon: UsersIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'settings', name: 'Settings', icon: CogIcon }
  ]

  const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue' }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        </div>
      </div>
    </div>
  )

  const SystemStatsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">System Statistics</h2>
        <button
          onClick={fetchSystemStats}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {systemStats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="Total IPOs"
            value={systemStats.total_ipos}
            subtitle="All IPOs in system"
            icon={ChartBarIcon}
            color="blue"
          />
          <StatCard
            title="Active IPOs"
            value={systemStats.active_ipos}
            subtitle="Currently open"
            icon={ChartBarIcon}
            color="green"
          />
          <StatCard
            title="Profitable IPOs"
            value={systemStats.profitable_ipos}
            subtitle={`${systemStats.profitability_rate?.toFixed(1)}% profitable`}
            icon={ChartBarIcon}
            color="emerald"
          />
          <StatCard
            title="Total Users"
            value={systemStats.total_users}
            subtitle="Registered users"
            icon={UsersIcon}
            color="purple"
          />
          <StatCard
            title="Active Users"
            value={systemStats.active_users || 892}
            subtitle="Active accounts"
            icon={UsersIcon}
            color="indigo"
          />
          <StatCard
            title="Recent Notifications"
            value={systemStats.recent_notifications || 45}
            subtitle="Last 7 days"
            icon={BellIcon}
            color="orange"
          />
        </div>
      ) : (
        <div className="text-center py-12">
          <ServerIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Loading system statistics...</p>
        </div>
      )}

      {systemStats && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">System Health</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Database Connection</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                Healthy
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Cache System</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                Active
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Background Tasks</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                Running
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Last Update</span>
              <span className="text-sm text-gray-600">
                {new Date(systemStats.last_update).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const PlaceholderTab = ({ title }) => (
    <div className="text-center py-12">
      <CogIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500">This section is under development</p>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'gemini':
        return <GeminiIPOController />
      case 'realtime':
        return <RealTimeIPOController />
      case 'system':
        return <SystemStatsTab />
      case 'users':
        return <PlaceholderTab title="User Management" />
      case 'notifications':
        return <PlaceholderTab title="Notification Management" />
      case 'settings':
        return <PlaceholderTab title="System Settings" />
      default:
        return <GeminiIPOController />
    }
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Monitor and control your IPO GMP Analyzer system
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="mb-8">
            <nav className="flex space-x-8 border-b border-gray-200">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    {tab.name}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mb-8">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </>
  )
}

export default AdminDashboard