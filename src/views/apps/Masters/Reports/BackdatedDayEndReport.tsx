import React, { useState, useEffect } from 'react';
import { Button, Card, Form, Row, Col, Modal, InputGroup, Alert } from 'react-bootstrap';
import { Calendar, Printer, FileText, CreditCard, DollarSign, Tag, RefreshCw, BarChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuthContext } from '@/common/context/useAuthContext';
import DayendService, { DayendReportPayload } from '@/common/api/dayend';

const BackdatedDayEndReport: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReports, setSelectedReports] = useState({
    billDetails: true,
    creditSummary: true,
    paymentSummary: true,
    discountSummary: true,
    reverseKOTSummary: true,
    reverseBillSummary: true,
    ncKOTSummary: true,
  });

  // Default to today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  }, []);

  const handleGenerateClick = () => {
    if (!selectedDate) {
      toast.error('Please select a date');
      return;
    }
    setShowReportModal(true);
  };

  const handleGenerateReports = async () => {
    const selectedReportKeys = Object.keys(selectedReports).filter(
      key => selectedReports[key as keyof typeof selectedReports]
    );

    if (selectedReportKeys.length === 0) {
      toast.error("Please select at least one report to generate.");
      return;
    }

    if (!user) {
      toast.error("User information is not available. Please log in again.");
      return;
    }

    setLoading(true);
    try {
      const payload: DayendReportPayload = {
        DayEndEmpID: user.id,
        businessDate: selectedDate,
        selectedReports: selectedReportKeys,
      };

      console.log('🔍 Report payload:', payload);
      const response = await DayendService.generateReportHTML(payload);
      console.log('📄 API Response:', response);

      if (response.success && response.html && response.html.trim().length > 50) {
        // Store HTML for preview
        sessionStorage.setItem('dayEndReportHTML', response.html);
        const outletId = user?.outletid || user?.hotelid;
        sessionStorage.setItem('dayEndReportOutletId', outletId?.toString() || '');
        
        console.log('✅ Stored HTML length:', response.html.length, 'OutletId:', outletId);
        toast.success('✅ Report generated! Opening preview...');
        setShowReportModal(false);
        navigate('/apps/Masters/Reports/DayEndReportPreview');
      } else {
        console.error('❌ Empty report HTML. Backend debug needed.');
        toast.error(`Failed to generate reports. No data found for ${selectedDate}`);
      }
    } catch (error) {
      console.error('Error generating reports:', error);
      toast.error("An error occurred while generating reports.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content">
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
              <h4 className="mb-sm-0">Backdated Day End Report</h4>
            </div>
          </div>
        </div>

        <Row>
          <Col lg={12}>
            <Card>
              <Card.Header>
                <h5 className="card-title mb-0">Select Date & Generate Report</h5>
              </Card.Header>
              <Card.Body>
                <Row className="g-3">
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>
                        <Calendar className="me-1 mb-1" size={16} />
                        Select Date
                      </Form.Label>
                      <Form.Control
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={8} className="d-flex align-items-end">
                    <Button 
                      variant="primary" 
                      onClick={handleGenerateClick}
                      disabled={!selectedDate}
                    >
                      <Printer className="me-1 mb-1" size={16} />
                      Generate Day End Report
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {selectedDate && (
          <Alert variant="info" className="mt-3">
            Click the button above to generate the day end report for {selectedDate}.
          </Alert>
        )}
      </div>

      {/* Report Selection Modal - Similar to DayEnd component */}
      <Modal show={showReportModal} onHide={() => setShowReportModal(false)} centered size="sm">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-primary">Select Reports</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-3">
          <div className="mb-3">
            <InputGroup>
              <InputGroup.Text>
                <Calendar size={16} />
              </InputGroup.Text>
              <Form.Control
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </InputGroup>
          </div>
          <div>
            <div className="fw-semibold mb-2">Choose Reports</div>
            <Form.Check
              type="checkbox"
              className="report-checkbox mb-2"
              label={
                <>
                  <FileText size={16} className="report-icon me-2" />
                  Bill Details
                </>
              }
              checked={selectedReports.billDetails}
              onChange={(e) => setSelectedReports(prev => ({ ...prev, billDetails: e.target.checked }))}
            />
            <Form.Check
              type="checkbox"
              className="report-checkbox mb-2"
              label={
                <>
                  <CreditCard size={16} className="report-icon me-2" />
                  Credit Summary
                </>
              }
              checked={selectedReports.creditSummary}
              onChange={(e) => setSelectedReports(prev => ({ ...prev, creditSummary: e.target.checked }))}
            />
            <Form.Check
              type="checkbox"
              className="report-checkbox mb-2"
              label={
                <>
                  <DollarSign size={16} className="report-icon me-2" />
                  Payment Summary
                </>
              }
              checked={selectedReports.paymentSummary}
              onChange={(e) => setSelectedReports(prev => ({ ...prev, paymentSummary: e.target.checked }))}
            />
            <Form.Check
              type="checkbox"
              className="report-checkbox mb-2"
              label={
                <>
                  <Tag size={16} className="report-icon me-2" />
                  Discount Summary
                </>
              }
              checked={selectedReports.discountSummary}
              onChange={(e) => setSelectedReports(prev => ({ ...prev, discountSummary: e.target.checked }))}
            />
            <Form.Check
              type="checkbox"
              className="report-checkbox mb-2"
              label={
                <>
                  <RefreshCw size={16} className="report-icon me-2" />
                  Reverse KOTs Summary
                </>
              }
              checked={selectedReports.reverseKOTSummary}
              onChange={(e) => setSelectedReports(prev => ({ ...prev, reverseKOTSummary: e.target.checked }))}
            />
            <Form.Check
              type="checkbox"
              className="report-checkbox mb-2"
              label={
                <>
                  <RefreshCw size={16} className="report-icon me-2" />
                  Reverse Bill Summary
                </>
              }
              checked={selectedReports.reverseBillSummary}
              onChange={(e) => setSelectedReports(prev => ({ ...prev, reverseBillSummary: e.target.checked }))}
            />
            <Form.Check
              type="checkbox"
              className="report-checkbox mb-2"
              label={
                <>
                  <BarChart size={16} className="report-icon me-2" />
                  NC KOT Sales Summary
                </>
              }
              checked={selectedReports.ncKOTSummary}
              onChange={(e) => setSelectedReports(prev => ({ ...prev, ncKOTSummary: e.target.checked }))}
            />
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="secondary" onClick={() => setShowReportModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleGenerateReports}
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate Reports'}
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .report-checkbox {
          margin-bottom: 0.5rem;
        }
        .report-icon {
          margin-right: 0.5rem;
          color: #6c757d;
        }
      `}</style>
    </div>
  );
};

export default BackdatedDayEndReport;