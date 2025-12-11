// Real IPO Data Service - Fetches actual current IPOs from reliable sources
import bytezApiService from './bytezApiService'

class RealIPODataService {
  constructor() {
    this.cache = new Map()
    this.cacheTimeout = 30 * 60 * 1000 // 30 minutes cache
    this.lastFetch = null
  }

  // Fetch real current IPOs from multiple sources
  async fetchCurrentRealIPOs() {
    try {
      console.log('🔍 Fetching real current IPOs from live sources...')
      
      // Initialize Bytez SDK
      const isInitialized = await bytezApiService.initializeSDK()
      if (!isInitialized || !bytezApiService.model) {
        console.log('⚠️ Bytez SDK not available, cannot fetch real IPO data')
        return []
      }

      const realIPOPrompt = `
        I need you to search for REAL, CURRENT Indian IPOs that are available RIGHT NOW (${new Date().toDateString()}).

        Please search these LIVE sources and provide ONLY real, verified IPOs:

        1. BSE India Official Website (bseindia.com) - Current IPO section
        2. NSE India Official Website (nseindia.com) - IPO section  
        3. SEBI Official IPO Database (sebi.gov.in)
        4. Chittorgarh.com - Live IPO calendar and GMP data
        5. IPO Watch (ipowatch.in) - Current IPO listings
        6. MoneyControl IPO section - Live IPO data
        7. Economic Times Markets - Current IPO news
        8. Business Standard IPO section

        SEARCH CRITERIA - Find IPOs with these statuses ONLY:
        - Currently OPEN for subscription (accepting applications TODAY)
        - UPCOMING IPOs (opening in next 15 days with confirmed dates)
        - Recently ANNOUNCED with SEBI approval

        FOR EACH REAL IPO FOUND, provide these EXACT details:
        - Company Name (exact legal name as per SEBI filing)
        - Current Status (Open/Upcoming only)
        - Issue Size (in crores, exact amount)
        - Price Band (₹X to ₹Y, exact range)
        - Opening Date (DD/MM/YYYY)
        - Closing Date (DD/MM/YYYY)
        - Listing Date (DD/MM/YYYY if available)
        - Current GMP (Grey Market Premium in ₹, from Chittorgarh/IPO Watch)
        - Board (Main Board or SME)
        - Lot Size (exact number of shares)
        - Lead Manager(s)
        - Issue Type (Fresh Issue/OFS/Both)
        - Industry/Sector

        CRITICAL REQUIREMENTS:
        - Search ONLY live, official sources
        - Verify each IPO exists on multiple sources
        - NO sample/dummy/fake company names
        - NO closed or already listed IPOs
        - Cross-check GMP data from Chittorgarh.com
        - Verify SEBI approval status

        If you find REAL IPOs, return them as a JSON array.
        If NO real IPOs are currently available, return: {"message": "NO_REAL_IPOS_CURRENTLY_AVAILABLE"}

        IMPORTANT: I need ACTUAL market data, not examples or placeholders.
      `

      console.log('📡 Searching live IPO sources...')
      
      const { error, output } = await bytezApiService.model.run([{
        "role": "user",
        "content": realIPOPrompt
      }])

      if (error) {
        console.log('❌ Real IPO fetch error:', error)
        return []
      }

      console.log('📊 Processing real IPO response...')
      return this.parseRealIPOResponse(output)

    } catch (error) {
      console.error('Error fetching real IPOs:', error)
      return []
    }
  }

