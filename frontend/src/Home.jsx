import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
//  COMPONENT IMPORTS 
// Navbar: displays header with navigation and notifications
import Navbar from './components/Navbar';
// Footer: displays footer section
import Footer from './components/Footer';
// SearchBar: top-level search input for quick title/author filtering
import SearchBar from './components/SearchBar';
// Sidebar: collapsible filters panel for advanced search (genre, price, etc.)
import Sidebar from './components/Sidebar';
// Button: reusable button component for actions (Post Book, Filters, Hot Books)
import Button from './components/Button';

import './Home.css';

function Home() {
    //  REACT HOOKS & ROUTER 
    const navigate = useNavigate();      // Navigation hook for route changes (e.g., /books/:id)
    const sidebarRef = useRef(null);     // Reference to sidebar component for toggle control
    
    //  AUTHENTICATION STATE 
    const [isLoggedIn, setIsLoggedIn] = useState(false);  // Tracks if user is logged in from localStorage
    
    //  SEARCH STATE 
    // searchResults: most recent filtered book list from search endpoint
    const [searchResults, setSearchResults] = useState([]);
    // noResults: true if current search returned 0 books (displays "No results found" message)
    const [noResults, setNoResults] = useState(false);
    // searchError: error message from failed search request (displayed above grid)
    const [searchError, setSearchError] = useState('');
    
    // SIDEBAR FILTER STATE
    // These states track what the user has entered in the sidebar filter form
    const [titleFilter, setTitleFilter] = useState('');          // Filters by book title (regex match)
    const [authorFilter, setAuthorFilter] = useState('');        // Filters by author name (regex match)
    const [genreFilter, setGenreFilter] = useState('');          // Filters by genre (exact match: fiction, mystery, etc.)
    const [ratingFilter, setRatingFilter] = useState('');        // Minimum rating filter (1-5 stars)
    const [priceMin, setPriceMin] = useState('');                // Minimum price filter (gte)
    const [priceMax, setPriceMax] = useState('');                // Maximum price filter (lte)
    const [yearFilter, setYearFilter] = useState('');            // Publication year filter
    
    //  MAIN DATA & UI STATE 
    // allBooks: the complete list fetched on initial page load (never changes unless page reloads)
    const [allBooks, setAllBooks] = useState([]);
    // visibleBooks: the current list being rendered to the user (changes when search/filter applied or reset)
    const [visibleBooks, setVisibleBooks] = useState([]);
    // loading: true while fetching books on initial load
    const [loading, setLoading] = useState(true);
    // error: general error message from initial fetch (network failure, server error, etc.)
    const [error, setError] = useState('');


    //  EFFECT 1: FETCH ALL BOOKS ON MOUNT 
    // Runs once when component mounts, feeds the initial marketplace data
    // Load marketplace content once when the page is opened.
    useEffect(() => {
        const fetchBooks = async () => {
            try {
                setLoading(true);
                setError('');

                // Initial marketplace load: fetch all available books once.
                const res = await fetch('http://localhost:8800/books');
                if (!res.ok) {
                    throw new Error('Failed to fetch books');
                }

                const data = await res.json();
                const normalizedBooks = Array.isArray(data) ? data : [];

                setAllBooks(normalizedBooks);
                setVisibleBooks(normalizedBooks);
                setNoResults(normalizedBooks.length === 0);
            } catch (err) {
                // Keep UI stable even when backend is unavailable.
                setError(err.message || 'Unable to load books.');
                setAllBooks([]);
                setVisibleBooks([]);
                setNoResults(false);
            } finally {
                setLoading(false);
            }
        };

        // Immediately invoke the async fetchBooks function
        fetchBooks();
    }, []);

    //  EFFECT 2: SYNC LOGIN STATE FROM STORAGE 
    // Monitors localStorage for login/logout changes (from other browser tabs and page reloads)
    // Also registers listeners for 'focus' and 'storage' events to detect auth changes
        useEffect(() => {
            // Reads login state from localStorage and updates React state.
            const syncLoginState = () => {
                setIsLoggedIn(Boolean(localStorage.getItem('userId')));
            };

            // Run once on component mount so the UI reflects current auth state immediately.
            syncLoginState();
            // Re-check when tab regains focus (useful after logging in/out on another route/tab).
            window.addEventListener('focus', syncLoginState);
            // Re-check when localStorage changes in another tab/window.
            window.addEventListener('storage', syncLoginState);

            return () => {
                // Clean up listeners when component unmounts to prevent memory leaks.
                window.removeEventListener('focus', syncLoginState);
                window.removeEventListener('storage', syncLoginState);
            };
        }, []);

    //  HELPER FUNCTION: TOGGLE SIDEBAR 
    // Opens/closes the filter sidebar panel when "Filters" button is clicked
    const handleFiltersClick = () => {
            // Sidebar exposes advanced filters without leaving the main grid.
      if (sidebarRef.current) {
        sidebarRef.current.toggle();
      }
    };

    //  CORE SEARCH FUNCTION: runSearch 
    // Executes the backend search endpoint with provided filter parameters
    // Handles converting filter params to URL query string and updating visibleBooks with results
    // Called by both handleSearch (top bar) and handleSidebarSearch (sidebar filters)
        const runSearch = async (params) => {
            setSearchError('');

            const query = new URLSearchParams(params).toString();

            // Empty query resets the grid to default "all books" view.
            if (!query) {
                setSearchResults([]);
                setVisibleBooks(allBooks);
                setNoResults(allBooks.length === 0);
                return;
            }

            try {
                // Search endpoint returns a filtered book list using the same schema as /books.
                const response = await fetch(`http://localhost:8800/books/search?${query}`);
                const data = await response.json();
            

                const normalizedResults = Array.isArray(data)
                    ? data
                    : Array.isArray(data.results)
                        ? data.results
                        : [];

                // Search and default views share one rendering list.
                setSearchResults(normalizedResults);
                setVisibleBooks(normalizedResults);
                setNoResults(normalizedResults.length === 0);

                if (!response.ok) {
                    // Non-2xx may still include useful payload; keep rendered results if present.
                    setSearchError('Search request returned an error response.');
                }
            } catch (error) {
                // Network failures clear the filtered grid so stale results are not misleading.
                setSearchResults([]);
                setVisibleBooks([]);
                setNoResults(false);
                setSearchError('Unable to fetch search results.');
            }
        };

        //  HELPER FUNCTION: TOP SEARCH BAR 
        // Called when user types in top search bar and presses Enter
        // Searches by title only, clears other filters
        // Empty search resets to viewing all books again
        const handleSearch = async (term) => {
            const trimmedTerm = term.trim();
            if (!trimmedTerm) {
                // Empty top search bar resets to the original marketplace list.
                setSearchResults([]);
                setVisibleBooks(allBooks);
                setNoResults(allBooks.length === 0);
                setSearchError('');
                return;
            }

            await runSearch({ title: trimmedTerm });
        };

        //  HELPER FUNCTION: SIDEBAR FILTER SEARCH 
        // Called when user clicks "Apply Filters" button in sidebar
        // Builds filter object from sidebar state, only including non-empty values
        // Prevents validation errors from empty filter params sent to backend
        const handleSidebarSearch = async () => {
            // Sidebar filters are mapped directly to backend-supported query params.
            // Only include filters that have actual values to avoid validation errors.
            const filters = {};
            if (titleFilter.trim()) filters.title = titleFilter.trim();
            if (authorFilter.trim()) filters.author = authorFilter.trim();
            if (genreFilter) filters.genre = genreFilter;
            if (priceMin) filters.minPrice = priceMin;
            if (priceMax) filters.maxPrice = priceMax;
            
            await runSearch(filters);
        };

    //  HELPER FUNCTION: CARD CLICK HANDLER 
    // Navigates to the detailed book page when user clicks a book card
    // Route: /books/:id where :id is the MongoDB _id of the book
    const handleBookClick = (bookId) => {
        // Navigate to the dedicated listing page for this book.
        navigate(`/books/${bookId}`);
    };

    //  HELPER FUNCTION: FORMAT PRICE 
    // Converts any numeric input to display-ready currency format with 2 decimal places
    // Returns 'N/A' if value is undefined, null, or not a valid number
    const formatPrice = (value) => {
        // Normalize any numeric-like input into a display-safe currency string.
        if (value === undefined || value === null || Number.isNaN(Number(value))) {
            return 'N/A';
        }
        return Number(value).toFixed(2);//always 2 decimal places
    };

    //  HELPER FUNCTION: GET BOOK OWNER 
    // Extracts seller/owner username from book object for display on card
    // Returns 'Unknown owner' if owner data is missing (shouldn't happen if backend populates correctly)
    const getBookOwner = (book) => {
        if (book?.owner?.username) {
            return book.owner.username;
        }
        return 'Unknown owner';
    };
    const getBookAuthor = (book) =>{
        if(book?.author) {
            return book.author;
        }
        return 'Unknown Author';
    };
       

    //  HELPER FUNCTION: GET BOOK COVER IMAGE 
    // Retrieves book's cover image URL or returns placeholder if missing
    // Placeholder from via.placeholder.com ensures card always has an image (no broken src)
    const getCoverImage = (book) => {
        // Fallback keeps cards visually consistent when no image is uploaded yet.
        return book?.coverImage || 'https://via.placeholder.com/280x180?text=No+Image';
    };

  return (
    <>
        {/*  HEADER SECTION  */}
        {/* Contains Navbar with logo, notifications, and user menu */}
        <div id="home-header">
            <Navbar />
        </div>

                {/*  LOGIN/SIGNUP BUTTONS (UNAUTHENTICATED USERS ONLY)  */}
                {/* Only show Sign In / Sign Up buttons if user is NOT logged in */}
                {/* These buttons allow unauthenticated users to navigate to login/signup pages */}
                {!isLoggedIn && (
                    <div id="login-buttons">
                            {/* TODO: make the blue border around these buttons go away */}
                            <div id="sign-in-button"><Button title={ "Sign In" } onClick={() => navigate('/login')} /></div>
                            <div id="sign-up-button"><Button title={ "Sign Up" } onClick={() => navigate('/signup')} /></div>
                    </div>
                )}
        
        {/*  SIDEBAR: COLLAPSIBLE FILTER PANEL  */}
        {/* Contains advanced search options: title, author, genre, price range, etc. */}
        {/* Initially hidden; toggled open by "Filters" button */}
        <Sidebar ref={sidebarRef}>
            <h2>Search Filters</h2>
            <div className="sidebar-group">
                <label>Title:</label>
                                <input
                                    type="text"
                                    id="title-filter"
                                    placeholder="Enter book title"
                                    value={titleFilter}
                                    onChange={(event) => setTitleFilter(event.target.value)}
                                />
            </div>
            <div className="sidebar-group">
                <label>Author:</label>
                                <input
                                    type="text"
                                    id="author-filter"
                                    placeholder="Enter author name"
                                    value={authorFilter}
                                    onChange={(event) => setAuthorFilter(event.target.value)}
                                />
            </div>
            <div className="sidebar-group">
                <label>Genre:</label>
                                <select
                                    id="genre-filter"
                                    value={genreFilter}
                                    onChange={(event) => setGenreFilter(event.target.value)}
                                >
                    <option value="">Select genre</option>
                    <option value="fiction">Fiction</option>
                    <option value="non-fiction">Non-Fiction</option>
                    <option value="mystery">Mystery</option>
                    <option value="romance">Romance</option>
                    <option value="sci-fi">Science Fiction</option>
                    <option value="fantasy">Fantasy</option>
                    <option value="other">Other</option>
                </select>
            </div>
            <div className="sidebar-group">
                <label>Minimum Rating:</label>
                                <select
                                    id="rating-filter"
                                    value={ratingFilter}
                                    onChange={(event) => setRatingFilter(event.target.value)}
                                >
                    <option value="">Any</option>
                    <option value="1">1 star</option>
                    <option value="2">2 stars</option>
                    <option value="3">3 stars</option>
                    <option value="4">4 stars</option>
                    <option value="5">5 stars</option>
                </select>
            </div>
            <div className="sidebar-group">
                <label>Price Range:</label>
                                <input
                                    type="number"
                                    id="price-min"
                                    placeholder="Min"
                                    value={priceMin}
                                    onChange={(event) => setPriceMin(event.target.value)}
                                />
                <span> to </span>
                                <input
                                    type="number"
                                    id="price-max"
                                    placeholder="Max"
                                    value={priceMax}
                                    onChange={(event) => setPriceMax(event.target.value)}
                                />
            </div>
            <div className="sidebar-group last-element">
                <label htmlFor="year-filter">Publication Year:</label>
                                <input
                                    type="number"
                                    id="year-filter"
                                    placeholder="e.g., 2020"
                                    value={yearFilter}
                                    onChange={(event) => setYearFilter(event.target.value)}
                                />
            </div>
                        <div className="sidebar-group">
                                <Button title={"Apply Filters"} onClick={handleSidebarSearch} />
                        </div>
        </Sidebar>

        {/*  MAIN CONTENT CONTAINER  */}
        {/* Contains: title, search bar, book grid, and action buttons */}
        <div className="home-container">
            {/*  BRANDING TITLE  */}
            <h1 id="home-title">Book <br></br>Buddies</h1>
            
            {/*  TOP SEARCH BAR SECTION  */}
            {/* User types book title/author here for quick search */}
                        <div id="home-search-bar"><SearchBar onSearch={handleSearch} /></div>

                        {/*  STATUS MESSAGES SECTION  */}
                        {/* Displays loading spinner, errors, or "no results" message while fetching or searching */}
                        {loading && <p className="home-status">Loading books...</p>}
                        {error && <p className="home-status">{error}</p>}
                        {searchError && <p>{searchError}</p>}
                        {!loading && !error && noResults && <p className="home-status">No results found</p>}

                        {/*  MARKETPLACE BOOK GRID  */}
                        {/* Grid of clickable book cards displaying cover image, author, condition, seller, price */}
                        {/* visibleBooks updates when search applied or filters reset */}
                        {/* Shared marketplace grid used by both initial load and search results. */}
                        {!loading && !error && visibleBooks.length > 0 && (
                            <div className="book-grid">
                                {/* Each book renders as a clickable article card */}
                                {/* Card displays: cover image, author, condition, seller, price */}
                                {/* onClick: navigates to /books/:id for detailed view */}
                                {visibleBooks.map((book) => (
                                    <article
                                        key={book._id || book.isbn || `${book.title}-${book.author}`}  // Unique React key for list rendering efficiency
                                        className="book-card"  // CSS class for card styling and layout
                                        onClick={() => handleBookClick(book._id)}  // Click handler navigates to /books/:id page for full details
                                        role="button"  // Accessibility: tells screen readers this article is clickable
                                        tabIndex={0}   // Accessibility: allows keyboard (Tab key) navigation to this card
                                        onKeyDown={(event) => {
                                            // Accessibility: keyboard support for card click (Enter or Spacebar)
                                            // Allows keyboard-only users to select and open books without a mouse
                                            // Keyboard support for accessibility on card-like buttons.
                                            if (event.key === 'Enter' || event.key === ' ') {
                                                event.preventDefault();
                                                handleBookClick(book._id);
                                            }
                                        }}
                                    >
                                        {/*  BOOK CARD IMAGE */}
                                        <img src={getCoverImage(book)} alt={book.title || 'Book cover'} className="book-card-image" />
                                        {/* Cover image with fixed height ensures uniform grid layout */}
                                        {/* Falls back to placeholder if coverImage URL is missing from database */}
                                        
                                        {/*  BOOK CARD CONTENT (TEXT SECTION)  */}
                                        <div className="book-card-content">
                                            {/* Book title displayed in bold black text below image */}
                                            <p className="book-card-title">{book.title || 'Untitled'}</p>
                                            
                                            {/* Author name in smaller gray text */}
                                            <p className="book-card-meta">{book.author || 'Unknown author'}</p>
                                            
                                            {/* Book condition: new, like-new, good, fair, poor - helps buyer assess item quality */}
                                            <p className="book-card-meta">Condition: {book.condition || 'N/A'}</p>
                                            
                                            {/* Seller/owner username allows buyer to see who's selling and potentially contact them */}
                                            <p className="book-card-meta">Seller: {getBookOwner(book)}</p>
                                            
                                            {/* Price displayed in bold green text at bottom of card for emphasis */}
                                            <p className="book-card-price">${formatPrice(book.price)}</p>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}

            {/*  ACTION BUTTONS SECTION  */}
            {/* Row of buttons for marketplace controls: Filters, Hot Books, and Post Book (if logged in) */}
            <div id="home-buttons">
                {/* Filters button: toggles sidebar panel open/closed for advanced search */}
                <Button title={"Filters"} onClick={handleFiltersClick} />
                
                {/* Hot Books button: TODO - will show trending/most-viewed books when implemented */}
                <Button title={"Hot Books"} />
                
                {/* Post Book button: only visible if user is logged in */}
                {/* Navigates to /post-book page where users can list a book for sale */}
                {isLoggedIn && (
                    <Button title={"Post Book"} onClick={() => navigate('/post-book')} />
                )}
            </div>
        </div>

        {/*  FOOTER SECTION  */}
        {/* Contains copyright info, legal links, contact info, etc. */}
        <Footer />
    </>
  );

}

export default Home;