import Navbar from "./Navbar"
import './Header.css'

function Header() {
    return (
        <>
            <div className="container">
                <Navbar notifCount={5}/>
            </div>
        </>
    )
}

export default Header