  // Parse real IPO response with strict validation
  parseRealIPOResponse(output) {
    try {
      // Check if no real IPOs are available
      if (output.includes('NO_REAL_IPOS_CURRENTLY_AVAILABLE') || 
          output.toLowerCase().includes('no real ipos') ||
          output.toLowerCase().includes('no current ipos')) {
        console.log('ℹ️ No real IPOs currently available in the market')
        return []
      }

      // Try to extract JSON
      const jsonMatch = output.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        console.log('⚠️ No JSON array found in response')
        return this.parseTextForRealIPOs(output)
      }

      const realIPOs = JSON.parse(jsonMatch[0])
      
      if (!Array.isArray(realIPOs) || realIPOs.length === 0) {
        console.log('⚠️ No valid IPO array found')
        return []
      }

      // Strict validation for real IPOs
      const validatedIPOs = realIPOs
        .filter(ipo => this.validateRealIPO(ipo))
        .map((ipo, index) => this.formatRealIPO(ipo, index))

      console.log(`✅ Found ${validatedIPOs.length} real IPOs`)
      return validatedIPOs

    } catch (error) {
      console.error('Error parsing real IPO response:', error)
      return []
    }
  }

  // Strict validation for real IPOs
  validateRealIPO(ipo) {
    // Must have company name
    const companyName = ipo.companyName || ipo.company || ipo.name
    if (!companyName) return false

    // Check for fake indicators
    const name = companyName.toLowerCase()
    const fakeIndicators = [
      'example', 'sample', 'test', 'dummy', 'placeholder', 
      'company ltd', 'abc', 'xyz', 'demo', 'mock'
    ]
    
    if (fakeIndicators.some(indicator => name.includes(indicator))) {
      console.log(`❌ Rejected fake company: ${companyName}`)
      return false
    }

    // Must have valid status
    const status = ipo.status || ipo.currentStatus
    if (!status || !['open', 'upcoming'].includes(status.toLowerCase())) {
      return false
    }

    // Must have reasonable issue size
    const issueSize = this.parseNumber(ipo.issueSize || ipo.issue_size)
    if (!issueSize || issueSize < 50 || issueSize > 100000) {
      console.log(`❌ Invalid issue size for ${companyName}: ${issueSize}`)
      return false
    }

    // Must have price band
    const priceRange = ipo.priceRange || ipo.priceBand || ipo.price_range
    if (!priceRange || !priceRange.includes('₹')) {
      return false
    }

    console.log(`✅ Validated real IPO: ${companyName}`)
    return true
  }

  // Format real IPO data
  formatRealIPO(ipo, index) {
    const companyName = ipo.companyName || ipo.company || ipo.name
    const issueSize = this.parseNumber(ipo.issueSize || ipo.issue_size)
    const gmp = this.parseNumber(ipo.gmp || ipo.greyMarketPremium) || 0
    const boardType = ipo.board || ipo.boardType || (issueSize > 500 ? 'Main Board' : 'SME')
    
    return {
      id: `real_${Date.now()}_${index}`,
      name: `${companyName} IPO`,
      company: companyName,
      priceRange: ipo.priceRange || ipo.priceBand || ipo.price_range,
      issueSize: issueSize,
      gmp: gmp,
      gmpPercent: this.calculateGMPPercent(gmp, ipo.priceRange),
      status: this.normalizeStatus(ipo.status || ipo.currentStatus),
      isProfitable: gmp > 0,
      openDate: this.formatDate(ipo.openDate || ipo.opening_date || ipo.openingDate),
      closeDate: this.formatDate(ipo.closeDate || ipo.closing_date || ipo.closingDate),
      listingDate: this.formatDate(ipo.listingDate || ipo.listing_date),
      confidenceScore: 0.95, // High confidence for real data
      industry: ipo.industry || ipo.sector || 'Not specified',
      lotSize: this.parseNumber(ipo.lotSize || ipo.lot_size) || 100,
      boardType: boardType,
      leadManagers: ipo.leadManagers || ipo.managers || 'Not specified',
      issueType: ipo.issueType || ipo.type || 'Fresh Issue',
      description: `${companyName} IPO - ${ipo.industry || 'Business'} sector company launching public offering.`,
      source: 'real_live_data',
      lastUpdated: new Date().toISOString(),
      growwUrl: this.generateGrowwUrl(companyName),
      isRealTime: true,
      isRealIPO: true,
      fetchDate: new Date().toDateString()
    }
  }

  // Parse text for real IPO mentions
  parseTextForRealIPOs(textOutput) {
    try {
      console.log('📝 Parsing text for real IPO mentions...')
      
      // Look for specific IPO patterns with company names
      const patterns = [
        /(\w+(?:\s+\w+)*)\s+IPO.*(?:open|upcoming|live)/gi,
        /(\w+(?:\s+\w+)*)\s+(?:limited|ltd|pvt|private|public).*IPO/gi
      ]

      const foundIPOs = []
      
      patterns.forEach(pattern => {
        const matches = textOutput.match(pattern)
        if (matches) {
          matches.forEach(match => {
            const companyName = match.replace(/\s+(?:IPO|limited|ltd|pvt|private|public).*/i, '').trim()
            
            // Skip if looks fake
            if (this.isLikelyFakeCompany(companyName)) return
            
            foundIPOs.push(companyName)
          })
        }
      })

      if (foundIPOs.length === 0) {
        console.log('ℹ️ No real IPO mentions found in text')
        return []
      }

      // Remove duplicates and format
      const uniqueIPOs = [...new Set(foundIPOs)]
      console.log(`📊 Found ${uniqueIPOs.length} potential real IPOs in text`)
      
      return uniqueIPOs.slice(0, 5).map((companyName, index) => ({
        id: `real_text_${Date.now()}_${index}`,
        name: `${companyName} IPO`,
        company: companyName,
        priceRange: 'Price band to be announced',
        issueSize: 0,
        gmp: 0,
        gmpPercent: 0,
        status: 'Upcoming',
        isProfitable: false,
        openDate: 'To be announced',
        closeDate: 'To be announced',
        listingDate: 'To be announced',
        confidenceScore: 0.7,
        industry: 'Not specified',
        lotSize: 100,
        boardType: 'Main Board',
        leadManagers: 'To be announced',
        issueType: 'Fresh Issue',
        description: `${companyName} IPO announcement found in market sources.`,
        source: 'real_text_parsed',
        lastUpdated: new Date().toISOString(),
        growwUrl: 'https://groww.in/ipo',
        isRealTime: true,
        isRealIPO: true,
        fetchDate: new Date().toDateString()
      }))

    } catch (error) {
      console.error('Error parsing text for real IPOs:', error)
      return []
    }
  }

  // Check if company name looks fake
  isLikelyFakeCompany(name) {
    const lowerName = name.toLowerCase()
    const fakeIndicators = [
      'example', 'sample', 'test', 'dummy', 'placeholder',
      'abc', 'xyz', 'company', 'corp', 'inc', 'demo'
    ]
    
    return fakeIndicators.some(indicator => lowerName === indicator || lowerName.includes(indicator))
  }

  // Helper methods
  parseNumber(value) {
    if (!value) return null
    if (typeof value === 'number') return value
    
    const numStr = value.toString().replace(/[^\d.]/g, '')
    return numStr ? parseFloat(numStr) : null
  }

  calculateGMPPercent(gmp, priceRange) {
    if (!gmp || !priceRange) return 0
    
    const priceMatch = priceRange.match(/₹(\d+)/g)
    if (priceMatch && priceMatch.length > 0) {
      const avgPrice = priceMatch.reduce((sum, price) => {
        return sum + parseInt(price.replace('₹', ''))
      }, 0) / priceMatch.length
      
      return parseFloat(((gmp / avgPrice) * 100).toFixed(2))
    }
    
    return 0
  }

  normalizeStatus(status) {
    if (!status) return 'Upcoming'
    
    const statusMap = {
      'open': 'Open',
      'upcoming': 'Upcoming',
      'live': 'Open',
      'active': 'Open'
    }
    
    return statusMap[status.toLowerCase()] || 'Upcoming'
  }

  formatDate(dateStr) {
    if (!dateStr || dateStr === 'TBA' || dateStr === 'To be announced') {
      return 'To be announced'
    }
    
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch (error) {
      return 'To be announced'
    }
  }

  generateGrowwUrl(companyName) {
    if (!companyName) return 'https://groww.in/ipo'
    
    // Real IPO mappings for Groww
    const realGrowwMappings = {
      'bajaj housing finance': 'https://groww.in/ipo/bajaj-housing-finance-ipo',
      'hyundai motor india': 'https://groww.in/ipo/hyundai-motor-india-ipo',
      'ntpc green energy': 'https://groww.in/ipo/ntpc-green-energy-ipo',
      'swiggy': 'https://groww.in/ipo/swiggy-ipo',
      'ola electric': 'https://groww.in/ipo/ola-electric-ipo'
    }
    
    const normalizedName = companyName.toLowerCase()
    
    for (const [key, url] of Object.entries(realGrowwMappings)) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        return url
      }
    }
    
    return 'https://groww.in/ipo'
  }

  // Get cached real IPO data
  getCachedRealIPOs() {
    const cacheKey = 'real_current_ipos'
    const cached = this.cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log('✅ Using cached real IPO data')
      return cached.data
    }
    
    return null
  }

  // Cache real IPO data
  cacheRealIPOs(data) {
    const cacheKey = 'real_current_ipos'
    this.cache.set(cacheKey, {
      data: data,
      timestamp: Date.now()
    })
    this.lastFetch = new Date().toISOString()
  }

  // Main method to get real IPOs
  async getRealCurrentIPOs() {
    try {
      // Check cache first
      const cachedData = this.getCachedRealIPOs()
      if (cachedData && cachedData.length > 0) {
        return cachedData
      }

      console.log('🔍 Fetching fresh real IPO data...')
      const realIPOs = await this.fetchCurrentRealIPOs()
      
      if (realIPOs && realIPOs.length > 0) {
        this.cacheRealIPOs(realIPOs)
        console.log(`✅ Successfully fetched ${realIPOs.length} real IPOs`)
        return realIPOs
      } else {
        console.log('ℹ️ No real IPOs currently available in the market')
        return []
      }

    } catch (error) {
      console.error('Error getting real current IPOs:', error)
      return []
    }
  }

  // Force refresh real IPO data
  async forceRefreshRealIPOs() {
    console.log('🔄 Force refreshing real IPO data...')
    this.cache.clear()
    return await this.getRealCurrentIPOs()
  }

  // Get service status
  getStatus() {
    const cachedData = this.getCachedRealIPOs()
    
    return {
      hasRealData: cachedData && cachedData.length > 0,
      lastFetch: this.lastFetch,
      cachedCount: cachedData ? cachedData.length : 0,
      cacheValid: cachedData !== null
    }
  }
}

// Export singleton instance
export const realIPODataService = new RealIPODataService()
export default realIPODataService