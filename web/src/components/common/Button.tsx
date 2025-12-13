import type { ReactNode } from "react"

interface ButtonProps {
    text: string,
    classNames: string,
    onClick?: () => void,
    disabled?: boolean,
    icon?: ReactNode,
    loadingIcon?: ReactNode,
    isLoading?: boolean
    type?: "button" | "submit" | "reset"
}

const Button = ({ text, classNames, onClick, disabled, icon, loadingIcon, isLoading, type }: ButtonProps) => {
    return (
        <button disabled={disabled} onClick={onClick} className={classNames} type={type}>
            {isLoading ? loadingIcon : icon}
            <h1>{text}</h1>
        </button>
    )
}

export default Button