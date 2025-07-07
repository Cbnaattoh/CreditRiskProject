import React from "react";
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

// Risk distribution data
const riskData = [
  { name: "Low Risk", value: 35 },
  { name: "Medium Risk", value: 25 },
  { name: "High Risk", value: 20 },
  { name: "Critical", value: 15 },
  { name: "Pending", value: 5 },
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

// Custom tooltip component for premium feel
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50 rounded-xl p-4 shadow-xl">
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          {label}
        </p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center text-sm">
            <div
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-700 dark:text-gray-300">
              {entry.name}: {entry.value}
              {entry.name === "Approval Rate" ? "%" : ""}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Custom legend component
const CustomLegend = ({ payload }: any) => {
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center">
          <div
            className="w-3 h-3 rounded-full mr-2"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export const RiskDistributionChart: React.FC = () => {
  // Custom label renderer for pie chart
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    name,
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
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <defs>
          {COLORS.map((color, index) => (
            <linearGradient
              key={`gradient-${index}`}
              id={`gradient-${index}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor={color} stopOpacity={0.8} />
              <stop offset="100%" stopColor={color} stopOpacity={0.6} />
            </linearGradient>
          ))}
        </defs>
        <Pie
          data={riskData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={100}
          innerRadius={60}
          paddingAngle={2}
          dataKey="value"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={2}
        >
          {riskData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={`url(#gradient-${index})`}
              className="hover:opacity-80 transition-opacity duration-200"
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend content={<CustomLegend />} />
      </PieChart>
    </ResponsiveContainer>
  );
};

export const ApplicationTrendChart: React.FC = () => (
  <ResponsiveContainer width="100%" height={300}>
    <AreaChart
      data={trendData}
      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
    >
      <defs>
        <linearGradient id="approvedGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
          <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
        </linearGradient>
        <linearGradient id="deniedGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
          <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1} />
        </linearGradient>
        <linearGradient id="pendingGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8} />
          <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.1} />
        </linearGradient>
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
        strokeWidth={2}
      />
      <Area
        type="monotone"
        dataKey="denied"
        stackId="1"
        stroke="#EF4444"
        fill="url(#deniedGradient)"
        strokeWidth={2}
      />
      <Area
        type="monotone"
        dataKey="pending"
        stackId="1"
        stroke="#F59E0B"
        fill="url(#pendingGradient)"
        strokeWidth={2}
      />
    </AreaChart>
  </ResponsiveContainer>
);

export const RiskFactorsRadar: React.FC = () => (
  <ResponsiveContainer width="100%" height={300}>
    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
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
        fill="#6366F1"
        fillOpacity={0.3}
        strokeWidth={2}
        dot={{ r: 4, fill: "#6366F1" }}
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
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={approvalRateData}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
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
          strokeWidth={3}
          dot={{
            r: 5,
            fill: "#6366F1",
            stroke: "#ffffff",
            strokeWidth: 2,
            className: "dark:stroke-gray-800",
          }}
          activeDot={{
            r: 7,
            fill: "#6366F1",
            stroke: "#ffffff",
            strokeWidth: 3,
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
  className?: string;
}> = ({ children, title, className = "" }) => (
  <div
    className={`
    relative p-6 rounded-2xl 
    bg-white/95 dark:bg-gray-900/95 
    backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50 
    shadow-lg hover:shadow-xl dark:shadow-gray-900/20 
    transition-all duration-300 
    group overflow-hidden
    ${className}
  `}
  >
    {/* Gradient overlay */}
    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 via-transparent to-purple-50/20 dark:from-indigo-900/10 dark:via-transparent dark:to-purple-900/10 pointer-events-none" />

    {/* Inner glow */}
    <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10 dark:ring-gray-800/50 pointer-events-none" />

    {/* Title */}
    <div className="relative mb-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200">
        {title}
      </h3>
      <div className="mt-2 h-0.5 w-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full" />
    </div>

    {/* Chart content */}
    <div className="relative">{children}</div>
  </div>
);
