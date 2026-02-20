import { useState, useEffect } from 'react'
import { Modal, Button, Form } from 'react-bootstrap'
import DayendService from '../common/api/dayend'

interface OpeningBalanceModalProps {
  show: boolean
  onSubmit: (data: { opening_balance: number }) => void
  onClose: () => void
  outlet_id?: number
  hotel_id: number
}

export default function OpeningBalanceModal({
  show,
  onSubmit,
  outlet_id,
  hotel_id,
}: OpeningBalanceModalProps) {
  const [openingBalance, setOpeningBalance] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [fetchingBalance, setFetchingBalance] = useState(false)

  // Fetch closing balance when modal opens
  useEffect(() => {
    if (show && hotel_id) {
      fetchClosingBalance()
    }
  }, [show, hotel_id])

  const fetchClosingBalance = async () => {
    setFetchingBalance(true)
    try {
      const response = await DayendService.getClosingBalance({
        outlet_id,
        hotel_id
      })
      
      // Handle the response - API returns { success: true, data: { closing_balance, ... } }
      // response.data is ClosingBalanceData
      if (response.data) {
        const closingBalance = response.data.closing_balance || 0
        setOpeningBalance(closingBalance)
      }
    } catch (error) {
      console.error('Error fetching closing balance:', error)
    } finally {
      setFetchingBalance(false)
    }
  }

  const handleSubmit = async () => {
    if (openingBalance < 0) {
      alert('Please enter valid opening balance')
      return
    }

    setLoading(true)

    try {
      await onSubmit({ opening_balance: openingBalance })
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      show={show}
      backdrop="static"
      keyboard={false}
      centered
    >
      <Modal.Header>
        <Modal.Title>Enter Opening Balance</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form.Group>
          <Form.Label>Opening Cash Amount (Previous Day Closing: {fetchingBalance ? 'Loading...' : openingBalance})</Form.Label>
          <Form.Control
            type="number"
            placeholder="Enter amount"
            value={openingBalance}
            onChange={(e) => setOpeningBalance(Number(e.target.value))}
            disabled={fetchingBalance}
          />
        </Form.Group>
      </Modal.Body>

      <Modal.Footer>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={loading || fetchingBalance}
        >
          {loading ? 'Saving...' : 'Submit'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
