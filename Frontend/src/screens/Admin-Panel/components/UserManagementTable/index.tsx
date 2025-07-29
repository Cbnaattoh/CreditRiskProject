import React, { useState, useCallback, useMemo, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import type {
  GridColDef,
  GridRenderCellParams,
  GridRowSelectionModel,
} from "@mui/x-data-grid";
import { Box, useTheme, Tooltip, Menu, MenuItem } from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  PersonAdd as PersonAddIcon,
  Shield as ShieldIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  AccessTime as AccessTimeIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import {
  useGetAdminUsersListQuery,
  useGetUsersFiltersQuery,
  useUpdateUserStatusMutation,
  useBulkUserActionsMutation,
  useAssignUserRoleMutation,
  useRemoveUserRoleMutation,
  useGetRolesQuery,
} from "../../../../components/redux/features/api/RBAC/rbacApi";
import {
  ProtectedButton,
  ProtectedComponent,
} from "../../../../components/redux/features/api/RBAC/ProtectedComponent";
import {
  useHasPermission,
  useIsAdmin,
} from "../../../../components/utils/hooks/useRBAC";

interface UserManagementTableProps {
  className?: string;
}

// Error Boundary Component
class DataGridErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("DataGrid Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-64 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
          <div className="text-center">
            <div className="text-red-600 dark:text-red-400 mb-2">⚠️</div>
            <p className="text-red-800 dark:text-red-200 mb-4">
              Something went wrong with the data grid.
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const UserManagementTable: React.FC<UserManagementTableProps> = ({
  className = "",
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [filterModel, setFilterModel] = useState({
    search: "",
    user_type: "",
    status: "",
    role: "",
  });
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Permission checks
  const canEditUsers = useHasPermission("user_edit_all");
  const canDeleteUsers = useHasPermission("user_delete");
  const canManageRoles = useHasPermission("user_manage_roles");
  const isAdmin = useIsAdmin();

  // API hooks with proper error handling
  const {
    data: usersData,
    isLoading: usersLoading,
    error: usersError,
    refetch: refetchUsers,
  } = useGetAdminUsersListQuery(
    {
      ...filterModel,
      page: paginationModel.page + 1,
      page_size: paginationModel.pageSize,
    },
    {
      refetchOnMountOrArgChange: true,
      skip: false,
    }
  );

  const { data: filtersData } = useGetUsersFiltersQuery();
  const { data: rolesData } = useGetRolesQuery();

  // Mutations
  const [updateUserStatus] = useUpdateUserStatusMutation();
  const [bulkUserActions] = useBulkUserActionsMutation();
  const [assignUserRole] = useAssignUserRoleMutation();
  const [removeUserRole] = useRemoveUserRoleMutation();

  // Reset selection when data changes or on component mount
  useEffect(() => {
    setSelectedRows([]);
  }, [usersData?.results]);

  // Handlers
  const handleMenuClick = useCallback(
    (event: React.MouseEvent<HTMLElement>, user: any) => {
      setAnchorEl(event.currentTarget);
      setSelectedUser(user);
    },
    []
  );

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
    setSelectedUser(null);
  }, []);

  const handleStatusUpdate = useCallback(
    async (userId: number, action: "activate" | "deactivate") => {
      try {
        await updateUserStatus({ userId, action }).unwrap();
        refetchUsers();
        handleMenuClose();
      } catch (error) {
        console.error("Status update failed:", error);
      }
    },
    [updateUserStatus, refetchUsers, handleMenuClose]
  );

  const handleBulkAction = useCallback(
    async (action: "activate" | "deactivate" | "delete" | "reset_password") => {
      if (selectedRows.length === 0) return;

      try {
        await bulkUserActions({
          user_ids: selectedRows.map(Number),
          action,
        }).unwrap();
        setSelectedRows([]);
        refetchUsers();
      } catch (error) {
        console.error("Bulk action failed:", error);
      }
    },
    [bulkUserActions, selectedRows, refetchUsers]
  );

  const formatDate = useCallback((dateString: string | null) => {
    if (!dateString) return "Never";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  }, []);

  const formatRelativeTime = useCallback((days: number | null) => {
    if (days === null || days === undefined) return "Never";
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  }, []);

  // Safe data extraction with stable IDs
  const rows = useMemo(() => {
    if (!usersData?.results || !Array.isArray(usersData.results)) {
      return [];
    }

    return usersData.results.map((user, index) => ({
      ...user,
      // Ensure every row has a valid, unique ID
      id: user.id || `user-${index}-${Date.now()}`,
    }));
  }, [usersData?.results]);

  const totalRowCount = usersData?.count || 0;

  // Memoized columns with enhanced styling
  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: "profile",
        headerName: "User",
        width: 280,
        renderCell: (params: GridRenderCellParams) => (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              height: "100%",
              py: 1,
            }}
          >
            <div className="relative h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-500 flex items-center justify-center overflow-hidden ring-2 ring-white/20 dark:ring-gray-700/50 shadow-lg mr-3 transition-all duration-300 group-hover:ring-indigo-300 dark:group-hover:ring-indigo-600">
              <span className="text-white text-sm font-semibold">
                {params.row.full_name?.charAt(0) ||
                  params.row.email?.charAt(0) ||
                  "?"}
              </span>
            </div>
            <div className="flex flex-col justify-center min-w-0 flex-1">
              <div className="font-medium text-gray-900 dark:text-white text-sm leading-tight truncate transition-colors duration-200">
                {params.row.full_name || "No name"}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 leading-tight truncate transition-colors duration-200">
                {params.row.email || "No email"}
              </div>
              <div className="flex items-center mt-1 space-x-2">
                {params.row.is_verified && (
                  <Tooltip title="Verified Account">
                    <CheckIcon className="w-3 h-3 text-emerald-500 transition-all duration-200 hover:text-emerald-400" />
                  </Tooltip>
                )}
                {params.row.mfa_enabled && (
                  <Tooltip title="MFA Enabled">
                    <ShieldIcon className="w-3 h-3 text-blue-500 transition-all duration-200 hover:text-blue-400" />
                  </Tooltip>
                )}
              </div>
            </div>
          </Box>
        ),
      },
      {
        field: "user_type_display",
        headerName: "Type",
        width: 130,
        renderCell: (params: GridRenderCellParams) => (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            <span className="px-2.5 py-1 text-xs font-medium rounded-full border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-900/30 transition-all duration-200 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:border-indigo-300 dark:hover:border-indigo-600 cursor-default">
              {params.value || "Unknown"}
            </span>
          </Box>
        ),
      },
      {
        field: "active_roles",
        headerName: "Roles",
        width: 200,
        renderCell: (params: GridRenderCellParams) => (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            <div className="flex flex-wrap gap-1">
              {params.value &&
              Array.isArray(params.value) &&
              params.value.length > 0 ? (
                params.value.slice(0, 2).map((role: any, index: number) => (
                  <span
                    key={role?.id || `role-${index}`}
                    className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-200 border border-purple-200 dark:border-purple-700 transition-all duration-200 hover:bg-purple-100 dark:hover:bg-purple-900/50 hover:border-purple-300 dark:hover:border-purple-600 cursor-default hover:shadow-sm"
                  >
                    {role?.name || "Unknown Role"}
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-400 dark:text-gray-500 transition-colors duration-200">
                  No roles
                </span>
              )}
              {params.value &&
                Array.isArray(params.value) &&
                params.value.length > 2 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-default">
                    +{params.value.length - 2}
                  </span>
                )}
            </div>
          </Box>
        ),
      },
      {
        field: "is_active",
        headerName: "Status",
        width: 120,
        renderCell: (params: GridRenderCellParams) => {
          const isActive = Boolean(params.value);
          return (
            <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
              <span
                className={`px-3 py-1 text-xs font-medium rounded-full border transition-all duration-200 cursor-default hover:shadow-sm ${
                  isActive
                    ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 hover:border-emerald-300 dark:hover:border-emerald-600"
                    : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 border-red-200 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/50 hover:border-red-300 dark:hover:border-red-600"
                }`}
              >
                {isActive ? "Active" : "Inactive"}
              </span>
            </Box>
          );
        },
      },
      {
        field: "days_since_last_login",
        headerName: "Last Login",
        width: 140,
        renderCell: (params: GridRenderCellParams) => (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            <div className="flex items-center transition-all duration-200 hover:text-indigo-600 dark:hover:text-indigo-400">
              <AccessTimeIcon className="w-4 h-4 text-gray-400 mr-2 transition-colors duration-200" />
              <span className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">
                {formatRelativeTime(params.value)}
              </span>
            </div>
          </Box>
        ),
      },
      {
        field: "date_joined",
        headerName: "Joined",
        width: 120,
        renderCell: (params: GridRenderCellParams) => (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            <span className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-default">
              {formatDate(params.value)}
            </span>
          </Box>
        ),
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 120,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams) => (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              height: "100%",
              gap: 0.5,
            }}
          >
            <ProtectedComponent
              permissions={["user_edit_all", "user_manage_roles"]}
              requireAll={false}
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => handleMenuClick(e, params.row)}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200 hover:shadow-sm border border-transparent hover:border-indigo-200 dark:hover:border-indigo-700"
              >
                <MoreVertIcon fontSize="small" />
              </motion.button>
            </ProtectedComponent>
          </Box>
        ),
      },
    ],
    [handleMenuClick, formatDate, formatRelativeTime]
  );

  // Loading state
  if (usersLoading && !usersData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">
          Loading users...
        </span>
      </div>
    );
  }

  // Error state
  if (usersError) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
        <div className="flex items-center">
          <div className="text-red-600 dark:text-red-400 mr-2">⚠️</div>
          <span className="text-red-800 dark:text-red-200">
            Failed to load users. Please try again.
          </span>
          <button
            onClick={() => refetchUsers()}
            className="ml-4 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header with bulk actions */}
      {selectedRows.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg mb-4 border border-blue-200 dark:border-blue-700 shadow-sm backdrop-blur-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {selectedRows.length} user(s) selected
            </span>
            <div className="flex gap-2">
              <ProtectedButton
                permissions={["user_edit_all"]}
                variant="secondary"
                onClick={() => handleBulkAction("activate")}
                className="text-sm px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all duration-200"
              >
                Activate
              </ProtectedButton>
              <ProtectedButton
                permissions={["user_edit_all"]}
                variant="secondary"
                onClick={() => handleBulkAction("deactivate")}
                className="text-sm px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-200 border border-amber-200 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-all duration-200"
              >
                Deactivate
              </ProtectedButton>
              <ProtectedButton
                permissions={["user_delete"]}
                variant="danger"
                onClick={() => handleBulkAction("delete")}
                className="text-sm px-3 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 border border-red-200 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/50 transition-all duration-200"
              >
                Delete
              </ProtectedButton>
            </div>
          </div>
        </motion.div>
      )}

      {/* Data Grid with Error Boundary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full"
      >
        <div className="h-[600px] w-full rounded-xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-purple-50/30 dark:from-indigo-900/20 dark:via-transparent dark:to-purple-900/10 pointer-events-none rounded-xl" />

          <DataGridErrorBoundary>
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
                  minHeight: "72px !important",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    backgroundColor: isDarkMode
                      ? "rgba(99, 102, 241, 0.12)"
                      : "rgba(99, 102, 241, 0.08)",
                    transform: "translateY(-1px)",
                    boxShadow: isDarkMode
                      ? "0 4px 12px rgba(99, 102, 241, 0.15)"
                      : "0 4px 12px rgba(99, 102, 241, 0.1)",
                  },
                  "&.Mui-selected": {
                    backgroundColor: isDarkMode
                      ? "rgba(99, 102, 241, 0.16)"
                      : "rgba(99, 102, 241, 0.12)",
                    "&:hover": {
                      backgroundColor: isDarkMode
                        ? "rgba(99, 102, 241, 0.20)"
                        : "rgba(99, 102, 241, 0.16)",
                    },
                  },
                },
                "& .MuiDataGrid-cell": {
                  borderBottom: isDarkMode
                    ? "1px solid rgba(255, 255, 255, 0.1)"
                    : "1px solid rgba(0, 0, 0, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  padding: "8px 16px",
                  transition: "all 0.2s ease-in-out",
                },
                "& .MuiDataGrid-columnHeaders": {
                  backgroundColor: isDarkMode
                    ? "rgba(31, 41, 55, 0.9)"
                    : "rgba(249, 250, 251, 0.9)",
                  backdropFilter: "blur(12px)",
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
                    ? "rgba(31, 41, 55, 0.9)"
                    : "rgba(249, 250, 251, 0.9)",
                  backdropFilter: "blur(12px)",
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
                onPaginationModelChange={(newModel) => {
                  if (
                    newModel &&
                    typeof newModel.page === "number" &&
                    typeof newModel.pageSize === "number"
                  ) {
                    setPaginationModel(newModel);
                  }
                }}
                pageSizeOptions={[10, 25, 50]}
                checkboxSelection={false}
                disableColumnMenu
                loading={usersLoading}
                rowCount={totalRowCount}
                paginationMode="server"
                getRowHeight={() => 72}
                disableRowSelectionOnClick
                initialState={{
                  pagination: {
                    paginationModel: { page: 0, pageSize: 10 },
                  },
                }}
                getRowId={(row) => row.id}
                key={`data-grid-${rows.length}-${totalRowCount}`}
              />
            </Box>
          </DataGridErrorBoundary>
        </div>
      </motion.div>

      {/* Enhanced Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            bgcolor: isDarkMode
              ? "rgba(31, 41, 55, 0.95)"
              : "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(12px)",
            border: isDarkMode
              ? "1px solid rgba(255, 255, 255, 0.1)"
              : "1px solid rgba(0, 0, 0, 0.1)",
            borderRadius: "12px",
            boxShadow: "0 25px 50px rgba(0, 0, 0, 0.25)",
            "& .MuiMenuItem-root": {
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                backgroundColor: isDarkMode
                  ? "rgba(99, 102, 241, 0.1)"
                  : "rgba(99, 102, 241, 0.05)",
              },
            },
          },
        }}
      >
        {canEditUsers && (
          <MenuItem
            onClick={() => {
              if (selectedUser) {
                handleStatusUpdate(
                  selectedUser.id,
                  selectedUser.is_active ? "deactivate" : "activate"
                );
              }
            }}
            sx={{ color: isDarkMode ? "white" : "black" }}
          >
            {selectedUser?.is_active ? "Deactivate" : "Activate"} User
          </MenuItem>
        )}
        {canManageRoles && (
          <MenuItem
            onClick={handleMenuClose}
            sx={{ color: isDarkMode ? "white" : "black" }}
          >
            Manage Roles
          </MenuItem>
        )}
        {canEditUsers && (
          <MenuItem
            onClick={handleMenuClose}
            sx={{ color: isDarkMode ? "white" : "black" }}
          >
            Reset Password
          </MenuItem>
        )}
        {canDeleteUsers && (
          <MenuItem
            onClick={handleMenuClose}
            sx={{
              color: isDarkMode ? "#f87171" : "#dc2626",
              "&:hover": {
                backgroundColor: isDarkMode
                  ? "rgba(239, 68, 68, 0.1)"
                  : "rgba(239, 68, 68, 0.05)",
              },
            }}
          >
            Delete User
          </MenuItem>
        )}
      </Menu>

      {/* Enhanced Summary Stats */}
      {usersData?.summary && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-lg p-4 border border-gray-200/50 dark:border-gray-700/50 transition-all duration-200 hover:shadow-lg cursor-default"
          >
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {usersData.summary.total_users}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Total Users
            </div>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 backdrop-blur-xl rounded-lg p-4 border border-emerald-200/50 dark:border-emerald-700/50 transition-all duration-200 hover:shadow-lg cursor-default"
          >
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {usersData.summary.active_users}
            </div>
            <div className="text-sm text-emerald-600/70 dark:text-emerald-400/70">
              Active
            </div>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 backdrop-blur-xl rounded-lg p-4 border border-blue-200/50 dark:border-blue-700/50 transition-all duration-200 hover:shadow-lg cursor-default"
          >
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {usersData.summary.security.mfa_enabled}
            </div>
            <div className="text-sm text-blue-600/70 dark:text-blue-400/70">
              MFA Enabled
            </div>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 backdrop-blur-xl rounded-lg p-4 border border-purple-200/50 dark:border-purple-700/50 transition-all duration-200 hover:shadow-lg cursor-default"
          >
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {usersData.summary.login_activity.logged_in_week}
            </div>
            <div className="text-sm text-purple-600/70 dark:text-purple-400/70">
              Active This Week
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default UserManagementTable;
