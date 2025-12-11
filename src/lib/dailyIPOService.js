// Daily IPO Data Service - Manages daily fetching and updating of IPO data
import bytezApiService from './bytezApiService'
import backendApiService from './backendApiService'

class DailyIPOService {
  constructor() {
    this.isRunning = false
    this.lastFetchDate = null
    this.fetchInterval = null
    this.retryCount = 0
    this.maxRetries = 3
  }

  // Start the daily IPO data service
  async start() {
    if (this.isRunning) {
      console.log('Daily IPO service already running')
      return
    }

    this.isRunning = true
    console.log('🚀 Starting Daily IPO Data Service...')

    // Initial fetch if we don't have today's data
    await this.checkAndFetchTodaysData()

    // Schedule daily fetches
    this.scheduleDailyFetches()

    console.log('✅ Daily IPO Data Service started successfully')
  }

  // Stop the daily IPO data service
  stop() {
    if (!this.isRunning) return

    this.isRunning = false
    
    if (this.fetchInterval) {
      clearInterval(this.fetchInterval)
      this.fetchInterval = null
    }

    console.log('⏹️ Daily IPO Data Service stopped')
  }

  // Check if we need to fetch today's data
  async checkAndFetchTodaysData() {
    const today = new Date().toDateString()
    
    if (this.lastFetchDate === today) {
      console.log('✅ Today\'s IPO data already fetched')
      return
    }

    console.log('🔄 Fetching today\'s IPO data...')
    await this.fetchDailyData()
  }

  // Fetch daily IPO data with retry logic
  async fetchDailyData() {
    try {
      console.log(`📊 Fetching daily IPO data (attempt ${this.retryCount + 1}/${this.maxRetries})...`)
      
      // Fetch from multiple sources
      const [bytezData, backendHealth] = await Promise.all([
        bytezApiService.fetchDailyIPOUpdates(),
        backendApiService.checkBackendHealth()
      ])

      if (bytezData && bytezData.length > 0) {
        console.log(`✅ Successfully fetched ${bytezData.length} IPOs`)
        
        // Sync with backend if available
        if (backendHealth.available) {
          try {
            await backendApiService.syncDailyIPOs(bytezData)
            console.log('✅ Synced daily data with backend')
          } catch (syncError) {
            console.warn('⚠️ Failed to sync with backend:', syncError.message)
          }
        }

        // Update fetch status
        this.lastFetchDate = new Date().toDateString()
        this.retryCount = 0

        // Emit update event for UI
        this.emitDataUpdate(bytezData)

        return bytezData
      } else {
        throw new Error('No IPO data received')
      }

    } catch (error) {
      console.error('❌ Daily fetch failed:', error.message)
      
      this.retryCount++
      
      if (this.retryCount < this.maxRetries) {
        console.log(`🔄 Retrying in 5 minutes... (${this.retryCount}/${this.maxRetries})`)
        setTimeout(() => this.fetchDailyData(), 5 * 60 * 1000) // Retry in 5 minutes
      } else {
        console.error('❌ Max retries reached, will try again tomorrow')
        this.retryCount = 0
      }
    }
  }

  // Schedule daily fetches at optimal times
  scheduleDailyFetches() {
    // Fetch at multiple times during the day for better coverage
    const fetchTimes = [
      { hour: 9, minute: 0 },   // 9:00 AM - Market opening
      { hour: 12, minute: 0 },  // 12:00 PM - Mid-day update
      { hour: 15, minute: 30 }, // 3:30 PM - Market closing
      { hour: 18, minute: 0 }   // 6:00 PM - Post-market update
    ]

    fetchTimes.forEach(time => {
      this.scheduleNextFetch(time.hour, time.minute)
    })
  }

