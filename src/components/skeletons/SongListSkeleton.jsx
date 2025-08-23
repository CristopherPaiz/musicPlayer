import Skeleton from "./Skeleton";

const SongListItemSkeleton = () => (
  <div className="flex items-center gap-4 p-2 my-1">
    <Skeleton className="size-12 rounded-md flex-shrink-0" />
    <div className="flex-grow">
      <Skeleton className="h-5 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2" />
    </div>
    <Skeleton className="h-5 w-12 hidden sm:block" />
  </div>
);

const SongListSkeleton = ({ count = 10 }) => {
  return (
    <div className="p-4">
      {Array.from({ length: count }).map((_, i) => (
        <SongListItemSkeleton key={i} />
      ))}
    </div>
  );
};

export default SongListSkeleton;
