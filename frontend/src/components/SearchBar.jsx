import { useState } from "react"
import './SearchBar.css';
import {Search} from 'lucide-react';


function SearchBar({ onSearch }){
    const [query, setQuery] = useState("");


    const handleChange = (event) => {
    setQuery(event.target.value);
    }
    const handleSubmit = (event) => {
        event.preventDefault();
        onSearch(query)
    }

    return (
        <form className="search-bar" onSubmit={handleSubmit}>
        <input
            type="text"
            placeholder="Search Books"
            value={query}
            onChange={handleChange}
        />
        <button type="submit"><Search/></button>
        </form>
    )
}

export default SearchBar
