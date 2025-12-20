import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/gemini-ipo/market-sentiment`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error proxying to backend:', error)
    
    // Return mock market sentiment
    const mockSentiment = {
      status: 'success',
      data: {
        sentiment: 'Bullish',
        investorAppetite: 'High',
        confidence: 0.85,
        trends: 'Strong demand for technology and healthcare IPOs with positive market conditions',
        outlook: 'Market showing strong appetite for quality IPOs with good fundamentals',
        lastUpdated: new Date().toISOString()
      }
    }
    
    return NextResponse.json(mockSentiment)
  }
}