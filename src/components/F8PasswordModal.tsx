import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

interface F8PasswordModalProps {
  show: boolean;
  onHide: () => void;
  onSubmit: (password: string) => void;
  error?: string;
  loading?: boolean;
}

const F8PasswordModal: React.FC<F8PasswordModalProps> = ({
  show,
  onHide,
  onSubmit,
  error,
  loading = false
}) => {
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      onSubmit(password);
    }
  };

  const handleHide = () => {
    setPassword('');
    onHide();
  };

  return (
    <Modal show={show} onHide={handleHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>F8 Action - Password Required</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <p className="mb-3">
            This table has been billed. Please enter your password to proceed with F8 (Reverse Quantity) action.
          </p>
          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoFocus
              disabled={loading}
            />
          </Form.Group>
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleHide} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={loading || !password.trim()}
          >
            {loading ? 'Verifying...' : 'Submit'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default F8PasswordModal;
