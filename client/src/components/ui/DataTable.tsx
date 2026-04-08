import { useEffect, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Search,
  Filter } from
'lucide-react';
export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}
export interface FilterOption {
  key: string;
  label: string;
  options: { label: string; value: string }[];
}
interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField: keyof T;
  title?: string;
  actions?: (item: T) => React.ReactNode;
  onSelectionChange?: (selectedIds: string[]) => void;
  bulkActions?: {
    label: string;
    onClick: (selectedIds: string[]) => void;
  }[];
  filterOptions?: FilterOption[];
  onFilterChange?: (filters: Record<string, string>) => void;
  externalSearch?: string;
  onSearchChange?: (term: string) => void;
}
export function DataTable<
  T extends {
    [key: string]: any;
  }>(
{
  data,
  columns,
  keyField,
  title,
  actions,
  onSelectionChange,
  bulkActions,
  filterOptions,
  onFilterChange,
  externalSearch,
  onSearchChange
}: DataTableProps<T>) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const itemsPerPage = 10;

  const activeSearch = externalSearch !== undefined ? externalSearch : searchTerm;
  const handleSearch = onSearchChange || setSearchTerm;

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters };
    if (value) {
      newFilters[key] = value;
    } else {
      delete newFilters[key];
    }
    setFilters(newFilters);
    setCurrentPage(1);
    onFilterChange?.(newFilters);
  };

  const activeFilterCount = Object.keys(filters).length;

  // Handle Selection
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = data.map((item) => String(item[keyField]));
      setSelectedIds(allIds);
      onSelectionChange?.(allIds);
    } else {
      setSelectedIds([]);
      onSelectionChange?.([]);
    }
  };
  const handleSelectRow = (id: string) => {
    const newSelected = selectedIds.includes(id) ?
    selectedIds.filter((sId) => sId !== id) :
    [...selectedIds, id];
    setSelectedIds(newSelected);
    onSelectionChange?.(newSelected);
  };
  // Handle Sorting
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (
    sortConfig &&
    sortConfig.key === key &&
    sortConfig.direction === 'asc')
    {
      direction = 'desc';
    }
    setSortConfig({
      key,
      direction
    });
  };
  // Filter & Sort Data
  const filteredData = data.filter((item) =>
  Object.values(item).some((val) =>
  String(val).toLowerCase().includes(activeSearch.toLowerCase())
  )
  );
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig) return 0;
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });
  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [activeSearch]);

  useEffect(() => {
    const safeTotalPages = Math.max(totalPages, 1);
    if (currentPage > safeTotalPages) {
      setCurrentPage(safeTotalPages);
    }
  }, [currentPage, totalPages]);

  const showingFrom = sortedData.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const showingTo = sortedData.length === 0 ? 0 : Math.min(currentPage * itemsPerPage, sortedData.length);

  return (
    <div className="shared-table">
      {/* Header */}
      <div className="shared-table__header">
        {title &&
        <h3 className="shared-table__title">{title}</h3>
        }

        <div className="shared-table__toolbar">
          <div className="shared-table__search">
            <Search className="shared-table__search-icon h-4 w-4" />
            <input
              type="text"
              placeholder="Search..."
              value={activeSearch}
              onChange={(e) => handleSearch(e.target.value)}
              className="shared-input-reset shared-table__search-input" />

          </div>
          {filterOptions && filterOptions.length > 0 && (
            <div className="shared-table__filter-wrap">
              <button
                type="button"
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className={`shared-table__filter-button ${
                  showFilterPanel || activeFilterCount > 0
                    ? 'shared-table__filter-button--active'
                    : ''
                }`}
              >
                <Filter className="h-4 w-4" />
              </button>
              {showFilterPanel && (
                <div className="shared-table__filter-panel">
                  <div className="shared-table__filter-list">
                    {filterOptions.map((filter) => (
                      <div key={filter.key}>
                        <label className="shared-table__filter-label">
                          {filter.label}
                        </label>
                        <select
                          value={filters[filter.key] || ''}
                          onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                          className="shared-select-reset"
                        >
                          <option value="">All</option>
                          {filter.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                    {activeFilterCount > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setFilters({});
                          setCurrentPage(1);
                          onFilterChange?.({});
                        }}
                        className="shared-table__clear"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && bulkActions &&
      <div className="shared-table__bulk">
          <span className="font-medium">{selectedIds.length} selected</span>
          <div className="shared-table__bulk-divider" />
          {bulkActions.map((action, idx) =>
        <button
          key={idx}
          type="button"
          onClick={() => action.onClick(selectedIds)}
          className="shared-table__bulk-button">

              {action.label}
            </button>
        )}
        </div>
      }

      {/* Table */}
      <div className="shared-table__scroll">
        <table className="shared-table__table">
          <thead className="shared-table__head">
            <tr>
              <th className="shared-table__th shared-table__th--checkbox">
                <input
                  type="checkbox"
                  className="shared-checkbox"
                  onChange={handleSelectAll}
                  checked={
                  selectedIds.length === data.length && data.length > 0
                  } />

              </th>
              {columns.map((col) =>
              <th
                key={String(col.key)}
                className={`shared-table__th ${col.sortable ? 'shared-table__th--sortable' : ''}`}
                onClick={() => col.sortable && handleSort(String(col.key))}>

                  <div className="shared-table__sort">
                    {col.header}
                    {sortConfig?.key === col.key && (
                  sortConfig.direction === 'asc' ?
                  <ChevronUp className="h-3 w-3" /> :

                  <ChevronDown className="h-3 w-3" />)
                  }
                  </div>
                </th>
              )}
              {actions && <th className="shared-table__th shared-table__cell-actions">Actions</th>}
            </tr>
          </thead>
          <tbody className="shared-table__body">
            {paginatedData.length > 0 ?
            paginatedData.map((item) =>
            <tr key={String(item[keyField])} className="shared-table__row">
                  <td className="shared-table__td">
                    <input
                  type="checkbox"
                  className="shared-checkbox"
                  checked={selectedIds.includes(String(item[keyField]))}
                  onChange={() => handleSelectRow(String(item[keyField]))} />

                  </td>
                  {columns.map((col) =>
              <td key={String(col.key)} className="shared-table__td">
                      {col.render ? col.render(item) : item[col.key as keyof T]}
                    </td>
              )}
                  {actions &&
              <td className="shared-table__td shared-table__cell-actions">{actions(item)}</td>
              }
                </tr>
            ) :

            <tr>
                <td
                colSpan={columns.length + 2}
                className="shared-table__empty">

                  No results found
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="shared-table__footer">
        <div className="shared-table__footer-text">
          Showing{' '}
          <span className="font-medium">{showingFrom}</span>{' '}
          to{' '}
          <span className="font-medium">{showingTo}</span>{' '}
          of <span className="font-medium">{sortedData.length}</span> results
        </div>
        <div className="shared-table__pager">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="shared-table__pager-button">

            Previous
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="shared-table__pager-button">

            Next
          </button>
        </div>
      </div>
    </div>);

}
