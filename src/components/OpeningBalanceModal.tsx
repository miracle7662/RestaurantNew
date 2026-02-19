import { useState } from 'react'
import { Modal, Button, Form } from 'react-bootstrap'

interface OpeningBalanceModalProps {
  show: boolean
  onSubmit: (data: { opening_balance: number }) => void
  onClose: () => void
}

export default function OpeningBalanceModal({
  show,
  onSubmit,
}: OpeningBalanceModalProps) {
  const [openingBalance, setOpeningBalance] = useState<number>(0)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!openingBalance || openingBalance < 0) {
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
          <Form.Label>Opening Cash Amount</Form.Label>
          <Form.Control
            type="number"
            placeholder="Enter amount"
            value={openingBalance}
            onChange={(e) => setOpeningBalance(Number(e.target.value))}
          />
        </Form.Group>
      </Modal.Body>

      <Modal.Footer>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Submit'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
