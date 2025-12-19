import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/gemini-ipo/ipos`, {
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
    
    // Return fallback IPO data
    const fallbackData = {
      status: 'success',
      data: [
        {
          company_name: 'Sample IPO Ltd',
          ipo_name: 'Sample IPO',
          price_min: 100,
          price_max: 120,
          current_gmp: 15,
          sector: 'Technology',
          status: 'Open',
          subscription_status: 'Subscribed 2.5x',
          risk_level: 'Medium',
          recommendation: 'Buy'
        }
      ],
      count: 1,
      source: 'fallback_data',
      message: 'Backend unavailable - showing sample data'
    }
    
    return NextResponse.json(fallbackData)
  }
}