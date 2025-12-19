import axiosInstance from './axios';

/**
 * Low-level books API wrapper (kept for potential future use)
 */
export const booksAPI = {
  // Search books by title, author, or genre
  searchBooks: async (query = '', filter = 'all') => {
    const params = query ? { query, filter } : {};
    const response = await axiosInstance.get('/books/search', { params });
    return response.data;
  },

  // Get single book details
  getBook: async (bookId) => {
    const response = await axiosInstance.get(`/books/${bookId}`);
    return response.data;
  },

  // Lend a book (not used directly by UI; see named export `lendBook` below)
  lendBook: async (bookId, lendingDays, startDate = null) => {
    const response = await axiosInstance.post('/lending/lend', {
      book_id: bookId,
      lending_days: lendingDays,
      start_date: startDate,
    });
    return response.data;
  },

  // Get user's lending history
  getMyLendings: async () => {
    const response = await axiosInstance.get('/lending/my-lendings');
    return response.data;
  },

  // Return a book
  returnBook: async (lendingId) => {
    const response = await axiosInstance.post(`/lending/return/${lendingId}`);
    return response.data;
  },
};

/**
 * Named exports used across the UI
 * These match how other files import from '../api/books'.
 */

// Search books (used by Dashboard search)
export const searchBooks = async (query) => {
  // backend: GET /books/search?query=...
  const response = await axiosInstance.get('/books/search', {
    params: { query },
  });
  return response.data;
};

// Get all books for browsing
export const getAllBooks = async () => {
  // backend: GET /books/all
  const response = await axiosInstance.get('/books/all');
  return response.data;
};

// Get user lending dashboard (active/reserved/history)
export const getUserDashboard = async () => {
  // backend: GET /lending/dashboard
  const response = await axiosInstance.get('/lending/dashboard');
  return response.data;
};

// Check availability for a specific book
export const checkBookAvailability = async (bookId) => {
  // backend: GET /books/{book_id}/availability
  const response = await axiosInstance.get(`/books/${bookId}/availability`);
  return response.data;
};

// Lend or reserve a book (used by LendingModal)
export const lendBook = async (lendData) => {
  // backend: POST /lending/lend
  const response = await axiosInstance.post('/lending/lend', lendData);
  return response.data;
};