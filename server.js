const express = require('express')
const cors = require('cors')

// Initialize DB (creates file/tables if needed)
require('./backend/config/db')

const billsRoutes = require('./backend/routes/billsRoutes')

const app = express()
const port = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Health
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' })
})

// Bills APIs
app.use('/api/bills', billsRoutes)

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})


