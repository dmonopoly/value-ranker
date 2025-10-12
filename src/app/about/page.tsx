import React from 'react';

const AboutPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center">
            <main className="flex-grow w-full max-w-5xl p-2">
                <section className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <h2 className="text-2xl font-bold mb-4 text-center">
                        Get to know your friends better
                    </h2>
                    <div className="text-lg text-gray-700 mb-4 text-center">
                        This tool helps you discover what you and others value and engage in meaningful dialogue.
                        <br/>
                        <br/>
                        Every person has, deep down, a <b>ranking</b> of how they value things in the world, and that drives everything they do.
                    </div>
                </section>

                <section className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <h2 className="text-2xl font-bold text-center">
                        Features
                    </h2>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center">
                        {/* <img src="/public/images/ranking.png" alt="Ranking" className="w-full h-48 object-cover mb-4 rounded-lg" /> */}
                        <h3 className="text-xl font-bold mb-2">Rank Anything</h3>
                        <p className="text-gray-700 text-center">
                            Choose from a variety of categories and rank items based on your preferences.
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center">
                        {/* <img src="/public/images/share.png" alt="Share" className="w-full h-48 object-cover mb-4 rounded-lg" /> */}
                        <h3 className="text-xl font-bold mb-2">Share Your Rankings</h3>
                        <p className="text-gray-700 text-center">
                            Share a link with others to let them rank the same items and compare results.
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center">
                        {/* <img src="/public/images/discuss.png" alt="Discuss" className="w-full h-48 object-cover mb-4 rounded-lg" /> */}
                        <h3 className="text-xl font-bold mb-2">Engage in Dialogue</h3>
                        <p className="text-gray-700 text-center">
                            Use generated discussion questions to have meaningful conversations with others.
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center">
                        {/* <img src="/public/images/empathy.png" alt="Empathy" className="w-full h-48 object-cover mb-4 rounded-lg" /> */}
                        <h3 className="text-xl font-bold mb-2">Build Empathy</h3>
                        <p className="text-gray-700 text-center">
                            Understand and appreciate different perspectives to foster empathy.
                        </p>
                    </div>
                </section>
            </main>

            <footer className="w-full p-4 text-center">
                <p>&copy; 2025 What Do You Value? All rights reserved.</p>
            </footer>
        </div>
    );
};

export default AboutPage;