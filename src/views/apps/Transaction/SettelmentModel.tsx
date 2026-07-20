// SettlementModal.tsx (CUSTOMER CREATE WITH OPTIONAL MOBILE & NAME SEARCH)

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Customers from './Customers';

import { Modal, Row, Col, Form, Button, Card } from 'react-bootstrap';
import toast from 'react-hot-toast';
import CustomerService from '@/common/api/customers';
import CheckInService, { ActiveRoomCreditCheckin }  from '@/common/hotel/checkIn';
import { useAuthContext } from "@/common";


interface PaymentMode {
  id: number;
  mode_name: string;
  outletid: number;
}

interface Settlement {
  table_name?: string;
  PaymentType: string;
  Amount: number;
  received_amount: number;
  refund_amount: number;
  TipAmount: number;
  customerid?: number | null;
  mobile?: string;
  customerName?: string;
}

interface SettlementModalProps {
  show: boolean;
  initialCustomerName?: string;
  initialMobile?: string;
  initialCustomerId?: number | null;

  onHide: () => void;
  onSettle: (settlements: Settlement[], tip?: number) => Promise<void>;
  grandTotal: number;
  subtotal: number;
  loading: boolean;
  outletPaymentModes: PaymentMode[];
  selectedOutletId?: number | null;
  initialSelectedModes?: string[];
  initialPaymentAmounts?: { [key: string]: string };
  initialIsMixed?: boolean;
  initialTip?: number;
  initialCashReceived?: number;
  table_name?: string | null;
}

