import SearchBar from './components/SearchBar.jsx'
import Sidebar from './components/Sidebar.jsx'
import Navbar from './components/Navbar.jsx'

function Zoo(){
    return(
        <>
            <SearchBar onSearch={(q) => console.log(q)}/>
            <Sidebar />
            <Navbar />
        </>
    )
}

export default Zoo
