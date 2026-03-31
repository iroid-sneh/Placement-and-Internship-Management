import React, { useEffect, useState } from 'react';
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
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        {title &&
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        }

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={activeSearch}
              onChange={(e) => handleSearch(e.target.value)}
              className="h-9 w-full rounded-md border border-slate-300 pl-9 pr-4 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 sm:w-64" />

          </div>
          {filterOptions && filterOptions.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className={`inline-flex items-center justify-center rounded-md border p-2 transition-colors ${
                  showFilterPanel || activeFilterCount > 0
                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Filter className="h-4 w-4" />
              </button>
              {showFilterPanel && (
                <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border border-slate-200 bg-white p-4 shadow-xl">
                  <div className="space-y-4">
                    {filterOptions.map((filter) => (
                      <div key={filter.key}>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                          {filter.label}
                        </label>
                        <select
                          value={filters[filter.key] || ''}
                          onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                          className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
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
                        onClick={() => {
                          setFilters({});
                          setCurrentPage(1);
                          onFilterChange?.({});
                        }}
                        className="w-full text-sm font-medium text-teal-600 hover:text-teal-700"
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
      <div className="flex items-center gap-2 bg-teal-50 px-4 py-2 text-sm text-teal-900">
          <span className="font-medium">{selectedIds.length} selected</span>
          <div className="h-4 w-px bg-teal-200 mx-2" />
          {bulkActions.map((action, idx) =>
        <button
          key={idx}
          onClick={() => action.onClick(selectedIds)}
          className="rounded px-2 py-1 font-medium hover:bg-teal-100">

              {action.label}
            </button>
        )}
        </div>
      }

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="w-4 px-4 py-3">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  onChange={handleSelectAll}
                  checked={
                  selectedIds.length === data.length && data.length > 0
                  } />

              </th>
              {columns.map((col) =>
              <th
                key={String(col.key)}
                className={`px-4 py-3 font-semibold ${col.sortable ? 'cursor-pointer hover:text-slate-700' : ''}`}
                onClick={() => col.sortable && handleSort(String(col.key))}>

                  <div className="flex items-center gap-1">
                    {col.header}
                    {sortConfig?.key === col.key && (
                  sortConfig.direction === 'asc' ?
                  <ChevronUp className="h-3 w-3" /> :

                  <ChevronDown className="h-3 w-3" />)
                  }
                  </div>
                </th>
              )}
              {actions && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {paginatedData.length > 0 ?
            paginatedData.map((item) =>
            <tr key={String(item[keyField])} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <input
                  type="checkbox"
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  checked={selectedIds.includes(String(item[keyField]))}
                  onChange={() => handleSelectRow(String(item[keyField]))} />

                  </td>
                  {columns.map((col) =>
              <td key={String(col.key)} className="px-4 py-3">
                      {col.render ? col.render(item) : item[col.key as keyof T]}
                    </td>
              )}
                  {actions &&
              <td className="px-4 py-3 text-right">{actions(item)}</td>
              }
                </tr>
            ) :

            <tr>
                <td
                colSpan={columns.length + 2}
                className="px-4 py-8 text-center text-slate-500">

                  No results found
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
        <div className="text-sm text-slate-500">
          Showing{' '}
          <span className="font-medium">{showingFrom}</span>{' '}
          to{' '}
          <span className="font-medium">{showingTo}</span>{' '}
          of <span className="font-medium">{sortedData.length}</span> results
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="rounded px-3 py-1 text-sm disabled:opacity-50 hover:bg-slate-100">

            Previous
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="rounded px-3 py-1 text-sm disabled:opacity-50 hover:bg-slate-100">

            Next
          </button>
        </div>
      </div>
    </div>);

}
