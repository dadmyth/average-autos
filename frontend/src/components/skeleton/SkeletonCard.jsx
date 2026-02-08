import Skeleton from './Skeleton';

const SkeletonCard = () => {
  return (
    <div className="bg-white shadow rounded-lg p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-2 sm:mb-3">
        <Skeleton variant="title" className="h-5 sm:h-6 w-32" />
        <Skeleton variant="button" className="h-6 w-16" />
      </div>

      {/* Details */}
      <div className="space-y-1 sm:space-y-1.5 mb-3 sm:mb-4">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-28" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>

      {/* Button */}
      <Skeleton className="h-10 w-full" />
    </div>
  );
};

export default SkeletonCard;
