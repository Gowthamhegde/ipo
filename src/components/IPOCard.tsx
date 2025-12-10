'use client'

import { useState } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  DollarSign, 
  Shield, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Brain,
  Target
} from 'lucide-react'

interface IPO {
  id: number
  name: string
  companyName: string
  issuePriceMin: number
  issuePriceMax: number
  issueSize: number
  lotSize: number
  openDate: string
  closeDate: string
  listingDate: string
  status: string
  industry: string
  currentGMP: number
  gmpPercentage: number
  confidenceScore: number
  isProfitable: boolean
  prediction?: {
    gainPercentage: number
    confidence: number
    factors: Array<{
      factor: string
      impact: string
      weight: number
    }>
  }
}

interface IPOCardProps {
  ipo: IPO
}

export default function IPOCard({ ipo }: IPOCardProps) {
  const [expanded, setExpanded] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-green-700 bg-green-100 border-green-200'
      case 'upcoming': return 'text-blue-700 bg-blue-100 border-blue-200'
      case 'closed': return 'text-orange-700 bg-orange-100 border-orange-200'
      case 'listed': return 'text-gray-700 bg-gray-100 border-gray-200'
      default: return 'text-gray-700 bg-gray-100 border-gray-200'
    }
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600'
    if (score >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getGMPTrendIcon = () => {
    if (ipo.gmpPercentage > 0) {
      return <TrendingUp className="h-4 w-4 text-green-600" />
    } else if (ipo.gmpPercentage < 0) {
      return <TrendingDown className="h-4 w-4 text-red-600" />
    }
    return <DollarSign className="h-4 w-4 text-gray-600" />
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border-2 transition-all duration-200 hover:shadow-md ${
      ipo.isProfitable ? 'border-green-200 bg-green-50' : 'border-gray-200'
    }`}>
      {/* Header */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {ipo.name}
            </h3>
            <p className="text-sm text-gray-600">{ipo.companyName}</p>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(ipo.status)}`}>
              {ipo.status.toUpperCase()}
            </span>
            {ipo.isProfitable && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                Profitable
              </span>
            )}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-gray-600" />
              <span className="text-xs font-medium text-gray-600">Price Band</span>
            </div>
            <div className="text-sm font-semibold text-gray-900">
              ₹{ipo.issuePriceMin} - ₹{ipo.issuePriceMax}
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-gray-600" />
              <span className="text-xs font-medium text-gray-600">Issue Size</span>
            </div>
            <div className="text-sm font-semibold text-gray-900">
              ₹{ipo.issueSize} Cr
            </div>
          </div>
        </div>

        {/* GMP Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              {getGMPTrendIcon()}
              <span className="text-sm font-medium text-gray-700">Current GMP</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className={`h-4 w-4 ${getConfidenceColor(ipo.confidenceScore)}`} />
              <span className={`text-xs font-medium ${getConfidenceColor(ipo.confidenceScore)}`}>
                {(ipo.confidenceScore * 100).toFixed(0)}% Confidence
              </span>
            </div>
          </div>
          
          <div className="flex justify-between items-end">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                ₹{ipo.currentGMP.toFixed(0)}
              </div>
              <div className={`text-sm font-medium ${
                ipo.gmpPercentage >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {ipo.gmpPercentage >= 0 ? '+' : ''}{ipo.gmpPercentage.toFixed(1)}%
              </div>
            </div>
            
            {ipo.prediction && (
              <div className="text-right">
                <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                  <Brain className="h-3 w-3" />
                  <span>ML Prediction</span>
                </div>
                <div className="text-sm font-semibold text-purple-600">
                  {ipo.prediction.gainPercentage >= 0 ? '+' : ''}{ipo.prediction.gainPercentage.toFixed(1)}%
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <div className="text-gray-500 mb-1">Open</div>
            <div className="font-medium text-gray-900">{ipo.openDate}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-500 mb-1">Close</div>
            <div className="font-medium text-gray-900">{ipo.closeDate}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-500 mb-1">Listing</div>
            <div className="font-medium text-gray-900">{ipo.listingDate}</div>
          </div>
        </div>
      </div>

      {/* Expandable Section */}
      <div className="border-t border-gray-200">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-6 py-3 flex items-center justify-between text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <span>More Details</span>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        
        {expanded && (
          <div className="px-6 pb-6 space-y-4">
            {/* Additional Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Industry:</span>
                <span className="ml-2 font-medium text-gray-900">{ipo.industry}</span>
              </div>
              <div>
                <span className="text-gray-500">Lot Size:</span>
                <span className="ml-2 font-medium text-gray-900">{ipo.lotSize}</span>
              </div>
            </div>

            {/* ML Prediction Details */}
            {ipo.prediction && (
              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  AI Prediction Factors
                </h4>
                <div className="space-y-2">
                  {ipo.prediction.factors.map((factor, index) => (
                    <div key={index} className="flex justify-between items-center text-xs">
                      <span className="text-gray-700">{factor.factor}</span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full ${
                          factor.impact === 'Positive' ? 'bg-green-100 text-green-700' :
                          factor.impact === 'Negative' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {factor.impact}
                        </span>
                        <span className="text-gray-500">
                          {(factor.weight * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                Track IPO
              </button>
              <button className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                Set Alert
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}