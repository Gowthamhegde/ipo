// Bytez API Service for fetching real IPO data using AI
import backendApiService from './backendApiService'
import realIPODataService from './realIPODataService'
import { getCurrentIPOData, getCurrentIPOStats } from './currentIPOData'

// Dynamic import for bytez.js to avoid webpack issues
let Bytez = null
const initBytez = async () => {
  if (!Bytez) {
    try {
      const bytezModule = await import('bytez.js')
      Bytez = bytezModule.default || bytezModule
    } catch (error) {
      console.warn('Bytez.js not available:', error.message)
    }
  }
  return Bytez
}

class BytezAPIService {
  constructor() {
    this.key = "30a58e5ee5a9ee8a936bfa2244a494dd"
    this.sdk = null
    this.model = null
    this.cache = new Map()
    this.cacheTimeout = 15 * 60 * 1000 // 15 minutes cache for better performance
    this.apiWorking = null // Track API status
    this.initialized = false
    this.listingCheckInterval = null // Auto-check for listings
    this.lastListingCheck = null
    this.dailyFetchInterval = null // Daily IPO data fetching
    this.lastDailyFetch = null
  }

  // Initialize Bytez SDK
  async initializeSDK() {
    if (this.initialized) return true
    
    try {
      const BytezClass = await initBytez()
      if (BytezClass) {
        this.sdk = new BytezClass(this.key)
        this.model = this.sdk.model("openai/gpt-4o")
        this.initialized = true
        return true
      }
    } catch (error) {
      console.warn('Failed to initialize Bytez SDK:', error.message)
    }
    return false
  }

  // Check if cached data is still valid
  isCacheValid(key) {
    const cached = this.cache.get(key)
    if (!cached) return false
    return Date.now() - cached.timestamp < this.cacheTimeout
  }

