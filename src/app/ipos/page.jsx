'use client'

import React, { useState, useEffect } from 'react'
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChartBarIcon,
  CalendarIcon,
  CurrencyRupeeIcon,
  TrendingUpIcon
} from '@heroicons/react/24/outline'
import IPOCard from '../../components/IPOCard'
import FilterPanel from '../../components/FilterPanel'
import toast from 'react-hot-toast'

const IPOsPage = () => {
  const [ipos, setIpos] = useState([])
  const [filteredIpos, setFilteredIpos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('gmp')
  const [sortOrder, setSortOrder] = useState('desc')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    status: 'all',
    profitableOnly: false,
    minGMP: '',
    maxGMP: '',
    industry: 'all',
    boardType: 'all'
  })

  useEffect(() => {
    fetchIPOs()
  }, [])

  useEffect(() => {
    applyFiltersAndSort()
  }, [ipos, searchTerm, sortBy, sortOrder, filters])

  const fetchIPOs = async () => {
    try {
      setLoading(true)
      
      console.log('🤖 Fetching IPOs - Gemini AI Primary Mode')
      
      // Try Gemini AI first (primary source)
      try {
        const geminiResponse = await fetch('/api/gemini-ipo/ipos')
        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json()
          if (geminiData.data && geminiData.data.length > 0) {
            setIpos(geminiData.data)
            toast.success(`✅ Loaded ${geminiData.data.length} real IPOs from Gemini AI!`)
            return
          } else {
            console.log('ℹ️ Gemini returned no IPOs - market may be inactive')
            setIpos([])
            toast.info('No IPOs currently available in the market')
            return
          }
        }
      } catch (geminiError) {
        console.warn('Gemini API failed, trying real-time service:', geminiError.message)
      }

      // Fallback to real-time service
      const realtimeResponse = await fetch('/api/realtime-ipo/latest-data')
      if (realtimeResponse.ok) {
        const realtimeData = await realtimeResponse.json()
        if (realtimeData.data && realtimeData.data.length > 0) {
          setIpos(realtimeData.data)
          toast.success('Loaded IPO data from real-time service')
          return
        }
      }

      // Final fallback to regular API
      const response = await fetch('/api/ipos')
      if (response.ok) {
        const data = await response.json()
        setIpos(data)
        toast.info('Loaded IPO data from backend')
      } else {
        // Use mock data if all else fails
        const mockData = generateMockIPOs()
        setIpos(mockData)
        toast.warning('Using sample data - please configure Gemini AI for real data')
      }
    } catch (error) {
      console.error('Error fetching IPOs:', error)
      const mockData = generateMockIPOs()
      setIpos(mockData)
      toast.error('Failed to load IPO data - showing sample data')
    } finally {
      setLoading(false)
    }
  }

  const generateMockIPOs = () => {
    const companies = [
      'TechCorp Solutions', 'Green Energy Ltd', 'FinTech Innovations',
      'Healthcare Plus', 'Digital Media Co', 'Smart Logistics',
      'EduTech Systems', 'Food & Beverages Ltd', 'Renewable Power',
      'AI Technologies', 'Biotech Research', 'E-commerce Hub',
      'Cyber Security Inc', 'Cloud Computing Ltd', 'Mobile Apps Co'
    ]

    const industries = [
      'Technology', 'Energy', 'Finance', 'Healthcare', 'Media',
      'Logistics', 'Education', 'FMCG', 'Power', 'Biotechnology'
    ]

    const statuses = ['Upcoming', 'Open', 'Closed', 'Listed']

    return companies.map((company, index) => {
      const minPrice = Math.floor(Math.random() * 500) + 100
      const maxPrice = minPrice + Math.floor(Math.random() * 100) + 20
      const gmp = Math.floor(Math.random() * 200) - 50
      const gmpPercent = (gmp / minPrice) * 100
      const lotSize = minPrice <= 200 ? 75 : minPrice <= 500 ? 30 : 15

      return {
        id: index + 1,
        name: `${company} IPO`,
        company: company,
        priceRange: `₹${minPrice} - ₹${maxPrice}`,
        price_range: `₹${minPrice} - ₹${maxPrice}`,
        issueSize: Math.floor(Math.random() * 5000) + 500,
        issue_size: Math.floor(Math.random() * 5000) + 500,
        gmp: gmp,
        gmpPercent: parseFloat(gmpPercent.toFixed(2)),
        gmp_percent: parseFloat(gmpPercent.toFixed(2)),
        status: statuses[Math.floor(Math.random() * statuses.length)],
        isProfitable: gmp >= 20 || gmpPercent >= 10,
        is_profitable: gmp >= 20 || gmpPercent >= 10,
        openDate: getRandomDate(-5, 15),
        open_date: getRandomDate(-5, 15),
        closeDate: getRandomDate(5, 25),
        close_date: getRandomDate(5, 25),
        listingDate: getRandomDate(15, 35),
        listing_date: getRandomDate(15, 35),
        confidenceScore: Math.random() * 0.4 + 0.6,
        confidence_score: Math.random() * 0.4 + 0.6,
        industry: industries[Math.floor(Math.random() * industries.length)],
        lotSize: lotSize,
        lot_size: lotSize,
        boardType: Math.random() > 0.7 ? 'SME' : 'Main Board',
        board_type: Math.random() > 0.7 ? 'SME' : 'Main Board',
        estimatedGain: Math.max(0, gmp * lotSize),
        estimated_gain: Math.max(0, gmp * lotSize),
        riskLevel: gmp < 0 ? 'High' : gmp < 50 ? 'Medium' : 'Low',
        risk_level: gmp < 0 ? 'High' : gmp < 50 ? 'Medium' : 'Low',
        recommendation: gmp >= 50 ? 'Strong Buy' : gmp >= 20 ? 'Buy' : gmp >= 0 ? 'Hold' : 'Avoid'
      }
    })
  }

  const getRandomDate = (minDays, maxDays) => {
    const today = new Date()
    const randomDays = Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays
    const date = new Date(today)
    date.setDate(today.getDate() + randomDays)
    return date.toISOString().split('T')[0]
  }

  const applyFiltersAndSort = () => {
    let filtered = [...ipos]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(ipo =>
        (ipo.name || ipo.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ipo.company || ipo.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply filters
    if (filters.status !== 'all') {
      filtered = filtered.filter(ipo => ipo.status === filters.status)
    }

    if (filters.profitableOnly) {
      filtered = filtered.filter(ipo => ipo.isProfitable || ipo.is_profitable)
    }

    if (filters.minGMP) {
      filtered = filtered.filter(ipo => (ipo.gmp || 0) >= parseFloat(filters.minGMP))
    }

    if (filters.maxGMP) {
      filtered = filtered.filter(ipo => (ipo.gmp || 0) <= parseFloat(filters.maxGMP))
    }

    if (filters.industry !== 'all') {
      filtered = filtered.filter(ipo => ipo.industry === filters.industry)
    }

    if (filters.boardType !== 'all') {
      filtered = filtered.filter(ipo => (ipo.boardType || ipo.board_type) === filters.boardType)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue

      switch (sortBy) {
        case 'gmp':
          aValue = a.gmp || 0
          bValue = b.gmp || 0
          break
        case 'gmpPercent':
          aValue = a.gmpPercent || a.gmp_percent || 0
          bValue = b.gmpPercent || b.gmp_percent || 0
          break
        case 'name':
          aValue = (a.name || a.company || '').toLowerCase()
          bValue = (b.name || b.company || '').toLowerCase()
          break
        case 'openDate':
          aValue = new Date(a.openDate || a.open_date || '1970-01-01')
          bValue = new Date(b.openDate || b.open_date || '1970-01-01')
          break
        case 'issueSize':
          aValue = a.issueSize || a.issue_size || 0
          bValue = b.issueSize || b.issue_size || 0
          break
        default:
          aValue = a.gmp || 0
          bValue = b.gmp || 0
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredIpos(filtered)
  }

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const getSortIcon = (field) => {
    if (sortBy !== field) return null
    return sortOrder === 'asc' ? 
      <ArrowUpIcon className="h-4 w-4 ml-1" /> : 
      <ArrowDownIcon className="h-4 w-4 ml-1" />
  }

  const getStatusStats = () => {
    const stats = {
      total: ipos.length,
      upcoming: ipos.filter(ipo => ipo.status === 'Upcoming').length,
      open: ipos.filter(ipo => ipo.status === 'Open').length,
      profitable: ipos.filter(ipo => ipo.isProfitable || ipo.is_profitable).length
    }
    return stats
  }

  const stats = getStatusStats()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading IPO data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">IPO Listings</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive IPO data with real-time GMP updates
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total IPOs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CalendarIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Open Now</p>
                <p className="text-2xl font-bold text-gray-900">{stats.open}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CurrencyRupeeIcon className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900">{stats.upcoming}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <TrendingUpIcon className="h-8 w-8 text-emerald-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Profitable</p>
                <p className="text-2xl font-bold text-gray-900">{stats.profitable}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search IPOs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Sort and Filter Controls */}
            <div className="flex items-center space-x-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="gmp">Sort by GMP</option>
                <option value="gmpPercent">Sort by GMP %</option>
                <option value="name">Sort by Name</option>
                <option value="openDate">Sort by Open Date</option>
                <option value="issueSize">Sort by Issue Size</option>
              </select>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                Filters
              </button>

              <button
                onClick={fetchIPOs}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <FilterPanel filters={filters} onFiltersChange={setFilters} />
            </div>
          )}
        </div>

        {/* Results Info */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredIpos.length} of {ipos.length} IPOs
            {searchTerm && ` matching "${searchTerm}"`}
          </p>
        </div>

        {/* IPO Grid */}
        {filteredIpos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIpos.map((ipo) => (
              <IPOCard key={ipo.id} ipo={ipo} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No IPOs Found</h3>
            <p className="text-gray-600">
              {searchTerm || Object.values(filters).some(f => f && f !== 'all')
                ? 'Try adjusting your search or filters'
                : 'No IPO data available at the moment'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default IPOsPage