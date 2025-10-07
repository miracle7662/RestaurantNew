import PageDashBreadcrumb from '@/components/Common/PageDashBreadcrumb'
import { Col, Row } from 'react-bootstrap'
import {
  CrmMiniCard,
  LatestLeads,
  LeadOverview,
  ProjectCustomerCard,
  ProjectStatisticChart,
} from '@/components/Dashboards/CRM'

const CRM = () => {
  return (
    <>
      <PageDashBreadcrumb title="Miracle Hotels Dashboard" subName="Dashboards" />
      <Row className="g-3 g-md-4">
        <Col xl={12}>
          <CrmMiniCard />
        </Col>
        <Col xl={8}>
          <ProjectStatisticChart />
        </Col>
        <Col xl={4}>
          <LeadOverview />
        </Col>
        <Col xl={8}>
          <LatestLeads />
        </Col>
        <Col xl={4}>
          <ProjectCustomerCard />
        </Col>
      </Row>
    </>
  )
}

export default CRM
