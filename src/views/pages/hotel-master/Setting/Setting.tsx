import React, { useState } from "react";
import {
  Card,
  CardBody,
  Row,
  Col,
  Form,
  Button,
} from "react-bootstrap";

const GracePeriodSettings = () => {
  const [settings, setSettings] = useState({
    graceBefore: 30,   // in minutes
    graceAfter: 30,    // in minutes
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = () => {
    console.log(settings);
    // API Call
  };

  return (
    <Card>
      <CardBody>
        <h4 className="mb-4">
          Room Extension Grace Period Settings
        </h4>

        <Form>
          {/* Before Grace Period */}
          <Row className="mb-3">
            <Col md={6}>
              <label className="form-label fw-semibold">
                Grace Period Before 
              </label>
              <select
                className="form-select"
                name="graceBefore"
                value={settings.graceBefore}
                onChange={handleChange}
              >
               
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour</option>
                <option value={120}>2 hours</option>
                <option value={180}>3 hours</option>
                <option value={240}>4 hours</option>
              </select>
              <small className="text-muted">
                Allowed time before the scheduled extension starts.
              </small>
            </Col>
          </Row>

          {/* After Grace Period */}
          <Row className="mb-3">
            <Col md={6}>
              <label className="form-label fw-semibold">
                Grace Period After 
              </label>
              <select
                className="form-select"
                name="graceAfter"
                value={settings.graceAfter}
                onChange={handleChange}
              >
                
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour</option>
                <option value={120}>2 hours</option>
                <option value={180}>3 hours</option>
                <option value={240}>4 hours</option>
              </select>
              <small className="text-muted">
                Allowed time after the scheduled extension ends.
              </small>
            </Col>
          </Row>

          <Button variant="primary" onClick={handleSave}>
            Save Settings
          </Button>
        </Form>
      </CardBody>
    </Card>
  );
};

export default GracePeriodSettings;