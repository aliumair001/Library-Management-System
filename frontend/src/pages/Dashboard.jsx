/**
 * Dashboard Page
 *
 * Main dashboard with:
 * - User info
 * - Active/Reserved lendings
 * - Book search and browsing
 * - Book lending functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { searchBooks, getAllBooks, getUserDashboard } from '../api/books';
import Sidebar from '../components/SideBar';
import SearchBar from '../components/SearchBar';
import BookCard from '../components/BookCard';
import DashboardWidgets from '../components/DashboardWidgets';
// Component implementation lives in "LendingModel.jsx" (name mismatch), so import from that file.
import LendingModal from '../components/LendingModel';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // overview or browse
  const [books, setBooks] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booksLoading, setBooksLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [showLendingModal, setShowLendingModal] = useState(false);

  /**
   * Fetch dashboard data on mount
   */
  useEffect(() => {
    fetchDashboardData();
  }, []);

  /**
   * Fetch all books when browse tab is selected
   */
  useEffect(() => {
    if (activeTab === 'browse' && books.length === 0) {
      fetchAllBooks();
    }
  }, [activeTab]);

  /**
   * Fetch user dashboard data
   */
  const fetchDashboardData = async () => {
    try {
      const data = await getUserDashboard();
      setDashboardData(data);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch all books
   */
  const fetchAllBooks = async () => {
    setBooksLoading(true);
    setError('');
    try {
      const data = await getAllBooks();
      setBooks(data);
    } catch (err) {
      setError('Failed to load books');
    } finally {
      setBooksLoading(false);
    }
  };

  /**
   * Handle book search (debounced in SearchBar component)
   */
  const handleSearch = useCallback(async (query) => {
    if (!query.trim()) {
      fetchAllBooks();
      return;
    }

    setBooksLoading(true);
    setError('');
    try {
      const data = await searchBooks(query);
      setBooks(data.books);
    } catch (err) {
      setError('Search failed');
    } finally {
      setBooksLoading(false);
    }
  }, []);

  /**
   * Handle book borrow click
   */
  const handleBorrowBook = (book) => {
    setSelectedBook(book);
    setShowLendingModal(true);
  };

  /**
   * Handle lending success
   */
  const handleLendingSuccess = () => {
    fetchDashboardData();
    if (activeTab === 'browse') {
      fetchAllBooks();
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner text="Loading dashboard..." />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
          <div className="px-8 py-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome, {user?.name}!
            </h1>
            <p className="text-gray-600 mt-1">Manage your library account</p>
          </div>

          {/* Tabs */}
          <div className="px-8">
            <div className="flex space-x-8 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'overview'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                My Lendings
              </button>
              <button
                onClick={() => setActiveTab('browse')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'browse'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Browse Books
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <DashboardWidgets dashboardData={dashboardData} />
          )}

          {/* Browse Books Tab */}
          {activeTab === 'browse' && (
            <>
              {/* Search Bar */}
              <div className="mb-6">
                <SearchBar onSearch={handleSearch} />
              </div>

              {/* Books Grid */}
              {booksLoading ? (
                <LoadingSpinner text="Loading books..." />
              ) : books.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {books.map((book) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      onBorrow={handleBorrowBook}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No books found</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Try a different search term
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Lending Modal */}
      {showLendingModal && selectedBook && (
        <LendingModal
          book={selectedBook}
          onClose={() => {
            setShowLendingModal(false);
            setSelectedBook(null);
          }}
          onSuccess={handleLendingSuccess}
        />
      )}
    </div>
  );
};

export default Dashboard;


