// Kite Token Validator - Helps diagnose token issues
export class KiteTokenValidator {
  constructor(apiKey, accessToken) {
    this.apiKey = apiKey
    this.accessToken = accessToken
  }

  // Validate token format
  validateTokenFormat() {
    const results = {
      apiKey: {
        valid: false,
        issues: []
      },
      accessToken: {
        valid: false,
        issues: []
      }
    }

    // Validate API Key
    if (!this.apiKey || this.apiKey === 'your_kite_api_key_here') {
      results.apiKey.issues.push('API key not configured')
    } else if (this.apiKey.length < 10) {
      results.apiKey.issues.push('API key too short (should be ~16 characters)')
    } else if (!/^[a-z0-9]+$/.test(this.apiKey)) {
      results.apiKey.issues.push('API key should contain only lowercase letters and numbers')
    } else {
      results.apiKey.valid = true
    }

    // Validate Access Token
    if (!this.accessToken || this.accessToken === 'your_kite_access_token_here') {
      results.accessToken.issues.push('Access token not configured')
    } else if (this.accessToken.length < 20) {
      results.accessToken.issues.push('Access token too short (should be ~32 characters)')
    } else if (!/^[a-z0-9]+$/.test(this.accessToken)) {
      results.accessToken.issues.push('Access token should contain only lowercase letters and numbers')
    } else {
      results.accessToken.valid = true
    }

    return results
  }

  // Check if token might be expired
  checkTokenExpiry() {
    const now = new Date()
    const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000)) // Convert to IST
    const currentHour = istTime.getHours()
    const currentMinute = istTime.getMinutes()

    // Tokens expire at 7:30 AM IST daily
    const expiryHour = 7
    const expiryMinute = 30

    const isAfterExpiry = currentHour > expiryHour || 
                         (currentHour === expiryHour && currentMinute >= expiryMinute)

    return {
      currentTimeIST: istTime.toLocaleString('en-IN'),
      isAfterExpiry,
      nextExpiryIST: '7:30 AM IST tomorrow',
      recommendation: isAfterExpiry ? 
        'Token likely expired - generate new token' : 
        'Token should still be valid'
    }
  }

  // Generate login URL for new token
  generateLoginURL() {
    if (!this.apiKey || this.apiKey === 'your_kite_api_key_here') {
      return 'Configure API key first'
    }
    
    return `https://kite.trade/connect/login?api_key=${this.apiKey}&v=3`
  }

  // Comprehensive validation report
  getValidationReport() {
    const formatValidation = this.validateTokenFormat()
    const expiryCheck = this.checkTokenExpiry()
    
    return {
      formatValidation,
      expiryCheck,
      loginURL: this.generateLoginURL(),
      recommendations: this.getRecommendations(formatValidation, expiryCheck)
    }
  }

  // Get specific recommendations
  getRecommendations(formatValidation, expiryCheck) {
    const recommendations = []

    if (!formatValidation.apiKey.valid) {
      recommendations.push({
        type: 'error',
        message: 'Fix API Key: ' + formatValidation.apiKey.issues.join(', ')
      })
    }

    if (!formatValidation.accessToken.valid) {
      recommendations.push({
        type: 'error',
        message: 'Fix Access Token: ' + formatValidation.accessToken.issues.join(', ')
      })
    }

    if (expiryCheck.isAfterExpiry) {
      recommendations.push({
        type: 'warning',
        message: 'Access token likely expired - generate new token using login URL'
      })
    }

    if (formatValidation.apiKey.valid && formatValidation.accessToken.valid) {
      if (expiryCheck.isAfterExpiry) {
        recommendations.push({
          type: 'action',
          message: 'Generate new access token and update .env.local file'
        })
      } else {
        recommendations.push({
          type: 'info',
          message: 'Credentials format looks correct - check network connectivity'
        })
      }
    }

    return recommendations
  }
}

// Helper function to validate current environment
export function validateCurrentKiteConfig() {
  const apiKey = process.env.NEXT_PUBLIC_KITE_API_KEY
  const accessToken = process.env.NEXT_PUBLIC_KITE_ACCESS_TOKEN
  
  const validator = new KiteTokenValidator(apiKey, accessToken)
  return validator.getValidationReport()
}