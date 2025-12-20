import React, { useState, useEffect } from 'react'
import { 
  PlayIcon, 
  StopIcon, 
  ArrowPathIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const RealTimeIPOController = () => {
  const [serviceStatus, setServiceStatus] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [tasks, setTasks] = useState([])

  useEffect(() => {
    fetchServiceStatus()
    fetchMetrics()
    fetchTasks()
    
    const interval = setInterval(() => {
      fetchServiceStatus()
      fetchMetrics()
      fetchTasks()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const fetchServiceStatus = async () => {
    try {
      const response = await fetch('/api/realtime-ipo/status')
      const data = await response.json()
      setServiceStatus(data)
      setLastUpdate(new Date().toLocaleTimeString())
    } catch (error) {
      console.error('Error fetching service status:', error)
    }
  }

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/realtime-ipo/metrics')
      const data = await response.json()
      setMetrics(data)
    } catch (error) {
      console.error('Error fetching metrics:', error)
    }
  }

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/realtime-ipo/tasks')
      const data = await response.json()
      setTasks(Object.entries(data.tasks || {}).map(([id, task]) => ({ id, ...task })))
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }

  const startService = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/realtime-ipo/start', { method: 'POST' })
      const data = await response.json()
      
      if (response.ok) {
        toast.success('Real-time IPO service started successfully!')
        fetchServiceStatus()
      } else {
        toast.error(data.detail || 'Failed to start service')
      }
    } catch (error) {
      toast.error('Error starting service')
    } finally {
      setIsLoading(false)
    }
  }

  const stopService = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/realtime-ipo/stop', { method: 'POST' })
      const data = await response.json()
      
      if (response.ok) {
        toast.success('Real-time IPO service stopped')
        fetchServiceStatus()
      } else {
        toast.error(data.detail || 'Failed to stop service')
      }
    } catch (error) {
      toast.error('Error stopping service')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchNow = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/realtime-ipo/fetch-now', { method: 'POST' })
      const data = await response.json()
      
      if (response.ok) {
        toast.success('IPO data fetch triggered!')
        fetchServiceStatus()
        fetchTasks()
      } else {
        toast.error(data.detail || 'Failed to trigger fetch')
      }
    } catch (error) {
      toast.error('Error triggering fetch')
    } finally {
      setIsLoading(false)
    }
  }

  const forceTask = async (taskType) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/realtime-ipo/force-task/${taskType}`, { method: 'POST' })
      const data = await response.json()
      
      if (response.ok) {
        toast.success(`${taskType} task triggered!`)
        fetchTasks()
      } else {
        toast.error(data.detail || 'Failed to trigger task')
      }
    } catch (error) {
      toast.error('Error triggering task')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (isRunning) => {
    return isRunning ? 'text-green-600' : 'text-red-600'
  }

  const getStatusIcon = (isRunning) => {
    return isRunning ? (
      <CheckCircleIcon className="h-5 w-5 text-green-600" />
    ) : (
      <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleString()
  }

  const getTaskStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'running': return 'text-blue-600 bg-blue-100'
      case 'failed': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <ChartBarIcon className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Real-time IPO Controller</h2>
            <p className="text-gray-600">Monitor and control automatic IPO data fetching</p>
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
            {serviceStatus && getStatusIcon(serviceStatus.service?.is_running)}
            <span className="ml-2">Service Status</span>
          </h3>
          
          {serviceStatus ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Service:</span>
                <span className={getStatusColor(serviceStatus.service?.is_running)}>
                  {serviceStatus.service?.is_running ? 'Running' : 'Stopped'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Scheduler:</span>
                <span className={getStatusColor(serviceStatus.scheduler?.is_running)}>
                  {serviceStatus.scheduler?.is_running ? 'Running' : 'Stopped'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Last Fetch:</span>
                <span className="text-sm">{formatDate(serviceStatus.service?.last_fetch)}</span>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">Loading...</div>
          )}
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Metrics</h3>
          
          {metrics ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Active Tasks:</span>
                <span className="font-medium">{metrics.scheduler_metrics?.active_tasks || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Tasks:</span>
                <span className="font-medium">{metrics.scheduler_metrics?.total_tasks || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Scheduled Jobs:</span>
                <span className="font-medium">{metrics.scheduler_metrics?.scheduled_jobs || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Data Sources:</span>
                <span className="font-medium">{metrics.service_metrics?.sources_count || 0}</span>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">Loading...</div>
          )}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={startService}
          disabled={isLoading || serviceStatus?.service?.is_running}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          <PlayIcon className="h-4 w-4 mr-2" />
          Start Service
        </button>

        <button
          onClick={stopService}
          disabled={isLoading || !serviceStatus?.service?.is_running}
          className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          <StopIcon className="h-4 w-4 mr-2" />
          Stop Service
        </button>

        <button
          onClick={fetchNow}
          disabled={isLoading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Fetch Now
        </button>
      </div>

      {/* Manual Task Triggers */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Manual Task Triggers</h3>
        <div className="flex flex-wrap gap-2">
          {['daily_fetch', 'periodic_fetch', 'weekly_cleanup', 'market_update'].map((taskType) => (
            <button
              key={taskType}
              onClick={() => forceTask(taskType)}
              disabled={isLoading}
              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              {taskType.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Recent Tasks */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Recent Tasks</h3>
        
        {tasks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Result</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tasks.slice(0, 10).map((task) => (
                  <tr key={task.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {task.id.substring(0, 20)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {task.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTaskStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(task.start_time)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {task.result || task.error || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <InformationCircleIcon className="h-12 w-12 mx-auto mb-2" />
            <p>No recent tasks found</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default RealTimeIPOController