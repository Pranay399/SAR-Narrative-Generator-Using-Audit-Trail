export default function Footer() {
    return (
        <footer className="w-full py-8 mt-auto bg-zinc-50 border-t border-zinc-100">
            <div className="flex flex-col md:flex-row justify-between items-center px-12 max-w-7xl mx-auto gap-4 font-sans text-[11px] font-normal leading-relaxed text-zinc-400">
                <p>© {new Date().getFullYear()} Digital Architect. All rights reserved.</p>
                <div className="flex items-center gap-6">
                    <a href="#" className="hover:underline transition-opacity duration-200">Privacy Policy</a>
                    <a href="#" className="hover:underline transition-opacity duration-200">Compliance Standards</a>
                    <a href="#" className="hover:underline transition-opacity duration-200">Support</a>
                </div>
            </div>
        </footer>
    );
}
