import React, { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import { toast } from 'react-hot-toast'
import { Button, Card, Stack } from 'react-bootstrap'
import { Preloader } from '@/components/Misc/Preloader'
import {
  InvoiceAsideHeader,
  InvoiceAsideCreate,
  InvoiceAsideSearch,
  InvoiceAsideList,
  InvoiceContentDetails,
  InvoiceContentHeader,
  InvoiceSendOffcanvas,
  InvoiceCreateContent,
} from '@/components/Apps/Invoice'
import InvoiceItems from '@/components/Apps/Invoice/data/invoiceItems'
import TitleHelmet from '@/components/Common/TitleHelmet'

const Invoice: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false)
  const [invoiceItems, setInvoiceItems] = useState<any[]>(InvoiceItems)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [showSendOptions, setShowSendOptions] = useState<boolean>(false)
  const [showInvoiceCreateContent, setShowInvoiceCreate] = useState<boolean>(false)
  const [containerToggle, setContainerToggle] = useState<boolean>(false)
  const [sidebarLeftToggle, setSidebarLeftToggle] = useState<boolean>(false)

  const handleCreateInvoice = () => {
    setContainerToggle(true)
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setShowInvoiceCreate(true)
      setSelectedInvoice(null)
    }, 1000)
  }

  const handleDeleteInvoice = (invoiceId?: string) => {
    if (invoiceId) {
      Swal.fire({
        title: 'Are you sure?',
        text: 'You will not be able to recover this invoice!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3E97FF',
        confirmButtonText: 'Yes, delete it!',
      }).then((result) => {
        if (result.isConfirmed) {
          setLoading(true)

          setTimeout(() => {
            const updatedInvoiceItems = invoiceItems.filter(
              (invoice: any) => invoice.id !== invoiceId,
            )
            setInvoiceItems(updatedInvoiceItems)
            if (selectedInvoice && selectedInvoice.id === invoiceId) {
              setSelectedInvoice(null)
            }
            setLoading(false)
            setContainerToggle(false)
            setSidebarLeftToggle(false)
            toast.success('Invoice deleted successfully')
          }, 1500)
        }
      })
    }
  }

  const handleSendClick = () => {
    setShowSendOptions(true)
  }

  useEffect(() => {
    if (containerToggle) {
      document.querySelector('.apps-card')?.classList.add('apps-container-toggle')
    } else {
      document.querySelector('.apps-card')?.classList.remove('apps-container-toggle')
    }
  }, [containerToggle])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 991.98 && sidebarLeftToggle) {
        document.querySelector('.apps-card')?.classList.remove('apps-sidebar-left-toggle')
      }
    }

    if (sidebarLeftToggle) {
      document.querySelector('.apps-card')?.classList.add('apps-sidebar-left-toggle')
    } else {
      document.querySelector('.apps-card')?.classList.remove('apps-sidebar-left-toggle')
    }

    handleResize()

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [sidebarLeftToggle])

  return (
    <>
      <TitleHelmet title="Invoice" />
      <Card
        className={`apps-card  ${selectedInvoice ? 'apps-container-toggle' : ''} ${
          sidebarLeftToggle ? 'apps-sidebar-left-toggle' : ''
        }`}
      >
        <div className="apps-sidebar apps-sidebar-left apps-sidebar-md">
          <InvoiceAsideHeader />
          <InvoiceAsideCreate handleCreateInvoice={handleCreateInvoice} />
          <InvoiceAsideSearch onSearch={setSearchQuery} />
          <InvoiceAsideList
            invoiceItems={invoiceItems}
            selectedInvoice={selectedInvoice}
            setSelectedInvoice={setSelectedInvoice}
            setShowInvoiceCreate={setShowInvoiceCreate}
            setLoading={setLoading}
            searchQuery={searchQuery}
            onDeleteInvoice={handleDeleteInvoice}
            setContainerToggle={setContainerToggle}
          />
        </div>
        <div className="apps-container">
          <div className="apps-container-inner">
            {loading ? (
              <Stack className="align-items-center justify-content-center flex-grow-1 h-100 ">
                <Preloader />
              </Stack>
            ) : (
              <>
                {showInvoiceCreateContent ? (
                  <InvoiceCreateContent
                    handleSendClick={handleSendClick}
                    setSelectedInvoice={setSelectedInvoice}
                    setShowInvoiceCreate={setShowInvoiceCreate}
                    sidebarLeftToggle={sidebarLeftToggle}
                    setSidebarLeftToggle={setSidebarLeftToggle}
                  />
                ) : !selectedInvoice ? (
                  <Stack
                    className="d-none d-lg-flex align-items-center justify-content-center flex-grow-1 h-100 mx-auto text-center"
                    style={{ maxWidth: '320px' }}
                  >
                    <i className="fi fi-rr-file-invoice-dollar fs-48 mb-6"></i>
                    <h4 className="fw-bold">Create new invoice</h4>
                    <p className="fs-15 fw-light text-muted mb-4">
                      Pick a person or group from the left sidebar invoice list and start your
                      conversation.
                    </p>
                    <Button variant="" className="btn-neutral" onClick={handleCreateInvoice}>
                      <i className="fi fi-br-plus fs-10"></i>
                      <span className="ms-2">Create Invoice</span>
                    </Button>
                  </Stack>
                ) : (
                  <>
                    <InvoiceContentHeader
                      selectedInvoice={selectedInvoice}
                      handleSendClick={handleSendClick}
                      onDeleteInvoice={handleDeleteInvoice}
                      setSelectedInvoice={setSelectedInvoice}
                      setContainerToggle={setContainerToggle}
                      sidebarLeftToggle={sidebarLeftToggle}
                      setSidebarLeftToggle={setSidebarLeftToggle}
                    />
                    <InvoiceContentDetails selectedInvoice={selectedInvoice} colSpan={2} />
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </Card>
      <InvoiceSendOffcanvas
        showSendOptions={showSendOptions}
        handleCloseSendOptions={() => setShowSendOptions(false)}
      />
    </>
  )
}
export default Invoice
