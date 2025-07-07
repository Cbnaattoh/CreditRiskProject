import React from "react";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { Avatar, Chip, IconButton, Box, useTheme } from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";

interface User {
  id: string;
  profile: string;
  name: string;
  role: string;
  status: "Active" | "Inactive" | "Suspended";
  lastLogin: string;
  joinDate: string;
}

const statusColors = {
  Active: "success",
  Inactive: "default",
  Suspended: "error",
};

const UserManagementTable: React.FC<{ users: User[] }> = ({ users }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  const columns: GridColDef[] = [
    {
      field: "profile",
      headerName: "User",
      width: 250,
      renderCell: (params: GridRenderCellParams) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            height: "100%",
            py: 1,
          }}
        >
          <div className="relative h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-500 flex items-center justify-center overflow-hidden ring-2 ring-white/20 dark:ring-gray-700/50 shadow-lg mr-3">
            <span className="text-white text-sm font-semibold">
              {params.row.name.charAt(0)}
            </span>
          </div>
          <div className="flex flex-col justify-center">
            <div className="font-medium text-gray-900 dark:text-white text-sm leading-tight">
              {params.row.name}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
              {params.row.profile}
            </div>
          </div>
        </Box>
      ),
    },
    {
      field: "role",
      headerName: "Role",
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <span className="px-3 py-1 text-xs font-medium rounded-full border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-900/30">
            {params.value}
          </span>
        </Box>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <span
            className={`px-3 py-1 text-xs font-medium rounded-full ${
              params.value === "Active"
                ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-700"
                : params.value === "Suspended"
                ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 border border-red-200 dark:border-red-700"
                : "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700"
            }`}
          >
            {params.value}
          </span>
        </Box>
      ),
    },
    {
      field: "lastLogin",
      headerName: "Last Login",
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            height: "100%",
          }}
        >
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {params.value}
          </span>
        </Box>
      ),
    },
    {
      field: "joinDate",
      headerName: "Join Date",
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            height: "100%",
          }}
        >
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {params.value}
          </span>
        </Box>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      sortable: false,
      filterable: false,
      renderCell: () => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            height: "100%",
            gap: 0.5,
          }}
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all duration-200"
          >
            <EditIcon fontSize="small" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-200"
          >
            <DeleteIcon fontSize="small" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
          >
            <MoreVertIcon fontSize="small" />
          </motion.button>
        </Box>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
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
            rows={users}
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

export default UserManagementTable;
