'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Bell, Shield, BarChart3, Users, Zap } from 'lucide-react'
import IPODashboard from '@/components/IPODashboard'
import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import Features from '@/components/Features'

export default function Home() {
  const [showDashboard, setShowDashboard] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onShowDashboard={() => setShowDashboard(true)} />
      
      {showDashboard ? (
        <IPODashboard />
      ) : (
        <>
          <Hero onGetStarted={() => setShowDashboard(true)} />
          <Features />
          
          {/* Stats Section */}
          <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Trusted by Investors Across India
                </h2>
                <p className="text-lg text-gray-600">
                  Real-time data from multiple sources with AI-powered insights
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
                  <div className="text-gray-600">IPOs Tracked</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">95%</div>
                  <div className="text-gray-600">Accuracy Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-purple-600 mb-2">4</div>
                  <div className="text-gray-600">Data Sources</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-orange-600 mb-2">24/7</div>
                  <div className="text-gray-600">Monitoring</div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-16 gradient-bg">
            <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to Make Smarter IPO Investments?
              </h2>
              <p className="text-xl text-blue-100 mb-8">
                Join thousands of investors who trust our GMP analysis and notifications
              </p>
              <button
                onClick={() => setShowDashboard(true)}
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Start Analyzing IPOs
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  )
}