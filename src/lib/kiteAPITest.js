// Kite API Test Utility
import kiteIPOService from './kiteIPOService'
import { validateCurrentKiteConfig } from './kiteTokenValidator'

export class KiteAPITester {
  constructor() {
    this.testResults = []
  }

  // Run comprehensive Kite API tests
  async runTests() {
    console.log('🧪 Starting Kite API Integration Tests...')
    this.testResults = []

    // Test 1: Environment Variables
    await this.testEnvironmentVariables()

    // Test 2: API Authentication
    await this.testAuthentication()

    // Test 3: API Connection
    await this.testAPIConnection()

    // Test 4: Data Fetching
    await this.testDataFetching()

    // Test 5: Service Status
    await this.testServiceStatus()

    // Display results
    this.displayResults()

    return this.testResults
  }

  // Test environment variables
  async testEnvironmentVariables() {
    const test = {
      name: 'Environment Variables & Token Validation',
      status: 'running',
      details: []
    }

    try {
      const apiKey = process.env.NEXT_PUBLIC_KITE_API_KEY
      const accessToken = process.env.NEXT_PUBLIC_KITE_ACCESS_TOKEN

      // Get comprehensive validation report
      const validationReport = validateCurrentKiteConfig()

      // Check API Key
      if (!apiKey || apiKey === 'your_kite_api_key_here') {
        test.details.push('❌ KITE_API_KEY not configured or using placeholder')
        test.status = 'failed'
      } else {
        test.details.push(`✅ KITE_API_KEY configured (${apiKey.substring(0, 8)}...)`)
        
        // Add format validation
        if (!validationReport.formatValidation.apiKey.valid) {
          test.details.push(`⚠️ API Key issues: ${validationReport.formatValidation.apiKey.issues.join(', ')}`)
          test.status = 'warning'
        }
      }

      // Check Access Token
      if (!accessToken || accessToken === 'your_kite_access_token_here') {
        test.details.push('❌ KITE_ACCESS_TOKEN not configured or using placeholder')
        test.status = 'failed'
      } else {
        test.details.push(`✅ KITE_ACCESS_TOKEN configured (${accessToken.substring(0, 8)}...)`)
        
        // Add format validation
        if (!validationReport.formatValidation.accessToken.valid) {
          test.details.push(`⚠️ Access Token issues: ${validationReport.formatValidation.accessToken.issues.join(', ')}`)
          test.status = 'warning'
        }
      }

      // Add expiry check
      if (validationReport.expiryCheck.isAfterExpiry) {
        test.details.push(`⚠️ Token likely expired (current time: ${validationReport.expiryCheck.currentTimeIST})`)
        test.details.push(`🔄 Generate new token: ${validationReport.loginURL}`)
        test.status = 'warning'
      } else {
        test.details.push(`✅ Token should be valid (expires at 7:30 AM IST daily)`)
      }

      // Add recommendations
      validationReport.recommendations.forEach(rec => {
        const icon = rec.type === 'error' ? '❌' : rec.type === 'warning' ? '⚠️' : '💡'
        test.details.push(`${icon} ${rec.message}`)
      })

      if (test.status !== 'failed' && test.status !== 'warning') {
        test.status = 'passed'
      }

    } catch (error) {
      test.status = 'failed'
      test.details.push(`❌ Error checking environment: ${error.message}`)
    }

    this.testResults.push(test)
  }

  // Test API authentication
  async testAuthentication() {
    const test = {
      name: 'API Authentication',
      status: 'running',
      details: []
    }

    try {
      const initialized = await kiteIPOService.initialize()
      
      if (initialized) {
        test.status = 'passed'
        test.details.push('✅ Kite API authentication successful')
        test.details.push('✅ API connection established')
      } else {
        test.status = 'failed'
        test.details.push('❌ Kite API authentication failed')
        test.details.push('❌ Check API credentials and permissions')
      }

    } catch (error) {
      test.status = 'failed'
      test.details.push(`❌ Authentication error: ${error.message}`)
      
      // Provide specific error guidance
      if (error.message.includes('401')) {
        test.details.push('💡 Hint: Invalid API credentials')
      } else if (error.message.includes('403')) {
        test.details.push('💡 Hint: API permissions insufficient')
      } else if (error.message.includes('timeout')) {
        test.details.push('💡 Hint: Network connectivity issue')
      }
    }

    this.testResults.push(test)
  }