  // Fetch real IPO data using multiple sources with priority order
  async fetchRealIPOData() {
    const cacheKey = 'real_ipo_data'
    
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey).data
    }

    try {
      console.log('🔍 Fetching current IPO data...')
      
      // Priority 1: Current IPO Data (verified market data)
      const currentIPOs = getCurrentIPOData()
      
      if (currentIPOs && currentIPOs.length > 0) {
        console.log(`✅ Found ${currentIPOs.length} current IPOs from market data`)
        
        // Cache the current data
        this.cache.set(cacheKey, {
          data: currentIPOs,
          timestamp: Date.now()
        })
        
        // Try to sync with backend if available
        try {
          const healthCheck = await backendApiService.checkBackendHealth()
          if (healthCheck.available) {
            await backendApiService.syncDailyIPOs(currentIPOs)
            console.log('✅ Synced current IPO data with backend')
          }
        } catch (syncError) {
          console.log('⚠️ Could not sync with backend:', syncError.message)
        }
        
        return currentIPOs
      }

      // Priority 2: Real IPO Data Service (AI-powered live search)
      console.log('🤖 Trying AI-powered IPO search...')
      const realIPOs = await realIPODataService.getRealCurrentIPOs()
      
      if (realIPOs && realIPOs.length > 0) {
        console.log(`✅ Found ${realIPOs.length} real IPOs from AI search`)
        
        // Cache the real data
        this.cache.set(cacheKey, {
          data: realIPOs,
          timestamp: Date.now()
        })
        
        return realIPOs
      }

      // Priority 3: Try backend ML service
      console.log('🔄 Trying ML backend...')
      const healthCheck = await backendApiService.checkBackendHealth()
      
      if (healthCheck.available) {
        console.log('✅ Backend available, fetching ML-powered data...')
        const backendIPOs = await backendApiService.getIPOsWithPredictions()
        
        if (backendIPOs && backendIPOs.length > 0) {
          // Convert backend format to frontend format
          const convertedIPOs = backendIPOs.map(ipo => 
            backendApiService.convertToFrontendFormat(ipo)
          )
          
          // Cache the result
          this.cache.set(cacheKey, {
            data: convertedIPOs,
            timestamp: Date.now()
          })
          
          console.log(`🎯 Loaded ${convertedIPOs.length} IPOs from ML backend`)
          return convertedIPOs
        }
      }

      // Priority 4: No data available
      console.log('ℹ️ No IPO data available from any source')
      
      // Cache empty result to avoid repeated calls
      this.cache.set(cacheKey, {
        data: [],
        timestamp: Date.now()
      })

      return []

    } catch (error) {
      console.error('Error fetching IPO data:', error)
      
      // Return current IPO data as fallback
      const fallbackData = getCurrentIPOData()
      
      this.cache.set(cacheKey, {
        data: fallbackData,
        timestamp: Date.now()
      })

      return fallbackData
    }
  }



  // Filter IPOs by board type
  async filterIPOsByBoard(boardType = 'all') {
    const allIPOs = await this.fetchRealIPOData()
    
    if (boardType === 'all') {
      return allIPOs
    }
    
    return allIPOs.filter(ipo => {
      if (boardType === 'mainboard') {
        return ipo.boardType === 'Main Board' || ipo.boardType === 'mainboard'
      } else if (boardType === 'sme') {
        return ipo.boardType === 'SME' || ipo.boardType === 'sme'
      }
      return true
    })
  }

  // Get IPO statistics by board type
  async getStatisticsByBoard(boardType = 'all') {
    const ipos = await this.filterIPOsByBoard(boardType)
    
    // Get base stats from current IPO data
    const baseStats = getCurrentIPOStats()
    
    return {
      totalIpos: ipos.length,
      activeIpos: ipos.filter(ipo => ['Open', 'Upcoming'].includes(ipo.status)).length,
      profitableIpos: ipos.filter(ipo => ipo.isProfitable).length,
      avgGMP: ipos.length > 0 ? 
        parseFloat((ipos.reduce((sum, ipo) => sum + ipo.gmp, 0) / ipos.length).toFixed(2)) : baseStats.avgGMP,
      totalIssueSize: ipos.reduce((sum, ipo) => sum + ipo.issueSize, 0),
      avgConfidence: ipos.length > 0 ?
        parseFloat((ipos.reduce((sum, ipo) => sum + ipo.confidenceScore, 0) / ipos.length).toFixed(2)) : 0.85,
      boardType: boardType,
      mainBoardCount: ipos.filter(ipo => ipo.boardType === 'Main Board').length,
      smeCount: ipos.filter(ipo => ipo.boardType === 'SME').length,
      openCount: ipos.filter(ipo => ipo.status === 'Open').length,
      upcomingCount: ipos.filter(ipo => ipo.status === 'Upcoming').length,
      lastUpdated: new Date().toISOString()
    }
  }

  // Daily IPO Data Fetching System
  async fetchDailyIPOUpdates() {
    try {
      console.log('🔄 Starting daily IPO data fetch...')
      
      const today = new Date().toDateString()
      const cacheKey = `daily_ipos_${today}`
      
      // Check if we already fetched today's data
      if (this.isCacheValid(cacheKey)) {
        console.log('✅ Daily IPO data already fetched today')
        return this.cache.get(cacheKey).data
      }

      // Priority 1: Use Current IPO Data
      console.log('📊 Loading current market IPO data...')
      const currentIPOs = getCurrentIPOData()
      
      if (currentIPOs && currentIPOs.length > 0) {
        console.log(`✅ Daily fetch: Found ${currentIPOs.length} current IPOs`)
        
        // Cache the daily data
        this.cache.set(cacheKey, {
          data: currentIPOs,
          timestamp: Date.now()
        })
        
        // Update last fetch time
        this.lastDailyFetch = new Date().toISOString()
        
        // Try to sync with backend
        await this.syncDailyDataWithBackend(currentIPOs)
        
        return currentIPOs
      }

      // Priority 2: Try AI-powered search
      console.log('🤖 Trying AI-powered IPO search for daily update...')
      const realIPOs = await realIPODataService.forceRefreshRealIPOs()
      
      if (realIPOs && realIPOs.length > 0) {
        console.log(`✅ Daily fetch: Found ${realIPOs.length} real IPOs from AI`)
        
        // Cache the daily data
        this.cache.set(cacheKey, {
          data: realIPOs,
          timestamp: Date.now()
        })
        
        // Update last fetch time
        this.lastDailyFetch = new Date().toISOString()
        
        // Try to sync with backend
        await this.syncDailyDataWithBackend(realIPOs)
        
        return realIPOs
      }

      // Fallback to current data
      console.log('📊 Using current IPO data as fallback')
      const fallbackData = getCurrentIPOData()
      
      // Cache the fallback data
      this.cache.set(cacheKey, {
        data: fallbackData,
        timestamp: Date.now()
      })
      
      this.lastDailyFetch = new Date().toISOString()
      return fallbackData

    } catch (error) {
      console.error('Error in daily IPO fetch:', error)
      // Return current data even on error
      return getCurrentIPOData()
    }
  }

  // Sync daily data with backend
  async syncDailyDataWithBackend(dailyIPOs) {
    try {
      const healthCheck = await backendApiService.checkBackendHealth()
      if (healthCheck.available) {
        console.log('🔄 Syncing daily IPO data with backend...')
        
        // Send daily IPOs to backend for storage and ML processing
        await backendApiService.syncDailyIPOs(dailyIPOs)
        console.log('✅ Daily IPO data synced with backend')
      } else {
        console.log('⚠️ Backend not available for daily sync')
      }
    } catch (error) {
      console.error('Error syncing daily data with backend:', error)
    }
  }

  // Get live analysis status
  async getLiveAnalysisStatus() {
    try {
      const healthCheck = await backendApiService.checkBackendHealth()
      
      if (healthCheck.available) {
        const stats = await backendApiService.getAdminStats()
        return {
          isLive: true,
          source: 'ML Backend',
          lastUpdate: stats?.last_update || new Date().toISOString(),
          totalIPOs: stats?.total_ipos || 0,
          activeIPOs: stats?.active_ipos || 0,
          mlPredictions: true
        }
      } else {
        const realIPOStatus = realIPODataService.getStatus()
        return {
          isLive: realIPOStatus.hasRealData,
          source: realIPOStatus.hasRealData ? 'Real IPO Data' : 'No Data',
          lastUpdate: realIPOStatus.lastFetch || new Date().toISOString(),
          totalIPOs: realIPOStatus.cachedCount || 0,
          activeIPOs: realIPOStatus.cachedCount || 0,
          mlPredictions: false,
          error: healthCheck.error
        }
      }
    } catch (error) {
      return {
        isLive: false,
        source: 'Error',
        error: error.message,
        mlPredictions: false
      }
    }
  }

  // Get real-time IPO updates
  async getRealTimeUpdates() {
    try {
      // Initialize SDK if needed
      const isInitialized = await this.initializeSDK()
      if (!isInitialized || !this.model) {
        return { 
          updates: [{ 
            type: 'info', 
            message: 'Real-time updates temporarily unavailable. Using cached data.',
            timestamp: new Date().toISOString()
          }] 
        }
      }

      const prompt = `
        Get ONLY real, current IPO market updates for today (${new Date().toDateString()}):
        
        Focus ONLY on:
        1. IPOs currently OPEN for application
        2. IPOs OPENING today or this week
        3. IPOs CLOSING today or this week
        4. New IPO announcements with SEBI approval
        
        Search real sources like BSE, NSE, SEBI announcements.
        Return current, actionable IPO information only.
        
        If no real IPOs are currently active, return message: "No IPOs currently open for application"
      `

      const { error, output } = await this.model.run([{
        "role": "user",
        "content": prompt
      }])

      if (error) {
        return { updates: [], error: 'Could not fetch updates' }
      }

      // Check if response indicates no real IPOs
      if (output.toLowerCase().includes('no ipos currently') || 
          output.toLowerCase().includes('no real ipos') ||
          output.toLowerCase().includes('no active ipos')) {
        return { 
          updates: [{ 
            type: 'info', 
            message: 'No IPOs are currently open for application. Check back later for new opportunities.',
            timestamp: new Date().toISOString()
          }] 
        }
      }

      try {
        const updatesMatch = output.match(/\[[\s\S]*\]/)
        if (updatesMatch) {
          const updates = JSON.parse(updatesMatch[0])
          // Filter to only include Open/Upcoming status updates
          const validUpdates = updates.filter(update => 
            !update.status || 
            update.status === 'Open' || 
            update.status === 'Upcoming' ||
            update.type === 'opening' ||
            update.type === 'announcement'
          )
          return { updates: validUpdates, timestamp: new Date().toISOString() }
        }
        
        // Parse text for real IPO mentions
        if (output.includes('IPO') && !output.toLowerCase().includes('no ipos')) {
          return { 
            updates: [{ 
              type: 'market', 
              message: output.substring(0, 200) + '...',
              timestamp: new Date().toISOString()
            }] 
          }
        }
        
        return { updates: [] }
        
      } catch (parseError) {
        return { updates: [] }
      }

    } catch (error) {
      return { updates: [], error: error.message }
    }
  }

  // Refresh all data sources - force fresh data
  async refreshAllData() {
    try {
      console.log('🔄 Refreshing IPO data...')
      
      // Clear all caches first
      this.clearCache()
      backendApiService.clearCache()
      
      // Try to refresh backend data first
      const healthCheck = await backendApiService.checkBackendHealth()
      if (healthCheck.available) {
        console.log('🤖 Refreshing backend data...')
        await backendApiService.refreshIPOData()
        return await this.fetchRealIPOData()
      }
      
      // Use real IPO data service
      console.log('📊 Loading fresh real IPO data...')
      return await realIPODataService.forceRefreshRealIPOs()
      
    } catch (error) {
      console.error('Error refreshing data:', error)
      return []
    }
  }

  // Force daily fetch (manual trigger)
  async forceDailyFetch() {
    console.log('🔄 Forcing daily IPO data fetch...')
    
    // Clear today's cache to force fresh fetch
    const today = new Date().toDateString()
    const cacheKey = `daily_ipos_${today}`
    this.cache.delete(cacheKey)
    
    return await this.fetchDailyIPOUpdates()
  }

  // Start daily IPO fetching scheduler
  startDailyIPOScheduler() {
    if (this.dailyFetchInterval) {
      clearInterval(this.dailyFetchInterval)
    }

    // Fetch daily IPO data every 24 hours at 9 AM IST
    const scheduleNextFetch = () => {
      const now = new Date()
      const nextFetch = new Date()
      nextFetch.setHours(9, 0, 0, 0) // 9 AM IST
      
      // If it's already past 9 AM today, schedule for tomorrow
      if (now.getHours() >= 9) {
        nextFetch.setDate(nextFetch.getDate() + 1)
      }
      
      const timeUntilNextFetch = nextFetch.getTime() - now.getTime()
      
      setTimeout(async () => {
        await this.fetchDailyIPOUpdates()
        
        // Schedule the next fetch (every 24 hours)
        this.dailyFetchInterval = setInterval(async () => {
          await this.fetchDailyIPOUpdates()
        }, 24 * 60 * 60 * 1000)
        
      }, timeUntilNextFetch)
    }

    scheduleNextFetch()
    console.log('🔄 Started daily IPO scheduler (fetches at 9 AM IST daily)')
  }

  // Stop daily IPO scheduler
  stopDailyIPOScheduler() {
    if (this.dailyFetchInterval) {
      clearInterval(this.dailyFetchInterval)
      this.dailyFetchInterval = null
      console.log('⏹️ Stopped daily IPO scheduler')
    }
  }

  // Get daily fetch status
  getDailyFetchStatus() {
    const today = new Date().toDateString()
    const cacheKey = `daily_ipos_${today}`
    const hasTodaysData = this.isCacheValid(cacheKey)
    
    return {
      isSchedulerRunning: this.dailyFetchInterval !== null,
      lastFetch: this.lastDailyFetch,
      hasTodaysData: hasTodaysData,
      nextFetchTime: this.getNextFetchTime(),
      cacheStatus: hasTodaysData ? 'fresh' : 'stale'
    }
  }

  // Get next scheduled fetch time
  getNextFetchTime() {
    const now = new Date()
    const nextFetch = new Date()
    nextFetch.setHours(9, 0, 0, 0) // 9 AM IST
    
    if (now.getHours() >= 9) {
      nextFetch.setDate(nextFetch.getDate() + 1)
    }
    
    return nextFetch.toISOString()
  }

  // Automatic listing detection - check if IPOs have been listed
  async checkForNewListings() {
    try {
      console.log('🔍 Checking for newly listed IPOs...')
      
      const currentIPOs = await this.fetchRealIPOData()
      const today = new Date()
      
      // Find IPOs that should be listed (past their listing date)
      const shouldBeListedIPOs = currentIPOs.filter(ipo => {
        if (ipo.status === 'Listed') return false // Already marked as listed
        
        const listingDate = this.parseListingDate(ipo.listingDate)
        return listingDate && listingDate <= today
      })

      if (shouldBeListedIPOs.length === 0) {
        console.log('✅ No IPOs due for listing today')
        return { newListings: [], updated: false }
      }

      console.log(`📊 Found ${shouldBeListedIPOs.length} IPOs that should be listed`)
      
      // For now, just mark them as listed based on date
      const listingUpdates = shouldBeListedIPOs.map(ipo => ({
        ...ipo,
        status: 'Listed',
        actualListingDate: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString(),
        isNewlyListed: true
      }))
      
      if (listingUpdates.length > 0) {
        // Update cache with new listing statuses
        await this.updateIPOStatuses(listingUpdates)
        console.log(`🎯 Updated ${listingUpdates.length} IPOs to Listed status`)
        
        return { 
          newListings: listingUpdates, 
          updated: true,
          message: `${listingUpdates.length} IPO(s) have been listed on the stock market`
        }
      }

      return { newListings: [], updated: false }

    } catch (error) {
      console.error('Error checking for new listings:', error)
      return { newListings: [], updated: false, error: error.message }
    }
  }

  // Parse listing date from various formats
  parseListingDate(dateStr) {
    if (!dateStr || dateStr === 'To be announced' || dateStr === 'TBA') return null
    
    try {
      // Handle DD/MM/YYYY format
      if (dateStr.includes('/')) {
        const [day, month, year] = dateStr.split('/')
        return new Date(year, month - 1, day)
      }
      
      // Handle other date formats
      return new Date(dateStr)
    } catch (error) {
      return null
    }
  }

  // Update IPO statuses in cache and backend
  async updateIPOStatuses(updatedIPOs) {
    try {
      // Update local cache
      const cacheKey = 'real_ipo_data'
      const cachedData = this.cache.get(cacheKey)
      
      if (cachedData) {
        const updatedData = cachedData.data.map(ipo => {
          const update = updatedIPOs.find(u => u.id === ipo.id || u.company === ipo.company)
          return update ? { ...ipo, ...update } : ipo
        })
        
        this.cache.set(cacheKey, {
          data: updatedData,
          timestamp: Date.now()
        })
      }

      // Try to update backend if available
      try {
        const healthCheck = await backendApiService.checkBackendHealth()
        if (healthCheck.available) {
          for (const updatedIPO of updatedIPOs) {
            await backendApiService.updateIPOStatus(updatedIPO.id, 'Listed', {
              listingPrice: updatedIPO.listingPrice,
              listingGains: updatedIPO.listingGains,
              actualListingDate: updatedIPO.actualListingDate
            })
          }
          console.log('✅ Updated backend with new listing statuses')
        }
      } catch (backendError) {
        console.log('⚠️ Could not update backend:', backendError.message)
      }

    } catch (error) {
      console.error('Error updating IPO statuses:', error)
    }
  }

  // Start automatic listing monitoring
  startListingMonitor() {
    if (this.listingCheckInterval) {
      clearInterval(this.listingCheckInterval)
    }

    // Check every 2 hours during market hours (9 AM to 6 PM IST)
    this.listingCheckInterval = setInterval(async () => {
      const now = new Date()
      const hour = now.getHours()
      
      // Only check during market hours (9 AM to 6 PM IST)
      if (hour >= 9 && hour <= 18) {
        await this.checkForNewListings()
      }
    }, 2 * 60 * 60 * 1000) // 2 hours

    console.log('🔄 Started automatic listing monitor')
  }

  // Stop automatic listing monitoring
  stopListingMonitor() {
    if (this.listingCheckInterval) {
      clearInterval(this.listingCheckInterval)
      this.listingCheckInterval = null
      console.log('⏹️ Stopped automatic listing monitor')
    }
  }

  // Get listing alerts for newly listed IPOs
  async getListingAlerts() {
    try {
      const listingCheck = await this.checkForNewListings()
      
      if (listingCheck.updated && listingCheck.newListings.length > 0) {
        return {
          hasAlerts: true,
          alerts: listingCheck.newListings.map(ipo => ({
            type: 'listing',
            title: `${ipo.company} IPO Listed!`,
            message: `${ipo.company} has been listed on the stock exchange`,
            listingPrice: ipo.listingPrice,
            listingGains: ipo.listingGains,
            timestamp: new Date().toISOString(),
            ipo: ipo
          }))
        }
      }

      return { hasAlerts: false, alerts: [] }

    } catch (error) {
      return { hasAlerts: false, alerts: [], error: error.message }
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear()
    console.log('Bytez API cache cleared')
  }
}

// Export singleton instance
export const bytezApiService = new BytezAPIService()
export default bytezApiService