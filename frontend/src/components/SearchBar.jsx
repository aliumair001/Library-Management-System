/**
 * SearchBar Component
 * 
 * Debounced search input for books.
 * Searches across title, author, and genre automatically as user types.
 */

import { useState, useEffect } from 'react';

const SearchBar = ({ onSearch, placeholder = "Search books by title, author, or genre..." }) => {
  const [searchTerm, setSearchTerm] = useState('');

  /**
   * Debounced search effect
   * Waits 500ms after user stops typing before triggering search
   */
  useEffect(() => {
    // Don't search if empty
    if (!searchTerm.trim()) {
      onSearch('');
      return;
    }

    // Set up debounce timer
    const timeoutId = setTimeout(() => {
      onSearch(searchTerm);
    }, 500);

    // Cleanup timer on component unmount or searchTerm change
    return () => clearTimeout(timeoutId);
  }, [searchTerm, onSearch]);

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        {/* Search icon */}
        <svg
          className="h-5 w-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
      />

      {/* Clear button */}
      {searchTerm && (
        <button
          onClick={() => setSearchTerm('')}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default SearchBar;