import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from 'antd'

interface PaginationProps {
  currentPage: number
  hasNext: boolean
  hasPrevious: boolean
  totalCount: number
  pageSize: number
  onPageChange: (page: number) => void
  isLoading?: boolean
}

export default function Pagination({
  currentPage,
  hasNext,
  hasPrevious,
  totalCount,
  pageSize,
  onPageChange,
  isLoading = false,
}: PaginationProps) {
  const totalPages = Math.ceil(totalCount / pageSize)
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalCount)

  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="text-sm text-gray-600">
        Showing {startItem} to {endItem} of {totalCount} results
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrevious || isLoading}
          icon={<ChevronLeft className="h-4 w-4" />}
        >
          Previous
        </Button>

        <div className="flex items-center gap-1">
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
        </div>

        <Button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNext || isLoading}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
