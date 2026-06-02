import { Button, Form } from 'react-bootstrap'

interface PaginationProps {
  currentPage: number
  totalPages: number
  pageSize: number
  onPageSizeChange: (size: number) => void
  onPageChange: (page: number) => void
  pageSizeOptions?: number[]
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  pageSize,
  onPageSizeChange,
  onPageChange,
  pageSizeOptions = [10, 25, 50],
}) => {
  return (
    <div className="d-flex justify-content-between align-items-center mt-3">
      <Form.Select
        style={{ maxWidth: 80 }}
        value={pageSize}
        onChange={(event) => onPageSizeChange(Number(event.target.value))}>
        {pageSizeOptions.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </Form.Select>
      <div className="d-flex align-items-center gap-2">
        <Button
          variant="outline-light"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}>
          {'<'}
        </Button>
        <Button variant="danger" size="sm">
          {currentPage}
        </Button>
        <Button
          variant="outline-light"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}>
          {'>'}
        </Button>
      </div>
    </div>
  )
}

export default Pagination
