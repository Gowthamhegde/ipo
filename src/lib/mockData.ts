// Mock data for development and demonstration

export const mockIPOs = [
  {
    id: 1,
    name: "TechCorp IPO",
    companyName: "TechCorp Solutions Ltd",
    issuePriceMin: 100,
    issuePriceMax: 105,
    issueSize: 2500,
    lotSize: 100,
    openDate: "15 Jan 2024",
    closeDate: "17 Jan 2024",
    listingDate: "22 Jan 2024",
    status: "open",
    industry: "Technology",
    currentGMP: 45,
    gmpPercentage: 43.2,
    confidenceScore: 0.85,
    isProfitable: true,
    prediction: {
      gainPercentage: 38.5,
      confidence: 0.82,
      factors: [
        { factor: "High GMP", impact: "Positive", weight: 0.8 },
        { factor: "Tech Sector Demand", impact: "Positive", weight: 0.7 },
        { factor: "Market Sentiment", impact: "Positive", weight: 0.6 }
      ]
    }
  },
  {
    id: 2,
    name: "HealthPlus IPO",
    companyName: "HealthPlus Pharmaceuticals",
    issuePriceMin: 250,
    issuePriceMax: 260,
    issueSize: 1800,
    lotSize: 50,
    openDate: "20 Jan 2024",
    closeDate: "22 Jan 2024",
    listingDate: "27 Jan 2024",
    status: "upcoming",
    industry: "Healthcare",
    currentGMP: 75,
    gmpPercentage: 29.4,
    confidenceScore: 0.92,
    isProfitable: true,
    prediction: {
      gainPercentage: 32.1,
      confidence: 0.89,
      factors: [
        { factor: "Strong Fundamentals", impact: "Positive", weight: 0.9 },
        { factor: "Healthcare Growth", impact: "Positive", weight: 0.8 },
        { factor: "Moderate GMP", impact: "Positive", weight: 0.6 }
      ]
    }
  },
  {
    id: 3,
    name: "GreenEnergy IPO",
    companyName: "GreenEnergy Solutions",
    issuePriceMin: 80,
    issuePriceMax: 85,
    issueSize: 1200,
    lotSize: 150,
    openDate: "25 Jan 2024",
    closeDate: "27 Jan 2024",
    listingDate: "01 Feb 2024",
    status: "upcoming",
    industry: "Energy",
    currentGMP: 12,
    gmpPercentage: 14.6,
    confidenceScore: 0.68,
    isProfitable: true,
    prediction: {
      gainPercentage: 18.2,
      confidence: 0.65,
      factors: [
        { factor: "ESG Focus", impact: "Positive", weight: 0.7 },
        { factor: "Government Support", impact: "Positive", weight: 0.6 },
        { factor: "Low GMP", impact: "Neutral", weight: 0.4 }
      ]
    }
  },
  {
    id: 4,
    name: "RetailMax IPO",
    companyName: "RetailMax Chain Stores",
    issuePriceMin: 150,
    issuePriceMax: 155,
    issueSize: 3000,
    lotSize: 75,
    openDate: "10 Jan 2024",
    closeDate: "12 Jan 2024",
    listingDate: "17 Jan 2024",
    status: "closed",
    industry: "Retail",
    currentGMP: 8,
    gmpPercentage: 5.2,
    confidenceScore: 0.45,
    isProfitable: false,
    prediction: {
      gainPercentage: 7.8,
      confidence: 0.42,
      factors: [
        { factor: "Retail Challenges", impact: "Negative", weight: 0.7 },
        { factor: "Low GMP", impact: "Negative", weight: 0.6 },
        { factor: "Large Issue Size", impact: "Negative", weight: 0.5 }
      ]
    }
  },
  {
    id: 5,
    name: "FinTech Pro IPO",
    companyName: "FinTech Pro Services",
    issuePriceMin: 200,
    issuePriceMax: 210,
    issueSize: 1500,
    lotSize: 60,
    openDate: "05 Feb 2024",
    closeDate: "07 Feb 2024",
    listingDate: "12 Feb 2024",
    status: "upcoming",
    industry: "Financial Services",
    currentGMP: 95,
    gmpPercentage: 46.3,
    confidenceScore: 0.88,
    isProfitable: true,
    prediction: {
      gainPercentage: 42.7,
      confidence: 0.85,
      factors: [
        { factor: "High GMP", impact: "Positive", weight: 0.9 },
        { factor: "FinTech Growth", impact: "Positive", weight: 0.8 },
        { factor: "Strong Management", impact: "Positive", weight: 0.7 }
      ]
    }
  },
  {
    id: 6,
    name: "AutoParts Ltd IPO",
    companyName: "AutoParts Manufacturing Ltd",
    issuePriceMin: 120,
    issuePriceMax: 125,
    issueSize: 800,
    lotSize: 100,
    openDate: "15 Feb 2024",
    closeDate: "17 Feb 2024",
    listingDate: "22 Feb 2024",
    status: "upcoming",
    industry: "Automotive",
    currentGMP: 18,
    gmpPercentage: 14.8,
    confidenceScore: 0.72,
    isProfitable: true,
    prediction: {
      gainPercentage: 16.5,
      confidence: 0.69,
      factors: [
        { factor: "Auto Sector Recovery", impact: "Positive", weight: 0.6 },
        { factor: "Moderate GMP", impact: "Neutral", weight: 0.5 },
        { factor: "Export Potential", impact: "Positive", weight: 0.7 }
      ]
    }
  }
]

export const mockStats = {
  totalIpos: 156,
  activeIpos: 23,
  profitableIpos: 18,
  avgGMP: 42.5,
  totalUsers: 1247,
  notificationsSent: 3456
}

export const mockNotifications = [
  {
    id: 1,
    type: "gmp_spike",
    title: "GMP Alert: TechCorp IPO",
    message: "GMP increased by 12% in the last hour",
    timestamp: "2024-01-15T10:30:00Z",
    isRead: false,
    ipoId: 1
  },
  {
    id: 2,
    type: "profitable_ipo",
    title: "Profitable IPO: HealthPlus",
    message: "HealthPlus IPO meets your profitability criteria",
    timestamp: "2024-01-15T09:15:00Z",
    isRead: false,
    ipoId: 2
  },
  {
    id: 3,
    type: "listing_reminder",
    title: "Listing Tomorrow: TechCorp",
    message: "TechCorp IPO is scheduled to list tomorrow",
    timestamp: "2024-01-14T18:00:00Z",
    isRead: true,
    ipoId: 1
  }
]

export const mockUserPreferences = {
  minProfitPercentage: 10.0,
  minAbsoluteProfit: 20.0,
  preferredIndustries: ["Technology", "Healthcare"],
  riskLevel: "medium",
  notificationChannels: {
    email: true,
    sms: false,
    push: true
  },
  gmpSpikeThreshold: 8.0
}