const SettlementModal: React.FC<SettlementModalProps> = ({
  show,
  onHide,
  onSettle,
  grandTotal = 0,
  subtotal = 0,
  loading,
  outletPaymentModes = [],
  initialSelectedModes = [],
  initialPaymentAmounts = {},
  initialIsMixed = false,
  initialTip = 0,
  initialCashReceived = 0,
  table_name,
  initialMobile,
  initialCustomerName,
  initialCustomerId,
  selectedOutletId,
}) => {
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  const handleCustomerModalToggle = () => {
    setShowCustomerModal(prev => !prev); // ✅ FIXED: was setShowCustomerModalModal
  };
  const { user } = useAuthContext();
  const hotelId = user?.hotelid;
  const [isMixedPayment, setIsMixedPayment] = useState(initialIsMixed);
  const [selectedPaymentModes, setSelectedPaymentModes] = useState<string[]>(initialSelectedModes);
  const [paymentAmounts, setPaymentAmounts] = useState<{ [key: string]: string }>(initialPaymentAmounts);
  const [tip, setTip] = useState<number>(initialTip);
  const [activePaymentIndex, setActivePaymentIndex] = useState(0);

  // Credit mode detection
  const hasCreditMode = selectedPaymentModes.some(mode => mode.toLowerCase() === 'credit');

  // Customer states for Credit mode
  const [customerMobile, setCustomerMobile] = useState(initialMobile || '');
  const [customerName, setCustomerName] = useState(initialCustomerName || '');
  const [customerId, setCustomerId] = useState<number | null>(initialCustomerId || null);
  
  // Track if customer was manually entered (not fetched)
  const [isManualCustomer, setIsManualCustomer] = useState(false);
  
  // Track if customer creation is in progress
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  // Customer search states
  const [customerSearchResults, setCustomerSearchResults] = useState<any[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [focusedCustomerIndex, setFocusedCustomerIndex] = useState<number>(-1);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const customerInputRef = useRef<HTMLInputElement>(null);


  const [roomCreditCheckins, setRoomCreditCheckins] = useState<ActiveRoomCreditCheckin[]>([]);
const [selectedCheckinId, setSelectedCheckinId] = useState<number | null>(null);
const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);   // ✅ NEW
const [loadingCheckins, setLoadingCheckins] = useState(false);
const selectedRoomDetail = roomCreditCheckins.find(r => r.room_id === selectedRoomId) || null;

useEffect(() => {
  const isRoomCreditSelected = selectedPaymentModes.some(
    m => m.toLowerCase() === 'room credit'
  );
  if (!isRoomCreditSelected) {
    setSelectedCheckinId(null);
    setSelectedRoomId(null);          // ✅ reset bhi karo
    return;
  }

  if (!hotelId) {
    console.warn('⚠️ [RoomCredit] hotelId missing, skipping fetch');
    return;
  }

  setLoadingCheckins(true);
  CheckInService.getActiveRoomCreditCheckins({ 
    hotelid: hotelId, 
    room_no: table_name || undefined
  })
    .then((res) => {
      console.log('✅ [RoomCredit] API response:', res);
      if (res.success) {
        setRoomCreditCheckins(res.data);

        // ✅ NEW: auto-select first room + its checkin
        if (res.data.length > 0) {
          const first = res.data[0];
          setSelectedRoomId(first.room_id);
          setSelectedCheckinId(first.checkin_id);
        } else {
          setSelectedRoomId(null);
          setSelectedCheckinId(null);
        }
      }
    })
    .catch((err) => {
      console.error('❌ [RoomCredit] API error:', err);
      toast.error('Failed to load active check-ins');
    })
    .finally(() => setLoadingCheckins(false));
}, [selectedPaymentModes, table_name, hotelId]);


const handleRoomSelect = (room: ActiveRoomCreditCheckin) => {
  setSelectedRoomId(room.room_id);
  setSelectedCheckinId(room.checkin_id);
};

  // Reset customer data when Credit deselected or modal closed
  useEffect(() => {
    if (!show) return;
    if (hasCreditMode) {
      setCustomerMobile(initialMobile || '');
      setCustomerName(initialCustomerName || '');
      setCustomerId(initialCustomerId || null);
      setIsManualCustomer(false);
      setCustomerSearchResults([]);
      setShowCustomerDropdown(false);
      setFocusedCustomerIndex(-1);
    }
  }, [show, hasCreditMode, initialMobile, initialCustomerName, initialCustomerId]);

  // Auto-fetch customer when mobile changes (min 10 digits)
  useEffect(() => {
    // Only fetch if mobile has 10 digits
    if (customerMobile.length === 10) {
      const fetchCustomer = async () => {
        try {
          const response = await CustomerService.getByMobile(customerMobile);
          if (response?.success && response?.data) {
            setCustomerName(response.data.name || '');
            setCustomerId(response.data.customerid || null);
            setIsManualCustomer(false);
            setCustomerSearchResults([]);
            setShowCustomerDropdown(false);
            setFocusedCustomerIndex(-1);
          } else {
            // Customer not found - allow manual entry
            setCustomerId(null);
            // Don't auto-clear name if user already typed it
            if (!customerName) {
              setIsManualCustomer(true);
            }
          }
        } catch (error) {
          // Customer not found or error
          setCustomerId(null);
          if (!customerName) {
            setIsManualCustomer(true);
          }
        }
      };
      
      fetchCustomer();
    } else if (customerMobile.length > 0 && customerMobile.length < 10) {
      // Invalid mobile - don't clear name if manually entered
      if (!isManualCustomer) {
        setCustomerId(null);
      }
    }
    // If mobile is empty, don't do anything
  }, [customerMobile]);

  // Search customers by name (debounced)
  const searchCustomersByName = useCallback(async (searchTerm: string) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setCustomerSearchResults([]);
      setShowCustomerDropdown(false);
      setFocusedCustomerIndex(-1);
      return;
    }

    setIsSearchingCustomer(true);
    try {
      const response = await CustomerService.searchByName(searchTerm.trim());
      console.log('SEARCH RESPONSE:', response); // Yeh line add karo

      
      if (response?.success && response?.data && response.data.length > 0) {
        // Filter out the current customer if already selected
        const results = response.data.filter(
          (cust: any) => cust.customerid !== customerId
        );
        setCustomerSearchResults(results);
        setShowCustomerDropdown(results.length > 0);
        setFocusedCustomerIndex(-1);
      } else {
        setCustomerSearchResults([]);
        setShowCustomerDropdown(false);
        setFocusedCustomerIndex(-1);
      }
    } catch (error) {
      console.error('Error searching customers:', error);
      setCustomerSearchResults([]);
      setShowCustomerDropdown(false);
      setFocusedCustomerIndex(-1);
    } finally {
      setIsSearchingCustomer(false);
    }
  }, [customerId]);

  // Handle customer name change with search
  const handleCustomerNameChange = (value: string) => {
    setCustomerName(value);
    setCustomerId(null); // Clear customer ID when name changes
    setIsManualCustomer(true);
    setShowCustomerDropdown(false);
    setFocusedCustomerIndex(-1);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      if (value.trim().length >= 2) {
        searchCustomersByName(value);
      } else {
        setCustomerSearchResults([]);
        setShowCustomerDropdown(false);
        setFocusedCustomerIndex(-1);
      }
    }, 300);
  };

  // Select customer from dropdown
  const handleSelectCustomer = (customer: any) => {
    setCustomerName(customer.name || '');
    setCustomerId(customer.customerid || null);
    setCustomerMobile(customer.mobile || '');
    setIsManualCustomer(false);
    setShowCustomerDropdown(false);
    setCustomerSearchResults([]);
    setFocusedCustomerIndex(-1);
    toast.success(`Customer selected: ${customer.name}`);
  };

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCustomerDropdown(false);
        setFocusedCustomerIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // ✅ KEYBOARD NAVIGATION FOR CUSTOMER DROPDOWN
  useEffect(() => {
    if (!showCustomerDropdown || customerSearchResults.length === 0) {
      setFocusedCustomerIndex(-1);
      return;
    }

    const handleDropdownKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        setFocusedCustomerIndex((prev: number) =>  // ✅ FIXED: Added type
          prev < customerSearchResults.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        setFocusedCustomerIndex((prev: number) => prev > 0 ? prev - 1 : -1); // ✅ FIXED: Added type
      } else if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        if (focusedCustomerIndex >= 0 && focusedCustomerIndex < customerSearchResults.length) {
          handleSelectCustomer(customerSearchResults[focusedCustomerIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setShowCustomerDropdown(false);
        setFocusedCustomerIndex(-1);
        // Focus back to input
        customerInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleDropdownKeyDown);
    return () => document.removeEventListener('keydown', handleDropdownKeyDown);
  }, [showCustomerDropdown, customerSearchResults, focusedCustomerIndex, handleSelectCustomer]);

  // Reset customer on modal close
  useEffect(() => {
    if (!show) {
      setCustomerMobile('');
      setCustomerName('');
      setCustomerId(null);
      setIsManualCustomer(false);
      setIsCreatingCustomer(false);
      setCustomerSearchResults([]);
      setShowCustomerDropdown(false);
      setFocusedCustomerIndex(-1);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    }
  }, [show]);

  // Single mode → keep only first payment method
  useEffect(() => {
    if (!isMixedPayment && selectedPaymentModes.length > 1) {
      const first = selectedPaymentModes[0];
      setSelectedPaymentModes([first]);
      setPaymentAmounts({ [first]: grandTotal.toFixed(2) });
    }
  }, [isMixedPayment, grandTotal, selectedPaymentModes]);

  const paymentModesTotal = Object.values(paymentAmounts).reduce((sum, v) => sum + (Number(v) || 0), 0);
  const totalReceived = paymentModesTotal + (tip || 0);
  const balance = grandTotal - totalReceived;
  const balanceDue = balance > 0 ? balance : 0;
  // ✅ FIXED: Track overpayment in the payment-mode amounts only (excluding tip), e.g. typing
  // ₹2000 across payment modes against a ₹1500 bill. Tip is added on top intentionally and
  // should NOT count as excess, so compare paymentModesTotal (not totalReceived) to grandTotal.
  const excessAmount = paymentModesTotal > grandTotal ? paymentModesTotal - grandTotal : 0;
  const [cashReceived, setCashReceived] = useState<number>(0);

  // Initialize cashReceived with prop value when modal opens
  useEffect(() => {
    if (show && initialCashReceived !== undefined) {
      setCashReceived(initialCashReceived);
    }
  }, [show, initialCashReceived]);

  // Calculate settlement amounts
  const receivedAmount = cashReceived || 0;
  const billAmount = grandTotal + (tip || 0);
  const refundAmount = receivedAmount > billAmount ? receivedAmount - billAmount : 0;

  const getRemainingExcluding = (excludeMode?: string) => {
    if (!isMixedPayment) return grandTotal;
    const paidByOthers = selectedPaymentModes
      .filter(m => m !== excludeMode)
      .reduce((sum, m) => sum + (Number(paymentAmounts[m]) || 0), 0);
    return Math.max(0, grandTotal - paidByOthers);
  };

  const handleAmountFocus = (mode: string) => {
    if (!isMixedPayment) return;
    if (Number(paymentAmounts[mode] || 0) > 0) return;

    const remaining = getRemainingExcluding(mode);
    if (remaining > 0) {
      setPaymentAmounts(prev => ({ ...prev, [mode]: remaining.toFixed(2) }));
    }
  };

  const handleAmountChange = (mode: string, value: string) => {
    setPaymentAmounts(prev => ({ ...prev, [mode]: value }));
  };

  const removePaymentMode = (modeName: string) => {
    setSelectedPaymentModes(prev => prev.filter(m => m !== modeName));
    setPaymentAmounts(prev => {
      const next = { ...prev };
      delete next[modeName];
      return next;
    });
  };

  const togglePaymentMode = (mode: PaymentMode) => {
    const name = mode.mode_name;
    const isAlreadySelected = selectedPaymentModes.includes(name);

    if (!isMixedPayment) {
      // Single payment mode
      if (isAlreadySelected) {
        setSelectedPaymentModes([]);
        setPaymentAmounts({});
      } else {
        setSelectedPaymentModes([name]);
        setPaymentAmounts({ [name]: grandTotal.toFixed(2) });
      }
    } else {
      // Mixed payment mode
      if (isAlreadySelected) {
        removePaymentMode(name);
      } else {
        setSelectedPaymentModes(prev => [...prev, name]);
        const remaining = getRemainingExcluding(name);
        if (remaining > 0) {
          setPaymentAmounts(prev => ({ ...prev, [name]: remaining.toFixed(2) }));
        } else {
          setPaymentAmounts(prev => ({ ...prev, [name]: '0' }));
        }
      }
    }
  };

  // ========== FIXED KEYBOARD NAVIGATION ==========
  // Using refs to prevent stale closure issues
  const grandTotalRef = useRef(grandTotal);
  const isMixedPaymentRef = useRef(isMixedPayment);
  const selectedPaymentModesRef = useRef(selectedPaymentModes);
  const paymentAmountsRef = useRef(paymentAmounts);

  // Keep refs in sync with state (for UI-driven changes)
  useEffect(() => { grandTotalRef.current = grandTotal; }, [grandTotal]);
  useEffect(() => { isMixedPaymentRef.current = isMixedPayment; }, [isMixedPayment]);
  useEffect(() => { selectedPaymentModesRef.current = selectedPaymentModes; }, [selectedPaymentModes]);
  useEffect(() => { paymentAmountsRef.current = paymentAmounts; }, [paymentAmounts]);

  // Create customer if not exists using CustomerService (MOBILE OPTIONAL)
  const createCustomerIfNotExists = useCallback(async (): Promise<number | null> => {
    // If customerId already exists, return it
    if (customerId) return customerId;

    // Validate: At least name is required
    if (!customerName || customerName.trim() === '') {
      toast.error('Please enter customer name');
      return null;
    }

    // Mobile is OPTIONAL - if provided, should be 10 digits
    if (customerMobile && customerMobile.length > 0 && customerMobile.length !== 10) {
      toast.error('Mobile number must be 10 digits (optional)');
      return null;
    }

    // Prevent duplicate creation requests
    if (isCreatingCustomer) return null;
    setIsCreatingCustomer(true);

    try {
      // If mobile is provided, check if customer already exists
      if (customerMobile && customerMobile.length === 10) {
        try {
          const existingResponse = await CustomerService.getByMobile(customerMobile);
          if (existingResponse?.success && existingResponse?.data?.customerid) {
            const existingId = existingResponse.data.customerid;
            setCustomerId(existingId);
            setCustomerName(existingResponse.data.name || '');
            setIsManualCustomer(false);
            toast(`Customer found: ${existingResponse.data.name}`);
            return existingId;
          }
        } catch (error) {
          // Customer not found - continue to create
        }
      }

      // Create new customer (mobile is optional)
      const payload = {
        name: customerName.trim(),
        countryCode: customerMobile ? '+91' : '+91',
        mobile: customerMobile || '', // Can be empty string
        mail: '',
        cityid: '',
        city_name: '',
        address1: '',
        address2: '',
        stateid: '',
        state_name: '',
        pincode: '',
        gstNo: '',
        fssai: '',
        panNo: '',
        aadharNo: '',
        birthday: '',
        anniversary: '',
        customerType: 'Regular',
        status: 1,
      };

      const response = await CustomerService.create(payload);
      
      if (response?.success && response?.data?.customerid) {
        const newId = response.data.customerid;
        setCustomerId(newId);
        setIsManualCustomer(false);
        toast.success(`Customer "${customerName}" created successfully!`);
        return newId;
      } else {
        toast.error(response?.message || 'Failed to create customer');
        return null;
      }
    } catch (error: any) {
      console.error('Create customer error:', error);
      toast.error(error?.message || 'Error creating customer');
      return null;
    } finally {
      setIsCreatingCustomer(false);
    }
  }, [customerId, customerMobile, customerName, isCreatingCustomer]);

  // handleSettle with customer creation
 const handleSettle = useCallback(async () => {
    if (loading || isCreatingCustomer) return;

    const currentModes = selectedPaymentModesRef.current;
    const currentAmounts = paymentAmountsRef.current;

    // Validate Credit requires customer
    const hasCredit = currentModes.some(mode => mode.toLowerCase() === 'credit');
    
 const hasRoomCredit = currentModes.some(mode => mode.toLowerCase() === 'room credit');
if (hasRoomCredit && (!selectedCheckinId || !selectedRoomId)) {
  toast.error('Please select a room for Room Credit payment');
  return;
}

    // If credit mode, ensure customer exists
    let finalCustomerId = customerId;
    
    if (hasCredit) {
      if (!finalCustomerId) {
        if (!customerName || customerName.trim() === '') {
          toast.error('Please enter customer name for Credit payment');
          return;
        }
        
        const newCustomerId = await createCustomerIfNotExists();
        if (!newCustomerId) {
          return;
        }
        finalCustomerId = newCustomerId;
      }
    }

    if (cashReceived > 0 && cashReceived < grandTotal) {
      toast.error(`Received amount ₹${cashReceived} is less than bill ₹${grandTotal}`);
      return;
    }

    if (balanceDue > 0) {
      toast.error(`Balance due: ₹${balanceDue.toFixed(2)}`);
      return;
    }

    if (excessAmount > 0) {
      toast.error(`Entered amount exceeds bill by ₹${excessAmount.toFixed(2)}`);
      return;
    }

   const settlements = currentModes.map((name, index) => {
      const baseSettlement = {
        table_name: table_name || '',
        PaymentType: name,
        Amount: Number(currentAmounts[name] || 0),
        received_amount: receivedAmount,
        refund_amount: refundAmount,
        TipAmount: index === 0 ? (tip || 0) : 0,
      };

      // Add customer data to Credit payments only
      if (name.toLowerCase() === 'credit' && finalCustomerId) {
        return {
          ...baseSettlement,
          customerid: finalCustomerId,
          mobile: customerMobile || '',
          customerName: customerName,
        };
      }

      // ✅ NEW: Add checkinid to Room Credit payments only
      if (name.toLowerCase() === 'room credit' && selectedCheckinId) {
        return {
          ...baseSettlement,
          checkinid: selectedCheckinId,
        };
      }

      return baseSettlement;
    });

    try {
      console.log("=== Frontend Settlements ===");
      console.table(settlements);
      console.log("Tip:", tip);
      await onSettle(settlements, tip);
    } catch (err) {
      toast.error('Settlement failed');
    }
  }, [
    loading, isCreatingCustomer, customerId, customerMobile, customerName, 
    cashReceived, grandTotal, balanceDue, excessAmount, tip, table_name, receivedAmount, 
    refundAmount, onSettle, createCustomerIfNotExists,
    selectedCheckinId  // ✅ NEW dependency
  ]);

  // ✅ FIXED: Arrow keys - check if customer dropdown is open
  useEffect(() => {
    if (!show || !Array.isArray(outletPaymentModes) || outletPaymentModes.length === 0) return;

    const handler = (e: KeyboardEvent) => {
      // ✅ If customer dropdown is open, don't interfere - let the dropdown handler work
      if (showCustomerDropdown) {
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setActivePaymentIndex((prev: number) => { // ✅ FIXED: Added type
          const next = e.key === 'ArrowDown'
            ? (prev + 1) % outletPaymentModes.length
            : (prev - 1 + outletPaymentModes.length) % outletPaymentModes.length;

          const modeName = outletPaymentModes[next].mode_name;

          const currentGrandTotal = grandTotalRef.current;
          const currentIsMixed = isMixedPaymentRef.current;
          const currentSelectedModes = [...selectedPaymentModesRef.current];
          const currentAmounts = { ...paymentAmountsRef.current };

          if (!currentIsMixed) {
            // Single mode — replace selection
            const newModes = [modeName];
            const newAmounts = { [modeName]: currentGrandTotal.toFixed(2) };

            selectedPaymentModesRef.current = newModes;
            paymentAmountsRef.current = newAmounts;

            setSelectedPaymentModes(newModes);
            setPaymentAmounts(newAmounts);
          } else {
            // Mixed mode — toggle selection
            const isAlreadySelected = currentSelectedModes.includes(modeName);

            if (isAlreadySelected) {
              const newModes = currentSelectedModes.filter(m => m !== modeName);
              const newAmounts = { ...currentAmounts };
              delete newAmounts[modeName];

              selectedPaymentModesRef.current = newModes;
              paymentAmountsRef.current = newAmounts;

              setSelectedPaymentModes(newModes);
              setPaymentAmounts(newAmounts);
            } else {
              const paidByOthers = currentSelectedModes.reduce(
                (sum, m) => sum + (Number(currentAmounts[m]) || 0), 0
              );
              const remaining = Math.max(0, currentGrandTotal - paidByOthers);
              const newModes = [...currentSelectedModes, modeName];
              const newAmounts = remaining > 0
                ? { ...currentAmounts, [modeName]: remaining.toFixed(2) }
                : { ...currentAmounts, [modeName]: '0' };

              selectedPaymentModesRef.current = newModes;
              paymentAmountsRef.current = newAmounts;

              setSelectedPaymentModes(newModes);
              setPaymentAmounts(newAmounts);
            }
          }

          return next;
        });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSettle();
      } else if (e.key === 'Escape') {
        onHide();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [show, outletPaymentModes, onHide, handleSettle, showCustomerDropdown]);

  // Reset form when modal closes
  useEffect(() => {
    if (!show) {
      setIsMixedPayment(false);
      setSelectedPaymentModes([]);
      setPaymentAmounts({});
      setTip(0);
      setCashReceived(0);
      setActivePaymentIndex(0);
    }
  }, [show]);

  // Update states when modal opens with initial props and auto-select Cash if needed
  useEffect(() => {
    if (show) {
      setIsMixedPayment(initialIsMixed);
      setSelectedPaymentModes(initialSelectedModes);
      setTip(initialTip);

      if (initialSelectedModes.length > 0 && grandTotal > 0) {
        const newAmounts: { [key: string]: string } = {};

        const hasValidAmounts = initialSelectedModes.every(mode => {
          const amount = parseFloat(initialPaymentAmounts[mode] || '0');
          return amount > 0;
        });

        if (hasValidAmounts && Object.keys(initialPaymentAmounts).length > 0) {
          setPaymentAmounts(initialPaymentAmounts);
        } else {
          if (!initialIsMixed && initialSelectedModes.length === 1) {
            newAmounts[initialSelectedModes[0]] = grandTotal.toFixed(2);
          } else if (initialIsMixed && initialSelectedModes.length > 0) {
            newAmounts[initialSelectedModes[0]] = grandTotal.toFixed(2);
            for (let i = 1; i < initialSelectedModes.length; i++) {
              newAmounts[initialSelectedModes[i]] = '0';
            }
          }
          setPaymentAmounts(newAmounts);
        }
      }
      else if (!initialIsMixed && initialSelectedModes.length === 0) {
        const cashMode = Array.isArray(outletPaymentModes) ? outletPaymentModes.find(m => m.mode_name?.toLowerCase() === 'cash') : null;
        if (cashMode && grandTotal > 0) {
          setSelectedPaymentModes([cashMode.mode_name]);
          setPaymentAmounts({ [cashMode.mode_name]: grandTotal.toFixed(2) });
        }
      }
      else {
        setPaymentAmounts(initialPaymentAmounts);
      }
    }
  }, [show, initialIsMixed, initialSelectedModes, initialPaymentAmounts, initialTip, outletPaymentModes, grandTotal]);

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      size="lg"
      backdrop="static"
    >
      <Modal.Header closeButton className="pb-2 pt-3 border-0">
        <Modal.Title className="fw-bold fs-4 w-100 text-center">
          {table_name ? `Table ${table_name} | ` : ''}Payment Settlement
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-0">
        <Row className="g-0 h-100">
          {/* LEFT – Payment Methods */}
          <Col md={4} className="bg-white border-end">
            <div className="p-3 border-bottom bg-light">
              <div className="d-flex align-items-center gap-3">
                <Form.Check
                  type="switch"
                  id="mixed-switch"
                  checked={isMixedPayment}
                  onChange={e => setIsMixedPayment(e.target.checked)}
                />
                <div>
                  <strong>Mixed Payment</strong>
                  <div className="small text-muted">Use multiple methods</div>
                </div>
              </div>
            </div>

            <div className="p-2">
              <h6 className="fw-bold text-uppercase small mb-3 text-secondary">
                Payment Methods
              </h6>

              <div style={{ overflowY: 'auto' }}>
                {Array.isArray(outletPaymentModes) && outletPaymentModes.length > 0 ? (
                  outletPaymentModes.map((mode, index) => {
                    const isSelected = selectedPaymentModes.includes(mode.mode_name);
                    const isActive = index === activePaymentIndex;

                    return (
                      <div
                        key={mode.id}
                        onClick={() => {
                          setActivePaymentIndex(index);
                          togglePaymentMode(mode);
                        }}
                        className={`
                          p-2 mb-2 rounded border cursor-pointer transition-all
                          ${isSelected
                            ? 'bg-success text-white'
                            : isActive
                              ? 'bg-primary-subtle border-primary'
                              : 'border hover-bg-light'}
                        `}
                      >
                        {mode.mode_name}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-3 text-center text-muted">
                    No payment modes available for this outlet
                    {process.env.NODE_ENV === 'development' && (
                      <div className="mt-2 p-2 bg-warning text-dark small">
                        <strong>DEBUG:</strong> outletPaymentModes = {JSON.stringify(outletPaymentModes)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Col>

          {/* RIGHT – Summary & Payment Inputs */}
          <Col md={8} className="p-2 bg-light d-flex flex-column">
            {/* Due Amount */}
            <div className="text-center mb-4">
              <div className="fs-2 fw-bold text-success rounded text-center ">₹{grandTotal.toFixed(2)}</div>
            </div>

            {/* Selected Payment Inputs */}
            {selectedPaymentModes.length === 0 ? (
              <div className="text-center text-muted py-3">
                Select payment method(s) to continue
              </div>
            ) : (
              <div className="mb-3">
                {selectedPaymentModes.map(modeName => (
                  <div
                    key={modeName}
                    className={`
                      mb-2 p-2 rounded border bg-danger-subtle border-danger
                      d-flex align-items-center gap-2
                      ${isMixedPayment ? '' : 'border-success bg-success-subtle'}
                    `}
                    style={{ minHeight: '52px' }}
                  >
                    <strong
                      className={`flex-grow-1 ${isMixedPayment ? 'text-danger' : 'text-success'}`}
                      style={{ fontSize: '1rem' }}
                    >
                      {modeName}
                    </strong>

                    <div className="d-flex align-items-center gap-2" style={{ minWidth: '200px' }}>
                      <Form.Control
                        size="sm"
                        type="number"
                        value={paymentAmounts[modeName] ?? ''}
                        onChange={e => handleAmountChange(modeName, e.target.value)}
                        onFocus={() => handleAmountFocus(modeName)}
                        className="text-end fw-bold py-1"
                        style={{ width: '130px' }}
                        step="0.01"
                        min="0"
                      />

                      {isMixedPayment && selectedPaymentModes.length > 1 && (
                        <Button
                          variant="link"
                          size="sm"
                          className="text-danger p-0"
                          onClick={() => removePaymentMode(modeName)}
                          style={{ fontSize: '0.85rem' }}
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

        {selectedPaymentModes.includes('Room Credit') && (
  <div className="mb-3 p-2 border rounded">
    <div className="fw-bold small mb-2">Select Check-in for Room Credit</div>

    {loadingCheckins ? (
      <div className="text-muted small">Loading check-ins...</div>
    ) : roomCreditCheckins.length === 0 ? (
      <div className="text-muted small">No active check-ins found</div>
    ) : (
      <Row className="g-2">
        {/* LEFT — Room dropdown */}
        <Col xs={6}>
          <Form.Select
            size="sm"
            value={selectedRoomId ?? ''}
            onChange={(e) => {
              const roomId = Number(e.target.value);
              const room = roomCreditCheckins.find(r => r.room_id === roomId);
              if (room) handleRoomSelect(room);
            }}
          >
            <option value="" disabled>Select Room</option>
            {roomCreditCheckins.map((r) => (
              <option key={r.room_id} value={r.room_id}>
                Room {r.room_no} ({r.reg_no})
              </option>
            ))}
          </Form.Select>
        </Col>

        {/* RIGHT — Guest name of selected room */}
        <Col xs={6}>
          <div
            className={`form-control form-control-sm text-center fw-bold ${
              selectedRoomDetail ? 'bg-success-subtle border-success text-success' : 'text-muted'
            }`}
          >
            {selectedRoomDetail ? selectedRoomDetail.guest_name : 'No room selected'}
          </div>
        </Col>
      </Row>
    )}
  </div>
)}

            {balanceDue > 0 && (
              <div className="alert alert-warning small py-2 mb-3">
                Please complete ₹{balanceDue.toFixed(2)}
              </div>
            )}

            {/* ✅ FIXED: Show warning when entered payment-mode amounts exceed the bill */}
            {excessAmount > 0 && (
              <div className="alert alert-danger small py-2 mb-3">
                Entered amount exceeds bill by ₹{excessAmount.toFixed(2)}
              </div>
            )}

            {/* Customer Fields - ONLY when Credit selected */}
            {hasCreditMode && (
              <div className="mb-3 p-3 bg-info-subtle rounded border border-info">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="fw-bold mb-0 text-info">
                    <i className="fas fa-user me-1"></i>Customer Details
                  </h6>
                  <span className="badge bg-danger">Credit Required</span>
                </div>

                <div className="d-flex gap-2 align-items-start flex-column">
                  <div className="w-100 d-flex gap-2 align-items-center">
                    <div style={{ flex: 1 }}>
                      <div className="input-group input-group-sm">
                        <span className="input-group-text bg-white border-info">+91</span>
                        <input
                          type="tel"
                          className={`form-control form-control-sm ${
                            customerMobile && customerMobile.length > 0 && customerMobile.length !== 10 
                              ? 'border-danger' 
                              : customerId ? 'border-success' : ''
                          }`}
                          placeholder="Mobile (10 digits - Optional)"
                          value={customerMobile}
                          onChange={(e) => setCustomerMobile(e.target.value.replace(/\D/g, ''))}
                          maxLength={10}
                        />
                      </div>
                      {customerMobile && customerMobile.length > 0 && customerMobile.length !== 10 && (
                        <small className="text-danger">Enter 10 digits</small>
                      )}
                    </div>

                    <div style={{ flex: 1 }} className="position-relative" ref={dropdownRef}>
                      <input
                        ref={customerInputRef}
                        type="text"
                        className={`form-control form-control-sm ${
                          isSearchingCustomer ? 'bg-info-subtle' :
                          isCreatingCustomer ? 'bg-info-subtle' :
                          !customerId && customerName && !showCustomerDropdown
                            ? 'border-warning bg-warning-subtle' 
                            : customerId 
                              ? 'border-success bg-success-subtle' 
                              : 'border-danger bg-light'
                        }`}
                        placeholder={
                          isSearchingCustomer ? 'Searching...' :
                          isCreatingCustomer ? 'Creating customer...' :
                          customerId ? "Customer found ✓" : 
                          "Enter customer name *"
                        }
                        value={customerName || ''}
                        readOnly={!!customerId || isCreatingCustomer}
                        onChange={(e) => handleCustomerNameChange(e.target.value)}
                        autoComplete="off"
                      />
                      
                      {/* Dropdown for customer search results */}
                      {showCustomerDropdown && customerSearchResults.length > 0 && (
                        <div 
                          className="position-absolute w-100 mt-1 bg-white border rounded shadow-lg"
                          style={{ 
                            zIndex: 1050, 
                            maxHeight: '200px', 
                            overflowY: 'auto',
                            top: '100%',
                            left: 0
                          }}
                        >
                          {customerSearchResults.map((customer, index) => (
                            <div
                              key={customer.customerid}
                              className={`px-3 py-2 border-bottom d-flex justify-content-between align-items-center ${
                                index === focusedCustomerIndex 
                                  ? 'bg-primary text-white' 
                                  : ''
                              }`}
                              onClick={() => handleSelectCustomer(customer)}
                              style={{ cursor: 'pointer' }}
                              onMouseEnter={() => setFocusedCustomerIndex(index)}
                              onMouseLeave={() => setFocusedCustomerIndex(-1)}
                            >
                              <div>
                                <strong>{customer.name}</strong>
                                {customer.mobile && (
                                  <span className={`ms-2 small ${
                                    index === focusedCustomerIndex 
                                      ? 'text-white-50' 
                                      : 'text-muted'
                                  }`}>
                                    📱 {customer.mobile}
                                  </span>
                                )}
                               
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {showCustomerDropdown && customerSearchResults.length === 0 && !isSearchingCustomer && customerName.length >= 2 && (
                        <div 
                          className="position-absolute w-100 mt-1 bg-white border rounded shadow-lg p-2 text-muted small"
                          style={{ zIndex: 1050, top: '100%', left: 0 }}
                        >
                          No customers found. Enter name to create new.
                        </div>
                      )}
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => setShowCustomerModal(true)}
                        className="btn btn-primary btn-sm"
                        style={{
                          width: '32px',
                          height: '31px',
                          padding: '0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          fontWeight: 'bold'
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Status Messages */}
                {isSearchingCustomer && (
                  <div className="mt-2 p-2 bg-info-subtle rounded small text-info">
                    <i className="fas fa-spinner fa-spin me-1"></i>
                    Searching for customers...
                  </div>
                )}

                {isCreatingCustomer && (
                  <div className="mt-2 p-2 bg-info-subtle rounded small text-info">
                    <i className="fas fa-spinner fa-spin me-1"></i>
                    Creating customer...
                  </div>
                )}

                {!customerId && !isCreatingCustomer && !isSearchingCustomer && customerName && !showCustomerDropdown && (
                  <div className="mt-2 p-2 bg-info-subtle rounded small text-info">
                    <i className="fas fa-user-plus me-1"></i>
                    New customer will be created with name: <strong>{customerName}</strong>
                    {customerMobile && customerMobile.length === 10 && (
                      <span> | Mobile: {customerMobile}</span>
                    )}
                    {!customerMobile && (
                      <span className="text-muted"> (No mobile provided)</span>
                    )}
                  </div>
                )}

                {!customerId && !isCreatingCustomer && !customerName && !isSearchingCustomer && !showCustomerDropdown && (
                  <div className="mt-2 p-2 bg-warning-subtle rounded small text-warning">
                    <i className="fas fa-edit me-1"></i>
                    Please enter customer name to create new customer
                  </div>
                )}

                {customerId && !isCreatingCustomer && (
                  <div className="mt-2 p-2 bg-success-subtle rounded small text-success">
                    <i className="fas fa-check-circle me-1"></i>
                    Customer verified ✓
                  </div>
                )}
              </div>
            )}

            {/* Footer Summary Card */}
            <div className="mt-auto">
              <Card
                className="shadow-sm border-0"
                style={{
                  backgroundColor: '#f8f9fa',
                  maxWidth: '100%',
                }}
              >
                <Card.Body className="py-3 px-4">
                  <Row className="g-3">
                    <Col xs={4}>
                      <Form.Label className="small fw-medium text-muted mb-1">
                        Tip
                      </Form.Label>
                      <Form.Control
                        size="sm"
                        type="number"
                        value={tip || ''}
                        onChange={e => setTip(Number(e.target.value) || 0)}
                        className="text-center fw-bold"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                      />
                    </Col>

                    <Col xs={4}>
                      <Form.Label className="small fw-medium text-success mb-1">
                        Received
                      </Form.Label>
                      <Form.Control
                        size="sm"
                        type="number"
                        value={cashReceived ?? ''}
                        onChange={e => setCashReceived(Number(e.target.value) || 0)}
                        className={`text-center fw-bold ${
                          cashReceived >= (grandTotal + (tip || 0))
                            ? 'border-success text-success'
                            : 'border-warning text-warning'
                        }`}
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                      />
                    </Col>

                    <Col xs={4}>
                      <Form.Label className="small fw-medium text-muted mb-1">
                        {cashReceived - (grandTotal + (tip || 0)) > 0 ? 'Change' : 'Balance'}
                      </Form.Label>
                      <div
                        className={`form-control text-center fw-bold py-1 px-2 ${
                          cashReceived - (grandTotal + (tip || 0)) > 0
                            ? 'text-success bg-success-subtle border-success'
                            : cashReceived - (grandTotal + (tip || 0)) < 0
                              ? 'text-danger bg-danger-subtle border-danger'
                              : 'text-success bg-success-subtle border-success'
                        }`}
                        style={{ height: '31px' }}
                      >
                        {cashReceived - (grandTotal + (tip || 0)) > 0
                          ? `₹${(cashReceived - (grandTotal + (tip || 0))).toFixed(2)}`
                          : cashReceived - (grandTotal + (tip || 0)) < 0
                            ? `₹${Math.abs(cashReceived - (grandTotal + (tip || 0))).toFixed(2)}`
                            : '✓ Done'}
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </div>
          </Col>
        </Row>
      </Modal.Body>

      {/* Customer Management Modal */}
      <Modal
        show={showCustomerModal}
        onHide={handleCustomerModalToggle}
        size="xl"
        centered
        style={{ maxHeight: '90vh' }}
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="fw-bold">Customer Management</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: 0, height: '70vh', overflowY: 'auto' }}>
          <Customers />
        </Modal.Body>
      </Modal>

      <Modal.Footer className="border-0 pt-3 pb-4 px-4 d-flex gap-3 justify-content-end">
        <Button
          variant="outline-secondary"
          onClick={onHide}
          disabled={loading || isCreatingCustomer}
          style={{ minWidth: '120px' }}
        >
          Back
        </Button>
        <Button
          variant="success"
          size="lg"
          onClick={handleSettle}
          disabled={
            loading || 
            balanceDue > 0 || 
            excessAmount > 0 ||
            selectedPaymentModes.length === 0 || 
            isCreatingCustomer ||
            // Credit mode requires name
            (hasCreditMode && !customerName)
          }
          style={{ minWidth: '180px' }}
        >
          {loading || isCreatingCustomer ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" />
              {isCreatingCustomer ? 'Creating Customer...' : 'Processing...'}
            </>
          ) : (
            'Settle'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SettlementModal;