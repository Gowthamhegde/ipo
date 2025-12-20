
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

function Navbar({ onShowDashboard }) {
  const router = useRouter()
  
  return (
    <nav className="bg-gradient-to-r from-gray-900 via-gray-800 to-blue-900 shadow-2xl sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">💎</span>
              </div>
              <div className="ml-4">
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-300 to-indigo-300 bg-clip-text text-transparent">
                  IPO GMP Pro
                </span>
                <div className="text-xs text-blue-200 font-medium">AI-Powered Analysis</div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Launch Dashboard
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

function Hero({ onGetStarted }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 min-h-screen flex items-center">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="text-center">
          <div className="mb-8">
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-500/20 text-blue-200 border border-blue-500/30">
              🚀 AI-Powered IPO Analysis
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-8">
            <span className="bg-gradient-to-r from-white via-blue-200 to-indigo-200 bg-clip-text text-transparent">
              Smart IPO Analysis
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-300 to-indigo-300 bg-clip-text text-transparent">
              with Gemini AI
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-4xl mx-auto leading-relaxed">
            Discover profitable IPO opportunities with real-time Grey Market Premium data, 
            AI-powered predictions, and intelligent analysis from reliable sources.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button
              onClick={onGetStarted}
              className="group bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-10 py-5 rounded-2xl text-lg font-bold hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 shadow-2xl hover:shadow-blue-500/25 transform hover:scale-105"
            >
              <span className="flex items-center gap-3">
                Start Analysis
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </span>
            </button>
            
            <button
              onClick={() => window.open('/ipos', '_blank')}
              className="group bg-white/10 backdrop-blur-sm text-white px-10 py-5 rounded-2xl text-lg font-bold hover:bg-white/20 transition-all duration-300 shadow-2xl border border-white/20"
            >
              <span className="flex items-center gap-3">
                View IPOs
                <span className="group-hover:translate-x-1 transition-transform">📊</span>
              </span>
            </button>
          </div>
          
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">AI-Powered</h3>
              <p className="text-blue-200">Advanced Gemini AI analysis for market insights</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Real-Time</h3>
              <p className="text-blue-200">Live GMP updates and market data</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📈</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Analytics</h3>
              <p className="text-blue-200">Comprehensive market analysis and trends</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  const router = useRouter()

  const handleStartAnalysis = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Hero onGetStarted={handleStartAnalysis} />
    </div>
  )
}
