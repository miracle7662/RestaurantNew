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

    return Object.keys(summary).map((key) => ({
      name: key,
      type: 'bar',
      data: [summary[key]],
    }))
  }

  // fallback sample data (old demo data)
  const getChartData = () => {
    switch (selectedOption.value) {
      case 'monthly':
        return [
          { name: 'Tasks Completed', type: 'bar', data: [10, 25, 11, 28, 12, 32, 10, 25, 11, 28, 12, 32] },
          { name: 'Upcomming Projects', type: 'line', data: [15, 20, 18, 35, 22, 23, 15, 25, 16, 18, 22, 23] },
          { name: 'Project Pending', type: 'bar', data: [20, 11, 26, 10, 30, 14, 20, 11, 26, 10, 30, 14] },
        ]
      default:
        return []
    }
  }

  const apexOptions: ApexCharts.ApexOptions = {
    chart: {
      width: '100%',
      stacked: false,
      foreColor: '#7d8aa2',
      fontFamily: 'Inter, sans-serif',
      toolbar: { show: false },
    },
    stroke: {
      width: [2, 2, 2],
      curve: 'smooth',
      lineCap: 'round',
    },
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 3,
        columnWidth: '35%',
      },
    },
    xaxis: {
      categories:
        settlements.length > 0
          ? ['Payment Types']
          : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        formatter: (val) => `₹${val}`,
      },
    },
    grid: {
      padding: { left: 16, right: 0 },
      strokeDashArray: 3,
      borderColor: 'rgba(170, 180, 195, 0.25)',
    },
    legend: { show: true },
    colors: [themeColor, '#e49e3d', '#E4E8EF', '#34c38f'],
    dataLabels: { enabled: false },
    tooltip: { theme: 'dark' },
  }

  const handleChange = (selectedOption: any) => {
    setSelectedOption(selectedOption)
  }

  return (
    <>
      <Card>
        <Card.Header className="d-sm-flex align-items-center py-3">
          <Card.Title>Settlement Payment Statistics</Card.Title>
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
        <Card.Body>
          <ReactApexChart
            options={apexOptions}
            series={settlements.length > 0 ? getPaymentTypeSummary() : getChartData()}
            height={366}
          />
        </Card.Body>
      </Card>
    </>
  )
}

export default ProjectStatisticChart
