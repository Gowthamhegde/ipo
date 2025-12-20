import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/realtime-ipo/tasks`, {
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
    
    // Return mock task data
    return NextResponse.json({
      tasks: {
        'task_1': {
          type: 'daily_fetch',
          status: 'completed',
          start_time: new Date().toISOString(),
          result: 'Fetched 5 IPOs successfully'
        },
        'task_2': {
          type: 'periodic_fetch',
          status: 'running',
          start_time: new Date().toISOString(),
          result: 'In progress'
        }
      },
      scheduler: {
        is_running: true,
        active_tasks: 2,
        total_tasks: 5
      }
    })
  }
}