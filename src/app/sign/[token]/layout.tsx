export default function SigningLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Minimal Header */}
            <header className="h-16 border-b bg-white flex items-center px-6 shadow-sm z-10 sticky top-0">
                <div className="font-semibold text-lg flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                        S
                    </div>
                    SignApp
                </div>
            </header>
            <main className="flex-1">
                {children}
            </main>
        </div>
    );
}
