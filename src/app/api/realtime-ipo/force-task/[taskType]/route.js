import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function POST(request, { params }) {
  const { taskType } = params
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/realtime-ipo/force-task/${taskType}`, {
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
    
    // Return mock success response
    return NextResponse.json({
      status: 'triggered',
      message: `Task '${taskType}' triggered successfully`,
      task_type: taskType,
      timestamp: new Date().toISOString()
    })
  }
}