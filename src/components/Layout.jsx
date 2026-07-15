import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, Calendar, Compass, User } from 'lucide-react';
import Header from './Header';

export default function Layout() {
    const location = useLocation();

    const navItems = [
        { icon: Home, label: 'Home', path: '/' },
        { icon: Calendar, label: 'Schedule', path: '/schedule' },
        { icon: Compass, label: 'Explore', path: '/explore' },
        { icon: User, label: 'Profile', path: '/profile' },
    ];

    return (
        <div className="min-h-screen bg-mesh font-sans flex flex-col">

            {/* Decorative top gradient bar */}
            <div className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-taylor-red via-taylor-red-light to-taylor-red z-50 pointer-events-none" />

            {/* Responsive centered column - allows scrolling */}
            <div className="w-full max-w-[430px] sm:max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto flex-1 bg-[#050508] flex flex-col shadow-2xl overflow-hidden" style={{ WebkitOverflowScrolling: 'touch' }}>

                {/* Header - Sticky so it stays visible while scrolling */}
                <div className="sticky top-0 z-40 bg-[#050508]/90 backdrop-blur-md border-b border-white/5">
                    <Header />
                </div>

                {/* Main Content Area - scrollable, allows content to expand */}
                <main className="flex-1 overflow-y-scroll overflow-x-hidden pb-24" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
                    <Outlet />
                </main>

            </div>

            {/* Bottom Navigation - fixed to viewport, works on all devices */}
            <nav className="fixed bottom-0 left-0 right-0 bg-[#050508]/95 backdrop-blur-xl border-t border-white/5 px-6 py-3 flex justify-around items-center z-50 safe-area-bottom">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                    >
                        {({ isActive }) => (
                            <div className={`flex flex-col items-center gap-1 transition-colors duration-200 ${
                                isActive ? 'text-taylor-red' : 'text-gray-500 hover:text-gray-300'
                            }`}>
                                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                                <span className="text-[10px] font-medium font-inter tracking-wide">{item.label}</span>
                                {isActive && (
                                    <div className="absolute -bottom-1 w-1 h-1 bg-taylor-red rounded-full" />
                                )}
                            </div>
                        )}
                    </NavLink>
                ))}
            </nav>
        </div>
    );
}
