"use client"; 

import React, { useState } from 'react';
import Link from 'next/link';

const Header: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <nav className="bg-gray-100 border-b-2 border-gray-300">
            <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
                <Link href="/" className="flex items-center space-x-3 rtl:space-x-reverse">
                    <img src="/public/logo.svg" className="h-8" alt="Logo" />
                    <div className="self-center text-2xl font-semibold whitespace-nowrap">
                        What Do You Value?
                    </div>
                    <div className="self-center text-sm font-light whitespace-nowrap text-gray-600 hidden sm:block">
                        A tool to understand others better
                    </div>
                </Link>
                <div className="md:hidden">
                    <button
                        onClick={toggleMenu}
                        className="text-gray-800 focus:outline-none"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
                        </svg>
                    </button>
                </div>
                <div className={`${isMenuOpen ? 'block' : 'hidden'} w-full md:block md:w-auto`} id="navbar-default">
                    <ul className="font-medium flex flex-col p-4 md:p-0 mt-4 border border-gray-100 rounded-lg bg-gray-100 md:flex-row md:space-x-8 rtl:space-x-reverse md:mt-0 md:border-0 md:bg-gray-100">
                        <li>
                            <Link href="/" className="text-lg text-blue-600 hover:underline flex-shrink-0">
                                Home
                            </Link>
                        </li>
                        <li>
                            <Link href="/about" className="text-lg text-blue-600 hover:underline flex-shrink-0">
                                About
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default Header;