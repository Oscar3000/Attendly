import { NextResponse } from 'next/server';

/**
 * Health check endpoint for Docker health checks and monitoring
 */
export async function GET() {
  try {
    // Check if the application is running
    const status = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '0.1.0'
    };

    return NextResponse.json(status, { status: 200 });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      { 
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Service unavailable'
      }, 
      { status: 503 }
    );
  }
}