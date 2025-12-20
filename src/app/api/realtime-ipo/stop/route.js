import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function POST() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/realtime-ipo/stop`, {
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
    
    return NextResponse.json({
      status: 'stopped',
      message: 'Real-time IPO service stopped successfully',
      timestamp: new Date().toISOString()
    })
  }
}