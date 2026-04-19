import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-white">
            <h1 className="text-6xl font-black text-brand mb-4">404</h1>
            <p className="text-xl text-gray-400 mb-8">This page could not be found.</p>
            <Link 
                href="/"
                className="px-6 py-3 bg-brand/10 text-brand border border-brand/20 rounded-xl hover:bg-brand hover:text-white transition-all duration-300"
            >
                Return Home
            </Link>
        </div>
    );
}
