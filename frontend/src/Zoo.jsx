import SearchBar from './components/SearchBar.jsx'

function Zoo(){
    return(
        <SearchBar onSearch={(q) => console.log(q)}/>
    )
}

export default Zoo
