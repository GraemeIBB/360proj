import React, { useRef, useState } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SearchBar from './components/SearchBar';
import Sidebar from './components/Sidebar';
import Button from './components/Button';

import './Home.css';

function Home() {
    const sidebarRef = useRef(null);
    const [searchResults, setSearchResults] = useState([]);
    const [noResults, setNoResults] = useState(false);
    const [searchError, setSearchError] = useState('');
    const [titleFilter, setTitleFilter] = useState('');
    const [authorFilter, setAuthorFilter] = useState('');
    const [genreFilter, setGenreFilter] = useState('');
    const [ratingFilter, setRatingFilter] = useState('');
    const [priceMin, setPriceMin] = useState('');
    const [priceMax, setPriceMax] = useState('');
    const [yearFilter, setYearFilter] = useState('');

    const handleFiltersClick = () => {
      if (sidebarRef.current) {
        sidebarRef.current.toggle();
      }
    };

        const runSearch = async (params) => {
            setSearchError('');

            const query = new URLSearchParams(params).toString();

            if (!query) {
                setSearchResults([]);
                setNoResults(false);
                return;
            }

            try {
                const response = await fetch(`http://localhost:3000/api/search?${query}`);

                if (!response.ok) {
                    throw new Error('Search request failed');
                }

                const results = await response.json();
                setSearchResults(results);
                setNoResults(results.length === 0);
            } catch (error) {
                setSearchResults([]);
                setNoResults(false);
                setSearchError('Unable to fetch search results.');
            }
        };

        const handleSearch = async (term) => {
            const trimmedTerm = term.trim();
            if (!trimmedTerm) {
                setSearchResults([]);
                setNoResults(false);
                setSearchError('');
                return;
            }

            await runSearch({ q: trimmedTerm });
        };

        const handleSidebarSearch = async () => {
            await runSearch({
                title: titleFilter.trim(),
                author: authorFilter.trim(),
                genre: genreFilter,
                minRating: ratingFilter,
                minPrice: priceMin,
                maxPrice: priceMax,
                year: yearFilter.trim()
            });
        };

  return (
    <>
        <div id="home-header"></div>

        <div id="login-buttons">
            {/* TODO: make the buttons work */}
            {/* TODO: make the blue border around these buttons go away */}
            <div id="sign-in-button"><Button title={ "Sign In" } /></div>
            <div id="sign-up-button"><Button title={ "Sign Up" } /></div>
        </div>
        
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
            <div className="sidebar-group">
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

        <div className="home-container">
            <h1 id="home-title">Book <br></br>Buddies</h1>
                        <div id="home-search-bar"><SearchBar onSearch={handleSearch} /></div>

                        {searchError && <p>{searchError}</p>}
                        {noResults && <p>No results found</p>}
                        {searchResults.length > 0 && (
                            <div>
                                {searchResults.map((book) => (
                                    <pre key={book.isbn}>{JSON.stringify(book, null, 2)}</pre>
                                ))}
                            </div>
                        )}

            <div id="home-buttons">
                <Button title={"Filters"} onClick={handleFiltersClick} />
                <Button title={"Hot Books"} /></div>
        </div>

        <Footer />
    </>
  );
}

export default Home;