import React, { useState, useCallback, useMemo } from "react";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  FilterList as FilterListIcon,
} from "@mui/icons-material";
import { Box, useTheme, Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { FiCalendar, FiFilter, FiX, FiUser, FiGlobe, FiClock } from "react-icons/fi";

const useGetSystemLogsQuery = (params: any) => {
  const mockData = {
    results: [
      {
        id: '1',
        timestamp: '2025-01-29 14:30:25',
        event: 'User Login',
        performed_by: 'john.doe@example.com',
        ip_address: '192.168.1.100',
        status: 'Success',
        user_agent: 'Mozilla/5.0...',
        details: 'User successfully logged in from desktop application',
        session_id: 'sess_123456789',
        resource_accessed: '/dashboard',
        outcome: 'Successful authentication'
      },
      {
        id: '2',
        timestamp: '2025-01-29 14:25:10',
        event: 'Permission Check',
        performed_by: 'jane.smith@example.com',
        ip_address: '192.168.1.101',
        status: 'Failed',
        user_agent: 'Mozilla/5.0...',
        details: 'User attempted to access admin panel without sufficient permissions',
        session_id: 'sess_987654321',
        resource_accessed: '/admin/users',
        outcome: 'Access denied - insufficient permissions'
      },
      {
        id: '3',
        timestamp: '2025-01-29 14:20:05',
        event: 'Role Assignment',
        performed_by: 'admin@example.com',
        ip_address: '192.168.1.102',
        status: 'Success',
        user_agent: 'Mozilla/5.0...',
        details: 'Assigned Risk Analyst role to user john.doe@example.com',
        session_id: 'sess_456789123',
        resource_accessed: '/admin/roles',
        outcome: 'Role successfully assigned'
      },
      {
        id: '4',
        timestamp: '2025-01-29 14:15:30',
        event: 'Password Reset',
        performed_by: 'system',
        ip_address: '192.168.1.103',
        status: 'Warning',
        user_agent: 'Internal System',
        details: 'Password reset requested for user with multiple failed login attempts',
        session_id: null,
        resource_accessed: '/auth/password-reset',
        outcome: 'Password reset email sent'
      }
    ],
    count: 4,
    filters_applied: params
  };

  return {
    data: mockData,
    isLoading: false,
    error: null,
    refetch: () => {}
  };
};

interface LogEntry {
  id: string;
  timestamp: string;
  event: string;
  performed_by: string;
  ip_address: string;
  status: "Success" | "Failed" | "Warning";
  user_agent: string;
  details: string;
  session_id: string | null;
  resource_accessed: string;
  outcome: string;
}

interface FilterSectionProps {
  onFilter: (filters: {
    dateRange: { start: string; end: string };
    eventType: string;
    status: string;
    user: string;
  }) => void;
  onExport: () => void;
}

const FilterSection: React.FC<FilterSectionProps> = ({ onFilter, onExport }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: { start: "", end: "" },
    eventType: "all",
    status: "all",
    user: "",
  });

  const handleApplyFilters = useCallback(() => {
    onFilter(filters);
    setIsExpanded(false);
  }, [filters, onFilter]);

  const handleResetFilters = useCallback(() => {
    const resetFilters = {
      dateRange: { start: "", end: "" },
      eventType: "all",
      status: "all",
      user: "",
    };
    setFilters(resetFilters);
    onFilter(resetFilters);
  }, [onFilter]);

  return (
    <motion.div
      layout
      className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-4 mb-6"
    >
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          System Logs & Filters
        </h3>
        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onExport}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all duration-200"
          >
            <DownloadIcon fontSize="small" />
            <span className="text-sm">Export</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all duration-200"
          >
            {isExpanded ? <FiX className="h-4 w-4" /> : <FilterListIcon fontSize="small" />}
            <span className="text-sm">{isExpanded ? 'Hide' : 'Filters'}</span>
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date Range
                </label>
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="date"
                      value={filters.dateRange.start}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          dateRange: { ...filters.dateRange, start: e.target.value },
                        })
                      }
                      className="pl-9 pr-3 py-2 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-gray-900 dark:text-white text-sm"
                    />
                    <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  </div>
                  <div className="relative">
                    <input
                      type="date"
                      value={filters.dateRange.end}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          dateRange: { ...filters.dateRange, end: e.target.value },
                        })
                      }
                      className="pl-9 pr-3 py-2 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-gray-900 dark:text-white text-sm"
                    />
                    <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Event Type
                </label>
                <select
                  value={filters.eventType}
                  onChange={(e) => setFilters({ ...filters, eventType: e.target.value })}
                  className="w-full p-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                >
                  <option value="all">All Events</option>
                  <option value="login">User Login</option>
                  <option value="logout">User Logout</option>
                  <option value="permission_check">Permission Check</option>
                  <option value="role_assignment">Role Assignment</option>
                  <option value="password_reset">Password Reset</option>
                  <option value="user_creation">User Creation</option>
                  <option value="data_export">Data Export</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full p-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                >
                  <option value="all">All Statuses</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                  <option value="warning">Warning</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  User Filter
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Filter by user email..."
                    value={filters.user}
                    onChange={(e) => setFilters({ ...filters, user: e.target.value })}
                    className="pl-9 pr-3 py-2 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white text-sm"
                  />
                  <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end space-x-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleResetFilters}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200"
              >
                Reset
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleApplyFilters}
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200 shadow-lg"
              >
                Apply Filters
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const SystemLogsTable: React.FC<{ className?: string }> = ({ className = '' }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  // State management
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [filters, setFilters] = useState({
    dateRange: { start: "", end: "" },
    eventType: "all",
    status: "all",
    user: "",
  });
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // API integration
  const { data: logsData, isLoading, refetch } = useGetSystemLogsQuery({
    ...filters,
    page: paginationModel.page + 1,
    page_size: paginationModel.pageSize,
  });

  const statusIcons = {
    Success: <CheckCircleIcon className="text-emerald-500 dark:text-emerald-400" fontSize="small" />,
    Failed: <ErrorIcon className="text-red-500 dark:text-red-400" fontSize="small" />,
    Warning: <WarningIcon className="text-amber-500 dark:text-amber-400" fontSize="small" />,
  };

  const handleViewDetails = useCallback((log: LogEntry) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  }, []);

  const handleExport = useCallback(() => {
    console.log('Exporting logs with filters:', filters);
  }, [filters]);

  const columns: GridColDef[] = useMemo(() => [
    {
      field: "timestamp",
      headerName: "Timestamp",
      width: 180,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <div className="flex items-center">
            <FiClock className="w-4 h-4 text-gray-400 mr-2" />
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {new Date(params.value).toLocaleDateString()}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(params.value).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </Box>
      ),
    },
    {
      field: "event",
      headerName: "Event",
      width: 180,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {params.value}
          </div>
        </Box>
      ),
    },
    {
      field: "performed_by",
      headerName: "Performed By",
      width: 220,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <div className="flex items-center">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-500 flex items-center justify-center mr-3">
              <span className="text-white text-xs font-medium">
                {params.value === 'system' ? 'S' : params.value.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                {params.value === 'system' ? 'System' : params.value}
              </div>
              {params.row.session_id && (
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  Session: {params.row.session_id.slice(-8)}
                </div>
              )}
            </div>
          </div>
        </Box>
      ),
    },
    {
      field: "ip_address",
      headerName: "IP Address",
      width: 140,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <div className="flex items-center">
            <FiGlobe className="w-4 h-4 text-gray-400 mr-2" />
            <span className="px-2 py-1 text-xs font-mono font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
              {params.value}
            </span>
          </div>
        </Box>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <span
            className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border ${
              params.value === "Success"
                ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700"
                : params.value === "Failed"
                ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 border-red-200 dark:border-red-700"
                : "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-200 border-amber-200 dark:border-amber-700"
            }`}
          >
            <span className="mr-1">{statusIcons[params.value as keyof typeof statusIcons]}</span>
            {params.value}
          </span>
        </Box>
      ),
    },
    {
      field: "resource_accessed",
      headerName: "Resource",
      width: 160,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <span className="px-2 py-1 text-xs font-mono bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-700">
            {params.value}
          </span>
        </Box>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleViewDetails(params.row)}
            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all duration-200"
          >
            <VisibilityIcon fontSize="small" className="mr-1" />
            Details
          </motion.button>
        </Box>
      ),
    },
  ], [handleViewDetails, statusIcons]);

  const rows = logsData?.results || [];

  return (
    <div className={className}>
      {/* Filter Section */}
      <FilterSection onFilter={setFilters} onExport={handleExport} />

      {/* Data Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full"
      >
        <div className="h-[600px] w-full rounded-xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl overflow-hidden">
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
                color: isDarkMode ? "rgba(255, 255, 255, 0.87)" : "rgba(0, 0, 0, 0.87)",
                borderRadius: 0,
                boxShadow: "none",
              },
              "& .MuiDataGrid-row": {
                minHeight: "72px !important",
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
                "& .MuiDataGrid-columnSeparator": { display: "none" },
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
            }}
          >
            <DataGrid
              rows={rows}
              columns={columns}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              pageSizeOptions={[10, 25, 50]}
              disableColumnMenu
              loading={isLoading}
              rowCount={logsData?.count || 0}
              paginationMode="server"
              getRowHeight={() => 72}
              disableRowSelectionOnClick
            />
          </Box>
        </div>
      </motion.div>

      {/* Details Modal */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: isDarkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '16px',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
          }
        }}
      >
        <DialogTitle sx={{ color: isDarkMode ? 'white' : 'black', borderBottom: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)' }}>
          <div className="flex items-center space-x-3">
            {selectedLog && statusIcons[selectedLog.status]}
            <span>Log Entry Details</span>
          </div>
        </DialogTitle>
        <DialogContent sx={{ color: isDarkMode ? 'white' : 'black', py: 3 }}>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Timestamp
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm">
                    {new Date(selectedLog.timestamp).toLocaleString()}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Event Type
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm">
                    {selectedLog.event}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Performed By
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm">
                    {selectedLog.performed_by}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    IP Address
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm font-mono">
                    {selectedLog.ip_address}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Resource Accessed
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm font-mono">
                    {selectedLog.resource_accessed}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Session ID
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm font-mono">
                    {selectedLog.session_id || 'N/A'}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  User Agent
                </label>
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm font-mono break-all">
                  {selectedLog.user_agent}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Details
                </label>
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm">
                  {selectedLog.details}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Outcome
                </label>
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm">
                  {selectedLog.outcome}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)', p: 3 }}>
          <Button
            onClick={() => setDetailsOpen(false)}
            sx={{
              color: isDarkMode ? 'white' : 'black',
              '&:hover': {
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            Close
          </Button>
          <Button
            variant="contained"
            sx={{
              background: 'linear-gradient(45deg, #6366f1, #8b5cf6)',
              '&:hover': {
                background: 'linear-gradient(45deg, #5b50e6, #7c3aed)',
              },
            }}
          >
            Export Entry
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default SystemLogsTable;