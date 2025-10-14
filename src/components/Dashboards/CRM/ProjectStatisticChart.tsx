import { useState, useEffect } from 'react'
import { Card } from 'react-bootstrap'
import ReactApexChart from 'react-apexcharts'
import Select from 'react-select'
import axios from 'axios'
import { useThemeContext } from '@/common/context'
import colors from '@/constants/colors'

const ProjectStatisticChart = () => {
  const { settings } = useThemeContext()
  const selectedColor = settings.color as keyof typeof colors
  const themeColor = colors[selectedColor] || selectedColor

  // dropdown option
  const [selectedOption, setSelectedOption] = useState<{ label: string; value: string }>({
    label: 'Monthly',
    value: 'monthly',
  })
  const options = [
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Yearly', value: 'yearly' },
    { label: 'All Times', value: 'all_times' },
  ]

  // Settlement data
  const [settlements, setSettlements] = useState<any[]>([])

  // fetch settlements
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('http://localhost:3001/api/settlements')
        const data = res.data?.data?.settlements || res.data?.settlements || []
        setSettlements(data)
      } catch (error) {
        console.error('Error fetching settlement data:', error)
        setSettlements([])
      }
    }
    fetchData()
  }, [])

  // group settlement amount by payment type
  const getPaymentTypeSummary = () => {
    const summary: Record<string, number> = {}
    settlements.forEach((s) => {
      const type = s.PaymentType || 'Unknown'
      const amount = Number(s.Amount) || 0
      summary[type] = (summary[type] || 0) + amount
    })

    return {
      categories: Object.keys(summary),
      data: Object.values(summary),
    }
  }

  // fallback sample data (old demo data)
  const getChartData = () => {
    return {
      categories: ['Cash', 'UPI', 'Card', 'Net Banking', 'Wallet'],
      data: [45000, 32000, 28000, 15000, 12000],
    }
  }

  const chartData = settlements.length > 0 ? getPaymentTypeSummary() : getChartData()

  const apexOptions: ApexCharts.ApexOptions = {
    chart: {
      type: 'bar',
      height: 400,
      foreColor: '#7d8aa2',
      fontFamily: 'Inter, sans-serif',
      toolbar: { show: false },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
      },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 8,
        barHeight: '70%',
        distributed: true,
        dataLabels: {
          position: 'top',
        },
      },
    },
    colors: [themeColor, '#34c38f', '#e49e3d', '#5b73e8', '#f1b44c'],
    dataLabels: {
      enabled: true,
      formatter: (val) => `₹${Number(val).toLocaleString('en-IN')}`,
      offsetX: 30,
      style: {
        fontSize: '13px',
        fontWeight: 600,
        colors: ['#304758'],
      },
      background: {
        enabled: true,
        foreColor: '#fff',
        padding: 8,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        opacity: 0.95,
      },
    },
    xaxis: {
      categories: chartData.categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        formatter: (val) => `₹${Number(val).toLocaleString('en-IN')}`,
        style: {
          fontSize: '12px',
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: '13px',
          fontWeight: 500,
        },
      },
    },
    grid: {
      padding: { left: 20, right: 40 },
      strokeDashArray: 4,
      borderColor: 'rgba(170, 180, 195, 0.2)',
      xaxis: {
        lines: { show: true },
      },
      yaxis: {
        lines: { show: false },
      },
    },
    legend: { show: false },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: (val) => `₹${Number(val).toLocaleString('en-IN')}`,
      },
      style: {
        fontSize: '13px',
      },
    },
  }

  const handleChange = (selectedOption: any) => {
    setSelectedOption(selectedOption)
  }

  return (
    <>
      <Card className="shadow-sm">
        <Card.Header className="d-sm-flex align-items-center py-3 bg-light border-bottom">
          <Card.Title className="mb-0 fw-semibold">Settlement Payment Statistics</Card.Title>
          <div className="ms-auto mt-3 mt-sm-0" style={{ width: '160px' }}>
            <Select
              value={selectedOption}
              onChange={handleChange}
              options={options}
              isClearable={false}
              classNamePrefix="select"
            />
          </div>
        </Card.Header>
        <Card.Body className="p-4">
          <ReactApexChart
            options={apexOptions}
            series={[{ name: 'Amount', data: chartData.data }]}
            type="bar"
            height={400}
          />
        </Card.Body>
      </Card>
    </>
  )
}

export default ProjectStatisticChart