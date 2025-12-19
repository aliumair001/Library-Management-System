/**
 * LendingModal Component
 * 
 * Modal for borrowing books (immediate or advance reservation).
 * Shows availability status and lending options.
 */

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { checkBookAvailability, lendBook } from '../api/books';
import LoadingSpinner from './LoadingSpinner';

const LendingModal = ({ book, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [availability, setAvailability] = useState(null);
  const [duration, setDuration] = useState(5);
  const [startDate, setStartDate] = useState('');

  /**
   * Fetch book availability on mount
   */
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const data = await checkBookAvailability(book.id);
        setAvailability(data);

        // If not available, pre-fill start date with next available date
        if (!data.is_available && data.next_available_date) {
          const date = new Date(data.next_available_date);
          setStartDate(date.toISOString().split('T')[0]);
        }
      } catch (error) {
        toast.error('Failed to check availability');
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [book.id]);

  /**
   * Handle book lending submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const lendData = {
        book_id: book.id,
        duration_days: duration
      };

      // Add start date for advance lending
      if (!availability.is_available && startDate) {
        lendData.start_date = startDate;
      }

      await lendBook(lendData);
      
      toast.success(
        availability.is_available 
          ? 'Book borrowed successfully!' 
          : 'Book reserved successfully!'
      );
      
      onSuccess();
      onClose();
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to borrow book';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 animate-fadeIn">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {availability?.is_available ? 'Borrow Book' : 'Reserve Book'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <LoadingSpinner text="Checking availability..." />
        ) : (
          <>
            {/* Book Info */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-1">{book.title}</h3>
              <p className="text-sm text-gray-600">by {book.author}</p>
            </div>

            {/* Availability Status */}
            {availability?.is_available ? (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-green-800">
                    Book is available now
                  </span>
                </div>
              </div>
            ) : (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-yellow-800 mb-1">
                      Book is currently unavailable
                    </p>
                    <p className="text-sm text-yellow-700">
                      Will be available on: {' '}
                      <span className="font-semibold">
                        {new Date(availability.next_available_date).toLocaleDateString()}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Lending Form */}
            <form onSubmit={handleSubmit}>
              {/* Start Date (for advance lending) */}
              {!availability?.is_available && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date(availability.next_available_date).toISOString().split('T')[0]}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              )}

              {/* Duration Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lending Duration
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDuration(5)}
                    className={`py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                      duration === 5
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    5 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuration(8)}
                    className={`py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                      duration === 8
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    8 Days
                  </button>
                </div>
              </div>

              {/* Return Date Preview */}
              <div className="mb-6 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  Return Date: {' '}
                  <span className="font-semibold text-gray-900">
                    {(() => {
                      const start = startDate ? new Date(startDate) : new Date();
                      const returnDate = new Date(start);
                      returnDate.setDate(returnDate.getDate() + duration);
                      return returnDate.toLocaleDateString();
                    })()}
                  </span>
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Processing...' : (availability?.is_available ? 'Borrow' : 'Reserve')}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default LendingModal;