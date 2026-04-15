/**
 * Server Service - Clean API service for server information
 * Uses direct fetch for non-API endpoint (http://localhost:3001/get-server-ip)
 * Matches unitmaster.ts pattern
 */

import HttpClient from '../helpers/httpClient' // Not used for direct endpoint
const BASE_URL = 'http://localhost:3001';


/* ═══════════════════════════════════════════════════════════════════════════════
 * Server Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const ServerService = {
  /**
   * Get server IP address (direct endpoint)
   * 
   * 
   */

  
  getServerIP: async (): Promise<string> => {
  try {
    const response = await HttpClient.get<{ ip: string }>(
      `${BASE_URL}/get-server-ip`
    )

    return response.ip || 'localhost'   // ✅ direct access
  } catch (error) {
    console.error('Failed to fetch server IP:', error)
    return 'localhost'
  }
}
}

export default ServerService
