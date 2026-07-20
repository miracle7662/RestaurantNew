import React, { useEffect, useState, useRef } from 'react';
import {
    Modal,
    Row,
    Col,
    Card,
    Table,
    Button,
    Badge,
    Form,
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import OrderService from '@/common/api/order';

const KOT_COLORS = ['#E8F5E9', '#FFF3E0'];

const getRowColor = (kotNo: string | number | null | undefined) => {
    if (!kotNo) return '#ffffff';
    const firstKot = String(kotNo).split('|')[0];
    const num = parseInt(firstKot.replace(/\D/g, ''), 10);
    if (isNaN(num) || num === 0) return '#ffffff';
    return KOT_COLORS[num % KOT_COLORS.length];
};

// Default reason options
const DEFAULT_REASONS = ['Cancelled by Guest', 'Wrong Item', 'Item Not Available', 'Quality Issue', 'Delay in Service'];

interface ReverseKotModalProps {
    show: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    kotItems: any[];
    revKotNo: number | null;
    tableNo: number | string;
    waiter: string;
    pax: number;
    date: string;
    persistentTxnId: number | null;
    persistentTableId: number;
    outletid?: number | null | undefined;
    currDate?: string;
}

const ReverseKotModal: React.FC<ReverseKotModalProps> = ({
    show,
    onClose,
    onSave,
    kotItems,
    revKotNo,
    tableNo,
    waiter,
    pax,
    date,
    persistentTxnId,
    persistentTableId,
    outletid,
    currDate
}) => {
    const [items, setItems] = useState<any[]>([]);
    const [nextRevKotNo, setNextRevKotNo] = useState<number>((revKotNo ?? 0) + 1);
    const [reasonOptions, setReasonOptions] = useState<string[]>(DEFAULT_REASONS);
    const [customReasonInput, setCustomReasonInput] = useState<{ [key: number]: string }>({});
    
    // Track last used reason
    const [lastUsedReason, setLastUsedReason] = useState<string>('Cancelled by Guest');

    // Refs for navigation
    const cancelRefs = useRef<(HTMLInputElement | null)[]>([]);
    const reasonRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Load saved reasons from localStorage
    useEffect(() => {
        const savedReasons = localStorage.getItem('reverseKotReasons');
        if (savedReasons) {
            try {
                const parsed = JSON.parse(savedReasons);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setReasonOptions(parsed);
                }
            } catch (e) {
                console.error('Failed to parse saved reasons', e);
            }
        }
        
        // Load last used reason from localStorage
        const savedLastReason = localStorage.getItem('reverseKotLastReason');
        if (savedLastReason) {
            setLastUsedReason(savedLastReason);
        }
    }, []);

    // Save reasons to localStorage whenever they change
    const saveReasonsToLocalStorage = (reasons: string[]) => {
        localStorage.setItem('reverseKotReasons', JSON.stringify(reasons));
    };

    // Save last used reason to localStorage
    const saveLastReasonToLocalStorage = (reason: string) => {
        localStorage.setItem('reverseKotLastReason', reason);
        setLastUsedReason(reason);
    };

    // Add new reason to dropdown options and update last used
    const addNewReason = (newReason: string, idx: number) => {
        if (!newReason || newReason.trim() === '') return false;
        
        const trimmedReason = newReason.trim();
        
        // Check if reason already exists (case-insensitive)
        const exists = reasonOptions.some(
            r => r.toLowerCase() === trimmedReason.toLowerCase()
        );
        
        if (!exists) {
            const updatedReasons = [trimmedReason, ...reasonOptions];
            setReasonOptions(updatedReasons);
            saveReasonsToLocalStorage(updatedReasons);
            toast.success(`New reason "${trimmedReason}" added to list`);
        }
        
        // Always update last used reason (even if it exists)
        saveLastReasonToLocalStorage(trimmedReason);
        return true;
    };

    // Handle custom reason input change (for editable dropdown)
    const handleReasonInputChange = (idx: number, value: string) => {
        setCustomReasonInput(prev => ({ ...prev, [idx]: value }));
        
        // Update the item's reason with the custom value
        const updated = [...items];
        updated[idx].reason = value;
        setItems(updated);
        
        // Update last used reason when user types something
        if (value.trim()) {
            saveLastReasonToLocalStorage(value.trim());
        }
    };

    // Set default reason when cancel quantity is entered
    const setDefaultReasonOnEnter = (idx: number) => {
        const updated = [...items];
        // Only set default reason if cancelQty > 0 and reason is empty
        if (updated[idx].cancelQty > 0 && (!updated[idx].reason || updated[idx].reason.trim() === '')) {
            // Use last used reason instead of hardcoded "Cancelled by Guest"
            const defaultReason = lastUsedReason || 'Cancelled by Guest';
            updated[idx].reason = defaultReason;
            setCustomReasonInput(prev => ({ ...prev, [idx]: defaultReason }));
            setItems(updated);
        }
    };

    // ✅ MODIFIED: Handle Enter key on reason input - select the typed reason and move to next
    const handleReasonKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            
            const currentValue = customReasonInput[idx] || items[idx].reason || '';
            
            if (currentValue.trim()) {
                // ✅ Add the typed reason to dropdown list and update last used
                addNewReason(currentValue, idx);
                
                // ✅ Update the item's reason with the typed value (confirm selection)
                const updated = [...items];
                updated[idx].reason = currentValue.trim();
                setItems(updated);
                setCustomReasonInput(prev => ({ ...prev, [idx]: currentValue.trim() }));
                
                // ✅ Show toast to confirm selection
                toast.info(`Reason selected: "${currentValue.trim()}"`);
            }
            
            // Move to next row's Cancel field or Save if last row
            if (idx === items.length - 1) {
                // Last row: trigger save after a small delay
                setTimeout(() => {
                    handleReverseKotSave();
                }, 300);
            } else {
                // Move to next row's Cancel field
                setTimeout(() => {
                    const nextIdx = idx + 1;
                    if (nextIdx < items.length) {
                        cancelRefs.current[nextIdx]?.focus();
                        cancelRefs.current[nextIdx]?.select();
                    }
                }, 100);
            }
        }
    };

    

    // Fetch next reverse KOT number when modal opens
    useEffect(() => {
        const fetchNextRevKot = async () => {
            if (show && outletid) {
                try {
                    const response = await OrderService.fetchGlobalReverseKOTNumber(outletid, currDate);
                    if (response.data?.nextRevKOT) {
                        setNextRevKotNo(response.data.nextRevKOT);
                    }
                } catch (error) {
                    console.error('Error fetching global reverse KOT number:', error);
                    toast.error('Failed to fetch reverse KOT number');
                }
            }
        };
        fetchNextRevKot();
    }, [show, outletid, currDate]);

    useEffect(() => {
        const initialized = kotItems.map(item => {
            const rev = Number(item.revQty ?? item.RevQty ?? 0);
            const rate = Number(item.rate ?? item.RuntimeRate ?? 0);
            
            // Calculate original quantity (qty + already reversed qty)
            const originalQty = Number(item.qty || 0) + rev;
            
            // Preserve all ID fields for Takeaway orders
            const txnDetailId = item.txnDetailId ?? item.TXnDetailID ?? null;
            const itemId = item.itemId ?? item.ItemID ?? null;

            return {
                ...item,
                originalQty: originalQty,
                txnDetailId: txnDetailId,
                TXnDetailID: txnDetailId,
                itemId: itemId,
                ItemID: itemId,
                kotNo: item.kotNo ?? item.mkotNo ?? null,
                reversedQty: rev,
                cancelQty: 0,
                reason: '', // Start with empty reason
                rate: rate,
                amount: rev * rate,
                revKotNo: item.revKotNo || item.RevKOTNo || 0
            };
        });
        setItems(initialized);
        
        // Reset custom reason inputs
        setCustomReasonInput({});
    }, [kotItems]);

    useEffect(() => {
        if (show && cancelRefs.current[0]) {
            cancelRefs.current[0].focus();
        }
    }, [show]);

    const updateQty = (
        idx: number,
        field: 'reversedQty' | 'cancelQty',
        value: number
    ) => {
        const updated = [...items];
        if (field === 'cancelQty') {
            // Limit cancel quantity to remaining available quantity
            const maxCancelQty = (updated[idx].originalQty || updated[idx].qty) - (updated[idx].reversedQty || 0);
            const newCancelQty = Math.min(Number(value), maxCancelQty);
            updated[idx][field] = newCancelQty;
            
            // Clear reason if cancelQty becomes 0
            if (newCancelQty === 0) {
                updated[idx].reason = '';
                setCustomReasonInput(prev => ({ ...prev, [idx]: '' }));
            }
        } else {
            updated[idx][field] = Number(value);
        }

        // Total amount = (already reversed + new cancel) * rate
        const totalQty =
            Number(updated[idx].reversedQty || 0) +
            Number(updated[idx].cancelQty || 0);

        updated[idx].amount = totalQty * Number(updated[idx].rate || 0);
        setItems(updated);
    };

    // Focus next row's Cancel input
    const focusNextCancel = (currentIdx: number) => {
        const nextIdx = currentIdx + 1;
        if (nextIdx < items.length) {
            cancelRefs.current[nextIdx]?.focus();
            cancelRefs.current[nextIdx]?.select();
        } else {
            // Last row: trigger save when Enter pressed on Cancel field
            handleReverseKotSave();
        }
    };

    const handleCancelKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            
            // Get current cancel quantity value
            const currentCancelQty = items[idx].cancelQty || 0;
            
            // If quantity is greater than 0, set default reason and go to Reason field
            if (currentCancelQty > 0) {
                // Set default reason when Enter is pressed on Cancel field
                setDefaultReasonOnEnter(idx);
                setTimeout(() => {
                    reasonRefs.current[idx]?.focus();
                    reasonRefs.current[idx]?.select();
                }, 100);
            } else {
                // If no quantity typed, move to next row's Cancel field (or save if last row)
                focusNextCancel(idx);
            }
        }
    };

    const totalReversedAmount = items.reduce(
        (sum, item) => sum + (item.amount || 0),
        0
    );

    const handleReverseKotSave = () => {
        const filteredItems = items.filter(
            i => Number(i.cancelQty) > 0
        );

        if (filteredItems.length === 0) {
            toast.error('No items selected for reverse');
            return;
        }

        // Validate reasons for all items with cancelQty > 0
        const missingReasonItems = filteredItems.filter(i => !i.reason || i.reason.trim() === '');
        if (missingReasonItems.length > 0) {
            toast.error('Please select/enter reason for all cancelled items');
            return;
        }

        // Prepare data with all required fields for backend
        const reversalData = filteredItems.map(item => ({
            txnDetailId: item.txnDetailId ?? null,
            TXnDetailID: item.TXnDetailID ?? item.txnDetailId ?? null,
            itemId: item.itemId ?? item.ItemID ?? null,
            ItemID: item.ItemID ?? item.itemId ?? null,
            kotNo: item.kotNo ?? null,
            item_no: item.item_no,
            itemName: item.itemName,
            qty: item.cancelQty,
            cancelQty: item.cancelQty,
            rate: item.rate,
            price: item.rate,
            revKotNo: item.revKotNo,
            reason: item.reason || ''
        }));

        console.log('🔍 ReverseKotModal sending:', reversalData);
        
        onSave(reversalData);
        onClose();
    };

    return (
        <Modal show={show} onHide={onClose} size="xl" backdrop="static">
            <Modal.Body
                style={{
                    height: '90vh',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {/* ===== HEADER ===== */}
                <Row className="mb-3">
                    <Col>
                        <h4 className="fw-bold text-primary mb-0">REVERSE KOT</h4>
                    </Col>
                </Row>

                {/* ===== INFO ===== */}
                <Row className="g-2 mb-3 text-center">
                    {[
                        { label: 'TABLE', value: tableNo, highlight: true },
                        { label: 'REV KOT NO', value: nextRevKotNo, highlight: false },
                        { label: 'WAITER', value: waiter, highlight: false },
                        { label: 'PAX', value: pax, highlight: false },
                        { label: 'DATE', value: currDate || date, highlight: false }
                    ].map((info, idx) => (
                        <Col key={idx}>
                            <Card
                                className="py-2"
                                style={{
                                    backgroundColor: info.highlight ? '#e3f2fd' : '#f8f9fa',
                                    border: info.highlight ? '1px solid #90caf9' : '1px solid #dee2e6',
                                    borderRadius: '10px'
                                }}
                            >
                                <div className="text-muted small">{info.label}</div>
                                <div
                                    className="fw-bold"
                                    style={{
                                        fontSize: info.highlight ? '1.6rem' : '1rem',
                                        color: info.highlight ? '#0d6efd' : '#212529'
                                    }}
                                >
                                    {info.value}
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>

                {/* ===== TABLE ===== */}
                <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #dee2e6' }}>
                    <Table bordered hover size="sm" className="mb-0">
                        <thead className="sticky-top" style={{ backgroundColor: '#dc3545' }}>
                            <tr>
                                <th className="text-white">Item Name</th>
                                <th className="text-white">Actual</th>
                                <th className="text-white">Reversed</th>
                                <th className="text-white">Cancel</th>
                                <th className="text-white">Rate</th>
                                <th className="text-white">Total</th>
                                <th className="text-white">KOT</th>
                                <th className="text-white">Reason</th>
                            </tr>
                        </thead>

                        <tbody>
                            {items.map((row, idx) => {
                                // Calculate maximum cancel quantity (original - already reversed)
                                const maxCancelQty = (row.originalQty || row.qty) - (row.reversedQty || 0);
                                const isCancelled = row.cancelQty > 0;
                                
                                return (
                                    <tr key={idx} style={{ backgroundColor: getRowColor(row.mkotNo) }}>
                                        <td>{row.itemName}</td>
                                        
                                        {/* ACTUAL - Original quantity before any reversal */}
                                        <td>{row.originalQty || row.qty}</td>

                                        {/* REVERSED - Already reversed quantity (read-only) */}
                                        <td>
                                            <Form.Control
                                                type="number"
                                                size="sm"
                                                min={0}
                                                max={row.originalQty || row.qty}
                                                value={row.reversedQty}
                                                readOnly
                                                tabIndex={-1}
                                                className="bg-light"
                                                style={{ cursor: 'not-allowed' }}
                                            />
                                        </td>

                                        {/* CANCEL - New reversal quantity (user editable) */}
                                        <td>
                                            <Form.Control
                                                type="number"
                                                size="sm"
                                                min={0}
                                                max={maxCancelQty}
                                                value={row.cancelQty}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateQty(idx, 'cancelQty', +e.target.value)}
                                                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => handleCancelKeyDown(idx, e)}
                                                ref={(el: HTMLInputElement | null) => { cancelRefs.current[idx] = el; }}
                                            />
                                        </td>

                                        <td>{row.rate}</td>
                                        <td>{row.amount.toFixed(2)}</td>

                                        <td>
                                            {row.revKotNo ? (
                                                <div className="d-flex flex-wrap gap-1 justify-content-center">
                                                    <Badge bg="danger">{row.revKotNo}</Badge>
                                                </div>
                                            ) : row.mkotNo ? (
                                                <div className="d-flex flex-wrap gap-1 justify-content-center">
                                                    {row.mkotNo.split('|').map((kot: string, i: number) => (
                                                        <Badge key={i} bg="secondary">{kot}</Badge>
                                                    ))}
                                                </div>
                                            ) : null}
                                        </td>

                                        <td style={{ minWidth: '250px' }}>
                                            {/* Editable combobox - type directly in dropdown */}
                                            <Form.Control
                                                as="input"
                                                list={`reason-list-${idx}`}
                                                type="text"
                                                size="sm"
                                                placeholder={isCancelled ? "Type or select reason..." : ''}
                                                value={customReasonInput[idx] !== undefined ? customReasonInput[idx] : (row.reason || '')}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                    handleReasonInputChange(idx, e.target.value);
                                                }}
                                                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => handleReasonKeyDown(idx, e)}
                                                onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                                    // Update last used reason when focus leaves and value exists
                                                    if (e.target.value.trim()) {
                                                        saveLastReasonToLocalStorage(e.target.value.trim());
                                                        
                                                        // ✅ Confirm selection on blur
                                                        const updated = [...items];
                                                        updated[idx].reason = e.target.value.trim();
                                                        setItems(updated);
                                                        setCustomReasonInput(prev => ({ ...prev, [idx]: e.target.value.trim() }));
                                                    }
                                                }}
                                                disabled={!isCancelled}
                                                style={{ 
                                                    backgroundColor: !isCancelled ? '#fff' : '#fff'
                                                }}
                                                ref={(el: HTMLInputElement | null) => { reasonRefs.current[idx] = el; }}
                                            />
                                            
                                            {/* Datalist for dropdown options */}
                                            <datalist id={`reason-list-${idx}`}>
                                                {reasonOptions.map((reason, ridx) => (
                                                    <option key={ridx} value={reason} />
                                                ))}
                                            </datalist>
                                            
                                            {isCancelled && (
                                                <div className="text-muted small mt-1">
                                                    💡 Type reason & press Enter to add to list
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>
                </div>

                {/* ===== TOTAL ===== */}
                <Row className="justify-content-end align-items-center mt-2">
                    <Col xs="auto" className="fw-bold">
                        TOTAL REVERSED AMOUNT :
                    </Col>
                    <Col xs="auto">
                        <Form.Control
                            size="sm"
                            value={totalReversedAmount.toFixed(2)}
                            disabled
                            style={{ width: '120px', textAlign: 'right', fontWeight: 'bold' }}
                        />
                    </Col>
                    <Col xs="auto" className="fw-bold">Rs.</Col>
                </Row>

                {/* ===== FOOTER ===== */}
                <div className="d-flex justify-content-end gap-2 mt-3">
                    <Button variant="primary" onClick={handleReverseKotSave}>
                        Save
                    </Button>
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                </div>
            </Modal.Body>
        </Modal>
    );
};

export default ReverseKotModal;