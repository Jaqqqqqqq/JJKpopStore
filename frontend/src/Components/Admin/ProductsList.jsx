import { DataGrid } from "@mui/x-data-grid";

const formatPrice = (price) =>
  `₱${Number(price || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

export default function ProductsList({
  products,
  selectedIds,
  onSelectionChange,
  onEdit,
  onDelete,
}) {
  const rows = products.map((product) => ({ ...product, id: product._id }));
  const columns = [
    {
      field: "name",
      headerName: "Product",
      flex: 1.5,
      minWidth: 240,
      renderCell: ({ row }) => (
        <div className="admin-product-cell">
          {row.images?.[0]?.url || row.image ? (
            <img
              src={row.images?.[0]?.url || row.image}
              alt={row.name}
              loading="lazy"
              className="admin-product-image"
            />
          ) : (
            <span className="admin-product-image admin-product-no-image">
              No image
            </span>
          )}
          <span>{row.name}</span>
        </div>
      ),
    },
    { field: "artist", headerName: "Artist", flex: 1, minWidth: 130 },
    { field: "category", headerName: "Category", flex: 1, minWidth: 130 },
    {
      field: "price",
      headerName: "Price",
      width: 130,
      valueFormatter: (value) => formatPrice(value),
    },
    { field: "stock", headerName: "Stock", width: 100 },
    {
      field: "actions",
      headerName: "Actions",
      width: 160,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <div className="admin-product-actions">
          <button type="button" onClick={() => onEdit(row._id)}>
            Edit
          </button>
          <button type="button" onClick={() => onDelete(row._id)}>
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="admin-table-wrapper">
      <DataGrid
        rows={rows}
        columns={columns}
        checkboxSelection
        disableRowSelectionOnClick
        rowSelectionModel={{ type: "include", ids: new Set(selectedIds) }}
        onRowSelectionModelChange={(selection) =>
          onSelectionChange(Array.from(selection.ids))
        }
        pageSizeOptions={[5, 10, 25, 50]}
        initialState={{
          pagination: { paginationModel: { pageSize: 10, page: 0 } },
          sorting: { sortModel: [{ field: "name", sort: "asc" }] },
        }}
        showToolbar
        localeText={{ noRowsLabel: "No products found." }}
        sx={{
          minHeight: 430,
          border: "1px solid #f1dce5",
          borderRadius: "12px",
          backgroundColor: "#fff",
          "& .MuiDataGrid-columnHeaders": { backgroundColor: "#fff7fa" },
          "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 700 },
        }}
      />
    </div>
  );
}
