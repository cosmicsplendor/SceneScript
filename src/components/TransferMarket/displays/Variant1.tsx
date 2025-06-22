const DisplayVariant1: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <>
            <div className="absolute right-[16%] top-[0.8%] text-neutral-100 text-4xl font-semibold text-neutral-200 pb-2" style={{ fontFamily: 'Segoe UI', "borderBottom": "6px solid goldenrod" }}>MD</div>
            <div className="absolute left-[90%] top-[0.8%] text-5xl font-semibold text-neutral-200 pb-2 whitespace-nowrap" style={{ fontFamily: 'Futura Bold' }}>{children}</div>
        </>
    )
}

export default DisplayVariant1