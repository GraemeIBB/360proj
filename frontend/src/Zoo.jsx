import SearchBar from './components/SearchBar.jsx'
import Sidebar from './components/Sidebar.jsx'
import Header from './components/Header.jsx'
import Button from './components/Button.jsx'
import Footer from './components/Footer.jsx'


function Zoo(){
    return(
        <>
            <Header/>
            <SearchBar onSearch={(q) => console.log(q)}/>
            
            <Sidebar />
            <Button/>
        </>
    )
}

export default Zoo
