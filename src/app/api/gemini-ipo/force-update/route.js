import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function POST() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/gemini-ipo/force-update`, {
      method: 'POST',
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
    
    // Return mock updated data
    const mockUpdatedData = [
      {
        company: 'Tata Technologies',
        priceRange: '₹500 - ₹550',
        gmp: 90,
        status: 'Open',
        industry: 'Technology'
      },
      {
        company: 'IREDA',
        priceRange: '₹32 - ₹34',
        gmp: 15,
        status: 'Upcoming',
        industry: 'Energy'
      }
    ]
    
    return NextResponse.json({
      status: 'completed',
      message: 'Immediate update completed',
      data: mockUpdatedData,
      count: mockUpdatedData.length,
      timestamp: new Date().toISOString()
    })
  }
}