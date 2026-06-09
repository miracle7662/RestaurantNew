// components/CheckIn/GuestDocumentsModal.tsx
import { Modal, Row, Col, Badge, Button } from 'react-bootstrap'
import { useState } from 'react'
import GuestService from '@/common/hotel/guest'
import { toast } from 'react-hot-toast'

type DocumentType = {
  document_id: number
  document_type: string
  document_no: string
  front_side: string | null
  front_side_url?: string | null
  back_side: string | null
  back_side_url?: string | null
  // Guest photo is stored in guest_photo / guest_photo_url columns
  guest_photo?: string | null
  guest_photo_url?: string | null
}

interface Props {
  show: boolean
  onHide: () => void
  documents: DocumentType[]
  guestName?: string
  guestId?: number
  onDocumentsChange?: () => void
  /**
   * Temporary guest photo captured via DocumentScannerModal but not yet
   * saved to DB (waiting for F9 Check-In to complete).
   * When provided, it is shown as a "Pending – Not Saved Yet" preview
   * inside the Guest Photo section so the user can confirm the capture
   * before finalising check-in.
   */
  tempGuestPhoto?: string | null
}

const GuestDocumentsModal = ({
  show,
  onHide,
  documents = [],
  guestName,
  guestId,
  onDocumentsChange,
  tempGuestPhoto,
}: Props) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [removingPhoto, setRemovingPhoto] = useState(false)

  // Separate guest photo from other documents
  const guestPhoto = documents.find((doc) => doc.document_type === 'Guest Photo')
  const otherDocuments = documents.filter((doc) => doc.document_type !== 'Guest Photo')

  // For Guest Photo type: read from guest_photo_url / guest_photo column (not front_side)
  // For all other docs: read from front_side_url / front_side or back_side_url / back_side
  const getImageUrl = (doc: DocumentType, side: 'front' | 'back'): string | null => {
    if (doc.document_type === 'Guest Photo') {
      return doc.guest_photo_url || doc.guest_photo || null
    }
    if (side === 'front') {
      return doc.front_side_url || doc.front_side || null
    }
    return doc.back_side_url || doc.back_side || null
  }

  const handleImageClick = (url: string) => {
    setSelectedImage(url)
    setShowPreview(true)
  }

  const handleRemovePhoto = async () => {
    if (!guestId || !guestPhoto) return
    setRemovingPhoto(true)
    try {
      await GuestService.deleteGuestPhoto(guestId)
      toast.success('Guest photo removed')
      onDocumentsChange?.()
    } catch (error) {
      console.error('Failed to remove guest photo:', error)
      toast.error('Failed to remove photo')
    } finally {
      setRemovingPhoto(false)
    }
  }

  // ─── Resolve which photo to show in the Guest Photo section ───────────────
  // Priority:
  //   1. tempGuestPhoto  — just captured, pending F9 save (shown with a warning badge)
  //   2. guestPhoto from DB — previously saved permanent photo
  //   3. Nothing          — show "No Image" placeholder
  const savedPhotoUrl = guestPhoto ? getImageUrl(guestPhoto, 'front') : null
  const displayPhotoUrl: string | null = tempGuestPhoto || savedPhotoUrl || null
  const isTempPhoto = !!tempGuestPhoto && !savedPhotoUrl // captured this session, not yet in DB
  const showGuestPhotoSection = !!(tempGuestPhoto || guestPhoto)

  return (
    <>
      <Modal show={show} onHide={onHide} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className="w-100 text-center">
            Guest Documents {guestName && `- ${guestName}`}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>

          {/* ── Guest Photo Section ─────────────────────────────────────────── */}
          {showGuestPhotoSection && (
            <div
              className="mb-3 p-2"
              style={{
                border: `2px solid ${isTempPhoto ? '#fd7e14' : '#0d6efd'}`,
                borderRadius: '10px',
                background: isTempPhoto ? '#fff8f0' : '#e7f1ff',
              }}
            >
              <div className="mb-2 d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div className="d-flex align-items-center gap-2">
                  <Badge bg={isTempPhoto ? 'warning' : 'primary'} className="fs-6">
                    📸 Guest Photo {isTempPhoto ? '(Pending – Not Saved Yet)' : '(Saved)'}
                  </Badge>
                  {isTempPhoto && (
                    <span
                      className="small text-warning fw-semibold"
                      style={{ fontSize: '11px' }}>
                      ⚠ Will be saved permanently after Check-In (F9)
                    </span>
                  )}
                </div>

                {/* Remove button — only for already-saved DB photos, not temp ones */}
                {!isTempPhoto && guestId && savedPhotoUrl && (
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={handleRemovePhoto}
                    disabled={removingPhoto}
                    style={{ fontSize: '12px' }}>
                    {removingPhoto ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status" />
                        Removing...
                      </>
                    ) : (
                      <>❌ Remove Photo</>
                    )}
                  </Button>
                )}
              </div>

              {/* Photo display area */}
              <div
                style={{
                  border: `1px solid ${isTempPhoto ? '#fd7e14' : '#0d6efd'}`,
                  borderRadius: '8px',
                  padding: '10px',
                  minHeight: '250px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#fff',
                  cursor: displayPhotoUrl ? 'pointer' : 'default',
                  position: 'relative',
                }}
                onClick={() => {
                  if (displayPhotoUrl) handleImageClick(displayPhotoUrl)
                }}
              >
                {displayPhotoUrl ? (
                  <>
                    <img
                      src={displayPhotoUrl}
                      alt="Guest Photo"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '300px',
                        objectFit: 'contain',
                        opacity: isTempPhoto ? 0.92 : 1,
                      }}
                    />
                    {/* Overlay ribbon for pending photos */}
                    {isTempPhoto && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          background: '#fd7e14',
                          color: '#fff',
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          pointerEvents: 'none',
                        }}>
                        PENDING SAVE
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-muted">No Image</div>
                )}
              </div>

              <div className="mt-2 text-muted small text-center">
                {isTempPhoto
                  ? 'Captured this session — complete Check-In (F9) to save permanently'
                  : `Document No: ${guestPhoto?.document_no ?? ''}`}
              </div>
            </div>
          )}

          {/* ── Other Documents Section ─────────────────────────────────────── */}
          {otherDocuments.length > 0 && (
            <>
              <div className="mb-2">
                <Badge bg="secondary">Other Documents ({otherDocuments.length})</Badge>
              </div>
              {otherDocuments.map((doc, index) => (
                <div
                  key={index}
                  className="mb-2 p-2"
                  style={{
                    border: '1px solid #dee2e6',
                    borderRadius: '10px',
                    background: '#f8f9fa',
                  }}
                >
                  <div className="mb-2 text-center">
                    <Badge bg="info" className="me-1">{doc.document_type}</Badge>
                    <span className="text-muted">No: {doc.document_no}</span>
                  </div>

                  <Row className="justify-content-center align-items-center text-center">
                    {/* FRONT SIDE */}
                    <Col md={getImageUrl(doc, 'back') ? 6 : 12}>
                      <div
                        style={{
                          border: '1px dashed #6c757d',
                          borderRadius: '8px',
                          padding: '10px',
                          minHeight: '220px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: '#fff',
                          cursor: getImageUrl(doc, 'front') ? 'pointer' : 'default',
                        }}
                        onClick={() => {
                          const imgUrl = getImageUrl(doc, 'front')
                          if (imgUrl) handleImageClick(imgUrl)
                        }}
                      >
                        {getImageUrl(doc, 'front') ? (
                          <img
                            src={getImageUrl(doc, 'front') || ''}
                            alt="Front"
                            style={{
                              maxWidth: '100%',
                              maxHeight: '200px',
                              objectFit: 'contain',
                            }}
                          />
                        ) : (
                          <div className="text-muted">No Image</div>
                        )}
                      </div>
                      <div className="text-center mt-1 small">Front Side</div>
                    </Col>

                    {/* BACK SIDE - only if exists */}
                    {getImageUrl(doc, 'back') && (
                      <Col md={6}>
                        <div
                          style={{
                            border: '1px dashed #6c757d',
                            borderRadius: '8px',
                            padding: '10px',
                            minHeight: '220px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#fff',
                            cursor: 'pointer',
                          }}
                          onClick={() => {
                            const imgUrl = getImageUrl(doc, 'back')
                            if (imgUrl) handleImageClick(imgUrl)
                          }}
                        >
                          <img
                            src={getImageUrl(doc, 'back') || ''}
                            alt="Back"
                            style={{
                              maxWidth: '100%',
                              maxHeight: '200px',
                              objectFit: 'contain',
                            }}
                          />
                        </div>
                        <div className="text-center mt-1 small">Back Side</div>
                      </Col>
                    )}
                  </Row>
                </div>
              ))}
            </>
          )}

          {/* Empty state — no DB docs AND no temp photo */}
          {documents.length === 0 && !tempGuestPhoto && (
            <div className="text-center text-muted py-4">No documents found</div>
          )}
        </Modal.Body>

        <Modal.Footer className="justify-content-center">
          <Button variant="secondary" size="sm" onClick={onHide}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── Image Preview Modal ─────────────────────────────────────────────── */}
      <Modal show={showPreview} onHide={() => setShowPreview(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Image Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Preview"
              style={{ maxWidth: '100%', maxHeight: '80vh' }}
            />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPreview(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default GuestDocumentsModal