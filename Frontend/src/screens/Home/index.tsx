import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  RiskDistributionChart,
  ApplicationTrendChart,
  RiskFactorsRadar,
  ApprovalRateChart,
} from "./components/Charts";
import AlertCard from "./components/AlertCard";

const Dashboard: React.FC = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div>
      {/* Dashboard Content */}
      <main className="overflow-y-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {[
            {
              title: "Total Applications",
              value: "1,248",
              change: "+12%",
              trend: "up",
            },
            {
              title: "Approval Rate",
              value: "78%",
              change: "+3%",
              trend: "up",
            },
            {
              title: "Average Risk Score",
              value: "62",
              change: "-5%",
              trend: "down",
            },
            {
              title: "Flagged Cases",
              value: "24",
              change: "+2",
              trend: "up",
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h3 className="text-sm font-medium text-gray-500">
                {stat.title}
              </h3>
              <div className="mt-2 flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">
                  {stat.value}
                </p>
                <span
                  className={`ml-2 text-sm font-medium ${
                    stat.trend === "up" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {stat.change}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Application Trends
            </h3>
            <ApplicationTrendChart />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Risk Distribution
            </h3>
            <RiskDistributionChart />
          </motion.div>
        </div>

        {/* Secondary Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Approval Rate Trend
            </h3>
            <ApprovalRateChart />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Key Risk Factors
            </h3>
            <RiskFactorsRadar />
          </motion.div>
        </div>

        {/* Alerts and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Activity
            </h3>
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="border-b border-gray-100 pb-4 last:border-0"
                >
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                      <svg
                        className="h-5 w-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">
                        New application received
                      </p>
                      <p className="text-sm text-gray-500">
                        Applicant ID: APP-00{item}245
                      </p>
                    </div>
                    <div className="ml-auto text-sm text-gray-500">
                      2{item} mins ago
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Priority Alerts
            </h3>
            <div className="space-y-4">
              <AlertCard
                severity="high"
                title="High-Risk Application Flagged"
                description="Applicant John Doe exceeds risk threshold by 25%"
                time="5 minutes ago"
              />
              <AlertCard
                severity="medium"
                title="Unusual Activity Detected"
                description="Multiple applications from same IP address"
                time="32 minutes ago"
              />
            </div>
          </motion.div>
        </div>
      </main>
    </div>
    // <div className="flex h-screen bg-gray-50 overflow-hidden">
    //   {/* Sidebar/Drawer */}
    //   {/* <Sidebar isMobile={isMobile} /> */}

    //   {/* Main Content */}
    //   <div className="flex-1 flex flex-col overflow-hidden">
    //     {/* Header */}
    //     {/* <Header /> */}

    //   </div>
    // </div>
  );
};

export default Dashboard;
