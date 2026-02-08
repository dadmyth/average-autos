import Skeleton from './Skeleton';

const SkeletonTable = ({ rows = 5, columns = 5 }) => {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-b border-gray-200">
        <Skeleton variant="title" className="h-5 w-32" />
      </div>

      {/* Table header */}
      <div className="hidden sm:block bg-gray-50 border-b border-gray-200 px-6 py-3">
        <div className="grid grid-cols-5 gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4" />
          ))}
        </div>
      </div>

      {/* Table rows */}
      <div className="divide-y divide-gray-200">
        {/* Desktop rows */}
        <div className="hidden sm:block">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="px-6 py-4">
              <div className="grid grid-cols-5 gap-4">
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <Skeleton key={colIndex} className="h-4" />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden space-y-2 p-4">
          {Array.from({ length: Math.min(rows, 3) }).map((_, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-3">
              <div className="flex justify-between items-start mb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex gap-2 mb-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SkeletonTable;
