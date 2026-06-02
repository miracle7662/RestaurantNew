// pages/InventoryManagement/ReportsPanel.tsx
import { useState, useEffect } from 'react'
import { Button, Table, Form, Tabs, Tab, Badge } from 'react-bootstrap'
import StockService from '@/common/hotel/stock'
import { useAuthContext } from '@/common/context/useAuthContext'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const ReportsPanel = () => {
  const { user } = useAuthContext()
  const hotelId = user?.hotel_id

  const [activeReport, setActiveReport] = useState('daily')
  const [dailyData, setDailyData] = useState<any[]>([])
  const [stockData, setStockData] = useState<{ data: any[]; total_value: number }>({
    data: [],
    total_value: 0,
  })
  const [damageData, setDamageData] = useState<{ data: any[]; total_damage_value: number }>({
    data: [],
    total_damage_value: 0,
  })
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (hotelId) {
      loadDailyReport()
      loadStockReport()
    }
  }, [hotelId])

  useEffect(() => {
    if (activeReport === 'daily') {
      loadDailyReport()
    } else if (activeReport === 'damage') {
      loadDamageReport()
    }
  }, [selectedDate, startDate, endDate, activeReport])

  const loadDailyReport = async () => {
    if (!hotelId) return
    setLoading(true)
    try {
      const res = await StockService.getDailyConsumptionReport({
        date: selectedDate,
        hotelid: hotelId,
      })
      if (res.success) {
        setDailyData(Array.isArray(res.data) ? res.data : [])
      }
    } catch (error) {
      console.error('Failed to load daily report:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStockReport = async () => {
    if (!hotelId) return
    setLoading(true)
    try {
      const res = await StockService.getStockReport({ hotelid: hotelId })
      if (res.success && res.data) {
        setStockData({
          data: Array.isArray(res.data.data) ? res.data.data : [],
          total_value: res.data.total_value || 0,
        })
      }
    } catch (error) {
      console.error('Failed to load stock report:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadDamageReport = async () => {
    if (!hotelId) return
    setLoading(true)
    try {
      const params: any = { hotelid: hotelId }
      if (startDate) params.start_date = startDate
      if (endDate) params.end_date = endDate
      const res = await StockService.getDamageReport(params)
      if (res.success && res.data) {
        setDamageData({
          data: Array.isArray(res.data.data) ? res.data.data : [],
          total_damage_value: res.data.total_damage_value || 0,
        })
      }
    } catch (error) {
      console.error('Failed to load damage report:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportToExcel = (data: any[] | undefined | null, filename: string) => {
    const safeData = Array.isArray(data) ? data : []
    if (!safeData.length) {
      toast.error('No data to export')
      return
    }
    const ws = XLSX.utils.json_to_sheet(safeData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Report')
    XLSX.writeFile(wb, `${filename}.xlsx`)
    toast.success('Export completed')
  }

  const exportToPDF = async (elementId: string, filename: string) => {
    const element = document.getElementById(elementId)
    if (!element) {
      toast.error('No content to export')
      return
    }
    try {
      const canvas = await html2canvas(element, { scale: 2 })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const imgWidth = 280
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight)
      pdf.save(`${filename}.pdf`)
      toast.success('PDF generated')
    } catch (error) {
      console.error('PDF generation failed:', error)
      toast.error('Failed to generate PDF')
    }
  }

  const formatAmount = (amt: unknown) => {
    const num = typeof amt === 'number' ? amt : Number(amt)
    if (!Number.isFinite(num)) return '₹0.00'
    return `₹${num.toFixed(2)}`
  }

  return (
    <Tabs activeKey={activeReport} onSelect={(k) => setActiveReport(k || 'daily')} className="mb-3">
      <Tab eventKey="daily" title="Daily Consumption">
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex gap-2">
              <Form.Control
                type="date"
                size="sm"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ width: '150px' }}
              />
              <Button size="sm" variant="outline-primary" onClick={loadDailyReport}>
                Refresh
              </Button>
            </div>
            <div className="d-flex gap-2">
              <Button
                size="sm"
                variant="success"
                onClick={() => exportToExcel(dailyData, `daily_consumption_${selectedDate}`)}>
                <i className="fi fi-rr-file-excel me-1"></i> Excel
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() =>
                  exportToPDF('daily-report-table', `daily_consumption_${selectedDate}`)
                }>
                <i className="fi fi-rr-file-pdf me-1"></i> PDF
              </Button>
            </div>
          </div>

          <div id="daily-report-table">
            <h6 className="text-center mb-2">Daily Consumption Report - {selectedDate}</h6>
            <div className="table-responsive">
              <Table size="sm" hover>
                <thead className="table-light">
                  <tr>
                    <th>Item Name</th>
                    <th>Category</th>
                    <th>Issued</th>
                    <th>Returned</th>
                    <th>Damaged</th>
                    <th>Net Consumption</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center">
                        Loading...
                      </td>
                    </tr>
                  ) : dailyData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-muted">
                        No consumption data for this date
                      </td>
                    </tr>
                  ) : (
                    dailyData.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.item_name}</td>
                        <td>
                          <Badge bg="secondary">{item.category}</Badge>
                        </td>
                        <td className="text-center">{item.total_issued || 0}</td>
                        <td className="text-center">{item.total_returned || 0}</td>
                        <td className="text-center">{item.total_damaged || 0}</td>
                        <td className="fw-bold text-center">{item.net_consumption || 0}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          </div>
        </div>
      </Tab>

      <Tab eventKey="stock" title="Stock Report">
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <Badge bg="info" className="me-2">
                Total Stock Value: {formatAmount(stockData.total_value)}
              </Badge>
            </div>
            <div className="d-flex gap-2">
              <Button
                size="sm"
                variant="success"
                onClick={() => exportToExcel(stockData.data, 'stock_report')}>
                <i className="fi fi-rr-file-excel me-1"></i> Excel
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => exportToPDF('stock-report-table', 'stock_report')}>
                <i className="fi fi-rr-file-pdf me-1"></i> PDF
              </Button>
            </div>
          </div>

          <div id="stock-report-table">
            <h6 className="text-center mb-2">Current Stock Report</h6>
            <div className="table-responsive">
              <Table size="sm" hover >
                <thead className="table-light">
                  <tr>
                    <th>Item Name</th>
                    <th>Category</th>
                    <th>Current Stock</th>
                    <th>Min Stock</th>
                    <th>Price</th>
                    <th>Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center">
                        Loading...
                      </td>
                    </tr>
                  ) : stockData.data.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-muted">
                        No stock data available
                      </td>
                    </tr>
                  ) : (
                    stockData.data.map((item) => (
                      <tr key={item.item_id}>
                        <td>{item.item_name}</td>
                        <td>
                          <Badge bg="secondary">{item.category}</Badge>
                        </td>
                        <td
                          className={`fw-bold ${item.current_stock <= item.minimum_stock ? 'text-danger' : ''}`}>
                          {item.current_stock} {item.unit}
                        </td>
                        <td>{item.minimum_stock}</td>
                        <td>{formatAmount(item.price)}</td>
                        <td>{formatAmount(item.current_stock * item.price)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          </div>
        </div>
      </Tab>

      <Tab eventKey="damage" title="Damage Report">
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex gap-2">
              <Form.Control
                type="date"
                size="sm"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="From"
                style={{ width: '130px' }}
              />
              <Form.Control
                type="date"
                size="sm"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="To"
                style={{ width: '130px' }}
              />
              <Button size="sm" variant="outline-primary" onClick={loadDamageReport}>
                Apply
              </Button>
            </div>
            <div>
              <Badge bg="danger" className="me-2">
                Total Damage: {formatAmount(damageData.total_damage_value)}
              </Badge>
              <Button
                size="sm"
                variant="success"
                className="me-2"
                onClick={() => exportToExcel(damageData.data, 'damage_report')}>
                <i className="fi fi-rr-file-excel"></i>
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => exportToPDF('damage-report-table', 'damage_report')}>
                <i className="fi fi-rr-file-pdf"></i>
              </Button>
            </div>
          </div>

          <div id="damage-report-table">
            <h6 className="text-center mb-2">Damage Report</h6>
            <div className="table-responsive">
              <Table size="sm" hover>
                <thead className="table-light">
                  <tr>
                    <th>Date</th>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Damage Value</th>
                    <th>Guest</th>
                    <th>Room No</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center">
                        Loading...
                      </td>
                    </tr>
                  ) : damageData.data.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center text-muted">
                        No damage records found
                      </td>
                    </tr>
                  ) : (
                    damageData.data.map((item, idx) => (
                      <tr key={idx}>
                        <td>{new Date(item.transaction_date).toLocaleDateString()}</td>
                        <td>{item.item_name}</td>
                        <td className="text-center">{item.quantity}</td>
                        <td className="text-danger fw-bold">
                          {formatAmount(item.damage_value)}
                        </td>
                        <td>{item.guest_name || '-'}</td>
                        <td>{item.room_no || '-'}</td>
                        <td className="small">{item.reason || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          </div>
        </div>
      </Tab>
    </Tabs>
  )
}

export default ReportsPanel