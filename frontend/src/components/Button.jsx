import './Button.css';

function Button({type, title}){
    return (
        <button id="button" type={type || 'button'}>{title}</button>
    )
}
export default Button
