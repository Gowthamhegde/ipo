// Enhanced Fallback IPO Service - Now Gemini AI First!
// Uses Gemini AI as primary source, mock data as fallback only

import geminiIPOService from './geminiIPOService'

class GeminiFirstIPOService {
  constructor() {
    this.cache = new Map()
    this.isRunning = false
    this.preferGemini = true // Always try Gemini first
    this.lastGeminiFetch = null
  }

  async fetchDailyIPOUpdates() {
    console.log('🤖 Fetching IPO data - Gemini AI Primary Mode')
    
    // Always try Gemini AI first
    try {
      const geminiData = await geminiIPOService.fetchCurrentIPOs()
      if (geminiData && geminiData.length > 0) {
        this.lastGeminiFetch = new Date().toISOString()
        console.log(`✅ SUCCESS: Fetched ${geminiData.length} real IPOs from Gemini AI`)
        return geminiData
      } else {
        console.log('ℹ️ Gemini returned no IPOs (market may be inactive)')
        return [] // Return empty if no real IPOs available
      }
    } catch (error) {
      console.warn('⚠️ Gemini AI failed, using mock data as fallback:', error.message)
      return this.generateMockIPOs()
    }
  }

  async getLiveAnalysisStatus() {
    // Always check Gemini first
    try {
      const geminiStatus = geminiIPOService.getStatus()
      if (geminiStatus.isInitialized && geminiStatus.hasApiKey) {
        return {
          isLive: true,
          source: 'Gemini AI (Primary)',
          lastUpdate: this.lastGeminiFetch || geminiStatus.lastFetch || new Date().toISOString(),
          totalIPOs: 0, // Will be updated after fetch
          activeIPOs: 0,
          mlPredictions: true,
          aiPowered: true
        }
      } else if (!geminiStatus.hasApiKey) {
        return {
          isLive: false,
          source: 'Gemini AI (API Key Required)',
          lastUpdate: new Date().toISOString(),
          totalIPOs: 0,
          activeIPOs: 0,
          mlPredictions: false,
          aiPowered: false,
          error: 'Please configure Gemini API key'
        }
      }
    } catch (error) {
      console.warn('Gemini status check failed:', error.message)
    }

    // Fallback status
    return {
      isLive: false,
      source: 'Mock Data (Fallback)',
      lastUpdate: new Date().toISOString(),
      totalIPOs: 12,
      activeIPOs: 4,
      mlPredictions: false,
      aiPowered: false
    }
  }

  async getRealTimeUpdates() {
    // Try to get market sentiment from Gemini AI
    try {
      const sentiment = await geminiIPOService.getMarketSentiment()
      if (sentiment) {
        return {
          updates: [
            {
              type: 'market_sentiment',
              message: `Market sentiment is ${sentiment.sentiment}. ${sentiment.trends}`,
              timestamp: new Date().toISOString(),
              source: 'gemini_ai'
            },
            {
              type: 'investor_appetite',
              message: `Investor appetite: ${sentiment.investorAppetite}`,
              timestamp: new Date().toISOString(),
              source: 'gemini_ai'
            }
          ]
        }
      }
    } catch (error) {
      console.warn('Failed to get Gemini market updates:', error.message)
    }

    return {
      updates: [
        {
          type: 'info',
          message: 'Using Gemini AI for real-time IPO data analysis',
          timestamp: new Date().toISOString(),
          source: 'system'
        }
      ]
    }
  }

  async getListingAlerts() {
    return { hasAlerts: false, alerts: [] }
  }

  getDailyFetchStatus() {
    return {
      isSchedulerRunning: false,
      hasTodaysData: true,
      lastFetch: new Date().toISOString(),
      nextFetchTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      cacheStatus: 'mock'
    }
  }

  async filterIPOsByBoard(boardType = 'all') {
    // Get IPOs from Gemini AI (primary) or mock data (fallback)
    const allIPOs = await this.fetchDailyIPOUpdates()
    
    if (boardType === 'all') {
      return allIPOs
    }
    
    return allIPOs.filter(ipo => {
      if (boardType === 'mainboard') {
        return ipo.boardType === 'Main Board'
      } else if (boardType === 'sme') {
        return ipo.boardType === 'SME'
      }
      return true
    })
  }

