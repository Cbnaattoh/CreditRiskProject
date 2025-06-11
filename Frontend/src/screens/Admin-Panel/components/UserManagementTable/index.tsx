import React from "react";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { Avatar, Chip, IconButton, Box } from "@mui/material";
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
          <Avatar
            sx={{
              bgcolor: "primary.light",
              color: "primary.main",
              mr: 2,
              width: 36,
              height: 36,
              fontSize: "1rem",
            }}
          >
            {params.row.name.charAt(0)}
          </Avatar>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <Box
              sx={{ fontWeight: 500, color: "text.primary", lineHeight: 1.2 }}
            >
              {params.row.name}
            </Box>
            <Box
              sx={{
                fontSize: "0.875rem",
                color: "text.secondary",
                lineHeight: 1.2,
              }}
            >
              {params.row.profile}
            </Box>
          </Box>
        </Box>
      ),
    },
    {
      field: "role",
      headerName: "Role",
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Chip
            label={params.value}
            color="primary"
            size="small"
            variant="outlined"
          />
        </Box>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Chip
            label={params.value}
            color={statusColors[params.value]}
            size="small"
          />
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
            fontSize: "0.875rem",
            color: "text.secondary",
          }}
        >
          {params.value}
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
            fontSize: "0.875rem",
            color: "text.secondary",
          }}
        >
          {params.value}
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
          <IconButton size="small" color="primary">
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error">
            <DeleteIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="default">
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box
        sx={{
          height: 600,
          width: "100%",
          "& .MuiDataGrid-root": {
            border: "none",
            fontFamily: "inherit",
          },
          "& .MuiDataGrid-row": {
            minHeight: "64px !important",
            "&:hover": {
              backgroundColor: "rgba(249, 250, 251, 1)",
            },
          },
          "& .MuiDataGrid-cell": {
            borderBottom: "1px solid rgba(224, 224, 224, 0.5)",
            display: "flex",
            alignItems: "center",
            padding: "8px 16px",
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "#f9fafb",
            borderBottom: "1px solid rgba(224, 224, 224, 0.5)",
            minHeight: "56px !important",
          },
          "& .MuiDataGrid-columnHeader": {
            padding: "8px 16px",
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
          sx={{
            boxShadow: 2,
            borderRadius: 2,
          }}
        />
      </Box>
    </motion.div>
  );
};

export default UserManagementTable;
