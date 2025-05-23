// import React from 'react';
// import { useTable, Column } from 'react-table';
// import { motion } from 'framer-motion';
// import { FiEdit2, FiTrash2, FiMoreVertical } from 'react-icons/fi';

// interface User {
//   id: string;
//   profile: string;
//   name: string;
//   role: string;
//   status: 'Active' | 'Inactive' | 'Suspended';
//   lastLogin: string;
//   joinDate: string;
// }

// const UserManagementTable: React.FC<{ users: User[] }> = ({ users }) => {
//   const columns: Column<User>[] = React.useMemo(
//     () => [
//       {
//         Header: 'User',
//         accessor: 'profile',
//         Cell: ({ row }) => (
//           <div className="flex items-center">
//             <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mr-3">
//               {row.original.name.charAt(0)}
//             </div>
//             <div>
//               <p className="font-medium text-gray-900">{row.original.name}</p>
//               <p className="text-sm text-gray-500">{row.original.profile}</p>
//             </div>
//           </div>
//         ),
//       },
//       {
//         Header: 'Role',
//         accessor: 'role',
//         Cell: ({ value }) => (
//           <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
//             {value}
//           </span>
//         ),
//       },
//       {
//         Header: 'Status',
//         accessor: 'status',
//         Cell: ({ value }) => {
//           const statusColors = {
//             Active: 'bg-green-100 text-green-800',
//             Inactive: 'bg-gray-100 text-gray-800',
//             Suspended: 'bg-red-100 text-red-800',
//           };
//           return (
//             <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[value]}`}>
//               {value}
//             </span>
//           );
//         },
//       },
//       {
//         Header: 'Last Login',
//         accessor: 'lastLogin',
//         Cell: ({ value }) => <span className="text-sm text-gray-600">{value}</span>,
//       },
//       {
//         Header: 'Join Date',
//         accessor: 'joinDate',
//         Cell: ({ value }) => <span className="text-sm text-gray-600">{value}</span>,
//       },
//       {
//         Header: 'Actions',
//         id: 'actions',
//         Cell: () => (
//           <div className="flex space-x-2">
//             <button className="p-1 text-indigo-600 hover:text-indigo-900">
//               <FiEdit2 className="h-4 w-4" />
//             </button>
//             <button className="p-1 text-red-600 hover:text-red-900">
//               <FiTrash2 className="h-4 w-4" />
//             </button>
//             <button className="p-1 text-gray-600 hover:text-gray-900">
//               <FiMoreVertical className="h-4 w-4" />
//             </button>
//           </div>
//         ),
//       },
//     ],
//     []
//   );

//   const {
//     getTableProps,
//     getTableBodyProps,
//     headerGroups,
//     rows,
//     prepareRow,
//   } = useTable({ columns, data: users });

//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.5 }}
//       className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg"
//     >
//       <div className="overflow-x-auto">
//         <table {...getTableProps()} className="min-w-full divide-y divide-gray-300">
//           <thead className="bg-gray-50">
//             {headerGroups.map((headerGroup) => (
//               <tr {...headerGroup.getHeaderGroupProps()}>
//                 {headerGroup.headers.map((column) => (
//                   <th
//                     {...column.getHeaderProps()}
//                     className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
//                   >
//                     {column.render('Header')}
//                   </th>
//                 ))}
//               </tr>
//             ))}
//           </thead>
//           <tbody {...getTableBodyProps()} className="bg-white divide-y divide-gray-200">
//             {rows.map((row) => {
//               prepareRow(row);
//               return (
//                 <motion.tr
//                   {...row.getRowProps()}
//                   whileHover={{ backgroundColor: 'rgba(249, 250, 251, 1)' }}
//                   className="hover:bg-gray-50"
//                 >
//                   {row.cells.map((cell) => (
//                     <td
//                       {...cell.getCellProps()}
//                       className="px-6 py-4 whitespace-nowrap"
//                     >
//                       {cell.render('Cell')}
//                     </td>
//                   ))}
//                 </motion.tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>
//     </motion.div>
//   );
// };

// export default UserManagementTable;

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
        <div className="flex items-center">
          <Avatar
            sx={{ bgcolor: "primary.light", color: "primary.main", mr: 2 }}
          >
            {params.row.name.charAt(0)}
          </Avatar>
          <div>
            <div className="font-medium text-gray-900">{params.row.name}</div>
            <div className="text-sm text-gray-500">{params.row.profile}</div>
          </div>
        </div>
      ),
    },
    {
      field: "role",
      headerName: "Role",
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          color="primary"
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          color={statusColors[params.value]}
          size="small"
        />
      ),
    },
    {
      field: "lastLogin",
      headerName: "Last Login",
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <span className="text-sm text-gray-600">{params.value}</span>
      ),
    },
    {
      field: "joinDate",
      headerName: "Join Date",
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <span className="text-sm text-gray-600">{params.value}</span>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      sortable: false,
      filterable: false,
      renderCell: () => (
        <div>
          <IconButton size="small" color="primary">
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error">
            <DeleteIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="default">
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </div>
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
          "& .MuiDataGrid-cell": {
            borderBottom: "1px solid rgba(224, 224, 224, 0.5)",
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "#f9fafb",
            borderBottom: "1px solid rgba(224, 224, 224, 0.5)",
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
          componentsProps={{
            toolbar: {
              showQuickFilter: true,
              quickFilterProps: { debounceMs: 500 },
            },
          }}
          sx={{
            boxShadow: 2,
            borderRadius: 2,
            "& .MuiDataGrid-cell:hover": {
              backgroundColor: "rgba(249, 250, 251, 1)",
            },
          }}
        />
      </Box>
    </motion.div>
  );
};

export default UserManagementTable;
