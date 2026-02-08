import Skeleton from './Skeleton';

const SkeletonStat = () => {
  return (
    <div className="bg-white shadow rounded-lg p-3 sm:p-4 lg:p-6">
      <Skeleton className="h-4 w-20 mb-2" />
      <Skeleton className="h-8 w-24 mb-1" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
};

export default SkeletonStat;
