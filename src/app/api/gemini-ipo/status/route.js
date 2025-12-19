import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function GET() {
  try {
    console.log('Attempting to connect to backend at:', `${BACKEND_URL}/api/gemini-ipo/status`)
    
    const response = await fetch(`${BACKEND_URL}/api/gemini-ipo/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    console.log('Backend response status:', response.status)
    console.log('Backend response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.log('Backend error response:', errorText)
      throw new Error(`Backend responded with status: ${response.status}`)
    }

    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text()
      console.log('Non-JSON response from backend:', text.substring(0, 200))
      throw new Error(`Backend returned non-JSON response: ${text.substring(0, 100)}`)
    }

    const data = await response.json()
    console.log('Successfully got data from backend:', data)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error proxying to backend:', error)
    return NextResponse.json(
      { 
        error: 'Backend connection failed',
        service: {
          is_initialized: false,
          has_api_key: false,
          service: 'Gemini AI (Backend Unavailable)'
        }
      },
      { status: 200 } // Return 200 to avoid frontend errors
    )
  }
}