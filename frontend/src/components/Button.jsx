import './Button.css';

function Button({type, title, onClick}){
    return (
        <button id="button" type={type || 'button'} onClick={onClick}>{title}</button>
    )
}
export default Button
