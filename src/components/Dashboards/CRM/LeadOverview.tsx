import ReactApexChart from 'react-apexcharts'
import { Card, Dropdown, DropdownDivider } from 'react-bootstrap'

const LeadOverview = () => {
  const dataLeadOverview = [
    { label: 'Contacted', value: 37.74, change: '+2.6', color: '#3E97FF' },
    { label: 'Customer', value: 34.23, change: '-3.2', color: '#e49e3d' },
    { label: 'Proposal', value: 22.65, change: '-2.2', color: '#25b865' },
    { label: 'Working', value: 24.47, change: '+2.8', color: '#6f42c1' },
    { label: 'Progress', value: 22.65, change: '-2.2', color: '#495057' },
    { label: 'Projects', value: 24.47, change: '+2.8', color: '#d13b4c' },
  ]

  const donutChartOptions = {
    chart: {
      type: 'donut',
    },
    dataLabels: {
      enabled: false,
    },
    series: dataLeadOverview.map((item) => item.value),
    labels: dataLeadOverview.map((item) => item.label),
    colors: dataLeadOverview.map((item) => item.color),
    stroke: {
      width: 0,
      lineCap: 'round',
    },
    legend: {
      show: false,
    },
    plotOptions: {
      pie: {
        donut: {
          size: '85%',
          labels: {
            show: false,
            name: {
              show: false,
              fontSize: '16px',
              colors: '#A0ACBB',
              fontFamily: 'Inter',
            },
            value: {
              show: false,
              fontSize: '30px',
              fontFamily: 'Inter',
              color: '#A0ACBB',
              formatter: function (e: any) {
                return e
              },
            },
          },
          spacing: 5,
        },
      },
    },
    responsive: [
      {
        breakpoint: 380,
        options: {
          chart: {
            width: 280,
          },
          legend: {
            show: false,
          },
        },
      },
    ],
    tooltip: {
      theme: 'dark',
      y: {
        formatter: function (e: any) {
          return +e + '%'
        },
      },
      style: {
        colors: '#A0ACBB',
        fontFamily: 'Inter',
      },
    },
    grid: {
      padding: {
        left: 0,
        right: 0,
        bottom: 0,
      },
    },
  }

  return (
    <Card>
      <Card.Header className="py-3 pe-3 d-flex justify-content-between align-items-center">
        <Card.Title>Leads Overview</Card.Title>
        <Dropdown className="ms-auto" drop="down">
          <Dropdown.Toggle variant="light" className="p-0 btn-icon btn-md arrow-none">
            <i className="fi fi-bs-menu-dots-vertical"></i>
          </Dropdown.Toggle>
          <Dropdown.Menu align="end" style={{ marginTop: '0.875rem' }}>
            <Dropdown.Item>
              <i className="fi fi-rr-share"></i>
              <span className="ms-3">Share</span>
            </Dropdown.Item>
            <Dropdown.Item>
              <i className="fi fi-rr-refresh"></i>
              <span className="ms-3">Refresh</span>
            </Dropdown.Item>
            <DropdownDivider />
            <Dropdown.Item>
              <i className="fi fi-rr-stats"></i>
              <span className="ms-3">All Channels</span>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </Card.Header>
      <Card.Body className="mx-auto pt-2">
        <ReactApexChart
          options={donutChartOptions as ApexCharts.ApexOptions}
          series={donutChartOptions.series}
          type="donut"
          height={260}
        />
        <div className="hstack gap-2 flex-wrap">
          {dataLeadOverview.map((item, index) => (
            <span
              key={index}
              className="p-2 hstack gap-2 flex-fill rounded border border-dashed border-gray-5"
            >
              <span
                className="rounded-circle d-inline-block"
                style={{ backgroundColor: item.color, width: '0.5rem', height: '0.5rem' }}
              ></span>
              <span>
                {item.label}
                <span className="fs-12 text-muted ms-1">({item.value}%)</span>
              </span>
            </span>
          ))}
        </div>
      </Card.Body>
    </Card>
  )
}

export default LeadOverview
