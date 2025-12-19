/**
 * DashboardWidgets Component
 * 
 * Displays user lending information:
 * - Active lendings (currently borrowed books)
 * - Reserved lendings (advance bookings)
 * - Lending history
 */

const DashboardWidgets = ({ dashboardData }) => {
  const { active_lendings = [], reserved_lendings = [], total_books_borrowed = 0 } = dashboardData || {};

  /**
   * Calculate days remaining for a lending
   */
  const getDaysRemaining = (lending) => {
    if (lending.days_remaining !== null && lending.days_remaining !== undefined) {
      return lending.days_remaining;
    }
    
    const endDate = new Date(lending.lend_end_date);
    const today = new Date();
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  /**
   * Get status badge color
   */
  const getStatusColor = (daysRemaining) => {
    if (daysRemaining < 0) return 'bg-red-100 text-red-800';
    if (daysRemaining <= 2) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  /**
   * Render lending card
   */
  const LendingCard = ({ lending, isReserved = false }) => {
    const daysRemaining = getDaysRemaining(lending);
    
    return (
      <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-1">
              {lending.book.title}
            </h4>
            <p className="text-sm text-gray-600">
              by {lending.book.author}
            </p>
          </div>
          {!isReserved && (
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(daysRemaining)}`}>
              {daysRemaining < 0 ? 'Overdue' : `${daysRemaining}d left`}
            </span>
          )}
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Start:</span>
            <span className="font-medium text-gray-900">
              {new Date(lending.lend_start_date).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Return:</span>
            <span className="font-medium text-gray-900">
              {new Date(lending.lend_end_date).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Genre:</span>
            <span className="font-medium text-gray-900">
              {lending.book.genre}
            </span>
          </div>
        </div>

        {isReserved && (
          <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-800">
            <span className="font-semibold">Reserved</span> - Lending starts on{' '}
            {new Date(lending.lend_start_date).toLocaleDateString()}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm mb-1">Total Borrowed</p>
              <p className="text-3xl font-bold">{total_books_borrowed}</p>
            </div>
            <svg className="w-12 h-12 text-primary-200" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
            </svg>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm mb-1">Active</p>
              <p className="text-3xl font-bold">{active_lendings.length}</p>
            </div>
            <svg className="w-12 h-12 text-green-200" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm mb-1">Reserved</p>
              <p className="text-3xl font-bold">{reserved_lendings.length}</p>
            </div>
            <svg className="w-12 h-12 text-blue-200" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      {/* Active Lendings */}
      {active_lendings.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Currently Borrowed Books
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {active_lendings.map((lending) => (
              <LendingCard key={lending.id} lending={lending} />
            ))}
          </div>
        </div>
      )}

      {/* Reserved Lendings */}
      {reserved_lendings.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Reserved Books (Upcoming)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reserved_lendings.map((lending) => (
              <LendingCard key={lending.id} lending={lending} isReserved />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {active_lendings.length === 0 && reserved_lendings.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No books borrowed yet</h3>
          <p className="mt-2 text-sm text-gray-500">
            Start browsing our collection and borrow your first book!
          </p>
        </div>
      )}
    </div>
  );
};

export default DashboardWidgets;