import React, { useRef } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SearchBar from './components/SearchBar';
import Sidebar from './components/Sidebar';
import Button from './components/Button';

import './Home.css';

function Home() {
    const sidebarRef = useRef(null);

    const handleFiltersClick = () => {
      if (sidebarRef.current) {
        sidebarRef.current.toggle();
      }
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
                <input type="text" id="title-filter" placeholder="Enter book title" />
            </div>
            <div className="sidebar-group">
                <label>Author:</label>
                <input type="text" id="author-filter" placeholder="Enter author name" />
            </div>
            <div className="sidebar-group">
                <label>Genre:</label>
                <select id="genre-filter">
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
                <select id="rating-filter">
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
                <input type="number" id="price-min" placeholder="Min" />
                <span> to </span>
                <input type="number" id="price-max" placeholder="Max" />
            </div>
            <div className="sidebar-group last-element">
                <label htmlFor="year-filter">Publication Year:</label>
                <input type="number" id="year-filter" placeholder="e.g., 2020" />
            </div>
        </Sidebar>

        <div className="home-container">
            <h1 id="home-title">Book <br></br>Buddies</h1>
            {/* TODO: make search bar work */}
            <div id="home-search-bar"><SearchBar /></div>

            <div id="home-buttons">
                <Button title={"Filters"} onClick={handleFiltersClick} />
                <Button title={"Hot Books"} /></div>
        </div>

        <Footer />
    </>
  );
}

export default Home;