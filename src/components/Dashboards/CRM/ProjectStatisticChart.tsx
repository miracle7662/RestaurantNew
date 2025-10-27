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

  const [settlements, setSettlements] = useState<any[]>([])

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

  const chartData = getPaymentTypeSummary()

  const apexOptions: ApexCharts.ApexOptions = {
    chart: {
      type: 'bar',
      height: 400,
      foreColor: '#7d8aa2',
      fontFamily: 'Inter, sans-serif',
      toolbar: { show: false },
      animations: { enabled: true },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 6,
        barHeight: '45%', // ✅ Thinner bars
        distributed: true,
      },
    },
    colors: [themeColor, '#34c38f', '#e49e3d', '#5b73e8', '#f1b44c'],
    dataLabels: {
      enabled: true,
      formatter: (val) => `₹${Number(val).toLocaleString('en-IN')}`,
      offsetX: 18,
      style: {
        fontSize: '12px',
        fontWeight: 600,
      },
      background: {
        enabled: false,
      },
    },
    xaxis: {
      
     
     
       // ✅ Remove X-axis data
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
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: false } },
    },
    legend: { show: false },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: (val) => `₹${Number(val).toLocaleString('en-IN')}`,
      },
    },
  }

  const handleChange = (selectedOption: any) => {
    setSelectedOption(selectedOption)
  }

  return (
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
  )
}

export default ProjectStatisticChart
