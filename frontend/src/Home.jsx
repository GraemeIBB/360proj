import React from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SearchBar from './components/SearchBar';
import Sidebar from './components/Sidebar';
import Button from './components/Button';

import './Home.css';

function Home() {
    {/* TODO: add the Filter and Hot Books buttons at the bottom (refer to figma) */}
  return (
    <>
        <div id="home-header"></div>

        <div id="login-buttons">
            {/* TODO: make the buttons work */}
            {/* TODO: make the blue border around these buttons go away */}
            <div id="sign-in-button"><Button title={ "Sign In" } /></div>
            <div id="sign-up-button"><Button title={ "Sign Up" } /></div>
        </div>
        
        <Sidebar>
            {/* TODO: fill in sidebar content */}
            <h2>Sidebar Content</h2>
            <Button title={ "This is a sidebar button" } />
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
            <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
            <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
            <p>Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
            <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
            <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
            <p>Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
            <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
        </Sidebar>

        <div className="home-container">
            <h1 id="home-title">Book <br></br>Buddies</h1>
            {/* TODO: make search bar work */}
            <div id="home-search-bar"><SearchBar /></div>
        </div>

        <Footer />
    </>
  );
}

export default Home;