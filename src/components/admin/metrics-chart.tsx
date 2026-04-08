import { DashboardMetrics } from "@/lib/types";

interface MetricsChartProps {
  metrics: DashboardMetrics;
}

export default function MetricsChart({ metrics }: MetricsChartProps) {
  // Calculate heights for bars based on max value
  const maxValue = Math.max(
    metrics.pendingCount,
    metrics.confirmedCount,
    metrics.rescindedCount,
  );
  const maxHeight = 150; // Max bar height in pixels

  const getBarHeight = (value: number) => {
    return Math.max((value / maxValue) * maxHeight, 8); // Minimum height of 8px
  };

  const bars = [
    { label: "Pending", value: metrics.pendingCount, color: "#60A5FA" },
    { label: "Confirmed", value: metrics.confirmedCount, color: "#60A5FA" },
    { label: "Rescinded", value: metrics.rescindedCount, color: "#60A5FA" },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
      <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-4 sm:mb-6">Metrics</h2>

      <div className="flex items-end justify-between space-x-3 sm:space-x-8 h-48">
        {bars.map((bar) => (
          <div key={bar.label} className="flex flex-col items-center flex-1">
            {/* Value label */}
            <div className="text-xs sm:text-sm font-medium text-gray-600 mb-1">
              {bar.value}
            </div>

            {/* Bar */}
            <div className="flex-1 flex items-end mb-2 w-full">
              <div
                className="w-full max-w-12 mx-auto rounded-t transition-all duration-300"
                style={{
                  height: `${getBarHeight(bar.value)}px`,
                  backgroundColor: bar.color,
                }}
              />
            </div>

            {/* Label */}
            <div className="text-xs sm:text-sm font-medium text-gray-700 text-center">
              {bar.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
