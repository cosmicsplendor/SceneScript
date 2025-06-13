const DisplayVariant1: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <>
            <div className="absolute right-[5%] top-[2.2%] text-neutral-100 text-4xl font-semibold text-neutral-600 pb-2" style={{ fontFamily: 'Segoe UI', "borderBottom": "6px solid crimson" }}>Game Week </div>
            <div className="absolute left-[96%] top-[2%] text-neutral-100 text-6xl font-semibold text-neutral-600 pb-2" style={{ fontFamily: 'Futura Bold' }}>{children}</div>
        </>
    )
}

export default DisplayVariant1