  // Schedule next fetch at specific time
  scheduleNextFetch(hour, minute) {
    const now = new Date()
    const nextFetch = new Date()
    nextFetch.setHours(hour, minute, 0, 0)

    // If the time has passed today, schedule for tomorrow
    if (nextFetch <= now) {
      nextFetch.setDate(nextFetch.getDate() + 1)
    }

    const timeUntilFetch = nextFetch.getTime() - now.getTime()

    setTimeout(async () => {
      if (this.isRunning) {
        await this.fetchDailyData()
        
        // Schedule the next occurrence (24 hours later)
        this.scheduleNextFetch(hour, minute)
      }
    }, timeUntilFetch)

    console.log(`⏰ Next fetch scheduled for ${nextFetch.toLocaleString()}`)
  }

  // Get service status
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastFetchDate: this.lastFetchDate,
      retryCount: this.retryCount,
      hasTodaysData: this.lastFetchDate === new Date().toDateString(),
      nextFetchTimes: this.getNextFetchTimes()
    }
  }

  // Get next scheduled fetch times
  getNextFetchTimes() {
    const now = new Date()
    const times = [
      { hour: 9, minute: 0, label: 'Market Opening' },
      { hour: 12, minute: 0, label: 'Mid-day Update' },
      { hour: 15, minute: 30, label: 'Market Closing' },
      { hour: 18, minute: 0, label: 'Post-market Update' }
    ]

    return times.map(time => {
      const nextTime = new Date()
      nextTime.setHours(time.hour, time.minute, 0, 0)
      
      if (nextTime <= now) {
        nextTime.setDate(nextTime.getDate() + 1)
      }
      
      return {
        ...time,
        nextTime: nextTime.toISOString(),
        timeUntil: nextTime.getTime() - now.getTime()
      }
    }).sort((a, b) => a.timeUntil - b.timeUntil)
  }

  // Force immediate fetch
  async forceFetch() {
    console.log('🔄 Force fetching daily IPO data...')
    this.retryCount = 0
    return await this.fetchDailyData()
  }

  // Emit data update event (for UI updates)
  emitDataUpdate(data) {
    // Dispatch custom event for components to listen to
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dailyIPOUpdate', {
        detail: {
          data,
          timestamp: new Date().toISOString(),
          count: data.length
        }
      }))
    }
  }

  // Get cached daily data
  getCachedData() {
    const today = new Date().toDateString()
    return bytezApiService.cache.get(`daily_ipos_${today}`)?.data || []
  }

  // Clear cached data
  clearCache() {
    const today = new Date().toDateString()
    bytezApiService.cache.delete(`daily_ipos_${today}`)
    console.log('🗑️ Cleared daily IPO cache')
  }

  // Get comprehensive daily statistics
  async getDailyStatistics() {
    try {
      const cachedData = this.getCachedData()
      
      if (cachedData.length === 0) {
        return {
          totalIPOs: 0,
          openIPOs: 0,
          upcomingIPOs: 0,
          listedToday: 0,
          avgGMP: 0,
          totalIssueSize: 0,
          mainBoardCount: 0,
          smeCount: 0,
          lastUpdated: null
        }
      }

      const stats = {
        totalIPOs: cachedData.length,
        openIPOs: cachedData.filter(ipo => ipo.status === 'Open').length,
        upcomingIPOs: cachedData.filter(ipo => ipo.status === 'Upcoming').length,
        listedToday: cachedData.filter(ipo => 
          ipo.status === 'Listed' && 
          ipo.actualListingDate === new Date().toDateString()
        ).length,
        avgGMP: cachedData.length > 0 ? 
          cachedData.reduce((sum, ipo) => sum + (ipo.gmp || 0), 0) / cachedData.length : 0,
        totalIssueSize: cachedData.reduce((sum, ipo) => sum + (ipo.issueSize || 0), 0),
        mainBoardCount: cachedData.filter(ipo => ipo.boardType === 'Main Board').length,
        smeCount: cachedData.filter(ipo => ipo.boardType === 'SME').length,
        lastUpdated: this.lastFetchDate
      }

      return stats

    } catch (error) {
      console.error('Error calculating daily statistics:', error)
      return null
    }
  }
}

// Export singleton instance
export const dailyIPOService = new DailyIPOService()
export default dailyIPOService