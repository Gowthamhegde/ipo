'use client'

import { 
  TrendingUp, 
  Bell, 
  Shield, 
  BarChart3, 
  Users, 
  Zap,
  Clock,
  Target,
  Brain,
  Database,
  Smartphone,
  Award
} from 'lucide-react'

export default function Features() {
  const features = [
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Multi-Source GMP Tracking",
      description: "Real-time Grey Market Premium data from NSE, BSE, Chittorgarh, and IPOWatch with automatic validation.",
      color: "text-blue-600"
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Data Validation & Confidence Scoring",
      description: "Cross-source validation with outlier detection and confidence scores to ensure data reliability.",
      color: "text-green-600"
    },
    {
      icon: <Bell className="h-8 w-8" />,
      title: "Smart Notifications",
      description: "Get notified only for profitable IPOs (≥10% GMP or ≥₹20 absolute) with customizable filters.",
      color: "text-purple-600"
    },
    {
      icon: <Brain className="h-8 w-8" />,
      title: "ML-Powered Predictions",
      description: "AI-based listing gain predictions using 5+ years of historical IPO data and market trends.",
      color: "text-orange-600"
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: "Real-Time Updates",
      description: "Automated data refresh every 2 hours with GMP validation every 30 minutes.",
      color: "text-red-600"
    },
    {
      icon: <Target className="h-8 w-8" />,
      title: "Custom Filters",
      description: "Personalize notifications by profit percentage, industry, risk level, and investment preferences.",
      color: "text-indigo-600"
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Advanced Analytics",
      description: "Comprehensive charts, trends, and insights to make informed investment decisions.",
      color: "text-teal-600"
    },
    {
      icon: <Smartphone className="h-8 w-8" />,
      title: "Multi-Channel Alerts",
      description: "Receive notifications via email, SMS, and push notifications across all your devices.",
      color: "text-pink-600"
    },
    {
      icon: <Database className="h-8 w-8" />,
      title: "Historical Data Analysis",
      description: "Access comprehensive historical GMP data and performance analytics for better insights.",
      color: "text-cyan-600"
    },
    {
      icon: <Award className="h-8 w-8" />,
      title: "High Accuracy Rate",
      description: "95%+ accuracy in GMP validation with sophisticated algorithms and multiple data sources.",
      color: "text-yellow-600"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "User Dashboard",
      description: "Intuitive dashboard with portfolio tracking, notification history, and performance metrics.",
      color: "text-gray-600"
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Lightning Fast",
      description: "Optimized performance with caching, real-time updates, and responsive design.",
      color: "text-emerald-600"
    }
  ]

  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Comprehensive IPO Analysis Platform
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to make informed IPO investment decisions with 
            real-time data, AI insights, and smart notifications.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100"
            >
              <div className={`${feature.color} mb-4`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Additional Info Section */}
        <div className="mt-20 bg-white rounded-2xl p-8 shadow-lg">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Why Choose Our IPO GMP Analyzer?
              </h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Only profitable IPO notifications (saves time and increases ROI)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Multi-source validation eliminates fake GMP rumors</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>ML predictions based on 5+ years of historical data</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Customizable filters for personalized investment strategy</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Real-time updates every 2 hours with 30-minute validation</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Profitability Criteria
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Minimum GMP Percentage:</span>
                  <span className="font-semibold text-green-600">≥ 10%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Minimum Absolute GMP:</span>
                  <span className="font-semibold text-green-600">≥ ₹20</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">GMP Spike Alert:</span>
                  <span className="font-semibold text-orange-600">≥ 8% change</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Confidence Score:</span>
                  <span className="font-semibold text-blue-600">0.0 - 1.0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}