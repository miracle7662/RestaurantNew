import { Button, Card, Col, ProgressBar, Row, Stack } from 'react-bootstrap'

const cardData = [
  {
    icon: 'album-circle-plus',
    title: 'Awaiting payment',
    count: '37/50',
    amount: '$5,569',
    percentage: 56,
    color: 'warning',
  },
  {
    icon: 'briefcase',
    title: 'Converted leads',
    count: '23/40',
    amount: '$2,326',
    percentage: 67,
    color: 'danger',
  },
  {
    icon: 'animated-icon',
    title: 'Projects progress',
    count: '16/20',
    amount: '$3,478',
    percentage: 78,
    color: 'success',
  },
]

const CrmMiniCard = () => {
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
