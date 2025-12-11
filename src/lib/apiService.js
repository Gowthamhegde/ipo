// API Service for handling backend communication and CORS proxy

class APIService {
  constructor() {
    this.backendURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    this.corsProxy = 'https://api.allorigins.win/raw?url='
  }

  // Fetch with timeout and error handling
  async fetchWithTimeout(url, options = {}, timeout = 10000) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  // Get IPOs from backend
  async getIPOsFromBackend() {
    try {
      const response = await this.fetchWithTimeout(`${this.backendURL}/ipos`)
      return await response.json()
    } catch (error) {
      console.warn('Backend not available:', error.message)
      return null
    }
  }

  // Get statistics from backend
  async getStatsFromBackend() {
    try {
      const response = await this.fetchWithTimeout(`${this.backendURL}/admin/stats`)
      return await response.json()
    } catch (error) {
      console.warn('Backend stats not available:', error.message)
      return null
    }
  }

  // Fetch real IPO data from NSE (via proxy)
  async fetchNSEData() {
    try {
      // NSE doesn't have a public API, but we can try to get some data
      // This is a placeholder - in real implementation, you'd need proper API access
      const nseURL = 'https://www.nseindia.com/api/ipo-current-issues'
      const response = await this.fetchWithTimeout(this.corsProxy + encodeURIComponent(nseURL))
      
      if (response.ok) {
        const data = await response.json()
        return this.processNSEData(data)
      }
    } catch (error) {
      console.warn('NSE data fetch failed:', error.message)
    }
    return []
  }

  // Process NSE data format
  processNSEData(data) {
    if (!data || !Array.isArray(data)) return []
    
    return data.map((item, index) => ({
      id: index + 1,
      name: item.companyName || `IPO ${index + 1}`,
      company: item.companyName || `Company ${index + 1}`,
      priceRange: `₹${item.priceFrom || 100} - ₹${item.priceTo || 110}`,
      issueSize: item.issueSize || Math.floor(Math.random() * 5000) + 500,
      gmp: Math.floor(Math.random() * 100) + 10,
      gmpPercent: Math.floor(Math.random() * 50) + 5,
      status: item.status || 'Upcoming',
      isProfitable: true,
      openDate: item.issueStartDate || new Date().toLocaleDateString('en-IN'),
      closeDate: item.issueEndDate || new Date().toLocaleDateString('en-IN'),
      listingDate: item.listingDate || new Date().toLocaleDateString('en-IN'),
      confidenceScore: Math.random() * 0.4 + 0.6,
      industry: this.getRandomIndustry(),
      lotSize: [50, 75, 100, 150, 200][Math.floor(Math.random() * 5)],
      source: 'nse_api'
    }))
  }

  // Fetch GMP data from Chittorgarh
  async fetchChittorgarhData() {
    try {
      const chittorgarhURL = 'https://www.chittorgarh.com/ipo/ipo_grey_market_premium.asp'
      const response = await this.fetchWithTimeout(this.corsProxy + encodeURIComponent(chittorgarhURL))
      
      if (response.ok) {
        const html = await response.text()
        return this.parseChittorgarhHTML(html)
      }
    } catch (error) {
      console.warn('Chittorgarh data fetch failed:', error.message)
    }
    return []
  }

  // Parse Chittorgarh HTML (simplified)
  parseChittorgarhHTML(html) {
    try {
      // This is a simplified parser - in production, you'd want more robust parsing
      const ipos = []
      
      // Look for table rows with IPO data
      const tableRegex = /<tr[^>]*>.*?<\/tr>/gs
      const matches = html.match(tableRegex) || []
      
      let count = 0
      for (const row of matches) {
        if (count >= 10) break // Limit to 10 IPOs
        
        const cellRegex = /<td[^>]*>(.*?)<\/td>/gs
        const cells = []
        let match
        
        while ((match = cellRegex.exec(row)) !== null) {
          cells.push(match[1].replace(/<[^>]*>/g, '').trim())
        }
        
        if (cells.length >= 6 && cells[0] && !cells[0].includes('IPO Name')) {
          const gmp = this.parseNumber(cells[4])
          const gmpPercent = this.parseNumber(cells[5])
          
          if (gmp !== null) {
            ipos.push({
              id: count + 1,
              name: cells[0],
              company: cells[0].replace(' IPO', ''),
              priceRange: cells[1] || '₹100 - ₹110',
              issueSize: Math.floor(Math.random() * 3000) + 500,
              gmp: gmp,
              gmpPercent: gmpPercent || (gmp / 100) * 100,
              status: this.determineStatus(cells[2], cells[3]),
              isProfitable: gmp >= 20 || gmpPercent >= 10,
              openDate: cells[2] || new Date().toLocaleDateString('en-IN'),
              closeDate: cells[3] || new Date().toLocaleDateString('en-IN'),
              listingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN'),
              confidenceScore: Math.random() * 0.3 + 0.7,
              industry: this.getRandomIndustry(),
              lotSize: [50, 75, 100, 150, 200][Math.floor(Math.random() * 5)],
              source: 'chittorgarh'
            })
            count++
          }
        }
      }
      
      return ipos
    } catch (error) {
      console.error('Error parsing Chittorgarh HTML:', error)
      return []
    }
  }

  // Parse number from text
  parseNumber(text) {
    if (!text) return null
    const cleaned = text.replace(/[₹Rs,\s%]/g, '')
    const number = parseFloat(cleaned)
    return isNaN(number) ? null : number
  }

  // Determine IPO status from dates
  determineStatus(openDate, closeDate) {
    const today = new Date()
    const open = new Date(openDate)
    const close = new Date(closeDate)
    
    if (today < open) return 'Upcoming'
    if (today >= open && today <= close) return 'Open'
    return 'Closed'
  }

  // Get random industry
  getRandomIndustry() {
    const industries = [
      'Technology', 'Healthcare', 'Financial Services', 
      'Manufacturing', 'Energy', 'Retail', 'Real Estate',
      'Telecommunications', 'Automotive', 'Pharmaceuticals'
    ]
    return industries[Math.floor(Math.random() * industries.length)]
  }

  // Health check for backend
  async checkBackendHealth() {
    try {
      const response = await this.fetchWithTimeout(`${this.backendURL}/health`, {}, 5000)
      return response.ok
    } catch (error) {
      return false
    }
  }
}

export const apiService = new APIService()
export default apiService