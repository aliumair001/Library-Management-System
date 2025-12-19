/**
 * BookCard Component
 * 
 * Displays book information in a card layout.
 * Shows availability status and borrow button.
 */

const BookCard = ({ book, onBorrow }) => {
  /**
   * Get availability badge color
   */
  const getAvailabilityColor = () => {
    if (book.available_copies > 0) {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-red-100 text-red-800';
  };

  /**
   * Get availability text
   */
  const getAvailabilityText = () => {
    if (book.available_copies > 0) {
      return `${book.available_copies} Available`;
    }
    return 'Not Available';
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden animate-fadeIn">
      {/* Book icon placeholder */}
      <div className="h-48 bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
        <svg
          className="w-20 h-20 text-white"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
        </svg>
      </div>

      {/* Book details */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
          {book.title}
        </h3>
        
        <p className="text-sm text-gray-600 mb-2">
          by {book.author}
        </p>

        <div className="flex items-center justify-between mb-3">
          <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-primary-100 text-primary-800">
            {book.genre}
          </span>

          <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getAvailabilityColor()}`}>
            {getAvailabilityText()}
          </span>
        </div>

        <div className="text-sm text-gray-500 mb-3">
          Total Copies: {book.total_copies}
        </div>

        {/* Borrow button */}
        <button
          onClick={() => onBorrow(book)}
          className="w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          {book.available_copies > 0 ? 'Borrow Now' : 'Reserve Book'}
        </button>
      </div>
    </div>
  );
};

export default BookCard;