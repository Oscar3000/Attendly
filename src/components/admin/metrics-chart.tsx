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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-6">Metrics</h2>

      <div className="flex items-end justify-between space-x-8 h-48">
        {bars.map((bar, index) => (
          <div key={bar.label} className="flex flex-col items-center flex-1">
            {/* Y-axis labels */}
            {index === 0 && (
              <div className="absolute left-0 flex flex-col justify-between h-40 text-xs text-gray-500 -ml-8">
                <span>200</span>
                <span>150</span>
                <span>100</span>
                <span>50</span>
                <span>0</span>
              </div>
            )}

            {/* Bar */}
            <div className="flex-1 flex items-end mb-2">
              <div
                className="w-12 rounded-t transition-all duration-300"
                style={{
                  height: `${getBarHeight(bar.value)}px`,
                  backgroundColor: bar.color,
                }}
              />
            </div>

            {/* Label */}
            <div className="text-sm font-medium text-gray-700 text-center">
              {bar.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
