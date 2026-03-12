import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  isLoading?: boolean;
};

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  hasNextPage,
  hasPreviousPage,
  isLoading = false,
}: PaginationProps) {
  const handleFirstPage = () => {
    if (!isLoading && hasPreviousPage) {
      onPageChange(1);
    }
  };

  const handlePreviousPage = () => {
    if (!isLoading && hasPreviousPage) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (!isLoading && hasNextPage) {
      onPageChange(currentPage + 1);
    }
  };

  const handleLastPage = () => {
    if (!isLoading && hasNextPage) {
      onPageChange(totalPages);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={handleFirstPage}
          disabled={!hasPreviousPage || isLoading}
          aria-label="First page"
        >
          <ChevronsLeft />
        </Button>

        <Button
          variant="outline"
          size="icon-sm"
          onClick={handlePreviousPage}
          disabled={!hasPreviousPage || isLoading}
          aria-label="Previous page"
        >
          <ChevronLeft />
        </Button>

        <Button
          variant="outline"
          size="icon-sm"
          onClick={handleNextPage}
          disabled={!hasNextPage || isLoading}
          aria-label="Next page"
        >
          <ChevronRight />
        </Button>

        <Button
          variant="outline"
          size="icon-sm"
          onClick={handleLastPage}
          disabled={!hasNextPage || isLoading}
          aria-label="Last page"
        >
          <ChevronsRight />
        </Button>
      </div>
    </div>
  );
}
