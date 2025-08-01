import { useState } from 'react'
import { Card } from 'react-bootstrap'
import ReactApexChart from 'react-apexcharts'
import Select from 'react-select'
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

  const getChartData = () => {
    switch (selectedOption.value) {
      case 'daily':
        return [
          {
            name: 'Tasks Completed',
            type: 'bar',
            data: [18, 23, 20, 25, 21, 26, 23, 24, 21, 25, 23, 26],
          },
          {
            name: 'Upcomming Projects',
            type: 'line',
            data: [15, 20, 18, 35, 22, 23, 15, 25, 16, 18, 22, 23],
          },
          {
            name: 'Project Pending',
            type: 'bar',
            data: [23, 20, 25, 21, 26, 23, 24, 21, 25, 23, 26, 20],
          },
        ]
      case 'weekly':
        return [
          {
            name: 'Tasks Completed',
            type: 'bar',
            data: [8, 18, 10, 20, 12, 22, 8, 16, 10, 20, 12, 22],
          },
          {
            name: 'Upcomming Projects',
            type: 'line',
            data: [15, 20, 18, 35, 22, 23, 15, 25, 16, 18, 22, 23],
          },
          {
            name: 'Project Pending',
            type: 'bar',
            data: [15, 8, 18, 8, 20, 10, 15, 8, 18, 8, 20, 10],
          },
        ]
      case 'monthly':
        return [
          {
            name: 'Tasks Completed',
            type: 'bar',
            data: [10, 25, 11, 28, 12, 32, 10, 25, 11, 28, 12, 32],
          },
          {
            name: 'Upcomming Projects',
            type: 'line',
            data: [15, 20, 18, 35, 22, 23, 15, 25, 16, 18, 22, 23],
          },
          {
            name: 'Project Pending',
            type: 'bar',
            data: [20, 11, 26, 10, 30, 14, 20, 11, 26, 10, 30, 14],
          },
        ]
      case 'yearly':
        return [
          {
            name: 'Tasks Completed',
            type: 'bar',
            data: [18, 23, 20, 25, 21, 26, 23, 24, 21, 25, 23, 26],
          },
          {
            name: 'Upcomming Projects',
            type: 'line',
            data: [15, 20, 18, 35, 22, 23, 15, 25, 16, 18, 22, 23],
          },
          {
            name: 'Project Pending',
            type: 'bar',
            data: [23, 20, 25, 21, 26, 23, 24, 21, 25, 23, 26, 20],
          },
        ]
      case 'all_times':
        return [
          {
            name: 'Tasks Completed',
            type: 'bar',
            data: [10, 25, 11, 28, 12, 32, 10, 25, 11, 28, 12, 32],
          },
          {
            name: 'Upcomming Projects',
            type: 'line',
            data: [15, 20, 18, 35, 22, 23, 15, 25, 16, 18, 22, 23],
          },
          {
            name: 'Project Pending',
            type: 'bar',
            data: [20, 11, 26, 10, 30, 14, 20, 11, 26, 10, 30, 14],
          },
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
      toolbar: {
        show: false,
      },
    },
    stroke: {
      width: [1, 2, 3],
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
      categories: [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      labels: {
        formatter: function (e: any) {
          return e
        },
      },
    },
    grid: {
      padding: {
        left: 16,
        right: 0,
      },
      strokeDashArray: 3,
      borderColor: 'rgba(170, 180, 195, 0.25)',
    },
    legend: {
      show: false,
    },
    colors: [themeColor, '#e49e3d', '#E4E8EF'],
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      theme: 'dark',
    },
  }

  const handleChange = (selectedOption: any) => {
    setSelectedOption(selectedOption)
  }

  return (
    <>
      <Card>
        <Card.Header className="d-sm-flex align-items-center py-3">
          <Card.Title>Project Statistic</Card.Title>
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
          <ReactApexChart options={apexOptions} series={[...getChartData()]} height={366} />
        </Card.Body>
      </Card>
    </>
  )
}

export default ProjectStatisticChart
