import React from 'react';
import { Form, Pagination } from 'react-bootstrap';

interface PaginationComponentProps {
  totalItems: number;
  pageSize: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const PaginationComponent: React.FC<PaginationComponentProps> = ({
  totalItems,
  pageSize,
  currentPage,
  onPageChange,
  onPageSizeChange,
}) => {
  const totalPages = Math.ceil(totalItems / pageSize);

  const getPaginationItems = () => {
    const items = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <Pagination.Item
          key={i}
          active={i === currentPage}
          onClick={() => onPageChange(i)}
        >
          {i}
        </Pagination.Item>
      );
    }
    return items;
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onPageSizeChange(parseInt(e.target.value));
  };

  return (
    <div className="d-flex justify-content-between align-items-center">
      <div>
        <Form.Select
          value={pageSize}
          onChange={handlePageSizeChange}
          style={{ width: '100px', display: 'inline-block', marginRight: '10px' }}
        >
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
        </Form.Select>
        <span className="text-muted">
          Showing {Math.min(pageSize, totalItems - (currentPage - 1) * pageSize)} of {totalItems} entries
        </span>
      </div>
      <Pagination>
        <Pagination.Prev
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        />
        {getPaginationItems()}
        <Pagination.Next
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        />
      </Pagination>
    </div>
  );
};

export default PaginationComponent;
