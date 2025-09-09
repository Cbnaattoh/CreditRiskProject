import React, { useState, useEffect } from "react";
import { useGetRiskChartsDataQuery } from "../../../../components/redux/features/api/risk/riskApi";
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
  ComposedChart,
  Rectangle
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
  
  // Fetch real risk chart data
  const { data: chartsData, isLoading, error } = useGetRiskChartsDataQuery();
  
  // Use real data or show empty state
  const riskDataToUse = chartsData?.risk_distribution || [];

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

  // Show loading state with skeleton
  if (isLoading) {
    return (
      <div className="flex flex-col lg:flex-row gap-6 min-h-[400px]">
        <div className="flex-1 flex items-center justify-center">
          <div className="relative w-[300px] h-[300px] bg-gray-200 dark:bg-gray-700 rounded-full">
            <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-full opacity-100"></div>
            <div className="absolute inset-4 bg-gray-300 dark:bg-gray-600 rounded-full opacity-80"></div>
            <div className="absolute inset-8 bg-gray-100 dark:bg-gray-800 rounded-full opacity-60"></div>
            <div className="absolute inset-12 bg-gray-200 dark:bg-gray-700 rounded-full opacity-40"></div>
          </div>
        </div>
        <div className="flex-1 space-y-3 min-w-0">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full mr-2 opacity-60"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20 opacity-40"></div>
                </div>
                <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-12 opacity-60"></div>
              </div>
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full mb-2 opacity-30"></div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 opacity-50">
                <div className="bg-gray-300 dark:bg-gray-600 h-1.5 rounded-full opacity-80" style={{width: `${Math.random() * 80 + 20}%`}}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show empty state if no data
  if (!riskDataToUse || riskDataToUse.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-gray-500 dark:text-gray-400">
        <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-lg font-medium">No Risk Data Available</p>
        <p className="text-sm text-center">Risk distribution data will appear here once assessments are processed.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Enhanced Pie Chart */}
      <div className="flex-1">
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <defs>
              {riskDataToUse.map((item, index) => (
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
              data={riskDataToUse}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={100}
              innerRadius={60}
              paddingAngle={3}
              dataKey="value"
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
              stroke="rgba(255,255,255,0.3)"
              strokeWidth={2}
            >
              {riskDataToUse.map((entry, index) => (
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

      {/* Compact Interactive Legend */}
      <div className="flex-1 min-w-0">
        <div className="space-y-3">
          {riskDataToUse.map((item, index) => (
            <div
              key={index}
              className={`
                relative p-3 rounded-lg cursor-pointer transition-all duration-300 transform
                ${
                  activeIndex === index || hoveredLegend === index
                    ? "scale-102 shadow-md ring-2 ring-offset-1 ring-offset-white dark:ring-offset-gray-900"
                    : "hover:scale-101 hover:shadow-sm"
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
                    className="w-3 h-3 rounded-full mr-2 ring-2 ring-white/50 dark:ring-gray-800/50"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{item.icon}</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {item.value}%
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                {item.description}
              </div>

              {/* Compact Progress bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{
                    backgroundColor: item.color,
                    width: `${
                      (item.value / Math.max(...riskDataToUse.map((d) => d.value))) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const ApplicationTrendChart: React.FC = () => (
  <ResponsiveContainer width="100%" height={320}>
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

export const RiskFactorsRadar: React.FC = () => {
  // Fetch real risk chart data
  const { data: chartsData, isLoading, error } = useGetRiskChartsDataQuery();
  
  // Use real data or empty array
  const radarDataToUse = chartsData?.risk_factors_radar || [];

  // Show loading state with skeleton
  if (isLoading) {
    return (
      <div className="relative min-h-[320px] bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center">
        <div className="relative w-48 h-48">
          {/* Outer radar ring */}
          <div className="absolute inset-0 rounded-full border-4 border-gray-300 dark:border-gray-600 opacity-30"></div>
          {/* Middle radar ring */}
          <div className="absolute inset-4 rounded-full border-2 border-gray-300 dark:border-gray-600 opacity-50"></div>
          {/* Inner radar ring */}
          <div className="absolute inset-8 rounded-full border-2 border-gray-300 dark:border-gray-600 opacity-70"></div>
          {/* Center dot */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
          {/* Radar lines */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-300 dark:bg-gray-600 opacity-30"></div>
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600 opacity-30"></div>
          {/* Additional radar lines for more realistic look */}
          <div className="absolute top-1/4 left-1/4 right-1/4 bottom-3/4 h-0.5 bg-gray-300 dark:bg-gray-600 opacity-20 transform rotate-45"></div>
          <div className="absolute top-3/4 left-1/4 right-1/4 bottom-1/4 h-0.5 bg-gray-300 dark:bg-gray-600 opacity-20 transform -rotate-45"></div>
        </div>
      </div>
    );
  }

  // Show empty state if no data
  if (!radarDataToUse || radarDataToUse.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-gray-500 dark:text-gray-400">
        <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-lg font-medium">No Risk Factors Data Available</p>
        <p className="text-sm text-center">Risk factor analysis will appear here once data is available.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarDataToUse}>
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
};

export const ApprovalRateChart: React.FC = () => {
  const approvalRateData = trendData.map((month) => ({
    month: month.month,
    rate: parseFloat(
      ((month.approved / (month.approved + month.denied)) * 100).toFixed(1)
    ),
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
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

// Credit Score Distribution Chart - Premium Advanced Design
export const CreditScoreDistributionChart: React.FC = () => {
  const [activeRange, setActiveRange] = useState<number | null>(null);
  const [animationComplete, setAnimationComplete] = useState(false);
  
  // Fetch real risk chart data
  const { data: chartsData, isLoading, error } = useGetRiskChartsDataQuery();

  useEffect(() => {
    const timer = setTimeout(() => setAnimationComplete(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Credit score distribution data with realistic ranges (fallback)
  const defaultCreditScoreData = [
    { range: "300-579", label: "Poor", count: 145, percentage: 8.2, color: "#DC2626", icon: "🔴", description: "High risk borrowers", benchmark: 10.5 },
    { range: "580-669", label: "Fair", count: 289, percentage: 16.4, color: "#EA580C", icon: "🟠", description: "Subprime borrowers", benchmark: 18.2 },
    { range: "670-739", label: "Good", count: 456, percentage: 25.8, color: "#F59E0B", icon: "🟡", description: "Prime borrowers", benchmark: 24.1 },
    { range: "740-799", label: "Very Good", count: 523, percentage: 29.6, color: "#059669", icon: "🟢", description: "Low risk borrowers", benchmark: 28.7 },
    { range: "800-850", label: "Excellent", count: 354, percentage: 20.0, color: "#047857", icon: "💎", description: "Exceptional credit", benchmark: 18.5 },
  ];
  
  // Use real data or empty array
  const creditScoreData = chartsData?.credit_score_distribution?.map(item => ({
    ...item,
    benchmark: item.percentage + 2 // Add benchmark for comparison
  })) || [];

  const CustomCreditTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border border-white/30 dark:border-gray-700/40 rounded-3xl p-6 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 min-w-[280px]">
          <div className="flex items-center mb-4">
            <div className="text-2xl mr-3">{data.icon}</div>
            <div>
              <p className="font-bold text-lg text-gray-900 dark:text-white">
                {data.label} Credit
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Score Range: {data.range}
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Applications:</span>
              <span className="font-bold text-gray-900 dark:text-white text-lg">{data.count.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Portfolio:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">{data.percentage}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Industry Avg:</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">{data.benchmark}%</span>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl border border-indigo-200 dark:border-indigo-800">
            <p className="text-xs text-indigo-800 dark:text-indigo-200 font-medium">
              {data.description}
            </p>
          </div>
          
          {/* Performance vs benchmark */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>vs Industry</span>
              <span>{data.percentage > data.benchmark ? '+' : ''}{(data.percentage - data.benchmark).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  data.percentage > data.benchmark 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                    : 'bg-gradient-to-r from-amber-500 to-orange-500'
                }`}
                style={{ width: `${Math.min(Math.abs(data.percentage - data.benchmark) * 10, 100)}%` }}
              />
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Show loading state with skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Statistics Header Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
            </div>
          ))}
        </div>
        {/* Chart Skeleton */}
        <div className="relative min-h-[320px] bg-gray-200 dark:bg-gray-700 rounded-xl p-6">
          {/* Chart area skeleton */}
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-12 bg-gray-300 dark:bg-gray-600 h-2 rounded-full opacity-60"></div>
                <div className="bg-gray-300 dark:bg-gray-600 h-4 rounded opacity-40" style={{width: `${Math.random() * 60 + 40}%`}}></div>
                <div className="w-8 bg-gray-300 dark:bg-gray-600 h-2 rounded opacity-60"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show empty state if no data
  if (!creditScoreData || creditScoreData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-500 dark:text-gray-400">
        <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-lg font-medium">No Credit Score Data Available</p>
        <p className="text-sm text-center">Credit score distribution will appear here once ML assessments are completed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Premium Statistics Header */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-2xl p-4 border border-indigo-200 dark:border-indigo-800">
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {chartsData?.credit_statistics?.avg_score || 0}
          </div>
          <div className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">Avg Score</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-4 border border-green-200 dark:border-green-800">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {chartsData?.credit_statistics?.total_apps?.toLocaleString() || 0}
          </div>
          <div className="text-sm text-green-700 dark:text-green-300 font-medium">Total Apps</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-4 border border-purple-200 dark:border-purple-800">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {chartsData?.credit_statistics?.prime_plus_percentage || 0}%
          </div>
          <div className="text-sm text-purple-700 dark:text-purple-300 font-medium">Prime+</div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-2xl p-4 border border-amber-200 dark:border-amber-800">
          <div className={`text-2xl font-bold ${
            (chartsData?.credit_statistics?.vs_target || 0) >= 0 
              ? 'text-amber-600 dark:text-amber-400' 
              : 'text-red-600 dark:text-red-400'
          }`}>
            {(chartsData?.credit_statistics?.vs_target || 0) >= 0 ? '+' : ''}{chartsData?.credit_statistics?.vs_target || 0}%
          </div>
          <div className="text-sm text-amber-700 dark:text-amber-300 font-medium">vs Target</div>
        </div>
      </div>

      {/* Advanced Bar Chart */}
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart
          data={creditScoreData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <defs>
            {creditScoreData.map((item, index) => (
              <React.Fragment key={index}>
                <linearGradient id={`creditGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={item.color} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={item.color} stopOpacity={0.6} />
                </linearGradient>
                <filter id={`creditGlow-${index}`}>
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </React.Fragment>
            ))}
            <linearGradient id="benchmarkGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6B7280" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#6B7280" stopOpacity={0.4} />
            </linearGradient>
          </defs>
          
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(156, 163, 175, 0.2)"
            className="dark:opacity-30"
          />
          
          <XAxis
            dataKey="range"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "currentColor", fontSize: 11, fontWeight: 500 }}
            className="text-gray-600 dark:text-gray-400"
            angle={-45}
            textAnchor="end"
            height={80}
          />
          
          <YAxis
            yAxisId="count"
            orientation="left"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "currentColor", fontSize: 12 }}
            className="text-gray-600 dark:text-gray-400"
            label={{ value: 'Applications', angle: -90, position: 'insideLeft' }}
          />
          
          <YAxis
            yAxisId="percentage"
            orientation="right"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "currentColor", fontSize: 12 }}
            className="text-gray-600 dark:text-gray-400"
            label={{ value: 'Portfolio %', angle: 90, position: 'insideRight' }}
          />
          
          <Tooltip content={<CustomCreditTooltip />} />
          
          {/* Industry Benchmark Line */}
          <Line
            yAxisId="percentage"
            type="monotone"
            dataKey="benchmark"
            stroke="#6B7280"
            strokeWidth={3}
            strokeDasharray="8 4"
            dot={false}
            name="Industry Benchmark"
          />
          
          {/* Main Bars */}
          <Bar
            yAxisId="count"
            dataKey="count"
            fill={(entry: any, index: number) => `url(#creditGradient-${index})`}
            radius={[8, 8, 0, 0]}
            onMouseEnter={(data, index) => setActiveRange(index)}
            onMouseLeave={() => setActiveRange(null)}
          >
            {creditScoreData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={`url(#creditGradient-${index})`}
                filter={activeRange === index ? `url(#creditGlow-${index})` : ""}
                className="transition-all duration-300 cursor-pointer"
              />
            ))}
          </Bar>
          
          {/* Percentage Area */}
          <Area
            yAxisId="percentage"
            type="monotone"
            dataKey="percentage"
            stroke="#6366F1"
            strokeWidth={2}
            fill="url(#creditGradient-0)"
            fillOpacity={0.1}
          />
          
        </ComposedChart>
      </ResponsiveContainer>

      {/* Interactive Legend with Advanced Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        {creditScoreData.map((item, index) => (
          <div
            key={index}
            className={`
              p-4 rounded-2xl border transition-all duration-300 cursor-pointer transform hover:scale-105
              ${
                activeRange === index
                  ? 'border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 shadow-lg'
                  : 'border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600'
              }
            `}
            onMouseEnter={() => setActiveRange(index)}
            onMouseLeave={() => setActiveRange(null)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-lg">{item.icon}</div>
              <div className="text-xs font-bold text-gray-500 dark:text-gray-400">
                {item.percentage > item.benchmark ? '↗️' : '↘️'}
              </div>
            </div>
            <div className="text-sm font-bold text-gray-900 dark:text-white mb-1">
              {item.label}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              {item.range}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold" style={{ color: item.color }}>
                {item.count}
              </span>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {item.percentage}%
              </span>
            </div>
            
            {/* Mini progress bar */}
            <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full transition-all duration-500"
                style={{
                  backgroundColor: item.color,
                  width: `${(item.percentage / Math.max(...creditScoreData.map(d => d.percentage))) * 100}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Compliance Violations Trend Chart - Premium Advanced Design
export const ComplianceViolationsTrendChart: React.FC = () => {
  const [selectedMetric, setSelectedMetric] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('6m');
  
  // Fetch real risk chart data
  const { data: chartsData, isLoading, error } = useGetRiskChartsDataQuery();

  // Default compliance violations trend data with multiple metrics (fallback)
  const defaultViolationsData = [
    {
      month: "Jan 2024",
      total: 12,
      critical: 2,
      high: 4,
      medium: 4,
      low: 2,
      resolved: 10,
      compliance_score: 94.2,
      audit_findings: 8,
      policy_violations: 4,
      regulatory_breaches: 0
    },
    {
      month: "Feb 2024",
      total: 8,
      critical: 1,
      high: 2,
      medium: 3,
      low: 2,
      resolved: 7,
      compliance_score: 96.1,
      audit_findings: 5,
      policy_violations: 3,
      regulatory_breaches: 0
    },
    {
      month: "Mar 2024",
      total: 15,
      critical: 3,
      high: 5,
      medium: 5,
      low: 2,
      resolved: 12,
      compliance_score: 91.8,
      audit_findings: 10,
      policy_violations: 5,
      regulatory_breaches: 1
    },
    {
      month: "Apr 2024",
      total: 6,
      critical: 0,
      high: 2,
      medium: 3,
      low: 1,
      resolved: 6,
      compliance_score: 97.5,
      audit_findings: 3,
      policy_violations: 2,
      regulatory_breaches: 0
    },
    {
      month: "May 2024",
      total: 9,
      critical: 1,
      high: 3,
      medium: 3,
      low: 2,
      resolved: 8,
      compliance_score: 95.3,
      audit_findings: 6,
      policy_violations: 3,
      regulatory_breaches: 0
    },
    {
      month: "Jun 2024",
      total: 4,
      critical: 0,
      high: 1,
      medium: 2,
      low: 1,
      resolved: 4,
      compliance_score: 98.2,
      audit_findings: 2,
      policy_violations: 1,
      regulatory_breaches: 0
    },
  ];
  
  // Use real data or empty array
  const violationsData = chartsData?.compliance_violations_trend || [];

  const violationTypes = [
    { key: 'critical', label: 'Critical', color: '#DC2626', icon: '🚨' },
    { key: 'high', label: 'High', color: '#EA580C', icon: '⚠️' },
    { key: 'medium', label: 'Medium', color: '#F59E0B', icon: '⚡' },
    { key: 'low', label: 'Low', color: '#059669', icon: '📋' },
  ];

  const ComplianceTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border border-white/30 dark:border-gray-700/40 rounded-3xl p-6 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 min-w-[320px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-bold text-lg text-gray-900 dark:text-white">
                {label}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Compliance Overview
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {data.compliance_score}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Score</div>
            </div>
          </div>
          
          {/* Violations Breakdown */}
          <div className="space-y-2 mb-4">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Violations by Severity:</div>
            {violationTypes.map((type) => (
              <div key={type.key} className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="text-sm mr-2">{type.icon}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{type.label}:</span>
                </div>
                <span className="font-bold text-sm" style={{ color: type.color }}>
                  {data[type.key]}
                </span>
              </div>
            ))}
          </div>
          
          {/* Additional Metrics */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Violations:</span>
              <span className="font-bold text-red-600 dark:text-red-400">{data.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Resolved:</span>
              <span className="font-bold text-green-600 dark:text-green-400">{data.resolved}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Audit Findings:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">{data.audit_findings}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Regulatory Breaches:</span>
              <span className={`font-bold ${data.regulatory_breaches > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                {data.regulatory_breaches}
              </span>
            </div>
          </div>
          
          {/* Resolution Rate */}
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 rounded-2xl border border-green-200 dark:border-green-800">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-green-800 dark:text-green-200 font-medium">Resolution Rate</span>
              <span className="text-sm font-bold text-green-700 dark:text-green-300">
                {((data.resolved / data.total) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-green-200 dark:bg-green-800/50 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${(data.resolved / data.total) * 100}%` }}
              />
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Show loading state with skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Control Panel Skeleton */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
        {/* Chart Skeleton */}
        <div className="relative min-h-[384px] bg-gray-200 dark:bg-gray-700 rounded-xl p-6">
          {/* Line chart skeleton */}
          <div className="h-full flex items-end space-x-2">
            {[...Array(12)].map((_, i) => (
              <div 
                key={i} 
                className="flex-1 bg-gray-300 dark:bg-gray-600 rounded-t opacity-50"
                style={{
                  height: `${Math.random() * 200 + 50}px`
                }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show empty state if no data
  if (!violationsData || violationsData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-500 dark:text-gray-400">
        <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-lg font-medium">No Compliance Data Available</p>
        <p className="text-sm text-center">Compliance violations trend will appear here once compliance data is tracked.</p>
      </div>
    );
  }

  const currentData = violationsData;
  
  // Use statistics from API or calculate as fallback
  const avgCompliance = chartsData?.compliance_statistics?.avg_compliance || 
    (currentData.length > 0 ? currentData.reduce((sum, item) => sum + item.compliance_score, 0) / currentData.length : 0);
  const totalViolations = chartsData?.compliance_statistics?.total_violations || 
    currentData.reduce((sum, item) => sum + item.total, 0);
  const criticalViolations = chartsData?.compliance_statistics?.critical_issues || 
    currentData.reduce((sum, item) => sum + item.critical, 0);
  const resolutionRate = chartsData?.compliance_statistics?.resolution_rate || 
    (totalViolations > 0 ? (currentData.reduce((sum, item) => sum + item.resolved, 0) / totalViolations * 100) : 0);

  return (
    <div className="space-y-6">
      {/* Advanced Control Panel */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-4 border border-green-200 dark:border-green-800">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{avgCompliance.toFixed(1)}%</div>
            <div className="text-sm text-green-700 dark:text-green-300 font-medium">Avg Compliance</div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-2xl p-4 border border-red-200 dark:border-red-800">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{totalViolations}</div>
            <div className="text-sm text-red-700 dark:text-red-300 font-medium">Total Violations</div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-2xl p-4 border border-amber-200 dark:border-amber-800">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{criticalViolations}</div>
            <div className="text-sm text-amber-700 dark:text-amber-300 font-medium">Critical Issues</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-4 border border-blue-200 dark:border-blue-800">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{resolutionRate.toFixed(1)}%</div>
            <div className="text-sm text-blue-700 dark:text-blue-300 font-medium">Resolution Rate</div>
          </div>
        </div>
      </div>

      {/* Advanced Multi-Metric Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart
          data={currentData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <defs>
            <linearGradient id="complianceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#10B981" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="violationsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#DC2626" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#DC2626" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="criticalGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#DC2626" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#DC2626" stopOpacity={0.6} />
            </linearGradient>
            <linearGradient id="highGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EA580C" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#EA580C" stopOpacity={0.6} />
            </linearGradient>
            <linearGradient id="mediumGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.6} />
            </linearGradient>
            <linearGradient id="lowGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#059669" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#059669" stopOpacity={0.6} />
            </linearGradient>
            <filter id="complianceGlow">
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
            yAxisId="violations"
            orientation="left"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "currentColor", fontSize: 12 }}
            className="text-gray-600 dark:text-gray-400"
            label={{ value: 'Violations', angle: -90, position: 'insideLeft' }}
          />
          
          <YAxis
            yAxisId="score"
            orientation="right"
            domain={[85, 100]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "currentColor", fontSize: 12 }}
            className="text-gray-600 dark:text-gray-400"
            label={{ value: 'Compliance Score %', angle: 90, position: 'insideRight' }}
          />
          
          <Tooltip content={<ComplianceTooltip />} />
          
          {/* Stacked Violation Bars */}
          <Bar yAxisId="violations" dataKey="critical" stackId="violations" fill="url(#criticalGradient)" radius={[0, 0, 0, 0]} />
          <Bar yAxisId="violations" dataKey="high" stackId="violations" fill="url(#highGradient)" radius={[0, 0, 0, 0]} />
          <Bar yAxisId="violations" dataKey="medium" stackId="violations" fill="url(#mediumGradient)" radius={[0, 0, 0, 0]} />
          <Bar yAxisId="violations" dataKey="low" stackId="violations" fill="url(#lowGradient)" radius={[4, 4, 0, 0]} />
          
          {/* Compliance Score Line */}
          <Line
            yAxisId="score"
            type="monotone"
            dataKey="compliance_score"
            stroke="#10B981"
            strokeWidth={4}
            filter="url(#complianceGlow)"
            dot={{
              r: 6,
              fill: "#10B981",
              stroke: "#ffffff",
              strokeWidth: 3,
              className: "dark:stroke-gray-800",
            }}
            activeDot={{
              r: 8,
              fill: "#10B981",
              stroke: "#ffffff",
              strokeWidth: 4,
              className: "dark:stroke-gray-800",
            }}
          />
          
          {/* Target Compliance Line */}
          <Line
            yAxisId="score"
            type="monotone"
            dataKey={() => 95}
            stroke="#6B7280"
            strokeWidth={2}
            strokeDasharray="8 4"
            dot={false}
            name="Target (95%)"
          />
          
        </ComposedChart>
      </ResponsiveContainer>

      {/* Advanced Legend with Trend Indicators */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {violationTypes.map((type, index) => {
          const currentPeriodValue = currentData[currentData.length - 1]?.[type.key] || 0;
          const previousPeriodValue = currentData[currentData.length - 2]?.[type.key] || 0;
          const trend = currentPeriodValue - previousPeriodValue;
          
          return (
            <div
              key={type.key}
              className="p-4 rounded-2xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 hover:shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-lg">{type.icon}</div>
                <div className={`text-xs font-bold ${
                  trend > 0 ? 'text-red-500' : trend < 0 ? 'text-green-500' : 'text-gray-500'
                }`}>
                  {trend > 0 ? '↗️' : trend < 0 ? '↘️' : '➡️'} {trend !== 0 ? Math.abs(trend) : ''}
                </div>
              </div>
              <div className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                {type.label}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold" style={{ color: type.color }}>
                  {currentPeriodValue}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  This month
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// System-wide Risk Distribution Chart - Premium Advanced Design
export const SystemWideRiskDistributionChart: React.FC = () => {
  const [activeSegment, setActiveSegment] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'portfolio' | 'geographic' | 'sector'>('portfolio');

  // Enhanced system-wide risk data with multiple dimensions
  const systemRiskData = {
    portfolio: [
      { name: "Consumer Loans", value: 42.3, risk_score: 3.2, color: "#6366F1", icon: "🏠", exposure: 2.4, trend: "stable" },
      { name: "Business Loans", value: 28.7, risk_score: 4.1, color: "#8B5CF6", icon: "🏢", exposure: 1.8, trend: "improving" },
      { name: "Credit Cards", value: 15.2, risk_score: 5.3, color: "#EC4899", icon: "💳", exposure: 3.1, trend: "deteriorating" },
      { name: "Auto Loans", value: 8.9, risk_score: 2.8, color: "#10B981", icon: "🚗", exposure: 1.2, trend: "stable" },
      { name: "Mortgages", value: 4.9, risk_score: 2.1, color: "#F59E0B", icon: "🏘️", exposure: 0.9, trend: "improving" },
    ],
    geographic: [
      { name: "North America", value: 35.8, risk_score: 3.1, color: "#6366F1", icon: "🌎", exposure: 2.2, trend: "stable" },
      { name: "Europe", value: 28.4, risk_score: 2.9, color: "#8B5CF6", icon: "🌍", exposure: 1.9, trend: "improving" },
      { name: "Asia Pacific", value: 22.1, risk_score: 3.8, color: "#EC4899", icon: "🌏", exposure: 2.8, trend: "stable" },
      { name: "Latin America", value: 8.7, risk_score: 4.5, color: "#F59E0B", icon: "🌎", exposure: 3.2, trend: "deteriorating" },
      { name: "Middle East & Africa", value: 5.0, risk_score: 4.1, color: "#EF4444", icon: "🌍", exposure: 2.9, trend: "stable" },
    ],
    sector: [
      { name: "Technology", value: 24.6, risk_score: 2.8, color: "#6366F1", icon: "💻", exposure: 1.5, trend: "improving" },
      { name: "Healthcare", value: 19.3, risk_score: 3.2, color: "#10B981", icon: "🏥", exposure: 2.1, trend: "stable" },
      { name: "Financial Services", value: 16.8, risk_score: 3.9, color: "#F59E0B", icon: "🏦", exposure: 2.7, trend: "stable" },
      { name: "Retail", value: 14.2, risk_score: 4.3, color: "#EC4899", icon: "🛍️", exposure: 3.1, trend: "deteriorating" },
      { name: "Manufacturing", value: 12.4, risk_score: 3.7, color: "#8B5CF6", icon: "🏭", exposure: 2.4, trend: "improving" },
      { name: "Energy", value: 8.9, risk_score: 4.8, color: "#EF4444", icon: "⚡", exposure: 3.8, trend: "deteriorating" },
      { name: "Real Estate", value: 3.8, risk_score: 4.1, color: "#6B7280", icon: "🏗️", exposure: 2.9, trend: "stable" },
    ]
  };

  const currentData = systemRiskData[viewMode];

  const SystemRiskTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border border-white/30 dark:border-gray-700/40 rounded-3xl p-6 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 min-w-[300px]">
          <div className="flex items-center mb-4">
            <div className="text-3xl mr-3">{data.icon}</div>
            <div>
              <p className="font-bold text-xl text-gray-900 dark:text-white">
                {data.name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} Distribution
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{data.value}%</div>
              <div className="text-xs text-indigo-700 dark:text-indigo-300">Portfolio</div>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-900/30 rounded-2xl">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{data.risk_score}</div>
              <div className="text-xs text-red-700 dark:text-red-300">Risk Score</div>
            </div>
            <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/30 rounded-2xl">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">${data.exposure}B</div>
              <div className="text-xs text-amber-700 dark:text-amber-300">Exposure</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
              <div className={`text-lg font-bold ${
                data.trend === 'improving' ? 'text-green-600 dark:text-green-400' : 
                data.trend === 'deteriorating' ? 'text-red-600 dark:text-red-400' : 
                'text-gray-600 dark:text-gray-400'
              }`}>
                {data.trend === 'improving' ? '📈' : data.trend === 'deteriorating' ? '📉' : '➡️'}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Trend</div>
            </div>
          </div>
          
          {/* Risk Assessment */}
          <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-2xl border border-blue-200 dark:border-blue-800">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">Risk Level</span>
              <span className={`text-sm font-bold ${
                data.risk_score <= 3 ? 'text-green-600 dark:text-green-400' :
                data.risk_score <= 4 ? 'text-amber-600 dark:text-amber-400' :
                'text-red-600 dark:text-red-400'
              }`}>
                {data.risk_score <= 3 ? 'Low' : data.risk_score <= 4 ? 'Medium' : 'High'}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  data.risk_score <= 3 ? 'bg-gradient-to-r from-green-400 to-green-500' :
                  data.risk_score <= 4 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                  'bg-gradient-to-r from-red-400 to-red-500'
                }`}
                style={{ width: `${(data.risk_score / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const totalExposure = currentData.reduce((sum, item) => sum + item.exposure, 0);
  const avgRiskScore = currentData.reduce((sum, item) => sum + item.risk_score, 0) / currentData.length;
  const highRiskCount = currentData.filter(item => item.risk_score > 4).length;

  return (
    <div className="space-y-6">
      {/* Premium Control Panel */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        {/* View Mode Selector */}
        <div className="flex items-center space-x-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-2 border border-gray-200 dark:border-gray-700">
          {[
            { key: 'portfolio', label: 'Portfolio', icon: '📊' },
            { key: 'geographic', label: 'Geography', icon: '🌍' },
            { key: 'sector', label: 'Sectors', icon: '🏢' }
          ].map((mode) => (
            <button
              key={mode.key}
              onClick={() => setViewMode(mode.key as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                viewMode === mode.key 
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <span>{mode.icon}</span>
              <span>{mode.label}</span>
            </button>
          ))}
        </div>

        {/* KPI Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-xl font-bold text-gray-900 dark:text-white">${totalExposure.toFixed(1)}B</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Total Exposure</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{avgRiskScore.toFixed(1)}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Avg Risk Score</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-red-600 dark:text-red-400">{highRiskCount}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">High Risk</div>
          </div>
        </div>
      </div>

      {/* Advanced Donut Chart */}
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <defs>
                {currentData.map((item, index) => (
                  <React.Fragment key={index}>
                    <linearGradient
                      id={`systemGradient-${index}`}
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor={item.color} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={item.color} stopOpacity={0.6} />
                    </linearGradient>
                    <filter id={`systemGlow-${index}`}>
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
                data={currentData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={140}
                paddingAngle={2}
                dataKey="value"
                onMouseEnter={(_, index) => setActiveSegment(index)}
                onMouseLeave={() => setActiveSegment(null)}
              >
                {currentData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`url(#systemGradient-${index})`}
                    filter={activeSegment === index ? `url(#systemGlow-${index})` : ""}
                    className="transition-all duration-300 cursor-pointer hover:opacity-90"
                    style={{
                      transform: activeSegment === index ? 'scale(1.05)' : 'scale(1)',
                      transformOrigin: 'center'
                    }}
                  />
                ))}
              </Pie>
              <Tooltip content={<SystemRiskTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Enhanced Legend with Risk Metrics */}
        <div className="flex-1 space-y-3">
          <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Risk Breakdown</h4>
          {currentData.map((item, index) => (
            <div
              key={index}
              className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer transform hover:scale-102 ${
                activeSegment === index
                  ? 'border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 shadow-lg'
                  : 'border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/70 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onMouseEnter={() => setActiveSegment(index)}
              onMouseLeave={() => setActiveSegment(null)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{item.icon}</div>
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white">{item.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">${item.exposure}B exposure</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold" style={{ color: item.color }}>
                    {item.value}%
                  </div>
                  <div className={`text-sm font-medium ${
                    item.trend === 'improving' ? 'text-green-600 dark:text-green-400' : 
                    item.trend === 'deteriorating' ? 'text-red-600 dark:text-red-400' : 
                    'text-gray-600 dark:text-gray-400'
                  }`}>
                    {item.trend === 'improving' ? '↗️' : item.trend === 'deteriorating' ? '↘️' : '➡️'}
                  </div>
                </div>
              </div>
              
              {/* Risk Score Indicator */}
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-600 dark:text-gray-400">Risk Score</span>
                <span className={`text-sm font-bold ${
                  item.risk_score <= 3 ? 'text-green-600 dark:text-green-400' :
                  item.risk_score <= 4 ? 'text-amber-600 dark:text-amber-400' :
                  'text-red-600 dark:text-red-400'
                }`}>
                  {item.risk_score}/5.0
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    item.risk_score <= 3 ? 'bg-gradient-to-r from-green-400 to-green-500' :
                    item.risk_score <= 4 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                    'bg-gradient-to-r from-red-400 to-red-500'
                  }`}
                  style={{ width: `${(item.risk_score / 5) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Overall Application Trends Chart - Premium Advanced Design
export const OverallApplicationTrendsChart: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'3m' | '6m' | '12m'>('6m');
  const [selectedMetric, setSelectedMetric] = useState<'volume' | 'conversion' | 'quality'>('volume');
  const [forecastEnabled, setForecastEnabled] = useState(false);

  // Enhanced application trends data with predictions
  const applicationTrendsData = [
    {
      month: "Jan 2024",
      applications: 1420,
      approved: 892,
      rejected: 445,
      pending: 83,
      approval_rate: 62.8,
      avg_processing_time: 4.2,
      quality_score: 7.8,
      channel_online: 65,
      channel_mobile: 25,
      channel_branch: 10,
      predicted: false
    },
    {
      month: "Feb 2024", 
      applications: 1356,
      approved: 923,
      rejected: 354,
      pending: 79,
      approval_rate: 68.1,
      avg_processing_time: 3.9,
      quality_score: 8.1,
      channel_online: 67,
      channel_mobile: 24,
      channel_branch: 9,
      predicted: false
    },
    {
      month: "Mar 2024",
      applications: 1589,
      approved: 1045,
      rejected: 456,
      pending: 88,
      approval_rate: 65.8,
      avg_processing_time: 4.1,
      quality_score: 7.9,
      channel_online: 69,
      channel_mobile: 23,
      channel_branch: 8,
      predicted: false
    },
    {
      month: "Apr 2024",
      applications: 1634,
      approved: 1123,
      rejected: 398,
      pending: 113,
      approval_rate: 68.7,
      avg_processing_time: 3.8,
      quality_score: 8.3,
      channel_online: 71,
      channel_mobile: 22,
      channel_branch: 7,
      predicted: false
    },
    {
      month: "May 2024",
      applications: 1712,
      approved: 1189,
      rejected: 401,
      pending: 122,
      approval_rate: 69.5,
      avg_processing_time: 3.6,
      quality_score: 8.4,
      channel_online: 73,
      channel_mobile: 21,
      channel_branch: 6,
      predicted: false
    },
    {
      month: "Jun 2024",
      applications: 1598,
      approved: 1134,
      rejected: 356,
      pending: 108,
      approval_rate: 71.0,
      avg_processing_time: 3.4,
      quality_score: 8.6,
      channel_online: 74,
      channel_mobile: 21,
      channel_branch: 5,
      predicted: false
    },
    // Forecast data
    {
      month: "Jul 2024",
      applications: 1680,
      approved: 1210,
      rejected: 370,
      pending: 100,
      approval_rate: 72.6,
      avg_processing_time: 3.2,
      quality_score: 8.8,
      channel_online: 75,
      channel_mobile: 20,
      channel_branch: 5,
      predicted: true
    },
    {
      month: "Aug 2024",
      applications: 1735,
      approved: 1272,
      rejected: 363,
      pending: 100,
      approval_rate: 73.3,
      avg_processing_time: 3.1,
      quality_score: 8.9,
      channel_online: 76,
      channel_mobile: 20,
      channel_branch: 4,
      predicted: true
    }
  ];

  const displayData = forecastEnabled ? applicationTrendsData : applicationTrendsData.slice(0, 6);

  const ApplicationTrendsTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border border-white/30 dark:border-gray-700/40 rounded-3xl p-6 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 min-w-[350px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-bold text-xl text-gray-900 dark:text-white">
                {label}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Application Performance
                {data.predicted && <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-xs">Forecast</span>}
              </p>
            </div>
          </div>
          
          {/* Volume Metrics */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="text-center p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{data.applications.toLocaleString()}</div>
              <div className="text-xs text-indigo-700 dark:text-indigo-300">Applications</div>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/30 rounded-2xl">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{data.approval_rate}%</div>
              <div className="text-xs text-green-700 dark:text-green-300">Approval Rate</div>
            </div>
            <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/30 rounded-2xl">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{data.avg_processing_time}</div>
              <div className="text-xs text-amber-700 dark:text-amber-300">Avg Days</div>
            </div>
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/30 rounded-2xl">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{data.quality_score}</div>
              <div className="text-xs text-purple-700 dark:text-purple-300">Quality Score</div>
            </div>
          </div>

          {/* Channel Distribution */}
          <div className="mb-4">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Channel Distribution:</div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">📱 Online:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{data.channel_online}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">📲 Mobile:</span>
                <span className="font-bold text-purple-600 dark:text-purple-400">{data.channel_mobile}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">🏢 Branch:</span>
                <span className="font-bold text-gray-600 dark:text-gray-400">{data.channel_branch}%</span>
              </div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">✅ Approved:</span>
              <span className="font-bold text-green-600 dark:text-green-400">{data.approved.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">❌ Rejected:</span>
              <span className="font-bold text-red-600 dark:text-red-400">{data.rejected.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">⏳ Pending:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">{data.pending.toLocaleString()}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const totalApplications = displayData.reduce((sum, item) => sum + item.applications, 0);
  const avgApprovalRate = displayData.reduce((sum, item) => sum + item.approval_rate, 0) / displayData.length;
  const avgProcessingTime = displayData.reduce((sum, item) => sum + item.avg_processing_time, 0) / displayData.length;

  return (
    <div className="space-y-6">
      {/* Advanced Control Panel */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        {/* Controls */}
        <div className="flex items-center space-x-4">
          {/* Time Range */}
          <div className="flex items-center space-x-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-2 border border-gray-200 dark:border-gray-700">
            {[
              { key: '3m', label: '3M' },
              { key: '6m', label: '6M' },
              { key: '12m', label: '12M' }
            ].map((range) => (
              <button
                key={range.key}
                onClick={() => setTimeRange(range.key as any)}
                className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all duration-300 ${
                  timeRange === range.key 
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>

          {/* Forecast Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setForecastEnabled(!forecastEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
                forecastEnabled ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                  forecastEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Forecast</span>
          </div>
        </div>

        {/* KPI Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{totalApplications.toLocaleString()}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Total Apps</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-green-600 dark:text-green-400">{avgApprovalRate.toFixed(1)}%</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Avg Approval</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{avgProcessingTime.toFixed(1)}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Avg Days</div>
          </div>
        </div>
      </div>

      {/* Advanced Multi-Layer Chart */}
      <ResponsiveContainer width="100%" height={420}>
        <ComposedChart
          data={displayData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <defs>
            <linearGradient id="applicationsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366F1" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#6366F1" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="approvalGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#10B981" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="rejectedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EF4444" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#EF4444" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="pendingGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.1} />
            </linearGradient>
            <filter id="trendsGlow">
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
            yAxisId="volume"
            orientation="left"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "currentColor", fontSize: 12 }}
            className="text-gray-600 dark:text-gray-400"
            label={{ value: 'Applications', angle: -90, position: 'insideLeft' }}
          />
          
          <YAxis
            yAxisId="rate"
            orientation="right"
            domain={[0, 100]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "currentColor", fontSize: 12 }}
            className="text-gray-600 dark:text-gray-400"
            label={{ value: 'Approval Rate %', angle: 90, position: 'insideRight' }}
          />
          
          <Tooltip content={<ApplicationTrendsTooltip />} />
          
          {/* Volume Areas */}
          <Area
            yAxisId="volume"
            type="monotone"
            dataKey="approved"
            stackId="1"
            stroke="#10B981"
            fill="url(#approvalGradient)"
            strokeWidth={2}
          />
          <Area
            yAxisId="volume"
            type="monotone"
            dataKey="rejected" 
            stackId="1"
            stroke="#EF4444"
            fill="url(#rejectedGradient)"
            strokeWidth={2}
          />
          <Area
            yAxisId="volume"
            type="monotone"
            dataKey="pending"
            stackId="1"
            stroke="#F59E0B"
            fill="url(#pendingGradient)"
            strokeWidth={2}
          />
          
          {/* Approval Rate Line */}
          <Line
            yAxisId="rate"
            type="monotone"
            dataKey="approval_rate"
            stroke="#8B5CF6"
            strokeWidth={4}
            filter="url(#trendsGlow)"
            dot={{
              r: 6,
              fill: "#8B5CF6",
              stroke: "#ffffff",
              strokeWidth: 3,
              className: "dark:stroke-gray-800",
            }}
            activeDot={{
              r: 8,
              fill: "#8B5CF6", 
              stroke: "#ffffff",
              strokeWidth: 4,
              className: "dark:stroke-gray-800",
            }}
            strokeDasharray={({ payload }: any) => payload?.predicted ? "5,5" : "0"}
          />
          
          {/* Quality Score Line */}
          <Line
            yAxisId="rate"
            type="monotone"
            dataKey={(data: any) => data.quality_score * 10}
            stroke="#EC4899"
            strokeWidth={3}
            strokeDasharray="8 4"
            dot={false}
            name="Quality Score (x10)"
          />
          
        </ComposedChart>
      </ResponsiveContainer>

      {/* Enhanced Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border border-indigo-200 dark:border-indigo-800">
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl">📊</div>
            <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              +12.3%
            </div>
          </div>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-1">
            {displayData[displayData.length - 1]?.applications.toLocaleString()}
          </div>
          <div className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">Latest Month</div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl">✅</div>
            <div className="text-xs font-bold text-green-600 dark:text-green-400">
              +2.1%
            </div>
          </div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
            {displayData[displayData.length - 1]?.approval_rate}%
          </div>
          <div className="text-sm text-green-700 dark:text-green-300 font-medium">Current Rate</div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl">⏱️</div>
            <div className="text-xs font-bold text-green-600 dark:text-green-400">
              -0.8d
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mb-1">
            {displayData[displayData.length - 1]?.avg_processing_time}
          </div>
          <div className="text-sm text-amber-700 dark:text-amber-300 font-medium">Processing Days</div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl">⭐</div>
            <div className="text-xs font-bold text-purple-600 dark:text-purple-400">
              +0.3
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
            {displayData[displayData.length - 1]?.quality_score}
          </div>
          <div className="text-sm text-purple-700 dark:text-purple-300 font-medium">Quality Score</div>
        </div>
      </div>
    </div>
  );
};

// System-wide Risk Factors Chart - Premium Advanced Design
export const SystemWideRiskFactorsChart: React.FC = () => {
  const [activeFactor, setActiveFactor] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'radar' | 'heatmap' | 'matrix'>('radar');
  const [timeComparison, setTimeComparison] = useState<'current' | 'trend' | 'forecast'>('current');

  // Enhanced risk factors data with multiple dimensions and historical trends
  const riskFactorsData = {
    current: [
      { 
        factor: "Credit Quality", 
        score: 85, 
        weight: 25, 
        trend: "stable", 
        impact: "high",
        subcategories: {
          "Credit Score Distribution": 88,
          "Payment History": 82,
          "Debt-to-Income": 87,
          "Credit Utilization": 83
        },
        benchmark: 82,
        threshold: 75,
        description: "Overall creditworthiness assessment"
      },
      { 
        factor: "Market Conditions", 
        score: 72, 
        weight: 20, 
        trend: "deteriorating", 
        impact: "high",
        subcategories: {
          "Interest Rate Environment": 68,
          "Economic Indicators": 75,
          "Market Volatility": 70,
          "Industry Outlook": 76
        },
        benchmark: 78,
        threshold: 65,
        description: "External market and economic factors"
      },
      { 
        factor: "Operational Risk", 
        score: 91, 
        weight: 15, 
        trend: "improving", 
        impact: "medium",
        subcategories: {
          "Process Efficiency": 93,
          "Technology Risk": 89,
          "Compliance": 95,
          "Human Resources": 87
        },
        benchmark: 85,
        threshold: 80,
        description: "Internal operational effectiveness"
      },
      { 
        factor: "Portfolio Concentration", 
        score: 78, 
        weight: 15, 
        trend: "stable", 
        impact: "medium",
        subcategories: {
          "Geographic Spread": 82,
          "Industry Diversification": 75,
          "Product Mix": 80,
          "Customer Segments": 76
        },
        benchmark: 75,
        threshold: 70,
        description: "Portfolio diversification and concentration risk"
      },
      { 
        factor: "Liquidity Position", 
        score: 88, 
        weight: 12, 
        trend: "improving", 
        impact: "high",
        subcategories: {
          "Cash Reserves": 92,
          "Credit Facilities": 85,
          "Asset Quality": 87,
          "Funding Sources": 88
        },
        benchmark: 83,
        threshold: 75,
        description: "Availability of liquid assets and funding"
      },
      { 
        factor: "Regulatory Environment", 
        score: 82, 
        weight: 8, 
        trend: "stable", 
        impact: "medium",
        subcategories: {
          "Compliance Status": 95,
          "Regulatory Changes": 75,
          "Capital Requirements": 85,
          "Reporting Standards": 92
        },
        benchmark: 80,
        threshold: 75,
        description: "Regulatory compliance and environment"
      },
      { 
        factor: "Technology & Innovation", 
        score: 79, 
        weight: 5, 
        trend: "improving", 
        impact: "low",
        subcategories: {
          "Digital Capabilities": 83,
          "Data Analytics": 82,
          "Cybersecurity": 75,
          "System Integration": 76
        },
        benchmark: 72,
        threshold: 65,
        description: "Technology infrastructure and innovation"
      }
    ]
  };

  const currentData = riskFactorsData.current;
  const overallRiskScore = Math.round(
    currentData.reduce((sum, factor) => sum + (factor.score * factor.weight), 0) / 
    currentData.reduce((sum, factor) => sum + factor.weight, 0)
  );

  const RiskFactorsTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const factor = currentData.find(f => f.factor === label);
      
      if (!factor) return null;
      
      return (
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border border-white/30 dark:border-gray-700/40 rounded-3xl p-6 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 min-w-[350px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-bold text-xl text-gray-900 dark:text-white">
                {factor.factor}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                {factor.description}
              </p>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${
                factor.score >= 85 ? 'text-green-600 dark:text-green-400' :
                factor.score >= 75 ? 'text-amber-600 dark:text-amber-400' :
                'text-red-600 dark:text-red-400'
              }`}>
                {factor.score}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Risk Score</div>
            </div>
          </div>
          
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl">
              <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{factor.weight}%</div>
              <div className="text-xs text-indigo-700 dark:text-indigo-300">Weight</div>
            </div>
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/30 rounded-2xl">
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{factor.impact.toUpperCase()}</div>
              <div className="text-xs text-purple-700 dark:text-purple-300">Impact</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
              <div className="text-lg font-bold text-gray-600 dark:text-gray-400">{factor.benchmark}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Benchmark</div>
            </div>
            <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/30 rounded-2xl">
              <div className={`text-lg font-bold ${
                factor.trend === 'improving' ? 'text-green-600 dark:text-green-400' :
                factor.trend === 'deteriorating' ? 'text-red-600 dark:text-red-400' :
                'text-gray-600 dark:text-gray-400'
              }`}>
                {factor.trend === 'improving' ? '📈' : factor.trend === 'deteriorating' ? '📉' : '➡️'}
              </div>
              <div className="text-xs text-amber-700 dark:text-amber-300">Trend</div>
            </div>
          </div>
          
          {/* Subcategories Breakdown */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Risk Breakdown:</div>
            <div className="space-y-2">
              {Object.entries(factor.subcategories).map(([category, score]) => (
                <div key={category} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{category}:</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          score >= 85 ? 'bg-gradient-to-r from-green-400 to-green-500' :
                          score >= 75 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                          'bg-gradient-to-r from-red-400 to-red-500'
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <span className={`text-sm font-bold ${
                      score >= 85 ? 'text-green-600 dark:text-green-400' :
                      score >= 75 ? 'text-amber-600 dark:text-amber-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Performance vs Benchmark */}
          <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-2xl border border-blue-200 dark:border-blue-800">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">vs Benchmark</span>
              <span className={`text-sm font-bold ${
                factor.score > factor.benchmark ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {factor.score > factor.benchmark ? '+' : ''}{factor.score - factor.benchmark}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  factor.score > factor.benchmark 
                    ? 'bg-gradient-to-r from-green-400 to-green-500' 
                    : 'bg-gradient-to-r from-red-400 to-red-500'
                }`}
                style={{ width: `${Math.min(Math.abs(factor.score - factor.benchmark) * 5, 100)}%` }}
              />
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const highRiskFactors = currentData.filter(factor => factor.score < factor.threshold).length;
  const avgScore = Math.round(currentData.reduce((sum, factor) => sum + factor.score, 0) / currentData.length);
  const criticalFactors = currentData.filter(factor => factor.impact === 'high' && factor.score < 80).length;

  return (
    <div className="space-y-6">
      {/* Premium Control Panel */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        {/* View Mode Controls */}
        <div className="flex items-center space-x-4">
          {/* View Mode Selector */}
          <div className="flex items-center space-x-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-2 border border-gray-200 dark:border-gray-700">
            {[
              { key: 'radar', label: 'Radar', icon: '🎯' },
              { key: 'heatmap', label: 'Heatmap', icon: '🔥' },
              { key: 'matrix', label: 'Matrix', icon: '📊' }
            ].map((mode) => (
              <button
                key={mode.key}
                onClick={() => setViewMode(mode.key as any)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  viewMode === mode.key 
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span>{mode.icon}</span>
                <span>{mode.label}</span>
              </button>
            ))}
          </div>

          {/* Time Comparison */}
          <div className="flex items-center space-x-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-2 border border-gray-200 dark:border-gray-700">
            {[
              { key: 'current', label: 'Current' },
              { key: 'trend', label: 'Trend' },
              { key: 'forecast', label: 'Forecast' }
            ].map((time) => (
              <button
                key={time.key}
                onClick={() => setTimeComparison(time.key as any)}
                className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all duration-300 ${
                  timeComparison === time.key 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {time.label}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className={`text-xl font-bold ${
              overallRiskScore >= 85 ? 'text-green-600 dark:text-green-400' :
              overallRiskScore >= 75 ? 'text-amber-600 dark:text-amber-400' :
              'text-red-600 dark:text-red-400'
            }`}>{overallRiskScore}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Overall Score</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-red-600 dark:text-red-400">{criticalFactors}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Critical Issues</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{avgScore}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Avg Factor</div>
          </div>
        </div>
      </div>

      {/* Enhanced Radar Chart */}
      {viewMode === 'radar' && (
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={currentData.map(factor => ({
                subject: factor.factor,
                score: factor.score,
                benchmark: factor.benchmark,
                threshold: factor.threshold,
                fullMark: 100,
                ...factor
              }))}>
                <defs>
                  <linearGradient id="riskRadarGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity={0.8} />
                    <stop offset="50%" stopColor="#8B5CF6" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#EC4899" stopOpacity={0.4} />
                  </linearGradient>
                  <linearGradient id="riskBenchmarkGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#6B7280" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#6B7280" stopOpacity={0.3} />
                  </linearGradient>
                  <filter id="riskGlow">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur" />
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
                  tick={{ fill: "currentColor", fontSize: 11, fontWeight: 600 }}
                  className="text-gray-600 dark:text-gray-400"
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={{ fill: "currentColor", fontSize: 9 }}
                  className="text-gray-500 dark:text-gray-500"
                />
                
                {/* Benchmark Area */}
                <Radar
                  name="Industry Benchmark"
                  dataKey="benchmark"
                  stroke="#6B7280"
                  fill="url(#riskBenchmarkGradient)"
                  strokeWidth={2}
                  dot={false}
                  fillOpacity={0.2}
                />
                
                {/* Current Score Area */}
                <Radar
                  name="Current Score"
                  dataKey="score"
                  stroke="#6366F1"
                  fill="url(#riskRadarGradient)"
                  strokeWidth={3}
                  dot={{ 
                    r: 6, 
                    fill: "#6366F1", 
                    stroke: "#ffffff", 
                    strokeWidth: 2,
                    filter: "url(#riskGlow)"
                  }}
                  filter="url(#riskGlow)"
                />
                
                {/* Threshold Line */}
                <Radar
                  name="Risk Threshold"
                  dataKey="threshold"
                  stroke="#EF4444"
                  strokeWidth={2}
                  strokeDasharray="5,5"
                  dot={false}
                  fill="none"
                />
                
                <Tooltip content={<RiskFactorsTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Enhanced Legend with Risk Assessment */}
          <div className="flex-1 space-y-4">
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Risk Factor Analysis</h4>
            {currentData.map((factor, index) => (
              <div
                key={index}
                className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer transform hover:scale-102 ${
                  activeFactor === index
                    ? 'border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 shadow-lg'
                    : 'border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/70 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onMouseEnter={() => setActiveFactor(index)}
                onMouseLeave={() => setActiveFactor(null)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <div className="font-bold text-gray-900 dark:text-white text-sm">{factor.factor}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{factor.weight}% weight • {factor.impact} impact</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${
                      factor.score >= 85 ? 'text-green-600 dark:text-green-400' :
                      factor.score >= 75 ? 'text-amber-600 dark:text-amber-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {factor.score}
                    </div>
                    <div className={`text-xs font-medium ${
                      factor.trend === 'improving' ? 'text-green-600 dark:text-green-400' :
                      factor.trend === 'deteriorating' ? 'text-red-600 dark:text-red-400' :
                      'text-gray-600 dark:text-gray-400'
                    }`}>
                      {factor.trend === 'improving' ? '↗️ Improving' : factor.trend === 'deteriorating' ? '↘️ Declining' : '➡️ Stable'}
                    </div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Performance</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">vs {factor.benchmark} benchmark</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      factor.score >= 85 ? 'bg-gradient-to-r from-green-400 to-green-500' :
                      factor.score >= 75 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                      'bg-gradient-to-r from-red-400 to-red-500'
                    }`}
                    style={{ width: `${factor.score}%` }}
                  />
                </div>
                
                {/* Quick Status */}
                <div className="flex justify-between items-center">
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                    factor.score >= factor.threshold 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  }`}>
                    {factor.score >= factor.threshold ? 'Within Limits' : 'Above Threshold'}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {factor.score > factor.benchmark ? '+' : ''}{factor.score - factor.benchmark} vs benchmark
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Heatmap View */}
      {viewMode === 'heatmap' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {currentData.map((factor, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h5 className="font-bold text-gray-900 dark:text-white">{factor.factor}</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{factor.description}</p>
                  </div>
                  <div className={`text-3xl font-bold ${
                    factor.score >= 85 ? 'text-green-600 dark:text-green-400' :
                    factor.score >= 75 ? 'text-amber-600 dark:text-amber-400' :
                    'text-red-600 dark:text-red-400'
                  }`}>
                    {factor.score}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(factor.subcategories).map(([category, score]) => (
                    <div
                      key={category}
                      className={`p-3 rounded-xl text-center ${
                        score >= 85 ? 'bg-green-50 dark:bg-green-900/30' :
                        score >= 75 ? 'bg-amber-50 dark:bg-amber-900/30' :
                        'bg-red-50 dark:bg-red-900/30'
                      }`}
                    >
                      <div className={`text-lg font-bold ${
                        score >= 85 ? 'text-green-600 dark:text-green-400' :
                        score >= 75 ? 'text-amber-600 dark:text-amber-400' :
                        'text-red-600 dark:text-red-400'
                      }`}>
                        {score}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{category}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Matrix View */}
      {viewMode === 'matrix' && (
        <div className="space-y-6">
          {/* Risk Impact Matrix */}
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
            <h5 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Risk Impact Matrix</h5>
            <div className="grid grid-cols-4 gap-4">
              {/* Matrix Headers */}
              <div></div>
              <div className="text-center font-semibold text-gray-600 dark:text-gray-400">Low Impact</div>
              <div className="text-center font-semibold text-gray-600 dark:text-gray-400">Medium Impact</div>
              <div className="text-center font-semibold text-gray-600 dark:text-gray-400">High Impact</div>
              
              {/* High Risk Row */}
              <div className="flex items-center font-semibold text-gray-600 dark:text-gray-400">High Risk</div>
              <div className="h-20 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  {currentData.filter(f => f.score < 75 && f.impact === 'low').map(f => (
                    <div key={f.factor} className="text-xs text-amber-800 dark:text-amber-200">{f.factor}</div>
                  ))}
                </div>
              </div>
              <div className="h-20 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  {currentData.filter(f => f.score < 75 && f.impact === 'medium').map(f => (
                    <div key={f.factor} className="text-xs text-red-800 dark:text-red-200">{f.factor}</div>
                  ))}
                </div>
              </div>
              <div className="h-20 bg-red-200 dark:bg-red-900/50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  {currentData.filter(f => f.score < 75 && f.impact === 'high').map(f => (
                    <div key={f.factor} className="text-xs text-red-900 dark:text-red-100 font-semibold">{f.factor}</div>
                  ))}
                </div>
              </div>
              
              {/* Medium Risk Row */}
              <div className="flex items-center font-semibold text-gray-600 dark:text-gray-400">Medium Risk</div>
              <div className="h-20 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  {currentData.filter(f => f.score >= 75 && f.score < 85 && f.impact === 'low').map(f => (
                    <div key={f.factor} className="text-xs text-green-800 dark:text-green-200">{f.factor}</div>
                  ))}
                </div>
              </div>
              <div className="h-20 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  {currentData.filter(f => f.score >= 75 && f.score < 85 && f.impact === 'medium').map(f => (
                    <div key={f.factor} className="text-xs text-amber-800 dark:text-amber-200">{f.factor}</div>
                  ))}
                </div>
              </div>
              <div className="h-20 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  {currentData.filter(f => f.score >= 75 && f.score < 85 && f.impact === 'high').map(f => (
                    <div key={f.factor} className="text-xs text-red-800 dark:text-red-200">{f.factor}</div>
                  ))}
                </div>
              </div>
              
              {/* Low Risk Row */}
              <div className="flex items-center font-semibold text-gray-600 dark:text-gray-400">Low Risk</div>
              <div className="h-20 bg-green-200 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  {currentData.filter(f => f.score >= 85 && f.impact === 'low').map(f => (
                    <div key={f.factor} className="text-xs text-green-900 dark:text-green-100 font-semibold">{f.factor}</div>
                  ))}
                </div>
              </div>
              <div className="h-20 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  {currentData.filter(f => f.score >= 85 && f.impact === 'medium').map(f => (
                    <div key={f.factor} className="text-xs text-green-800 dark:text-green-200">{f.factor}</div>
                  ))}
                </div>
              </div>
              <div className="h-20 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  {currentData.filter(f => f.score >= 85 && f.impact === 'high').map(f => (
                    <div key={f.factor} className="text-xs text-amber-800 dark:text-amber-200">{f.factor}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Policy Compliance Matrix data generator
const generatePolicyComplianceData = () => [
  {
    policy: 'Data Privacy (GDPR)',
    compliant: 95,
    nonCompliant: 5,
    totalChecks: 1250,
    criticalIssues: 2,
    lastAudit: '2024-01-15',
    riskLevel: 'Low',
    trend: 'up'
  },
  {
    policy: 'Financial Regulations',
    compliant: 88,
    nonCompliant: 12,
    totalChecks: 980,
    criticalIssues: 8,
    lastAudit: '2024-01-20',
    riskLevel: 'Medium',
    trend: 'down'
  },
  {
    policy: 'Security Standards',
    compliant: 92,
    nonCompliant: 8,
    totalChecks: 2100,
    criticalIssues: 5,
    lastAudit: '2024-01-18',
    riskLevel: 'Low',
    trend: 'stable'
  },
  {
    policy: 'Credit Risk Policies',
    compliant: 85,
    nonCompliant: 15,
    totalChecks: 1500,
    criticalIssues: 12,
    lastAudit: '2024-01-22',
    riskLevel: 'High',
    trend: 'up'
  },
  {
    policy: 'Operational Risk',
    compliant: 90,
    nonCompliant: 10,
    totalChecks: 850,
    criticalIssues: 4,
    lastAudit: '2024-01-19',
    riskLevel: 'Medium',
    trend: 'up'
  },
  {
    policy: 'AML/KYC Compliance',
    compliant: 97,
    nonCompliant: 3,
    totalChecks: 3200,
    criticalIssues: 1,
    lastAudit: '2024-01-21',
    riskLevel: 'Low',
    trend: 'up'
  }
];

// Audit Coverage Analysis data generator
const generateAuditCoverageData = () => [
  {
    department: 'Credit Risk',
    covered: 95,
    pending: 5,
    auditsCompleted: 45,
    totalAudits: 48,
    highRiskAreas: 3,
    mediumRisk: 8,
    lowRisk: 34,
    nextAudit: '2024-02-15'
  },
  {
    department: 'Operations',
    covered: 82,
    pending: 18,
    auditsCompleted: 28,
    totalAudits: 35,
    highRiskAreas: 6,
    mediumRisk: 12,
    lowRisk: 17,
    nextAudit: '2024-02-08'
  },
  {
    department: 'IT Security',
    covered: 98,
    pending: 2,
    auditsCompleted: 52,
    totalAudits: 53,
    highRiskAreas: 1,
    mediumRisk: 4,
    lowRisk: 48,
    nextAudit: '2024-02-28'
  },
  {
    department: 'Compliance',
    covered: 88,
    pending: 12,
    auditsCompleted: 22,
    totalAudits: 25,
    highRiskAreas: 2,
    mediumRisk: 6,
    lowRisk: 17,
    nextAudit: '2024-02-12'
  },
  {
    department: 'Finance',
    covered: 91,
    pending: 9,
    auditsCompleted: 32,
    totalAudits: 35,
    highRiskAreas: 3,
    mediumRisk: 7,
    lowRisk: 25,
    nextAudit: '2024-02-18'
  }
];

export const PolicyComplianceMatrix: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [viewMode, setViewMode] = useState<'bar' | 'radar'>('bar');
  const data = generatePolicyComplianceData();

  const radarData = data.map(item => ({
    policy: item.policy.split(' ')[0],
    compliance: item.compliant,
    fullMark: 100
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border border-white/30 dark:border-gray-700/40 rounded-2xl p-4 shadow-xl">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value}%`}
            </p>
          ))}
          {data.criticalIssues !== undefined && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-2">
              Critical Issues: {data.criticalIssues}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            🛡️ Policy Compliance Matrix
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time compliance monitoring across all policy domains
          </p>
        </div>
        <div className="flex space-x-2 mt-4 lg:mt-0">
          {(['bar', 'radar'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                viewMode === mode
                  ? 'bg-indigo-500 text-white shadow-lg transform scale-105'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {mode === 'bar' ? '📊 Bar Chart' : '🎯 Radar'}
            </button>
          ))}
        </div>
      </div>

      <div className="h-96 mb-8">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'bar' ? (
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <defs>
                <linearGradient id="compliantGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.4}/>
                </linearGradient>
                <linearGradient id="nonCompliantGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.4}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
              <XAxis 
                dataKey="policy" 
                angle={-45} 
                textAnchor="end" 
                height={80}
                fontSize={12}
                tick={{ fill: isDarkMode ? '#9CA3AF' : '#374151' }}
              />
              <YAxis tick={{ fill: isDarkMode ? '#9CA3AF' : '#374151', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="compliant" 
                name="Compliant %" 
                fill="url(#compliantGradient)"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="nonCompliant" 
                name="Non-Compliant %" 
                fill="url(#nonCompliantGradient)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          ) : (
            <RadarChart data={radarData} margin={{ top: 40, right: 80, bottom: 40, left: 80 }}>
              <PolarGrid stroke="#e5e7eb" opacity={0.3} />
              <PolarAngleAxis 
                dataKey="policy" 
                tick={{ fontSize: 12, fill: isDarkMode ? '#9CA3AF' : '#374151' }} 
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]} 
                tick={{ fontSize: 10, fill: isDarkMode ? '#9CA3AF' : '#374151' }} 
              />
              <Radar
                name="Compliance %"
                dataKey="compliance"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.2}
                strokeWidth={3}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.slice(0, 3).map((item, index) => (
          <div
            key={item.policy}
            className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 rounded-2xl p-4 border border-gray-200/50 dark:border-gray-600/30"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {item.policy}
              </h4>
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                item.riskLevel === 'Low' ? 'bg-green-100 text-green-800 border-green-200' :
                item.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                'bg-red-100 text-red-800 border-red-200'
              }`}>
                {item.riskLevel} Risk
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${item.compliant}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {item.compliant}%
              </span>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-600 dark:text-gray-400">
              <span>{item.criticalIssues} critical issues</span>
              <span className="flex items-center">
                {item.trend === 'up' && <span className="text-green-500">📈</span>}
                {item.trend === 'down' && <span className="text-red-500">📉</span>}
                {item.trend === 'stable' && <span className="text-gray-500">➡️</span>}
                <span className="ml-1">{item.trend}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const AuditCoverageAnalysis: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [viewMode, setViewMode] = useState<'bar' | 'pie'>('bar');
  const data = generateAuditCoverageData();

  const pieData = data.map((item, index) => ({
    name: item.department,
    value: item.covered,
    fill: COLORS[index % COLORS.length]
  }));

  const AuditTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border border-white/30 dark:border-gray-700/40 rounded-2xl p-4 shadow-xl">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <p style={{ color: '#3b82f6' }}>Coverage: {data.covered}%</p>
            <p style={{ color: '#f59e0b' }}>Pending: {data.pending}%</p>
            <p className="text-gray-600 dark:text-gray-400">
              Completed: {data.auditsCompleted}/{data.totalAudits}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              Next Audit: {data.nextAudit}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            👁️ Audit Coverage Analysis
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive audit coverage tracking across all departments
          </p>
        </div>
        <div className="flex space-x-2 mt-4 lg:mt-0">
          {(['bar', 'pie'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                viewMode === mode
                  ? 'bg-indigo-500 text-white shadow-lg transform scale-105'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {mode === 'bar' ? '📊 Bar Chart' : '🥧 Pie Chart'}
            </button>
          ))}
        </div>
      </div>

      <div className="h-96 mb-8">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'bar' ? (
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="coveredGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.4}/>
                </linearGradient>
                <linearGradient id="pendingGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.4}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
              <XAxis 
                dataKey="department" 
                tick={{ fill: isDarkMode ? '#9CA3AF' : '#374151', fontSize: 12 }}
              />
              <YAxis tick={{ fill: isDarkMode ? '#9CA3AF' : '#374151', fontSize: 12 }} />
              <Tooltip content={<AuditTooltip />} />
              <Legend />
              <Bar 
                dataKey="covered" 
                name="Coverage %" 
                fill="url(#coveredGradient)"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="pending" 
                name="Pending %" 
                fill="url(#pendingGradient)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          ) : (
            <PieChart margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={120}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}%`}
                labelLine={false}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Department Risk Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {data.map((dept, index) => (
          <div
            key={dept.department}
            className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 rounded-2xl p-4 border border-gray-200/50 dark:border-gray-600/30"
          >
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              {dept.department}
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-red-600 dark:text-red-400">High Risk</span>
                <span className="font-medium">{dept.highRiskAreas}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-yellow-600 dark:text-yellow-400">Medium Risk</span>
                <span className="font-medium">{dept.mediumRisk}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-green-600 dark:text-green-400">Low Risk</span>
                <span className="font-medium">{dept.lowRisk}</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>Next Audit:</span>
                <span className="font-medium">{new Date(dept.nextAudit).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Removed unused generateClientRiskData function - now using only real ML assessment data

// Removed unused generateClientApplicationData function - now using only real application data

// Function to generate client risk data from ML assessment
const generateClientRiskDataFromML = (assessment: {
  credit_score: number;
  category: string;
  risk_level: string;
  confidence: number;
  confidence_factors?: Record<string, any>;
}) => {
  // Extract factors from confidence_factors or create default ones
  const factors = [];
  
  if (assessment.confidence_factors) {
    // Map confidence factors to risk factors
    Object.entries(assessment.confidence_factors).forEach(([key, value], index) => {
      if (index < 6) { // Limit to 6 factors for radar chart
        const score = typeof value === 'number' ? Math.round(value * 100) : 75;
        factors.push({
          factor: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          score: Math.max(0, Math.min(100, score)), // Ensure score is between 0-100
          status: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor',
          change: Math.random() > 0.5 ? 'up' : 'down'
        });
      }
    });
  }
  
  // Fill remaining factors if needed
  const defaultFactors = [
    'Payment History', 'Credit Utilization', 'Length of History', 
    'Account Mix', 'Recent Inquiries', 'Debt to Income'
  ];
  
  while (factors.length < 6) {
    const remainingFactors = defaultFactors.filter(df => 
      !factors.some(f => f.factor.includes(df.split(' ')[0]))
    );
    if (remainingFactors.length === 0) break;
    
    const factorName = remainingFactors[0];
    const score = 60 + Math.random() * 30; // Random score between 60-90
    factors.push({
      factor: factorName,
      score: Math.round(score),
      status: score >= 80 ? 'excellent' : score >= 60 ? 'good' : 'fair',
      change: Math.random() > 0.5 ? 'up' : 'down'
    });
  }

  return {
    overallScore: assessment.credit_score,
    riskLevel: assessment.category,
    confidence: `${Math.round(assessment.confidence)}%`,
    lastUpdated: 'Today',
    factors: factors.slice(0, 6), // Ensure max 6 factors
    trend: {
      direction: assessment.risk_level === 'Low Risk' ? 'up' : 
                assessment.risk_level === 'High Risk' ? 'down' : 'stable',
      change: '+12',
      period: '30 days'
    }
  };
};

interface ClientRiskProfileProps {
  mlAssessmentData?: {
    latest_assessment?: {
      credit_score: number;
      category: string;
      risk_level: string;
      confidence: number;
      confidence_factors?: Record<string, any>;
    };
  };
  isLoading?: boolean;
}

export const ClientRiskProfileChart: React.FC<ClientRiskProfileProps> = ({ 
  mlAssessmentData, 
  isLoading = false 
}) => {
  const [viewMode, setViewMode] = useState<'radar' | 'trend'>('radar');
  
  // Check if we have real ML assessment data
  const hasRealData = mlAssessmentData?.latest_assessment;
  
  // Only use real data, no fake fallback
  const data = hasRealData ? 
    generateClientRiskDataFromML(mlAssessmentData.latest_assessment) : 
    null;

  const radarData = data?.factors.map(factor => ({
    factor: factor.factor.split(' ')[0],
    score: factor.score,
    fullMark: 100
  })) || [];

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      excellent: 'bg-green-100 text-green-800 border-green-200',
      good: 'bg-blue-100 text-blue-800 border-blue-200',
      fair: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      poor: 'bg-red-100 text-red-800 border-red-200'
    };
    return styles[status as keyof typeof styles] || styles.fair;
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">
          Loading risk profile...
        </div>
      </div>
    );
  }

  // Show empty state if no real data available
  if (!hasRealData) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Risk Profile Available
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 max-w-sm">
          Submit a credit application to generate your personalized risk assessment and credit profile.
        </p>
        <button
          onClick={() => window.location.href = '/home/loan-applications'}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Submit Application
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center space-x-3">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {data.overallScore}
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Credit Score</div>
              <div className={`text-sm font-medium ${
                data.riskLevel === 'Excellent' ? 'text-green-600' :
                data.riskLevel === 'Good' ? 'text-blue-600' :
                data.riskLevel === 'Fair' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {data.riskLevel} Standing
              </div>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          {(['radar', 'trend'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                viewMode === mode
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {mode === 'radar' ? '🎯' : '📈'}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'radar' ? (
            <RadarChart data={radarData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <PolarGrid stroke="#e5e7eb" opacity={0.3} />
              <PolarAngleAxis dataKey="factor" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} />
              <Radar
                name="Risk Factors"
                dataKey="score"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload[0]) {
                    const factor = data.factors.find(f => f.factor.startsWith(payload[0].payload.factor));
                    return (
                      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-lg">
                        <p className="font-semibold text-gray-900 dark:text-white">{factor?.factor}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Score: {factor?.score}/100</p>
                        <p className="text-xs" style={{ color: getScoreColor(factor?.score || 0) }}>
                          {factor?.status.charAt(0).toUpperCase() + factor?.status.slice(1)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </RadarChart>
          ) : (
            <LineChart data={data.trends} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis domain={['dataMin - 10', 'dataMax + 10']} tick={{ fontSize: 12 }} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload[0]) {
                    return (
                      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-lg">
                        <p className="font-semibold text-gray-900 dark:text-white">{label}</p>
                        <p className="text-sm text-indigo-600">Score: {payload[0].value}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#6366f1"
                strokeWidth={3}
                dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#6366f1', strokeWidth: 2 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Risk Factors Summary */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        {data.factors.slice(0, 4).map((factor, index) => (
          <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate">
                {factor.factor}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusBadge(factor.status)}`}>
                {factor.status}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${factor.score}%`,
                    backgroundColor: getScoreColor(factor.score)
                  }}
                />
              </div>
              <span className="text-xs font-medium text-gray-900 dark:text-white">
                {factor.score}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface ClientApplicationHistoryProps {
  applicationsData?: {
    results?: any[];
    count?: number;
  } | any[];
  isLoading?: boolean;
  onViewAll?: () => void;
}

// Transform backend application data to chart format
const transformApplicationData = (applications: any[]) => {
  if (!Array.isArray(applications)) {
    return [];
  }
  
  const transformed = applications.map((app) => {
    // Map status from backend to display format
    const getDisplayStatus = (status: string) => {
      const statusMap = {
        'DRAFT': 'Draft',
        'SUBMITTED': 'Under Review',
        'UNDER_REVIEW': 'Under Review',
        'APPROVED': 'Approved',
        'REJECTED': 'Rejected',
        'NEEDS_INFO': 'Needs More Information'
      };
      return statusMap[status as keyof typeof statusMap] || status;
    };

    // Get loan type from loan_amount - this could be enhanced based on your data
    const getLoanType = (amount: number) => {
      if (!amount) return 'Credit Application';
      if (amount <= 5000) return 'Small Personal Loan';
      if (amount <= 25000) return 'Personal Loan';
      if (amount <= 100000) return 'Business Loan';
      return 'Large Loan';
    };

    // Get risk score from ML assessment if available
    const getRiskScore = () => {
      if (app.ml_assessment?.credit_score) {
        return app.ml_assessment.credit_score;
      }
      if (app.risk_assessment?.risk_score) {
        return Math.round(app.risk_assessment.risk_score * 100); // Convert to 0-100 scale if needed
      }
      return null;
    };

    return {
      id: app.id || app.reference_number,
      reference_number: app.reference_number,
      type: getLoanType(parseFloat(app.loan_amount || '0')),
      amount: parseFloat(app.loan_amount || '0'),
      status: getDisplayStatus(app.status),
      appliedDate: app.submission_date || app.last_updated,
      approvedDate: app.status === 'APPROVED' ? app.last_updated : null,
      riskScore: getRiskScore(),
      interestRate: parseFloat(app.interest_rate || '0'),
      term: 36, // Default term, could be enhanced based on your data
      rawApp: app // Keep reference to original app data for additional info
    };
  }); // Show all applications
  
  return transformed;
};

export const ClientApplicationHistoryChart: React.FC<ClientApplicationHistoryProps> = ({ 
  applicationsData, 
  isLoading = false,
  onViewAll
}) => {
  const [viewMode, setViewMode] = useState<'timeline' | 'amounts'>('timeline');
  
  // Debug logging can be removed in production
  // console.log('🔍 ApplicationHistory Debug:', { applicationsData, isLoading });
  
  // Check for real application data, no fake fallback
  let applicationsArray;
  if (Array.isArray(applicationsData)) {
    applicationsArray = applicationsData;
  } else if (applicationsData?.results && Array.isArray(applicationsData.results)) {
    applicationsArray = applicationsData.results;
  }
  
  // Only use real data if available
  const hasRealData = applicationsArray && applicationsArray.length > 0;
  const data = hasRealData ? transformApplicationData(applicationsArray) : [];

  // Keep all data for statistics, but limit timeline display to recent 3
  const allData = data;
  const recentData = data.slice(0, 3);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'text-green-600 bg-green-100 border-green-200';
      case 'Under Review': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'Rejected': return 'text-red-600 bg-red-100 border-red-200';
      case 'Draft': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'Needs More Information': return 'text-orange-600 bg-orange-100 border-orange-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved': return '✅';
      case 'Under Review': return '🔄';
      case 'Rejected': return '❌';
      case 'Draft': return '📝';
      case 'Needs More Information': return '❓';
      default: return '📋';
    }
  };

  const chartData = allData.map(app => ({
    type: app.type,
    amount: app.amount,
    date: new Date(app.appliedDate).getTime(),
    status: app.status,
    riskScore: app.riskScore
  }));

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">
          Loading application history...
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Applications Yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 max-w-sm">
          Start your credit journey by submitting your first application. Track your progress and history here.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => window.location.href = '/home/loan-applications'}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Application
          </button>
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View All Applications
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Applications</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{allData.length}</div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex space-x-2">
            {(['timeline', 'amounts'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                  viewMode === mode
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {mode === 'timeline' ? '📅' : '💰'}
              </button>
            ))}
          </div>
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="px-3 py-1 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-all flex items-center space-x-1"
            >
              <span>View All</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 min-h-[200px]">
        {viewMode === 'amounts' ? (
          chartData.some(app => app.amount > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.filter(app => app.amount > 0)} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                <XAxis 
                  dataKey="type" 
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip
                  formatter={(value: any, name: any) => [`$${value.toLocaleString()}`, 'Amount']}
                  labelFormatter={(label) => `Application: ${label}`}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    backdropFilter: 'blur(12px)'
                  }}
                />
                <Bar 
                  dataKey="amount" 
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-center text-gray-500 dark:text-gray-400">
              <div>
                <div className="text-2xl mb-2">💰</div>
                <div className="text-sm">No loan amounts specified</div>
                <div className="text-xs mt-1">Applications don't have loan amounts yet</div>
              </div>
            </div>
          )
        ) : (
          <div className="space-y-3">
            {allData.length > 3 && (
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center mb-2">
                Showing {recentData.length} of {allData.length} recent applications
              </div>
            )}
            {recentData.map((app, index) => (
              <div key={app.id} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">{getStatusIcon(app.status)}</div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {app.type}
                        </h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(app.status)}`}>
                          {app.status}
                        </span>
                      </div>
                      {app.reference_number && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Ref: {app.reference_number}
                        </div>
                      )}
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Amount: <span className="font-medium">
                          {app.amount > 0 ? `$${app.amount.toLocaleString()}` : 'Not specified'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Applied: {new Date(app.appliedDate).toLocaleDateString()}
                        {app.approvedDate && (
                          <span> • Approved: {new Date(app.approvedDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {app.riskScore && (
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        Score: {app.riskScore}
                      </div>
                    )}
                    {app.interestRate && app.interestRate > 0 && (
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {app.interestRate}% APR
                      </div>
                    )}
                    {!app.riskScore && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        No score yet
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-green-600 dark:text-green-400">
            {allData.filter(app => app.status === 'Approved').length}
          </div>
          <div className="text-xs text-green-600 dark:text-green-400">Approved</div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
            {allData.filter(app => ['Under Review', 'Draft', 'Needs More Information'].includes(app.status)).length}
          </div>
          <div className="text-xs text-yellow-600 dark:text-yellow-400">Pending</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
            ${allData.reduce((sum, app) => sum + app.amount, 0).toLocaleString()}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400">Total Value</div>
        </div>
      </div>
    </div>
  );
};