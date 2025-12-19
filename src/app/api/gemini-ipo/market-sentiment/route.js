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
    
    // Return fallback sentiment data
    const fallbackData = {
      status: 'success',
      data: {
        sentiment_score: 6.5,
        analysis: 'Market sentiment data temporarily unavailable. System showing moderate optimism.',
        key_drivers: ['Backend unavailable', 'Using fallback data']
      },
      source: 'fallback_data'
    }
    
    return NextResponse.json(fallbackData)
  }
}