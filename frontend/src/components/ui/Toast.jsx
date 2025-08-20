export default function Toast({
  show,
  type = "success",
  title,
  message,
  onRetry,
  onClose,
}) {
  if (!show) return null;

  const isSuccess = type === "success";
  const isError = type === "error";

  return (
    <div className="toast toast-end toast-top z-50">
      <div className={`alert ${isSuccess ? "alert-success" : "alert-error"}`}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            {isSuccess ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
            <div>
              <div className="font-bold">{title}</div>
              <div className="text-xs">{message}</div>
            </div>
          </div>

          {isError && (onRetry || onClose) && (
            <div className="flex gap-2">
              {onRetry && (
                <button
                  className="btn btn-xs btn-outline btn-error"
                  onClick={onRetry}
                >
                  Try Again
                </button>
              )}
              {onClose && (
                <button className="btn btn-xs btn-ghost" onClick={onClose}>
                  ✕
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
