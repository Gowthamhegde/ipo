import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Mock system statistics - replace with real data from your backend
    const mockStats = {
      total_ipos: 156,
      active_ipos: 23,
      profitable_ipos: 89,
      total_users: 1247,
      active_users: 892,
      recent_notifications: 45,
      profitability_rate: 57.1,
      last_update: new Date().toISOString(),
      system_health: {
        database: 'healthy',
        cache: 'active',
        background_tasks: 'running'
      }
    }

    return NextResponse.json(mockStats)
  } catch (error) {
    console.error('Error fetching analytics stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics stats' },
      { status: 500 }
    )
  }
}