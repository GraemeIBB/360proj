function Button({type, title}){
    return (
        <button type={type || 'button'}>{title}</button>
    )
}
export default Button
