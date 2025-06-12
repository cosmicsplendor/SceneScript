const DisplayVariant1: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <>
            <div className="absolute right-[8%] top-[2%] text-4xl font-semibold text-neutral-600 pb-2" style={{ fontFamily: 'Segoe UI', "borderBottom": "6px solid #333" }}>Game Week </div>
            <div className="absolute left-[94%] top-[1.4%] text-6xl font-semibold text-neutral-600 pb-2" style={{ fontFamily: 'Futura Bold' }}>{children}</div>
        </>
    )
}

export default DisplayVariant1