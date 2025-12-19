import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const FilterPanel = ({ filters, onFiltersChange, onClearFilters }) => {
  const handleInputChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    const clearedFilters = {
      status: 'all',
      profitableOnly: false,
      minGMP: '',
      maxGMP: '',
      industry: 'all',
      boardType: 'all'
    };
    onFiltersChange(clearedFilters);
  };

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Manufacturing', 
    'Retail', 'Energy', 'Real Estate', 'Telecommunications',
    'FMCG', 'Biotechnology', 'Media', 'Logistics', 'Education', 'Others'
  ];

  const boardTypes = ['Main Board', 'SME'];
  const statuses = ['Upcoming', 'Open', 'Closed', 'Listed'];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        <button
          onClick={clearAllFilters}
          className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <XMarkIcon className="h-4 w-4" />
          <span>Clear All</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={filters.status || 'all'}
            onChange={(e) => handleInputChange('status', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            {statuses.map(status => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {/* Industry Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Industry
          </label>
          <select
            value={filters.industry || 'all'}
            onChange={(e) => handleInputChange('industry', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Industries</option>
            {industries.map(industry => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </select>
        </div>

        {/* Board Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Board Type
          </label>
          <select
            value={filters.boardType || 'all'}
            onChange={(e) => handleInputChange('boardType', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Board Types</option>
            {boardTypes.map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* GMP Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            GMP Range (₹)
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.minGMP || ''}
              onChange={(e) => handleInputChange('minGMP', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.maxGMP || ''}
              onChange={(e) => handleInputChange('maxGMP', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Profitable Only Checkbox */}
      <div className="mt-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={filters.profitableOnly || false}
            onChange={(e) => handleInputChange('profitableOnly', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">Show only profitable IPOs</span>
        </label>
      </div>

      {/* Active Filters Display */}
      <div className="mt-6">
        <div className="flex flex-wrap gap-2">
          {Object.entries(filters).map(([key, value]) => {
            if (!value || value === 'all' || value === '') return null;
            
            return (
              <span
                key={key}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {key.replace('_', ' ')}: {value}
                <button
                  onClick={() => handleInputChange(key, '')}
                  className="ml-2 hover:text-blue-600"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;