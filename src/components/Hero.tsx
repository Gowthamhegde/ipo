'use client'

import { TrendingUp, Shield, Zap, BarChart3 } from 'lucide-react'

interface HeroProps {
  onGetStarted: () => void
}

export default function Hero({ onGetStarted }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800">
      <div className="absolute inset-0 bg-black opacity-20"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Smart IPO Analysis with
            <span className="block text-yellow-300">GMP Intelligence</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Get real-time Grey Market Premium data from multiple sources, 
            AI-powered predictions, and smart notifications for profitable IPO opportunities.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={onGetStarted}
              className="bg-yellow-400 text-blue-900 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-yellow-300 transition-colors shadow-lg"
            >
              Start Analyzing IPOs
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
              Watch Demo
            </button>
          </div>
          
          {/* Key Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-16">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6 text-center">
              <TrendingUp className="h-12 w-12 text-yellow-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Multi-Source GMP</h3>
              <p className="text-blue-100 text-sm">
                Real-time data from NSE, BSE, Chittorgarh, and IPOWatch
              </p>
            </div>
            
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6 text-center">
              <Shield className="h-12 w-12 text-yellow-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Validated Data</h3>
              <p className="text-blue-100 text-sm">
                Cross-source validation with confidence scoring
              </p>
            </div>
            
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6 text-center">
              <Zap className="h-12 w-12 text-yellow-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Smart Alerts</h3>
              <p className="text-blue-100 text-sm">
                Only profitable IPOs (≥10% or ≥₹20 GMP)
              </p>
            </div>
            
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6 text-center">
              <BarChart3 className="h-12 w-12 text-yellow-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">ML Predictions</h3>
              <p className="text-blue-100 text-sm">
                AI-powered listing gain predictions
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-yellow-300 rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-blue-300 rounded-full opacity-10 animate-pulse delay-1000"></div>
      </div>
    </section>
  )
}