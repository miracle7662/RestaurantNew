// components/CheckIn/GuestDocumentsModal.tsx
import { Modal, Row, Col, Badge, Button } from 'react-bootstrap'
import { useState } from 'react'

type DocumentType = {
  document_id: number
  document_type: string
  document_no: string
  front_side: string | null
  front_side_url?: string | null
  back_side: string | null
  back_side_url?: string | null
}

interface Props {
  show: boolean
  onHide: () => void
  documents: DocumentType[]
  guestName?: string
}

const GuestDocumentsModal = ({ show, onHide, documents = [], guestName }: Props) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  // Separate guest photo from other documents
  const guestPhoto = documents.find(doc => doc.document_type === 'Guest Photo')
  const otherDocuments = documents.filter(doc => doc.document_type !== 'Guest Photo')

  // Helper function to get image URL
  const getImageUrl = (doc: DocumentType, side: 'front' | 'back'): string | null => {
    if (side === 'front') {
      return doc.front_side_url || doc.front_side
    }
    return doc.back_side_url || doc.back_side
  }

  const handleImageClick = (url: string) => {
    setSelectedImage(url)
    setShowPreview(true)
  }

  return (
    <>
      <Modal show={show} onHide={onHide} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className="w-100 text-center">
            Guest Documents {guestName && `- ${guestName}`}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {/* Guest Photo Section - Only Latest */}
          {guestPhoto && (
            <div
              className="mb-3 p-2"
              style={{
                border: '2px solid #0d6efd',
                borderRadius: '10px',
                background: '#e7f1ff',
              }}
            >
              <div className="mb-2 d-flex justify-content-between align-items-center">
                <Badge bg="primary" className="fs-6">
                  📸 Guest Photo (Latest)
                </Badge>
              </div>
              <div
                style={{
                  border: '1px solid #0d6efd',
                  borderRadius: '8px',
                  padding: '10px',
                  minHeight: '250px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#fff',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  const imgUrl = getImageUrl(guestPhoto, 'front')
                  if (imgUrl) handleImageClick(imgUrl)
                }}
              >
                {getImageUrl(guestPhoto, 'front') ? (
                  <img
                    src={getImageUrl(guestPhoto, 'front') || ''}
                    alt="Guest Photo"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '300px',
                      objectFit: 'contain',
                    }}
                  />
                ) : (
                  <div className="text-muted">No Image</div>
                )}
              </div>
              <div className="mt-2 text-muted small text-center">
                Document No: {guestPhoto.document_no}
              </div>
            </div>
          )}

          {/* Other Documents Section */}
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

          {documents.length === 0 && (
            <div className="text-center text-muted py-4">No documents found</div>
          )}
        </Modal.Body>

        <Modal.Footer className="justify-content-center">
          <Button variant="secondary" size="sm" onClick={onHide}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Image Preview Modal */}
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