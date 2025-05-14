import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiDownload, FiCheck, FiX } from "react-icons/fi";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";

interface DownloadReportButtonProps {
  riskData: {
    riskLevel: string;
    confidenceScore: number;
    metrics: Array<{
      name: string;
      applicantValue: string;
      portfolioAvg: string;
      comparison: "better" | "worse" | "equal";
    }>;
    keyFactors: Array<{
      factor: string;
      impact: string;
      trend: string;
    }>;
  };
}

const DownloadReportButton: React.FC<DownloadReportButtonProps> = ({
  riskData,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const generatePDF = async () => {
    setIsDownloading(true);
    setDownloadStatus("idle");

    try {
      // Create new PDF instance
      const doc = new jsPDF();

      // Add title
      doc.setFontSize(20);
      doc.setTextColor(40, 53, 147);
      doc.text("Credit Risk Assessment Report", 105, 20, { align: "center" });

      // Add date
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 30, {
        align: "center",
      });

      // Add risk level section
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text("Risk Level Assessment", 14, 45);

      doc.setFontSize(12);
      doc.text(`Risk Level: ${riskData.riskLevel}`, 14, 55);
      doc.text(`Confidence Score: ${riskData.confidenceScore}%`, 14, 65);

      // Add metrics table
      doc.setFontSize(16);
      doc.text("Comparative Analysis", 14, 85);

      const metricsData = riskData.metrics.map((metric) => [
        metric.name,
        metric.applicantValue,
        metric.portfolioAvg,
        metric.comparison.toUpperCase(),
      ]);

      autoTable(doc, {
        head: [["Metric", "Applicant", "Portfolio Avg", "Comparison"]],
        body: metricsData,
        startY: 90,
        headStyles: {
          fillColor: [79, 70, 229],
          textColor: 255,
        },
        alternateRowStyles: {
          fillColor: [243, 244, 246],
        },
        styles: {
          cellPadding: 5,
          fontSize: 10,
        },
      });

      // Add key risk factors
      doc.setFontSize(16);
      doc.text("Key Risk Factors", 14, doc.lastAutoTable.finalY + 20);

      const factorsData = riskData.keyFactors.map((factor) => [
        factor.factor,
        factor.impact,
        factor.trend,
      ]);

      autoTable(doc, {
        head: [["Factor", "Impact", "Trend"]],
        body: factorsData,
        startY: doc.lastAutoTable.finalY + 25,
        headStyles: {
          fillColor: [79, 70, 229],
          textColor: 255,
        },
        alternateRowStyles: {
          fillColor: [243, 244, 246],
        },
        styles: {
          cellPadding: 5,
          fontSize: 10,
        },
      });

      // Add chart image
      const chartElement = document.getElementById("risk-level-chart");
      if (chartElement) {
        const canvas = await html2canvas(chartElement);
        const imgData = canvas.toDataURL("image/png");
        doc.addPage();
        doc.setFontSize(16);
        doc.text("Risk Level Distribution", 105, 20, { align: "center" });
        doc.addImage(imgData, "PNG", 30, 30, 150, 100);
      }

      // Save the PDF
      doc.save("Risk_Assessment_Report.pdf");

      setDownloadStatus("success");
    } catch (error) {
      console.error("Error generating PDF:", error);
      setDownloadStatus("error");
    } finally {
      setIsDownloading(false);

      // Reset status after 3 seconds
      setTimeout(() => {
        setDownloadStatus("idle");
      }, 3000);
    }
  };

  return (
    <div className="relative">
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        whileHover={{ scale: downloadStatus === "idle" ? 1.02 : 1 }}
        whileTap={{ scale: downloadStatus === "idle" ? 0.98 : 1 }}
        onClick={generatePDF}
        disabled={isDownloading}
        className={`flex items-center px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-medium hover:from-indigo-700 hover:to-blue-700 transition-colors ${
          isDownloading ? "opacity-75 cursor-not-allowed" : ""
        }`}
      >
        {isDownloading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Generating...
          </>
        ) : (
          <>
            <FiDownload className="mr-2" />
            Download Full Report
          </>
        )}
      </motion.button>

      {/* Status indicator */}
      <AnimatePresence>
        {downloadStatus !== "idle" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className={`absolute -bottom-8 left-0 right-0 flex justify-center items-center ${
              downloadStatus === "success" ? "text-green-600" : "text-red-600"
            }`}
          >
            {downloadStatus === "success" ? (
              <FiCheck className="mr-1" />
            ) : (
              <FiX className="mr-1" />
            )}
            <span className="text-sm">
              {downloadStatus === "success"
                ? "Report downloaded successfully!"
                : "Failed to generate report"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DownloadReportButton;
