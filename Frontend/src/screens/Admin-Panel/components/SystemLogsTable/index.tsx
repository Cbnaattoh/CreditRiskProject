import React from "react";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import { Box, useTheme } from "@mui/material";
import { motion } from "framer-motion";

interface LogEntry {
  id: string;
  timestamp: string;
  event: string;
  performedBy: string;
  ipAddress: string;
  status: "Success" | "Failed" | "Warning";
  details: string;
}

const SystemLogsTable: React.FC<{ logs: LogEntry[] }> = ({ logs }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  const statusIcons = {
    Success: (
      <CheckCircleIcon
        className="text-emerald-500 dark:text-emerald-400"
        fontSize="small"
      />
    ),
    Failed: (
      <ErrorIcon className="text-red-500 dark:text-red-400" fontSize="small" />
    ),
    Warning: (
      <InfoIcon
        className="text-amber-500 dark:text-amber-400"
        fontSize="small"
      />
    ),
  };

  const columns: GridColDef[] = [
    {
      field: "timestamp",
      headerName: "Timestamp",
      width: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {params.value}
          </div>
        </Box>
      ),
    },
    {
      field: "event",
      headerName: "Event",
      width: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <div className="text-sm text-gray-700 dark:text-gray-300">
            {params.value}
          </div>
        </Box>
      ),
    },
    {
      field: "performedBy",
      headerName: "Performed By",
      width: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <div className="flex items-center">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-500 flex items-center justify-center mr-3">
              <span className="text-white text-xs font-medium">
                {params.value.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {params.value}
            </span>
          </div>
        </Box>
      ),
    },
    {
      field: "ipAddress",
      headerName: "IP Address",
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <span className="px-3 py-1 text-xs font-mono font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
            {params.value}
          </span>
        </Box>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <div className="flex items-center">
            <span
              className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full border ${
                params.value === "Success"
                  ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700"
                  : params.value === "Failed"
                  ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 border-red-200 dark:border-red-700"
                  : "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-200 border-amber-200 dark:border-amber-700"
              }`}
            >
              <span className="mr-1.5">{statusIcons[params.value]}</span>
              {params.value}
            </span>
          </div>
        </Box>
      ),
    },
    {
      field: "details",
      headerName: "Details",
      width: 120,
      renderCell: () => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all duration-200"
          >
            <VisibilityIcon fontSize="small" className="mr-1" />
            View
          </motion.button>
        </Box>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="w-full"
    >
      <div className="h-[600px] w-full rounded-xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl overflow-hidden">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-purple-50/30 dark:from-indigo-900/20 dark:via-transparent dark:to-purple-900/10 pointer-events-none rounded-xl" />

        <Box
          sx={{
            height: "100%",
            width: "100%",
            position: "relative",
            zIndex: 1,
            "& .MuiDataGrid-root": {
              border: "none",
              fontFamily: "inherit",
              backgroundColor: "transparent",
              color: isDarkMode
                ? "rgba(255, 255, 255, 0.87)"
                : "rgba(0, 0, 0, 0.87)",
              borderRadius: 0,
              boxShadow: "none",
            },
            "& .MuiDataGrid-row": {
              minHeight: "64px !important",
              "&:hover": {
                backgroundColor: isDarkMode
                  ? "rgba(99, 102, 241, 0.08)"
                  : "rgba(99, 102, 241, 0.04)",
              },
            },
            "& .MuiDataGrid-cell": {
              borderBottom: isDarkMode
                ? "1px solid rgba(255, 255, 255, 0.1)"
                : "1px solid rgba(0, 0, 0, 0.08)",
              display: "flex",
              alignItems: "center",
              padding: "8px 16px",
            },
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: isDarkMode
                ? "rgba(31, 41, 55, 0.8)"
                : "rgba(249, 250, 251, 0.8)",
              backdropFilter: "blur(8px)",
              borderBottom: isDarkMode
                ? "1px solid rgba(255, 255, 255, 0.1)"
                : "1px solid rgba(0, 0, 0, 0.08)",
              minHeight: "56px !important",
            },
            "& .MuiDataGrid-columnHeader": {
              padding: "8px 16px",
              color: isDarkMode ? "rgb(209, 213, 219)" : "rgb(75, 85, 99)",
              fontWeight: 600,
              "& .MuiDataGrid-columnSeparator": {
                display: "none",
              },
            },
            "& .MuiDataGrid-footerContainer": {
              borderTop: isDarkMode
                ? "1px solid rgba(255, 255, 255, 0.1)"
                : "1px solid rgba(0, 0, 0, 0.08)",
              backgroundColor: isDarkMode
                ? "rgba(31, 41, 55, 0.8)"
                : "rgba(249, 250, 251, 0.8)",
              backdropFilter: "blur(8px)",
            },
            "& .MuiTablePagination-root": {
              color: isDarkMode ? "rgb(209, 213, 219)" : "rgb(75, 85, 99)",
            },
            "& .MuiDataGrid-menuIcon button": {
              color: isDarkMode ? "rgb(209, 213, 219)" : "rgb(75, 85, 99)",
            },
            "& .MuiDataGrid-iconButtonContainer": {
              visibility: "visible",
            },
            "& .MuiDataGrid-cellContent": {
              overflow: "hidden",
              textOverflow: "ellipsis",
            },
            "& .MuiDataGrid-selectedRowCount": {
              color: isDarkMode ? "rgb(209, 213, 219)" : "rgb(75, 85, 99)",
            },
            "& .MuiDataGrid-toolbarContainer": {
              padding: "16px",
              borderBottom: isDarkMode
                ? "1px solid rgba(255, 255, 255, 0.1)"
                : "1px solid rgba(0, 0, 0, 0.08)",
              backgroundColor: isDarkMode
                ? "rgba(31, 41, 55, 0.8)"
                : "rgba(249, 250, 251, 0.8)",
              backdropFilter: "blur(8px)",
            },
            "& .MuiInputBase-root": {
              backgroundColor: isDarkMode
                ? "rgba(55, 65, 81, 0.8)"
                : "rgba(255, 255, 255, 0.8)",
              borderRadius: "8px",
              color: isDarkMode ? "rgb(255, 255, 255)" : "rgb(0, 0, 0)",
              "& .MuiInputBase-input": {
                color: isDarkMode ? "rgb(255, 255, 255)" : "rgb(0, 0, 0)",
              },
            },
            "& .MuiIconButton-root": {
              color: isDarkMode ? "rgb(209, 213, 219)" : "rgb(75, 85, 99)",
            },
          }}
        >
          <DataGrid
            rows={logs}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10]}
            disableSelectionOnClick
            disableColumnMenu
            getRowHeight={() => 64}
            componentsProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 500 },
              },
            }}
          />
        </Box>
      </div>
    </motion.div>
  );
};

export default SystemLogsTable;
