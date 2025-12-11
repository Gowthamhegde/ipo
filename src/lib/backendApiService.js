// Backend API Service for ML predictions and live analysis
class BackendAPIService {
  constructor() {
    this.baseURL = 'http://localhost:8000'
    this.cache = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5 minutes cache for live data
  }

  // Check if cached data is still valid
  isCacheValid(key) {
    const cached = this.cache.get(key)
    if (!cached) return false
    return Date.now() - cached.timestamp < this.cacheTimeout
  }

  // Check backend health
  async checkBackendHealth() {
    try {
      const response = await fetch(`${this.baseURL}/health`)
      if (response.ok) {
        const data = await response.json()
        return { available: true, status: data.status }
      }
      return { available: false, error: 'Backend not responding' }
    } catch (error) {
      return { available: false, error: error.message }
    }
  }

  // Get IPOs from backend with ML predictions
  async getIPOsWithPredictions() {
    const cacheKey = 'backend_ipos'
    
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey).data
    }

    try {
      // Check if backend is available
      const healthCheck = await this.checkBackendHealth()
      if (!healthCheck.available) {
        throw new Error('Backend not available')
      }

      // Fetch IPOs from backend
      const response = await fetch(`${this.baseURL}/ipos`)
      if (!response.ok) {
        throw new Error('Failed to fetch IPOs from backend')
      }

      const ipos = await response.json()
      
      // Get ML predictions for each IPO
      const iposWithPredictions = await Promise.all(
        ipos.map(async (ipo) => {
          try {
            const predictionResponse = await fetch(`${this.baseURL}/ipos/${ipo.id}/prediction`)
            if (predictionResponse.ok) {
              const prediction = await predictionResponse.json()
              return {
                ...ipo,
                mlPrediction: prediction,
                hasMLPrediction: true
              }
            }
            return { ...ipo, hasMLPrediction: false }
          } catch (error) {
            return { ...ipo, hasMLPrediction: false }
          }
        })
      )

      // Cache the result
      this.cache.set(cacheKey, {
        data: iposWithPredictions,
        timestamp: Date.now()
      })

      return iposWithPredictions

    } catch (error) {
      console.error('Backend API error:', error)
      throw error
    }
  }

  // Get GMP history for an IPO
  async getGMPHistory(ipoId) {
    try {
      const response = await fetch(`${this.baseURL}/ipos/${ipoId}/gmp`)
      if (!response.ok) {
        throw new Error('Failed to fetch GMP history')
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching GMP history:', error)
      return []
    }
  }

  // Get ML prediction for specific IPO
  async getMLPrediction(ipoId) {
    try {
      const response = await fetch(`${this.baseURL}/ipos/${ipoId}/prediction`)
      if (!response.ok) {
        throw new Error('Failed to fetch ML prediction')
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching ML prediction:', error)
      return null
    }
  }

  // Refresh IPO data (trigger backend data fetch)
  async refreshIPOData() {
    try {
      const response = await fetch(`${this.baseURL}/ipos/refresh`, {
        method: 'POST'
      })
      if (!response.ok) {
        throw new Error('Failed to refresh IPO data')
      }
      
      // Clear cache to force fresh data
      this.cache.clear()
      
      return await response.json()
    } catch (error) {
      console.error('Error refreshing IPO data:', error)
      throw error
    }
  }

  // Get admin statistics
  async getAdminStats() {
    try {
      const response = await fetch(`${this.baseURL}/admin/stats`)
      if (!response.ok) {
        throw new Error('Failed to fetch admin stats')
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching admin stats:', error)
      return null
    }
  }

  // Convert backend IPO format to frontend format
  convertToFrontendFormat(backendIPO) {
    return {
      id: backendIPO.id,
      name: `${backendIPO.company_name} IPO`,
      company: backendIPO.company_name,
      priceRange: `₹${backendIPO.issue_price_min} - ₹${backendIPO.issue_price_max}`,
      issueSize: backendIPO.issue_size,
      gmp: backendIPO.current_gmp || 0,
      gmpPercent: this.calculateGMPPercent(backendIPO.current_gmp, backendIPO.issue_price_min, backendIPO.issue_price_max),
      status: this.mapStatus(backendIPO.status),
      isProfitable: (backendIPO.current_gmp || 0) >= 20,
      openDate: this.formatDate(backendIPO.open_date),
      closeDate: this.formatDate(backendIPO.close_date),
      listingDate: this.formatDate(backendIPO.listing_date),
      confidenceScore: backendIPO.mlPrediction?.confidence_score || 0.5,
      industry: backendIPO.industry || 'Unknown',
      lotSize: backendIPO.lot_size || 0,
      boardType: backendIPO.issue_size > 250 ? 'Main Board' : 'SME',
      description: backendIPO.description || `${backendIPO.company_name} is launching its IPO.`,
      source: 'backend_ml',
      lastUpdated: new Date().toISOString(),
      growwUrl: this.generateGrowwUrl(backendIPO.company_name),
      
      // ML-specific fields
      mlPrediction: backendIPO.mlPrediction,
      hasMLPrediction: backendIPO.hasMLPrediction,
      predictedGain: backendIPO.mlPrediction?.predicted_gain_percentage,
      mlFactors: backendIPO.mlPrediction?.factors || []
    }
  }

  // Calculate GMP percentage
  calculateGMPPercent(gmp, minPrice, maxPrice) {
    if (!gmp || !minPrice || !maxPrice) return 0
    const avgPrice = (minPrice + maxPrice) / 2
    return parseFloat(((gmp / avgPrice) * 100).toFixed(2))
  }

  // Map backend status to frontend status
  mapStatus(backendStatus) {
    const statusMap = {
      'upcoming': 'Upcoming',
      'open': 'Open', 
      'closed': 'Closed',
      'listed': 'Listed'
    }
    return statusMap[backendStatus] || 'Unknown'
  }

  // Format date
  formatDate(dateString) {
    if (!dateString) return 'TBD'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Generate Groww URL (reuse from bytezApiService)
  generateGrowwUrl(companyName) {
    if (!companyName) return 'https://groww.in/ipo'
    
    const growwIPOMap = {
      'tata technologies': 'https://groww.in/ipo/tata-technologies-ipo',
      'ireda': 'https://groww.in/ipo/ireda-ipo',
      'indian renewable energy development agency': 'https://groww.in/ipo/ireda-ipo',
      'mankind pharma': 'https://groww.in/ipo/mankind-pharma-ipo',
      'yatharth hospital': 'https://groww.in/ipo/yatharth-hospital-ipo'
    }
    
    const normalizedName = companyName.toLowerCase().trim()
    
    if (growwIPOMap[normalizedName]) {
      return growwIPOMap[normalizedName]
    }
    
    for (const [key, url] of Object.entries(growwIPOMap)) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        return url
      }
    }
    
    return 'https://groww.in/ipo'
  }

  // Clear cache
  clearCache() {
    this.cache.clear()
    console.log('Backend API cache cleared')
  }
}

// Export singleton instance
export const backendApiService = new BackendAPIService()
export default backendApiService