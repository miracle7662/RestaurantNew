import { useEffect, useState } from 'react'
import { Button, Card, Col, ProgressBar, Row, Spinner, Stack } from 'react-bootstrap'
import axios from 'axios'

interface SummaryData {
  totalOrders: number
  totalKOTs: number
  totalSales: number
  completed: number
}

const CrmMiniCard = () => {
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSummaryData = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/handover/data')
        if (response.data.success) {
          setSummary(response.data.data.summary)
        }
      } catch (error) {
        console.error('Error fetching summary data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSummaryData()
  }, [])

  if (loading) {
    return (
      <Row xl={3}>
        {[...Array(3)].map((_, index) => (
          <Col key={index}>
            <Card>
              <Card.Body className="d-flex justify-content-center align-items-center" style={{ height: '188px' }}>
                <Spinner animation="border" variant="primary" />
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    )
  }

  const cardData = summary
    ? [
        {
          icon: 'file-invoice-dollar',
          title: 'Total Bills',
          count: `${summary.completed}/${summary.totalOrders}`,
          amount: `₹${summary.totalSales.toLocaleString()}`,
          percentage: summary.totalOrders > 0 ? Math.round((summary.completed / summary.totalOrders) * 100) : 0,
          color: 'success',
        },
        {
          icon: 'receipt',
          title: 'Total KOTs',
          count: `${summary.totalKOTs}`,
          amount: `Avg Items: ${summary.totalOrders > 0 ? (summary.totalKOTs / summary.totalOrders).toFixed(1) : 0}`,
          percentage: 100,
          color: 'info',
        },
        {
          icon: 'sack-dollar',
          title: 'Total Sales',
          count: `₹${summary.totalSales.toLocaleString()}`,
          amount: `Avg Sale: ₹${summary.totalOrders > 0 ? (summary.totalSales / summary.totalOrders).toFixed(0) : 0}`,
          percentage: 100,
          color: 'primary',
        },
      ]
    : []

  return (
    <Row xl={3}>
      {cardData.map(({ icon, count, title, amount, percentage, color }, index) => (
        <Col key={index}>
          <Card>
            <Card.Body>
              <Stack direction="horizontal" gap={4} className="mb-12 align-items-start">
                <Stack direction="horizontal" gap={4}>
                  <div
                    className={`d-flex align-items-center justify-content-center rounded bg-${color}-subtle text-${color}`}
                    style={{ width: '3.5rem', height: '3.5rem' }}>
                    <i className={`fs-4 fi fi-rr-${icon}`}></i>
                  </div>
                  <div>
                    <div className="fs-24 fw-bold text-dark">{count}</div>
                    <div>{title}</div>
                  </div>
                </Stack>
                <Button variant="light" className="btn-icon btn-md ms-auto">
                  <i className="fi fi-br-menu-dots-vertical"></i>
                </Button>
              </Stack>
              <div>
                <Stack direction="horizontal" gap={2} className="mb-2">
                  <div>{title}</div>
                  <div className="fs-13 ms-auto">
                    {amount} <span className=" text-muted">({percentage}%)</span>
                  </div>
                </Stack>
                <ProgressBar variant={color} now={percentage} style={{ height: '0.25rem' }} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  )
}

export default CrmMiniCard
