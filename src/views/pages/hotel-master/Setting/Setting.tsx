import React, { useEffect, useState } from "react";
import {
  Card,
  CardBody,
  Row,
  Col,
  Form,
  Button,
} from "react-bootstrap";
import GracePeriodService from "@/common/hotel/graceperiod";
import { useAuthContext } from "@/common/context";

const GracePeriodSettings = () => {
  const { user } = useAuthContext();

  const [loading, setLoading] = useState(false);

  const [settings, setSettings] = useState({
    graceBefore: 30,
    graceAfter: 30,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
     const response: any = await GracePeriodService.getSettings(user.hotelid);

if (response.success) {
  setSettings({
    graceBefore: response.data.grace_before,
    graceAfter: response.data.grace_after,
  });
}
    } catch (error) {
      console.error("Failed to load grace period settings:", error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setSettings((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      await GracePeriodService.saveSettings({
        hotelid: user.hotelid,
        userid: user.id,
        grace_before: settings.graceBefore,
        grace_after: settings.graceAfter,
      });

      alert("Grace Period Settings Saved Successfully.");
    } catch (error) {
      console.error("Failed to save grace period settings:", error);
      alert("Failed to save settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardBody>
        <h4 className="mb-4">
          Room Extension Grace Period Settings
        </h4>

        <Form>
          {/* Grace Period Before */}
          <Row className="mb-4">
            <Col md={6}>
              <Form.Label className="fw-semibold">
                Grace Period Before
              </Form.Label>

              <Form.Select
                name="graceBefore"
                value={settings.graceBefore}
                onChange={handleChange}
              >
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>1 Hour</option>
                <option value={120}>2 Hours</option>
                <option value={180}>3 Hours</option>
                <option value={240}>4 Hours</option>
              </Form.Select>

              <Form.Text className="text-muted">
                Allowed time before the scheduled extension starts.
              </Form.Text>
            </Col>
          </Row>

          {/* Grace Period After */}
          <Row className="mb-4">
            <Col md={6}>
              <Form.Label className="fw-semibold">
                Grace Period After
              </Form.Label>

              <Form.Select
                name="graceAfter"
                value={settings.graceAfter}
                onChange={handleChange}
              >
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>1 Hour</option>
                <option value={120}>2 Hours</option>
                <option value={180}>3 Hours</option>
                <option value={240}>4 Hours</option>
              </Form.Select>

              <Form.Text className="text-muted">
                Allowed time after the scheduled extension ends.
              </Form.Text>
            </Col>
          </Row>

          <Button
            variant="primary"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Settings"}
          </Button>
        </Form>
      </CardBody>
    </Card>
  );
};

export default GracePeriodSettings;