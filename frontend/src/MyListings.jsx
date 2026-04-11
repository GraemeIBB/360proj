import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import './MyListings.css';

const API = 'http://localhost:8800';

function MyListings() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) { navigate('/login'); return; }

    const fetchMyBooks = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API}/books/search?owner=${userId}`, { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to fetch listings');
        setBooks(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'Unable to load listings');
      } finally {
        setLoading(false);
      }
    };

    fetchMyBooks();
  }, [userId, navigate]);

  const getCoverImage = (book) => {
    if (!book?.coverImage) return `${API}/images/Book.png`;
    if (book.coverImage.startsWith('/')) return `${API}${book.coverImage}`;
    return book.coverImage;
  };

  return (
    <>
      <Header />
      <div className="my-listings-page">
        <div className="my-listings-header">
          <h1>My Listings</h1>
          <button className="post-book-btn" onClick={() => navigate('/post-book')}>
            + Post New Book
          </button>
        </div>

        {loading && <p className="my-listings-status">Loading...</p>}
        {error && <p className="my-listings-status my-listings-error">{error}</p>}

        {!loading && !error && books.length === 0 && (
          <div className="my-listings-empty">
            <p>You haven't listed any books yet.</p>
            <button className="post-book-btn" onClick={() => navigate('/post-book')}>
              Post Your First Book
            </button>
          </div>
        )}

        {!loading && !error && books.length > 0 && (
          <div className="my-listings-grid">
            {books.map((book) => (
              <article
                key={book._id}
                className="my-listing-card"
                onClick={() => navigate(`/books/${book._id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/books/${book._id}`); }}
              >
                <img
                  src={getCoverImage(book)}
                  alt={book.title}
                  className="my-listing-cover"
                  onError={(e) => { e.target.onerror = null; e.target.src = `${API}/images/Book.png`; }}
                />
                <div className="my-listing-info">
                  <p className="my-listing-title">{book.title}</p>
                  <p className="my-listing-meta">{book.author}</p>
                  <p className="my-listing-meta">Condition: {book.condition || 'N/A'}</p>
                  <p className="my-listing-price">${Number(book.price).toFixed(2)}</p>
                  <span className={`my-listing-badge ${book.isAvailable ? 'available' : 'unavailable'}`}>
                    {book.isAvailable ? 'Available' : 'Unlisted'}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}

export default MyListings;
