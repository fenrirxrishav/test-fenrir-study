
export function FenrirLogo({className}: {className?: string}) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M14 12l-3.43 3.43a2 2 0 0 0 0 2.83l.57.57a2 2 0 0 0 2.83 0L17 16" />
            <path d="M19 19 12 12" />
            <path d="m14 7 3 3" />
            <path d="M10 12 7.17 9.17a2 2 0 0 0-2.83 0L4 9.5a2 2 0 0 0 0 2.83L6.83 15" />
            <path d="m12 12 5.17 5.17a2 2 0 0 0 2.83 0L20.5 16a2 2 0 0 0 0-2.83L17.66 10.34" />
            <path d="M14.24 9.47s.5-2.47 2.24-4.24" />
            <path d="M10.15 13.85s-2.47.5-4.24 2.24" />
        </svg>
    );
}
