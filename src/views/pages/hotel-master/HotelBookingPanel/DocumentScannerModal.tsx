import React, { useEffect, useRef, useCallback, useState } from 'react'
import { Modal, Button } from 'react-bootstrap'
import { toast } from 'react-hot-toast'

interface DocumentScannerModalProps {
  show: boolean
  onHide: () => void
  onCapture: (imageDataUrl: string) => void
  uploading?: boolean
  guestName: string
}

const DocumentScannerModal: React.FC<DocumentScannerModalProps> = ({
  show,
  onHide,
  onCapture,
  uploading = false,
  guestName,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [cameraKey, setCameraKey] = useState(0)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isStartingCamera, setIsStartingCamera] = useState(false)

  // 🔴 Stop Camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  // 🟢 Start Camera
  const startCamera = useCallback(async () => {
    stopCamera()

    setIsStartingCamera(true)
    setError(null)
    setHasPermission(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setHasPermission(true)
    } catch (err: any) {
      console.error('Camera error:', err)
      setError(err.message || 'Camera access denied')
      setHasPermission(false)
      toast.error('Camera access required')
    } finally {
      setIsStartingCamera(false)
    }
  }, [stopCamera])

  // 🔄 Restart Camera
  const restartCamera = useCallback(() => {
    setCapturedImage(null)
    setCameraKey((prev) => prev + 1)
    setTimeout(() => {
      startCamera()
    }, 100)
  }, [startCamera])

  // 📸 Capture Photo
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9)
    setCapturedImage(imageDataUrl)
  }, [])

  // 💾 Upload Photo
  const uploadPhoto = useCallback(() => {
    if (!capturedImage) return
    onCapture(capturedImage)
  }, [capturedImage, onCapture])

  // 🎬 Modal Open/Close
  useEffect(() => {
    if (show) {
      setCapturedImage(null)
      setError(null)
      setHasPermission(null)

      setTimeout(() => {
        startCamera()
      }, 200)
    } else {
      stopCamera()
      setCapturedImage(null)
      setError(null)
      setHasPermission(null)
      setCameraKey((prev) => prev + 1)
    }
  }, [show, startCamera, stopCamera])

  // Cleanup
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      backdrop="static"
      animation={false}
      size="sm"
    >
      <Modal.Header
        closeButton={!capturedImage}
        className="bg-primary text-white px-2 py-2"
        closeVariant="white"
      >
        <Modal.Title className="fs-6 w-100 text-start text-white">
          Capture Guest Photo - {guestName}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-2 text-center">
        {isStartingCamera && !capturedImage && (
          <div
            className="d-flex justify-content-center align-items-center"
            style={{ height: '350px' }}
          >
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Starting camera...</span>
            </div>
          </div>
        )}

        {hasPermission === false && !isStartingCamera && (
          <div className="alert alert-danger py-2">
            {error || 'Camera access denied. Please check permissions.'}
            <Button
              size="sm"
              variant="outline-danger"
              className="mt-2 d-block mx-auto"
              onClick={restartCamera}
            >
              Retry
            </Button>
          </div>
        )}

        {capturedImage ? (
          <img
            src={capturedImage}
            alt="Captured guest"
            className="rounded"
            style={{
              width: '100%',
              height: '350px',
              objectFit: 'cover',
            }}
          />
        ) : (
          <video
            key={cameraKey}
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="rounded"
            style={{
              width: '100%',
              height: '350px',
              objectFit: 'cover',
              background: '#000',
              display: isStartingCamera ? 'none' : 'block',
            }}
          />
        )}
      </Modal.Body>

      <Modal.Footer className="px-2 py-3 d-flex justify-content-center gap-3">
        {!capturedImage && !isStartingCamera && hasPermission !== false && (
          <Button
            onClick={capturePhoto}
            variant="primary"
            size="lg"
            className="rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: 70, height: 70 }}
          >
            <i className="fi fi-rr-camera fs-2"></i>
          </Button>
        )}

        {capturedImage && (
          <>
            <Button
              variant="warning"
              onClick={restartCamera}
              disabled={uploading}
              className="px-4"
            >
              <i className="fi fi-rr-refresh me-2"></i>
              Retake
            </Button>

            <Button
              variant="success"
              onClick={uploadPhoto}
              disabled={uploading}
              className="px-4"
            >
              {uploading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                  ></span>
                  Saving...
                </>
              ) : (
                <>
                  <i className="fi fi-rr-check me-2"></i>
                  Save Photo
                </>
              )}
            </Button>
          </>
        )}
      </Modal.Footer>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </Modal>
  )
}

export default DocumentScannerModal