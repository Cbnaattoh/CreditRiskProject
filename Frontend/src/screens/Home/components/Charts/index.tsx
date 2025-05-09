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

const COLORS = ["#6366F1", "#F59E0B", "#EF4444", "#10B981", "#3B82F6"];

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

export const RiskDistributionChart: React.FC = () => (
  <ResponsiveContainer width="100%" height={300}>
    <PieChart>
      <Pie
        data={riskData}
        cx="50%"
        cy="50%"
        innerRadius={60}
        outerRadius={80}
        paddingAngle={2}
        dataKey="value"
        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
      >
        {riskData.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip formatter={(value) => [`${value} applications`, "Count"]} />
      <Legend />
    </PieChart>
  </ResponsiveContainer>
);

export const ApplicationTrendChart: React.FC = () => (
  <ResponsiveContainer width="100%" height={300}>
    <AreaChart data={trendData}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
      <XAxis dataKey="month" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Area
        type="monotone"
        dataKey="approved"
        stackId="1"
        stroke="#10B981"
        fill="#A7F3D0"
      />
      <Area
        type="monotone"
        dataKey="denied"
        stackId="1"
        stroke="#EF4444"
        fill="#FECACA"
      />
      <Area
        type="monotone"
        dataKey="pending"
        stackId="1"
        stroke="#F59E0B"
        fill="#FDE68A"
      />
    </AreaChart>
  </ResponsiveContainer>
);

export const RiskFactorsRadar: React.FC = () => (
  <ResponsiveContainer width="100%" height={300}>
    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
      <PolarGrid />
      <PolarAngleAxis dataKey="subject" />
      <PolarRadiusAxis angle={30} domain={[0, 100]} />
      <Radar
        name="Applicant"
        dataKey="A"
        stroke="#6366F1"
        fill="#6366F1"
        fillOpacity={0.6}
      />
      <Tooltip />
      <Legend />
    </RadarChart>
  </ResponsiveContainer>
);

export const ApprovalRateChart: React.FC = () => {
  const approvalRateData = trendData.map((month) => ({
    month: month.month,
    rate: (month.approved / (month.approved + month.denied)) * 100,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={approvalRateData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="month" />
        <YAxis
          domain={[0, 100]}
          label={{ value: "Approval %", angle: -90, position: "insideLeft" }}
        />
        <Tooltip formatter={(value) => [`${value}%`, "Approval Rate"]} />
        <Line
          type="monotone"
          dataKey="rate"
          stroke="#6366F1"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
