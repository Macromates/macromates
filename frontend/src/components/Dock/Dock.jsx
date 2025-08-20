import { Link, useLocation } from "react-router";

export default function Dock({ items = [] }) {
  const { pathname } = useLocation();

  // Split items into left and right groups to create space for camera button
  const midpoint = Math.ceil(items.length / 2);
  const leftItems = items.slice(0, midpoint);
  const rightItems = items.slice(midpoint);

  const renderDockItem = ({
    to,
    label,
    icon: Icon,
    avatarUrl,
    initials = "",
  }) => {
    const isActive = pathname === to;
    return (
      <Link
        key={label}
        to={to}
        className={`
          flex flex-col items-center justify-center
          p-3 transition-all duration-200 relative
          ${
            isActive
              ? "opacity-100 text-primary"
              : "opacity-85 hover:opacity-95 text-primary"
          }
        `}
      >
        {avatarUrl ? (
          <div className="avatar">
            <div className="w-6 h-6 rounded-full overflow-hidden">
              <img
                src={avatarUrl}
                alt={`${label} avatar`}
                className="object-cover w-full h-full"
              />
            </div>
          </div>
        ) : initials ? (
          <div className="avatar avatar-placeholder">
            <div
              className="w-6 h-6 rounded-full text-white flex items-center justify-center"
              style={{ backgroundColor: "#2c5e45" }}
            >
              <span className="text-xs font-medium">{initials}</span>
            </div>
          </div>
        ) : (
          Icon && (
            <Icon className={`w-6 h-6 ${isActive ? "text-primary" : ""}`} />
          )
        )}
        <span className="mt-1 text-xs font-medium text-primary">{label}</span>
        {isActive && (
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary"></div>
        )}
      </Link>
    );
  };

  return (
    <div
      className="
        fixed bottom-0 left-0 right-0 z-50
        border-t-1 border-gray-300
        bg-base-100
        flex items-center
        h-16
        pr-6
      "
    >
      {/* Left side items */}
      <div className="flex flex-1 justify-start gap-0">
        {leftItems.map(renderDockItem)}
      </div>

      {/* Gap for camera button */}
      <div className="w-24"></div>

      {/* Right side items */}
      <div className="flex flex-1 justify-end gap-2">
        {rightItems.map(renderDockItem)}
      </div>
    </div>
  );
}