  async refreshAllData() {
    // Clear all caches and force fresh Gemini fetch
    this.cache.clear()
    
    try {
      console.log('🔄 Forcing fresh data from Gemini AI...')
      geminiIPOService.clearCache()
      const freshData = await geminiIPOService.fetchCurrentIPOs()
      
      if (freshData && freshData.length > 0) {
        this.lastGeminiFetch = new Date().toISOString()
        console.log(`✅ Refreshed: ${freshData.length} real IPOs from Gemini AI`)
        return freshData
      } else {
        console.log('ℹ️ No real IPOs available from Gemini (market inactive)')
        return []
      }
    } catch (error) {
      console.warn('⚠️ Gemini refresh failed:', error.message)
      return this.generateMockIPOs()
    }
  }

  async forceDailyFetch() {
    return await this.refreshAllData()
  }

  startListingMonitor() {
    console.log('Mock: Listing monitor started')
  }

  stopListingMonitor() {
    console.log('Mock: Listing monitor stopped')
  }

  startDailyIPOScheduler() {
    console.log('Mock: Daily IPO scheduler started')
  }

  stopDailyIPOScheduler() {
    console.log('Mock: Daily IPO scheduler stopped')
  }

  generateMockIPOs() {
    const companies = [
      'TechCorp Solutions', 'Green Energy Ltd', 'FinTech Innovations',
      'Healthcare Plus', 'Digital Media Co', 'Smart Logistics',
      'EduTech Systems', 'Food & Beverages Ltd', 'Renewable Power',
      'AI Technologies', 'Biotech Research', 'E-commerce Hub'
    ]

    const industries = [
      'Technology', 'Energy', 'Finance', 'Healthcare', 'Media',
      'Logistics', 'Education', 'FMCG', 'Power', 'Biotechnology'
    ]

    const statuses = ['Upcoming', 'Open', 'Closed', 'Listed']

    return companies.map((company, index) => {
      const minPrice = Math.floor(Math.random() * 500) + 100
      const maxPrice = minPrice + Math.floor(Math.random() * 100) + 20
      const gmp = Math.floor(Math.random() * 200) - 50
      const gmpPercent = (gmp / minPrice) * 100
      const lotSize = minPrice <= 200 ? 75 : minPrice <= 500 ? 30 : 15

      return {
        id: index + 1,
        name: `${company} IPO`,
        company: company,
        priceRange: `₹${minPrice} - ₹${maxPrice}`,
        issueSize: Math.floor(Math.random() * 5000) + 500,
        gmp: gmp,
        gmpPercent: parseFloat(gmpPercent.toFixed(2)),
        status: statuses[Math.floor(Math.random() * statuses.length)],
        isProfitable: gmp >= 20 || gmpPercent >= 10,
        openDate: this.getRandomDate(-5, 15),
        closeDate: this.getRandomDate(5, 25),
        listingDate: this.getRandomDate(15, 35),
        confidenceScore: Math.random() * 0.4 + 0.6,
        industry: industries[Math.floor(Math.random() * industries.length)],
        lotSize: lotSize,
        boardType: Math.random() > 0.7 ? 'SME' : 'Main Board',
        source: 'mock_data',
        description: `${company} is a leading company in the ${industries[Math.floor(Math.random() * industries.length)]} sector.`,
        growwUrl: 'https://groww.in/ipo',
        hasMLPrediction: Math.random() > 0.5,
        predictedGain: Math.floor(Math.random() * 100) - 20,
        mlPrediction: {
          expectedGain: Math.floor(Math.random() * 50) + 10,
          confidence: Math.random() * 0.3 + 0.7
        },
        mlFactors: [
          { factor: 'Market Sentiment', impact: 'Positive' },
          { factor: 'Sector Performance', impact: 'Neutral' }
        ]
      }
    })
  }

  getRandomDate(minDays, maxDays) {
    const today = new Date()
    const randomDays = Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays
    const date = new Date(today)
    date.setDate(today.getDate() + randomDays)
    return date.toISOString().split('T')[0]
  }
}

export default new GeminiFirstIPOService()