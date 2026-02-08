const EmptyState = ({
  title,
  message,
  icon,
  action,
  actionLabel
}) => {
  const defaultIcon = (
    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10l4-4m4-4h-8" />
    </svg>
  );

  return (
    <div className="text-center py-12 px-4">
      <div className="max-w-md mx-auto">
        {icon || defaultIcon}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-500 mb-6">{message}</p>
        {action && actionLabel && (
          <button
            onClick={action}
            className="inline-flex items-center px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 font-medium"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
