// components/dashboard/Header.jsx
export default function DashboardHeader({
  title,
  description,
  breadcrumbs,
  primaryColor = "primary",
  secondaryColor = "secondary",
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold text-${secondaryColor}`}>
            {title}
          </h1>
          <p className="text-gray-600 mt-2">{description}</p>
        </div>

        <div className="flex items-center space-x-2 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center">
              {index > 0 && <span className="text-gray-400">/</span>}
              <button
                onClick={crumb.onClick}
                className={`
                  ${
                    crumb.clickable
                      ? `text-${primaryColor} hover:text-${primaryColor}/90 cursor-pointer`
                      : "text-gray-600 cursor-default"
                  } px-1
                `}
              >
                {crumb.label}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