  // Test API connection
  async testAPIConnection() {
    const test = {
      name: 'API Connection',
      status: 'running',
      details: []
    }

    try {
      // Test basic API call
      const response = await kiteIPOService.makeAPICall('/user/profile')
      
      if (response && response.status === 'success') {
        test.status = 'passed'
        test.details.push('✅ API connection working')
        test.details.push(`✅ User profile: ${response.data?.user_name || 'Retrieved'}`)
      } else {
        test.status = 'failed'
        test.details.push('❌ API connection failed')
        test.details.push(`❌ Response: ${JSON.stringify(response)}`)
      }

    } catch (error) {
      test.status = 'failed'
      test.details.push(`❌ Connection error: ${error.message}`)
      
      // Specific error guidance
      if (error.message.includes('Network Error') || error.message.includes('CORS')) {
        test.status = 'warning'
        test.details.push('⚠️ CORS Policy: Kite API blocks direct browser calls')
        test.details.push('💡 This is normal - API works through backend proxy in production')
        test.details.push('🔧 Your app will use curated IPO data instead (fully functional)')
      } else if (error.response?.status === 403) {
        test.details.push('💡 Token expired - generate new access token')
      } else if (error.response?.status === 401) {
        test.details.push('💡 Invalid credentials - check API key and token')
      } else if (error.code === 'ENOTFOUND') {
        test.details.push('💡 DNS resolution failed - check internet connection')
      } else if (error.code === 'ECONNREFUSED') {
        test.details.push('💡 Connection refused - Kite API may be down')
      }
    }

    this.testResults.push(test)
  }

  // Test data fetching
  async testDataFetching() {
    const test = {
      name: 'IPO Data Fetching',
      status: 'running',
      details: []
    }

    try {
      const ipoData = await kiteIPOService.getDailyIPOData()
      
      if (ipoData && Array.isArray(ipoData)) {
        test.status = 'passed'
        test.details.push(`✅ IPO data fetched successfully`)
        test.details.push(`✅ Found ${ipoData.length} IPO instruments`)
        
        if (ipoData.length > 0) {
          const sampleIPO = ipoData[0]
          test.details.push(`✅ Sample IPO: ${sampleIPO.company || sampleIPO.name}`)
          test.details.push(`✅ Current Price: ₹${sampleIPO.currentPrice || 'N/A'}`)
        }
      } else {
        test.status = 'warning'
        test.details.push('⚠️ No IPO data found')
        test.details.push('💡 This might be normal if no IPOs are currently active')
      }

    } catch (error) {
      test.status = 'failed'
      test.details.push(`❌ Data fetching error: ${error.message}`)
    }

    this.testResults.push(test)
  }

  // Test service status
  async testServiceStatus() {
    const test = {
      name: 'Service Status',
      status: 'running',
      details: []
    }

    try {
      const status = kiteIPOService.getStatus()
      
      test.details.push(`📊 Authentication: ${status.isAuthenticated ? '✅ Yes' : '❌ No'}`)
      test.details.push(`📊 API Key: ${status.apiKey}`)
      test.details.push(`📊 Access Token: ${status.accessToken}`)
      test.details.push(`📊 Cache Size: ${status.cacheSize} items`)
      test.details.push(`📊 Last Fetch: ${status.lastFetch || 'Never'}`)

      test.status = status.isAuthenticated ? 'passed' : 'failed'

    } catch (error) {
      test.status = 'failed'
      test.details.push(`❌ Status check error: ${error.message}`)
    }

    this.testResults.push(test)
  }

  // Display test results
  displayResults() {
    console.log('\n🧪 KITE API TEST RESULTS')
    console.log('========================')

    let passedTests = 0
    let totalTests = this.testResults.length

    this.testResults.forEach((test, index) => {
      const statusIcon = {
        'passed': '✅',
        'failed': '❌',
        'warning': '⚠️',
        'running': '🔄'
      }[test.status] || '❓'

      console.log(`\n${index + 1}. ${statusIcon} ${test.name} - ${test.status.toUpperCase()}`)
      
      test.details.forEach(detail => {
        console.log(`   ${detail}`)
      })

      if (test.status === 'passed') passedTests++
    })

    console.log('\n📊 SUMMARY')
    console.log('===========')
    console.log(`Tests Passed: ${passedTests}/${totalTests}`)
    console.log(`Success Rate: ${Math.round((passedTests/totalTests) * 100)}%`)

    if (passedTests === totalTests) {
      console.log('🎉 All tests passed! Kite API integration is working perfectly.')
    } else if (passedTests > 0) {
      console.log('⚠️ Some tests failed. Check the details above for troubleshooting.')
    } else {
      console.log('❌ All tests failed. Please check your Kite API configuration.')
    }

    // Provide next steps
    console.log('\n🔧 NEXT STEPS')
    console.log('=============')
    
    if (passedTests === 0) {
      console.log('1. Verify your Kite API credentials in .env.local')
      console.log('2. Check if your Zerodha account has API access')
      console.log('3. Ensure your access token is valid and not expired')
    } else if (passedTests < totalTests) {
      console.log('1. Review failed test details above')
      console.log('2. Check API permissions and rate limits')
      console.log('3. Verify network connectivity')
    } else {
      console.log('1. Your Kite API integration is ready!')
      console.log('2. Start the application to see live IPO data')
      console.log('3. Monitor the dashboard for real-time updates')
    }
  }

  // Get summary for UI display
  getSummary() {
    const passed = this.testResults.filter(t => t.status === 'passed').length
    const total = this.testResults.length
    
    return {
      passed,
      total,
      successRate: Math.round((passed/total) * 100),
      allPassed: passed === total,
      results: this.testResults
    }
  }
}

// Export singleton instance
export const kiteAPITester = new KiteAPITester()
export default kiteAPITester