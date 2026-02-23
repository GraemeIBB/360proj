import React, { useState } from 'react';
import './Sidebar.css';

const Sidebar = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <button className={`sidebar-toggle ${isOpen ? 'open' : ''}`} onClick={toggleSidebar}>
        {isOpen ? '<' : '...'}
      </button>
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-content">
          {children}
        </div>
      </div>
    </>
  );
};

export default Sidebar;