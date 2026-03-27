import React, { useState, useEffect } from 'react';
import { Button, Form, Card, Spinner, Container, Row, Col } from 'react-bootstrap';
import { toast } from 'react-hot-toast';
import BillPreviewPrint from './BillPrint';
import { OutletSettings } from 'src/utils/applyOutletSettings';
import BillPrintService from '@/common/api/billPrint';
import useUser from '@/hooks/useUser';

interface DuplicateBillData {
  items: any[];
  orderNo: string;
  selectedTable?: string;
  selectedWaiter?: string;
  customerName?: string;
  mobileNumber?: string;
  currentTxnId?: string;
  taxCalc: {
    subtotal: number;
    cgstAmt: number;
    sgstAmt: number;
    igstAmt: number;
    grandTotal: number;
  };
  taxRates: {
    cgst: number;
    sgst: number;
    igst: number;
  };
  discount?: number;
  reason?: string;
  roundOffEnabled?: boolean;
  roundOffValue?: number;
  selectedPaymentModes?: string[];
  restaurantName?: string;
  outletName?: string;
  billDate?: string;
}

const DuplicateBillPrint: React.FC = () => {
  const [loggedInUser] = useUser();
  const user = loggedInUser;
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({} as OutletSettings);
  const [billData, setBillData] = useState({} as DuplicateBillData);
  const [searchParams, setSearchParams] = useState({
    billNo: '',
    billDate: '',
    outletId: Number(user?.outletid) || 1
  });

  const loadSettings = async (outletId: number) => {
    try {
      const [previewRes, printRes] = await Promise.all([
        BillPrintService.getBillPreviewSettings(outletId),
        BillPrintService.getBillPrintSettings(outletId)
      ]);
      const previewSettings = previewRes?.data || previewRes;
      const printSettings = printRes?.data || printRes;
      setFormData({ ...formData, ...previewSettings, ...printSettings });
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  useEffect(() => {
    if (user?.outletid) {
      loadSettings(Number(user.outletid));
    }
  }, [user]);

const handleSearch = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!searchParams.billNo.trim()) {
    toast.error('Please enter Bill No');
    return;
  }

  setSearchLoading(true);
  try {
    // Call GET version of duplicate bill
    const res = await BillPrintService.getDuplicateBill({
      billNo: searchParams.billNo,
      billDate: searchParams.billDate || undefined,
      outletId: searchParams.outletId
    });

    if (!res?.data?.success && !res?.success) {
      toast.error('Bill not found. Check Bill No/Date/Outlet.');
      return;
    }

    // Extract the actual bill data
    const data = res.data?.data || res.data || res;

    setBillData({
      ...data,
      // fallback to current date if billDate not present
      billDate: searchParams.billDate || new Date().toLocaleDateString('en-GB')
    });

    setShowPreview(true);
    toast.success('Bill loaded successfully');
  } catch (err: any) {
    console.error('Search error:', err);
    toast.error(
      err?.response?.data?.message ||
      err.message ||
      'Failed to fetch bill data'
    );
  } finally {
    setSearchLoading(false);
  }
};

  const handlePreviewClose = () => {
    setShowPreview(false);
    setBillData({} as DuplicateBillData);
  };

  return (
    <Container className="py-4">
      <Row>
        <Col md={8} className="mx-auto">
          <Card>
            <Card.Header className="bg-primary text-white">
              <h4>Duplicate / Backdated Bill Print</h4>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSearch}>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Bill No / Order No</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="e.g., ORD001"
                        value={searchParams.billNo}
                        onChange={(e) => setSearchParams({ ...searchParams, billNo: e.target.value })}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Bill Date (for backdated)</Form.Label>
                      <Form.Control
                        type="date"
                        value={searchParams.billDate}
                        onChange={(e) => setSearchParams({ ...searchParams, billDate: e.target.value })}
                      />
                      <Form.Text>Leave blank for current date bills</Form.Text>
                    </Form.Group>
                  </Col>
                  
                </Row>
                <div className="text-center">
                  <Button
                    variant="primary"
                    type="submit"
                    
                  >
                    {searchLoading ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Searching...
                      </>
                    ) : (
                      'Load Bill for Printing'
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {showPreview && (
        <BillPreviewPrint
          show={showPreview}
          onHide={handlePreviewClose}
          formData={formData}
          user={user}
          items={billData.items || []}
          orderNo={billData.orderNo || ''}
          selectedTable={billData.selectedTable}
          selectedWaiter={billData.selectedWaiter}
          customerName={billData.customerName}
          mobileNumber={billData.mobileNumber}
          currentTxnId={billData.currentTxnId}
          taxCalc={billData.taxCalc}
          taxRates={billData.taxRates}
          discount={billData.discount}
          reason={billData.reason}
          roundOffEnabled={billData.roundOffEnabled}
          roundOffValue={billData.roundOffValue}
          selectedPaymentModes={billData.selectedPaymentModes}
          restaurantName={billData.restaurantName || user?.hotel_name}
          outletName={billData.outletName || user?.outlet_name}
          selectedOutletId={searchParams.outletId}
        activeTab="Quick Bill"
        />
      )}
    </Container>
  );
};
    

export default DuplicateBillPrint;

