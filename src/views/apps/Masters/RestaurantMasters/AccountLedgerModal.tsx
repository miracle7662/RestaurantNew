import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import { toast } from 'react-hot-toast';
import { useAppContext } from '@/common/context/AppContext';
import sanscript from 'sanscript';

// Interfaces
interface AccountLedgerItem {
  LedgerId?: string;
  LedgerNo: string;
  Name: string;
  MarathiName?: string;
  address: string;
  stateid?: string;
  state?: string;
  cityid?: string;
  city?: string;
  MobileNo: string;
  PhoneNo?: string;
  GstNo?: string;
  PanNo?: string;
  OpeningBalance: string;
  OpeningBalanceDate?: string;
  AccountTypeId?: string;
  AccountType: string;
  Status: number;
  createdbyid?: number;
  updatedbyid?: number;
  companyid?: number;
  yearid?: number;
}

interface AccountType {
  AccID: string;
  AccName: string;
}

interface State {
  stateid: string;
  state_name: string;
}

interface City {
  cityid: string;
  city_name: string;
}

interface AccountLedgerModalProps {
  show: boolean;
  onHide: () => void;
  ledger?: AccountLedgerItem | null;
  onSuccess: () => void;
}

// Main Modal Component
const AccountLedgerModal: React.FC<AccountLedgerModalProps> = ({ show, onHide, onSuccess, ledger }) => {
  const { session } = useAppContext();
  const [formData, setFormData] = useState({
    LedgerNo: '',
    Name: '',
    MarathiName: '',
    address: '',
    stateid: '',
    cityid: '',
    MobileNo: '',
    PhoneNo: '',
    GstNo: '',
    PanNo: '',
    OpeningBalance: '',
    OpeningBalanceDate: '',
    AccountTypeId: '',
    AccountType: '',
    Status: 1,
  });
  const [loading, setLoading] = useState(false);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);

  const isEdit = !!ledger;

  // Load states
  const loadStates = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        companyId: session.companyId!.toString(),
        yearId: session.yearId!.toString(),
      });
      const res = await fetch(`http://localhost:3001/api/states?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch states');
      }

      const data = await res.json();
      setStates(data);
    } catch (err) {
      console.error('Error loading states:', err);
      toast.error('Failed to load states');
    }
  }, [session.companyId, session.token, session.yearId]);

  // Load cities for selected state
  const loadCities = useCallback(async (stateId: string) => {
    try {
      if (stateId) {
        const params = new URLSearchParams({
          companyId: session.companyId!.toString(),
          yearId: session.yearId!.toString(),
        });
        const res = await fetch(`http://localhost:3001/api/cities/${stateId}?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${session.token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          throw new Error('Failed to fetch cities');
        }

        const data = await res.json();
        setCities(data);
      } else {
        setCities([]);
      }
    } catch (err) {
      console.error('Error loading cities:', err);
      toast.error('Failed to load cities');
    }
  }, [session.companyId, session.token, session.yearId]);

  // Load account types
  const loadAccountTypes = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        companyId: session.companyId!.toString(),
        yearId: session.yearId!.toString(),
      });
      const res = await fetch(`http://localhost:3001/api/accounttype?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch account types');
      }

      const data = await res.json();
      setAccountTypes(data);
    } catch (err) {
      console.error('Error loading account types:', err);
      toast.error('Failed to load account types');
    }
  }, [session.companyId, session.token, session.yearId]);

  // Get next ledger number
  const getNextLedgerNo = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        companyId: session.companyId!.toString(),
        yearId: session.yearId!.toString(),
      });
      const res = await fetch(`http://localhost:3001/api/account-ledger/next-ledger-no?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch next ledger number');
      }

      const data = await res.json();
      setFormData(prev => ({
        ...prev,
        LedgerNo: data.nextLedgerNo.toString(),
      }));
    } catch (err) {
      console.error('Error getting next ledger number:', err);
      toast.error('Failed to get next ledger number');
    }
  }, [session.companyId, session.token, session.yearId]);

  useEffect(() => {
    if (show) {
      loadStates();
      loadAccountTypes();
      if (!isEdit) {
        getNextLedgerNo();
      }
    }
  }, [show, loadStates, loadAccountTypes, isEdit, getNextLedgerNo]);

  useEffect(() => {
    if (ledger && isEdit) {
      setFormData({
        LedgerNo: ledger.LedgerNo || '',
        Name: ledger.Name || '',
        MarathiName: ledger.MarathiName || '',
        address: ledger.address || '',
        stateid: ledger.stateid || '',
        cityid: ledger.cityid || '',
        MobileNo: ledger.MobileNo || '',
        PhoneNo: ledger.PhoneNo || '',
        GstNo: ledger.GstNo || '',
        PanNo: ledger.PanNo || '',
        OpeningBalance: ledger.OpeningBalance || '',
        OpeningBalanceDate: ledger.OpeningBalanceDate || '',
        AccountTypeId: ledger.AccountTypeId || '',
        AccountType: ledger.AccountType || '',
        Status: ledger.Status !== undefined ? ledger.Status : 1,
      });
      if (ledger.stateid) {
        loadCities(ledger.stateid);
      }
    } else {
      setFormData({
        LedgerNo: '',
        Name: '',
        MarathiName: '',
        address: '',
        stateid: '',
        cityid: '',
        MobileNo: '',
        PhoneNo: '',
        GstNo: '',
        PanNo: '',
        OpeningBalance: '',
        OpeningBalanceDate: '',
        AccountTypeId: '',
        AccountType: '',
        Status: 1,
      });
      setCities([]);
    }
  }, [ledger, show, isEdit, loadCities]);

  // When state changes, load cities
  useEffect(() => {
    if (formData.stateid) {
      loadCities(formData.stateid);
    } else {
      setCities([]);
    }
  }, [formData.stateid, loadCities]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.LedgerNo || !formData.Name) {
      toast.error('Ledger No and Name are required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        companyId: session.companyId,
        yearId: session.yearId,
        ...(isEdit
          ? { updatedBy: session.userId }
          : { createdBy: session.userId }),
      };

      const params = new URLSearchParams({
        companyId: session.companyId!.toString(),
        yearId: session.yearId!.toString(),
      });
      const url = isEdit
        ? `http://localhost:3001/api/account-ledger/${ledger!.LedgerId}?${params.toString()}`
        : `http://localhost:3001/api/account-ledger?${params.toString()}`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Failed to ${isEdit ? 'update' : 'add'} ledger`);
      }

      toast.success(`Ledger ${isEdit ? 'updated' : 'added'} successfully`);
      onSuccess();
      onHide();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to ${isEdit ? 'update' : 'add'} ledger`;
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'Status' ? parseInt(value) : value,
    }));
  };

  // Auto-transliterate English Name to Marathi Name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      Name: value,
      MarathiName: value.trim() ? sanscript.t(value, 'itrans', 'devanagari') : '',
    }));
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{isEdit ? 'Edit Ledger' : 'Add Ledger'}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <div className="row">
            <div className="col-md-6 mb-3">
              <Form.Group>
                <Form.Label>Ledger No *</Form.Label>
                <Form.Control
                  type="text"
                  name="LedgerNo"
                  value={formData.LedgerNo}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </div>
            <div className="col-md-6 mb-3">
              <Form.Group>
                <Form.Label>Name *</Form.Label>
                <Form.Control
                  type="text"
                  name="Name"
                  value={formData.Name}
                  onChange={handleNameChange}
                  required
                />
              </Form.Group>
            </div>
          </div>
          <div className="row">
            <div className="col-md-6 mb-3">
              <Form.Group>
                <Form.Label>Marathi Name</Form.Label>
                <Form.Control
                  type="text"
                  name="MarathiName"
                  value={formData.MarathiName}
                  onChange={handleChange}
                />
              </Form.Group>
            </div>
            <div className="col-md-6 mb-3">
              <Form.Group>
                <Form.Label>Mobile No</Form.Label>
                <Form.Control
                  type="text"
                  name="MobileNo"
                  value={formData.MobileNo}
                  onChange={handleChange}
                />
              </Form.Group>
            </div>
          </div>
          <Form.Group className="mb-3">
            <Form.Label>Address</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              name="address"
              value={formData.address}
              onChange={handleChange}
            />
          </Form.Group>
          <div className="row">
            <div className="col-md-6 mb-3">
              <Form.Group>
                <Form.Label>State</Form.Label>
                <Form.Select
                  name="stateid"
                  value={formData.stateid}
                  onChange={handleChange}
                >
                  <option value="">Select State</option>
                  {states.map((state) => (
                    <option key={state.stateid} value={state.stateid}>
                      {state.state_name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-md-6 mb-3">
              <Form.Group>
                <Form.Label>City</Form.Label>
                <Form.Select
                  name="cityid"
                  value={formData.cityid}
                  onChange={handleChange}
                >
                  <option value="">Select City</option>
                  {cities.map((city) => (
                    <option key={city.cityid} value={city.cityid}>
                      {city.city_name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
          </div>
          <div className="row">
            <div className="col-md-6 mb-3">
              <Form.Group>
                <Form.Label>Phone No</Form.Label>
                <Form.Control
                  type="text"
                  name="PhoneNo"
                  value={formData.PhoneNo}
                  onChange={handleChange}
                />
              </Form.Group>
            </div>
            <div className="col-md-6 mb-3">
              <Form.Group>
                <Form.Label>GST No</Form.Label>
                <Form.Control
                  type="text"
                  name="GstNo"
                  value={formData.GstNo}
                  onChange={handleChange}
                />
              </Form.Group>
            </div>
          </div>
          <div className="row">
            <div className="col-md-6 mb-3">
              <Form.Group>
                <Form.Label>PAN No</Form.Label>
                <Form.Control
                  type="text"
                  name="PanNo"
                  value={formData.PanNo}
                  onChange={handleChange}
                />
              </Form.Group>
            </div>
            <div className="col-md-6 mb-3">
              <Form.Group>
                <Form.Label>Opening Balance</Form.Label>
                <Form.Control
                  type="number"
                  name="OpeningBalance"
                  value={formData.OpeningBalance}
                  onChange={handleChange}
                />
              </Form.Group>
            </div>
          </div>
          <div className="row">
            <div className="col-md-6 mb-3">
              <Form.Group>
                <Form.Label>Opening Balance Date</Form.Label>
                <Form.Control
                  type="date"
                  name="OpeningBalanceDate"
                  value={formData.OpeningBalanceDate}
                  onChange={handleChange}
                />
              </Form.Group>
            </div>
            <div className="col-md-6 mb-3">
              <Form.Group>
                <Form.Label>Account Type</Form.Label>
                <Form.Select
                  name="AccountTypeId"
                  value={formData.AccountTypeId}
                  onChange={handleChange}
                >
                  <option value="">Select Account Type</option>
                  {accountTypes.map((type) => (
                    <option key={type.AccID} value={type.AccID}>
                      {type.AccName}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
          </div>
          <Form.Group className="mb-3">
            <Form.Label>Status</Form.Label>
            <Form.Select
              name="Status"
              value={formData.Status}
              onChange={handleChange}
            >
              <option value={1}>Active</option>
              <option value={0}>Inactive</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default AccountLedgerModal;
