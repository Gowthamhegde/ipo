import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/realtime-ipo/metrics`, {
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
    
    // Return mock metrics
    return NextResponse.json({
      service_metrics: {
        is_running: true,
        last_fetch: new Date().toISOString(),
        sources_count: 3,
        uptime: '2h 30m'
      },
      scheduler_metrics: {
        is_running: true,
        active_tasks: 2,
        total_tasks: 5,
        scheduled_jobs: 3
      },
      cache_metrics: {
        hit_rate: 0.85,
        size: '2.5MB'
      },
      timestamp: new Date().toISOString()
    })
  }
}