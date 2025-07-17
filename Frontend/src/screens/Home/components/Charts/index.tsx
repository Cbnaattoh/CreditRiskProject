import React, { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

const COLORS = ["#6366F1", "#F59E0B", "#EF4444", "#10B981", "#8B5CF6"];
const DARK_COLORS = ["#818CF8", "#FCD34D", "#F87171", "#34D399", "#A78BFA"];

// Enhanced risk distribution data with icons and descriptions
const riskData = [
  {
    name: "Low Risk",
    value: 35,
    color: "#10B981",
    icon: "🟢",
    description: "Excellent credit profile",
  },
  {
    name: "Medium Risk",
    value: 25,
    color: "#F59E0B",
    icon: "🟡",
    description: "Good with minor concerns",
  },
  {
    name: "High Risk",
    value: 20,
    color: "#EF4444",
    icon: "🔴",
    description: "Significant risk factors",
  },
  {
    name: "Critical",
    value: 15,
    color: "#DC2626",
    icon: "⚠️",
    description: "Requires immediate attention",
  },
  {
    name: "Pending",
    value: 5,
    color: "#8B5CF6",
    icon: "⏳",
    description: "Under review",
  },
];

// Application trend data
const trendData = [
  { month: "Jan", approved: 120, denied: 45, pending: 30 },
  { month: "Feb", approved: 145, denied: 32, pending: 28 },
  { month: "Mar", approved: 98, denied: 56, pending: 42 },
  { month: "Apr", approved: 167, denied: 28, pending: 35 },
  { month: "May", approved: 132, denied: 39, pending: 29 },
  { month: "Jun", approved: 180, denied: 25, pending: 40 },
];

// Risk factors radar data
const radarData = [
  { subject: "Credit Score", A: 85, fullMark: 100 },
  { subject: "Debt Ratio", A: 65, fullMark: 100 },
  { subject: "Payment History", A: 75, fullMark: 100 },
  { subject: "Income Stability", A: 90, fullMark: 100 },
  { subject: "Employment Length", A: 70, fullMark: 100 },
];

// Enhanced tooltip component with glass morphism
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-2xl p-5 shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
        <div className="flex items-center mb-3">
          <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mr-3"></div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">
            {label}
          </p>
        </div>
        {payload.map((entry: any, index: number) => (
          <div
            key={index}
            className="flex items-center justify-between text-sm mb-1 last:mb-0"
          >
            <div className="flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-3 ring-2 ring-white/50"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                {entry.name}
              </span>
            </div>
            <span className="text-gray-900 dark:text-white font-semibold ml-4">
              {entry.value}
              {entry.name === "Approval Rate" ? "%" : ""}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Legend component
const CustomLegend = ({ payload }: any) => {
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-6">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center group cursor-pointer">
          <div
            className="w-4 h-4 rounded-full mr-3 ring-2 ring-white/50 dark:ring-gray-800/50 group-hover:ring-white/80 dark:group-hover:ring-gray-600/80 transition-all duration-200"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-200 font-medium">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// Enhanced Risk Distribution Chart with interactive legend
export const RiskDistributionChart: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [hoveredLegend, setHoveredLegend] = useState<number | null>(null);

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    index,
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className="text-xs font-bold drop-shadow-lg"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  return (
    <div className="space-y-6">
      {/* Interactive Legend */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        {riskData.map((item, index) => (
          <div
            key={index}
            className={`
              relative p-4 rounded-xl cursor-pointer transition-all duration-300 transform
              ${
                activeIndex === index || hoveredLegend === index
                  ? "scale-105 shadow-lg ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900"
                  : "hover:scale-102 hover:shadow-md"
              }
              bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50
              hover:bg-white/90 dark:hover:bg-gray-800/90
            `}
            style={{
              ringColor:
                activeIndex === index || hoveredLegend === index
                  ? item.color
                  : "transparent",
            }}
            onMouseEnter={() => setHoveredLegend(index)}
            onMouseLeave={() => setHoveredLegend(null)}
            onClick={() => setActiveIndex(activeIndex === index ? null : index)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div
                  className="w-4 h-4 rounded-full mr-3 ring-2 ring-white/50 dark:ring-gray-800/50"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {item.name}
                </span>
              </div>
              <span className="text-lg">{item.icon}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {item.description}
              </span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {item.value}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{
                  backgroundColor: item.color,
                  width: `${
                    (item.value / Math.max(...riskData.map((d) => d.value))) *
                    100
                  }%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Pie Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <defs>
            {riskData.map((item, index) => (
              <React.Fragment key={index}>
                <linearGradient
                  id={`gradient-${index}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor={item.color} stopOpacity={0.9} />
                  <stop
                    offset="100%"
                    stopColor={item.color}
                    stopOpacity={0.6}
                  />
                </linearGradient>
                <filter id={`glow-${index}`}>
                  <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </React.Fragment>
            ))}
          </defs>
          <Pie
            data={riskData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={120}
            innerRadius={70}
            paddingAngle={3}
            dataKey="value"
            onMouseEnter={onPieEnter}
            onMouseLeave={onPieLeave}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth={2}
          >
            {riskData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={`url(#gradient-${index})`}
                filter={activeIndex === index ? `url(#glow-${index})` : ""}
                className={`
                  transition-all duration-300 cursor-pointer
                  ${
                    activeIndex === index
                      ? "drop-shadow-lg"
                      : "hover:opacity-80"
                  }
                `}
                style={{
                  transform: activeIndex === index ? "scale(1.05)" : "scale(1)",
                  transformOrigin: "center",
                }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const ApplicationTrendChart: React.FC = () => (
  <ResponsiveContainer width="100%" height={350}>
    <AreaChart
      data={trendData}
      margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
    >
      <defs>
        <linearGradient id="approvedGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
          <stop offset="100%" stopColor="#10B981" stopOpacity={0.1} />
        </linearGradient>
        <linearGradient id="deniedGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EF4444" stopOpacity={0.8} />
          <stop offset="100%" stopColor="#EF4444" stopOpacity={0.1} />
        </linearGradient>
        <linearGradient id="pendingGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.8} />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.1} />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <CartesianGrid
        strokeDasharray="3 3"
        stroke="rgba(156, 163, 175, 0.2)"
        className="dark:opacity-30"
      />
      <XAxis
        dataKey="month"
        axisLine={false}
        tickLine={false}
        tick={{ fill: "currentColor", fontSize: 12 }}
        className="text-gray-600 dark:text-gray-400"
      />
      <YAxis
        axisLine={false}
        tickLine={false}
        tick={{ fill: "currentColor", fontSize: 12 }}
        className="text-gray-600 dark:text-gray-400"
      />
      <Tooltip content={<CustomTooltip />} />
      <Legend content={<CustomLegend />} />
      <Area
        type="monotone"
        dataKey="approved"
        stackId="1"
        stroke="#10B981"
        fill="url(#approvedGradient)"
        strokeWidth={3}
        filter="url(#glow)"
      />
      <Area
        type="monotone"
        dataKey="denied"
        stackId="1"
        stroke="#EF4444"
        fill="url(#deniedGradient)"
        strokeWidth={3}
        filter="url(#glow)"
      />
      <Area
        type="monotone"
        dataKey="pending"
        stackId="1"
        stroke="#F59E0B"
        fill="url(#pendingGradient)"
        strokeWidth={3}
        filter="url(#glow)"
      />
    </AreaChart>
  </ResponsiveContainer>
);

export const RiskFactorsRadar: React.FC = () => (
  <ResponsiveContainer width="100%" height={350}>
    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
      <defs>
        <linearGradient id="radarGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366F1" stopOpacity={0.8} />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.3} />
        </linearGradient>
        <filter id="radarGlow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <PolarGrid
        stroke="rgba(156, 163, 175, 0.3)"
        className="dark:opacity-40"
      />
      <PolarAngleAxis
        dataKey="subject"
        tick={{ fill: "currentColor", fontSize: 12 }}
        className="text-gray-600 dark:text-gray-400"
      />
      <PolarRadiusAxis
        angle={30}
        domain={[0, 100]}
        tick={{ fill: "currentColor", fontSize: 10 }}
        className="text-gray-500 dark:text-gray-500"
      />
      <Radar
        name="Risk Factors"
        dataKey="A"
        stroke="#6366F1"
        fill="url(#radarGradient)"
        strokeWidth={3}
        dot={{ r: 6, fill: "#6366F1", stroke: "#ffffff", strokeWidth: 2 }}
        filter="url(#radarGlow)"
      />
      <Tooltip content={<CustomTooltip />} />
      <Legend content={<CustomLegend />} />
    </RadarChart>
  </ResponsiveContainer>
);

export const ApprovalRateChart: React.FC = () => {
  const approvalRateData = trendData.map((month) => ({
    month: month.month,
    rate: parseFloat(
      ((month.approved / (month.approved + month.denied)) * 100).toFixed(1)
    ),
  }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart
        data={approvalRateData}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
          <filter id="lineGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(156, 163, 175, 0.2)"
          className="dark:opacity-30"
        />
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "currentColor", fontSize: 12 }}
          className="text-gray-600 dark:text-gray-400"
        />
        <YAxis
          domain={[0, 100]}
          axisLine={false}
          tickLine={false}
          tick={{ fill: "currentColor", fontSize: 12 }}
          className="text-gray-600 dark:text-gray-400"
          label={{
            value: "Approval %",
            angle: -90,
            position: "insideLeft",
            style: { textAnchor: "middle" },
          }}
        />
        <Tooltip
          content={<CustomTooltip />}
          formatter={(value) => [`${value}%`, "Approval Rate"]}
        />
        <Line
          type="monotone"
          dataKey="rate"
          stroke="url(#lineGradient)"
          strokeWidth={4}
          filter="url(#lineGlow)"
          dot={{
            r: 6,
            fill: "#6366F1",
            stroke: "#ffffff",
            strokeWidth: 3,
            className: "dark:stroke-gray-800",
          }}
          activeDot={{
            r: 8,
            fill: "#6366F1",
            stroke: "#ffffff",
            strokeWidth: 4,
            className: "dark:stroke-gray-800",
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export const ChartContainer: React.FC<{
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
}> = ({ children, title, subtitle, className = "" }) => (
  <div
    className={`
    relative p-8 rounded-3xl 
    bg-gradient-to-br from-white/95 via-white/90 to-gray-50/95 
    dark:from-gray-900/95 dark:via-gray-900/90 dark:to-gray-800/95 
    backdrop-blur-xl border border-white/20 dark:border-gray-700/30 
    shadow-xl hover:shadow-2xl dark:shadow-gray-900/30 
    transition-all duration-500 
    group overflow-hidden
    ring-1 ring-black/5 dark:ring-white/5
    ${className}
  `}
  >
    {/* Animated background gradient */}
    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/40 via-purple-50/20 to-pink-50/30 dark:from-indigo-900/20 dark:via-purple-900/10 dark:to-pink-900/15 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

    {/* Inner glow effect */}
    <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/20 dark:ring-gray-800/30 pointer-events-none" />

    {/* Floating particles effect */}
    <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
      <div className="absolute -top-4 -left-4 w-8 h-8 bg-gradient-to-br from-indigo-400/30 to-purple-500/30 rounded-full blur-sm animate-pulse" />
      <div
        className="absolute -bottom-4 -right-4 w-6 h-6 bg-gradient-to-br from-pink-400/30 to-purple-500/30 rounded-full blur-sm animate-pulse"
        style={{ animationDelay: "1s" }}
      />
    </div>

    {/* Enhanced title section */}
    <div className="relative mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-medium">
              {subtitle}
            </p>
          )}
        </div>

        {/* Status indicator */}
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
            Live
          </span>
        </div>
      </div>

      {/* Enhanced underline */}
      <div className="mt-4 flex items-center space-x-2">
        <div className="h-1 w-16 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full" />
        <div className="h-1 w-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full opacity-60" />
        <div className="h-1 w-1 bg-purple-500 rounded-full opacity-40" />
      </div>
    </div>

    {/* Chart content with enhanced styling */}
    <div className="relative z-10">{children}</div>
  </div>
);
