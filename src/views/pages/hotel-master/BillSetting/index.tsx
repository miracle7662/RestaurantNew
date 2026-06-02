// pages/BillPrintSetting/index.tsx
import { useState, useEffect } from 'react';
import { Card, Button, Tabs, Tab, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import TitleHelmet  from '@/components/Common/TitleHelmet';
import toast from 'react-hot-toast';
import { useAuthContext } from '@/common/context/useAuthContext';
import BillPrintSettingService, { BillPrintSetting } from '@/common/hotel/billPrintSettingService';
import BillSettingForm from './BillSettingForm';
import BillPreviewModal from './BillPreviewModal';

const BillPrintSettingMaster = () => {
    const navigate = useNavigate();
    const { user } = useAuthContext();
    const hotelId = user?.hotel_id;

    const [settings, setSettings] = useState<BillPrintSetting | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [activeTab, setActiveTab] = useState('general');

    const loadSettings = async () => {
        if (!hotelId) return;
        
        setLoading(true);
        try {
            const response = await BillPrintSettingService.getByHotelId(hotelId);
            if (response.success && response.data) {
                setSettings(response.data);
            } else {
                setSettings(null);
            }
        } catch (error: any) {
            console.error('Failed to load settings:', error);
            if (error.response?.status === 404) {
                setSettings(null);
            } else {
                toast.error('Failed to load bill print settings');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (hotelId) {
            loadSettings();
        }
    }, [hotelId]);

    const handleSave = async (formData: Partial<BillPrintSetting>) => {
        if (!hotelId) {
            toast.error('Hotel ID not found');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                ...formData,
                hotelid: hotelId,
                updated_by_id: user?.id,
                created_by_id: user?.id,
            };

            let response;
            if (settings?.setting_id) {
                response = await BillPrintSettingService.updateByHotelId(hotelId, payload);
            } else {
                response = await BillPrintSettingService.create(payload);
            }

            if (response.success) {
                setSettings(response.data);
                toast.success('Bill print settings saved successfully');
            } else {
                toast.error(response.message || 'Failed to save settings');
            }
        } catch (error: any) {
            console.error('Failed to save settings:', error);
            toast.error(error.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handlePreview = () => {
        setShowPreview(true);
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <Spinner animation="border" variant="primary" />
                <span className="ms-2">Loading settings...</span>
            </div>
        );
    }

    return (
        <>
            <TitleHelmet title="Bill Print Settings" />
            
            <div className="mb-1 d-flex justify-content-between align-items-center">
                <div>
                    <h4 className="mb-1">Bill Print Settings</h4>
                </div>
                <div className="d-flex gap-2">
                    <Button variant="outline-primary" onClick={handlePreview}>
                        <i className="fi fi-rr-eye me-1"></i> Preview Bill
                    </Button>
                </div>
            </div>

            <Card>
                <Card.Body>
                    <Tabs
                        activeKey={activeTab}
                        onSelect={(k) => setActiveTab(k || 'general')}
                        className="mb-3"
                    >
                        <Tab eventKey="general" title="General Settings">
                            <BillSettingForm
                                settings={settings}
                                onSave={handleSave}
                                saving={saving}
                                section="general"
                            />
                        </Tab>
                        <Tab eventKey="header" title="Header & Logo">
                            <BillSettingForm
                                settings={settings}
                                onSave={handleSave}
                                saving={saving}
                                section="header"
                            />
                        </Tab>
                        <Tab eventKey="sections" title="Sections Position">
                            <BillSettingForm
                                settings={settings}
                                onSave={handleSave}
                                saving={saving}
                                section="sections"
                            />
                        </Tab>
                        <Tab eventKey="fields" title="Fields Visibility">
                            <BillSettingForm
                                settings={settings}
                                onSave={handleSave}
                                saving={saving}
                                section="fields"
                            />
                        </Tab>
                        <Tab eventKey="table" title="Table Settings">
                            <BillSettingForm
                                settings={settings}
                                onSave={handleSave}
                                saving={saving}
                                section="table"
                            />
                        </Tab>
                        <Tab eventKey="footer" title="Footer & Messages">
                            <BillSettingForm
                                settings={settings}
                                onSave={handleSave}
                                saving={saving}
                                section="footer"
                            />
                        </Tab>
                        <Tab eventKey="print" title="Print Size & Paper">
                            <BillSettingForm
                                settings={settings}
                                onSave={handleSave}
                                saving={saving}
                                section="print"
                            />
                        </Tab>
                    </Tabs>
                </Card.Body>
            </Card>

            <BillPreviewModal
                show={showPreview}
                onHide={() => setShowPreview(false)}
                settings={settings}
                hotelId={hotelId}
            />
        </>
    );
};

export default BillPrintSettingMaster;