import SearchBar from './components/SearchBar.jsx'
import Sidebar from './components/Sidebar.jsx'
import Navbar from './components/Navbar.jsx'
import Button from './components/Button.jsx'

function Zoo(){
    return(
        <>
            <Button title={ "This is a prop" } />
            <SearchBar onSearch={(q) => console.log(q)}/>
            <Sidebar />
            <Navbar />
        </>
    )
}

export default Zoo
