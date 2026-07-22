import HttpClient from '../helpers/httpClient'

export interface GracePeriodSettings {
  grace_period_id?: number;
  hotelid: number;
  grace_before: number;
  grace_after: number;
  userid?: number;
}

const GracePeriodService = {
  /**
   * Get Grace Period Settings
   */
  getSettings: (hotelid: number) =>
    HttpClient.get(`/grace-period-settings/${hotelid}`),

  /**
   * Save / Update Grace Period Settings
   */
  saveSettings: (data: GracePeriodSettings) =>
    HttpClient.post(`/grace-period-settings`, data),

  
};




export default GracePeriodService;