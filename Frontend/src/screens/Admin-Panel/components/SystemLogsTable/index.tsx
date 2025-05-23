// import React from "react";
// import { useTable, Column } from "react-table";
// import { motion } from "framer-motion";
// import { FiAlertCircle, FiCheckCircle, FiInfo } from "react-icons/fi";

// interface LogEntry {
//   id: string;
//   timestamp: string;
//   event: string;
//   performedBy: string;
//   ipAddress: string;
//   status: "Success" | "Failed" | "Warning";
//   details: string;
// }

// const SystemLogsTable: React.FC<{ logs: LogEntry[] }> = ({ logs }) => {
//   const columns: Column<LogEntry>[] = React.useMemo(
//     () => [
//       {
//         Header: "Timestamp",
//         accessor: "timestamp",
//         Cell: ({ value }) => (
//           <div className="text-sm text-gray-900 font-medium">{value}</div>
//         ),
//       },
//       {
//         Header: "Event",
//         accessor: "event",
//         Cell: ({ value }) => (
//           <div className="text-sm text-gray-900">{value}</div>
//         ),
//       },
//       {
//         Header: "Performed By",
//         accessor: "performedBy",
//         Cell: ({ value }) => (
//           <div className="text-sm text-gray-900">{value}</div>
//         ),
//       },
//       {
//         Header: "IP Address",
//         accessor: "ipAddress",
//         Cell: ({ value }) => (
//           <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-mono rounded">
//             {value}
//           </span>
//         ),
//       },
//       {
//         Header: "Status",
//         accessor: "status",
//         Cell: ({ value }) => {
//           const statusConfig = {
//             Success: {
//               icon: <FiCheckCircle className="h-4 w-4 text-green-500" />,
//               bg: "bg-green-100",
//               text: "text-green-800",
//             },
//             Failed: {
//               icon: <FiAlertCircle className="h-4 w-4 text-red-500" />,
//               bg: "bg-red-100",
//               text: "text-red-800",
//             },
//             Warning: {
//               icon: <FiInfo className="h-4 w-4 text-yellow-500" />,
//               bg: "bg-yellow-100",
//               text: "text-yellow-800",
//             },
//           };
//           return (
//             <span
//               className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[value].bg} ${statusConfig[value].text}`}
//             >
//               {statusConfig[value].icon}
//               <span className="ml-1">{value}</span>
//             </span>
//           );
//         },
//       },
//       {
//         Header: "Details",
//         accessor: "details",
//         Cell: ({ value }) => (
//           <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
//             View Details
//           </button>
//         ),
//       },
//     ],
//     []
//   );

//   const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
//     useTable({ columns, data: logs });

//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.5, delay: 0.1 }}
//       className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg"
//     >
//       <div className="overflow-x-auto">
//         <table
//           {...getTableProps()}
//           className="min-w-full divide-y divide-gray-300"
//         >
//           <thead className="bg-gray-50">
//             {headerGroups.map((headerGroup) => (
//               <tr {...headerGroup.getHeaderGroupProps()}>
//                 {headerGroup.headers.map((column) => (
//                   <th
//                     {...column.getHeaderProps()}
//                     className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
//                   >
//                     {column.render("Header")}
//                   </th>
//                 ))}
//               </tr>
//             ))}
//           </thead>
//           <tbody
//             {...getTableBodyProps()}
//             className="bg-white divide-y divide-gray-200"
//           >
//             {rows.map((row) => {
//               prepareRow(row);
//               return (
//                 <motion.tr
//                   {...row.getRowProps()}
//                   whileHover={{ backgroundColor: "rgba(249, 250, 251, 1)" }}
//                   className="hover:bg-gray-50"
//                 >
//                   {row.cells.map((cell) => (
//                     <td
//                       {...cell.getCellProps()}
//                       className="px-6 py-4 whitespace-nowrap"
//                     >
//                       {cell.render("Cell")}
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

// export default SystemLogsTable;

import React from "react";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import { Chip, Box } from "@mui/material";
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

const statusIcons = {
  Success: <CheckCircleIcon color="success" fontSize="small" />,
  Failed: <ErrorIcon color="error" fontSize="small" />,
  Warning: <InfoIcon color="warning" fontSize="small" />,
};

const SystemLogsTable: React.FC<{ logs: LogEntry[] }> = ({ logs }) => {
  const columns: GridColDef[] = [
    {
      field: "timestamp",
      headerName: "Timestamp",
      width: 200,
      renderCell: (params: GridRenderCellParams) => (
        <div className="text-sm font-medium text-gray-900">{params.value}</div>
      ),
    },
    {
      field: "event",
      headerName: "Event",
      width: 200,
      renderCell: (params: GridRenderCellParams) => (
        <div className="text-sm text-gray-900">{params.value}</div>
      ),
    },
    {
      field: "performedBy",
      headerName: "Performed By",
      width: 200,
      renderCell: (params: GridRenderCellParams) => (
        <div className="text-sm text-gray-900">{params.value}</div>
      ),
    },
    {
      field: "ipAddress",
      headerName: "IP Address",
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          size="small"
          variant="outlined"
          sx={{ fontFamily: "monospace" }}
        />
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          icon={statusIcons[params.value]}
          label={params.value}
          color={
            params.value === "Warning" ? "warning" : params.value.toLowerCase()
          }
          variant="outlined"
          size="small"
        />
      ),
    },
    {
      field: "details",
      headerName: "Details",
      width: 120,
      renderCell: () => (
        <Chip
          icon={<VisibilityIcon fontSize="small" />}
          label="View"
          color="primary"
          variant="outlined"
          size="small"
          clickable
        />
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
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
          rows={logs}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10]}
          disableSelectionOnClick
          disableColumnMenu
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

export default SystemLogsTable;
