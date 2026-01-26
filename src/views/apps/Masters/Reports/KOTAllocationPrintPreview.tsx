import React from 'react';
import { Card, Table, Button } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/common';
import brandService, { BrandData } from '@/common/api/brand';


interface AllocationData {
  kitchen: string;
  allocation: string;
  sales: number;
}

interface BillData {
  billNo: string;
  billDate: string;
  totalAmount: number;
  discount: number;
  amount: number;
  paymentMode: string;
  customerName: string;
}

const KOTAllocationPrintPreview: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [hotelDetails, setHotelDetails] = React.useState<BrandData | null>(null);

  // Get data from navigation state
  const dataType = location.state?.dataType || 'allocation';
  const allocationData: AllocationData[] = location.state?.allocationData || [];
  const billData: BillData[] = location.state?.billData || [];
  const dateRange = location.state?.dateRange || { start: '', end: '' };
  const filters = location.state?.filters || {};

  React.useEffect(() => {
    const fetchHotelDetails = async () => {
      if (user?.hotelid) {
        try {
          const response = await brandService.getBrandById(String(user.hotelid));
          setHotelDetails(response.data);
        } catch (error) {
          console.error("Failed to fetch hotel details", error);
        }
      }
    };
    fetchHotelDetails();
  }, [user]);

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    navigate(-1);
  };

  const formatDate = (date: string) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-IN');
  };

  return (
    <div className="print-preview-container" style={{ padding: '20px' }}>
      <style>
        {`
          @media print {
            .no-print { display: none !important; }
            .print-preview-container { padding: 0 !important; }
            body { font-size: 12px; }
            .table { font-size: 11px; }
            .table th, .table td { padding: 4px 8px; }
          }
          @media screen {
            .print-only { display: none; }
          }
        `}
      </style>

      {/* Header Actions - Hidden in Print */}
      <div className="d-flex justify-content-between mb-3 no-print">
        <Button variant="secondary" onClick={handleBack}>
          ← Back to Report
        </Button>
        <Button variant="primary" onClick={handlePrint}>
          🖨️ Print
        </Button>
      </div>

      {/* Print Preview Content */}
      <Card className="border-0 shadow-none">
        <Card.Body className="p-4">
          {/* Hotel Header */}
          <div className="text-center mb-4">
            <h3 className="mb-1">{hotelDetails?.hotel_name || 'Hotel Name'}</h3>
            <p className="mb-1">{hotelDetails?.address || 'Address'}</p>
            <p className="mb-1">Phone: {hotelDetails?.phone || 'Phone Number'}</p>
            <h4 className="mt-3 mb-3">
              {dataType === 'allocation' ? 'KOT Allocation Report' : 'Daily Sales Report'}
            </h4>
            <p className="mb-0">
              Report Period: {formatDate(dateRange.start)} - {formatDate(dateRange.end)}
            </p>
            {filters.outlet && <p className="mb-0">Outlet: {filters.outlet}</p>}
          </div>

          {dataType === 'allocation' ? (
            /* Allocation Table */
            <Table bordered className="table-sm">
              <thead>
                <tr className="bg-light">
                  <th className="text-center">#</th>
                  <th>Kitchen</th>
                  <th className="text-end">Sales Amount (₹)</th>
                  <th className="text-end">Allocation (%)</th>
                </tr>
              </thead>
              <tbody>
                {allocationData.length > 0 ? (
                  allocationData.map((item, index) => (
                    <tr key={index}>
                      <td className="text-center">{index + 1}</td>
                      <td>{item.kitchen}</td>
                      <td className="text-end">{item.sales.toFixed(2)}</td>
                      <td className="text-end">{item.allocation}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center">No allocation data available</td>
                  </tr>
                )}
              </tbody>
              {allocationData.length > 0 && (
                <tfoot className="fw-bold">
                  <tr>
                    <td colSpan={2} className="text-end">Total:</td>
                    <td className="text-end">
                      {allocationData.reduce((sum, item) => sum + item.sales, 0).toFixed(2)}
                    </td>
                    <td className="text-end">
                      {allocationData.reduce((sum, item) => parseFloat(item.allocation) || 0, 0).toFixed(1)}%
                    </td>
                  </tr>
                </tfoot>
              )}
            </Table>
          ) : (
            /* Bill Summary Table */
            <Table bordered className="table-sm">
              <thead>
                <tr className="bg-light">
                  <th className="text-center">#</th>
                  <th>Bill No</th>
                  <th>Bill Date</th>
                  <th className="text-end">Total Amount (₹)</th>
                  <th className="text-end">Discount (₹)</th>
                  <th className="text-end">Net Amount (₹)</th>
                  <th>Payment Mode</th>
                  <th>Customer Name</th>
                </tr>
              </thead>
              <tbody>
                {billData.length > 0 ? (
                  billData.map((bill, index) => (
                    <tr key={index}>
                      <td className="text-center">{index + 1}</td>
                      <td>{bill.billNo}</td>
                      <td>{bill.billDate}</td>
                      <td className="text-end">{bill.totalAmount.toFixed(2)}</td>
                      <td className="text-end">{bill.discount.toFixed(2)}</td>
                      <td className="text-end">{bill.amount.toFixed(2)}</td>
                      <td>{bill.paymentMode}</td>
                      <td>{bill.customerName}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center">No bill data available</td>
                  </tr>
                )}
              </tbody>
              {billData.length > 0 && (
                <tfoot className="fw-bold">
                  <tr>
                    <td colSpan={3} className="text-end">Total:</td>
                    <td className="text-end">
                      {billData.reduce((sum, bill) => sum + bill.totalAmount, 0).toFixed(2)}
                    </td>
                    <td className="text-end">
                      {billData.reduce((sum, bill) => sum + bill.discount, 0).toFixed(2)}
                    </td>
                    <td className="text-end">
                      {billData.reduce((sum, bill) => sum + bill.amount, 0).toFixed(2)}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              )}
            </Table>
          )}

          {/* Footer */}
          <div className="mt-4 pt-3 border-top text-center">
            <p className="mb-1">Generated on: {new Date().toLocaleString('en-IN')}</p>
            <p className="mb-0">Report generated by Restaurant Management System</p>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default KOTAllocationPrintPreview;
