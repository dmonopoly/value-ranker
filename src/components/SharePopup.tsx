"use client"; 

import React, { useState, useEffect } from 'react';

type SharePopupProps = {
    shareableLink: string;
    onClose: () => void;
};

const SharePopup: React.FC<SharePopupProps> = ({ shareableLink, onClose }) => {
    const [isCopied, setIsCopied] = useState(false);

    // This effect will reset the "Copied!" message after 2 seconds
    useEffect(() => {
        if (isCopied) {
            const timer = setTimeout(() => {
                setIsCopied(false);
            }, 2000);

            // Clean up the timer if the component is unmounted
            return () => clearTimeout(timer);
        }
    }, [isCopied]);

    const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
        // Select the text in the input
        e.currentTarget.select();

        // Copy the text to the clipboard
        navigator.clipboard.writeText(shareableLink).then(() => {
            // Set the copied state to true to show the message
            setIsCopied(true);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-sm w-full">
                <h3 className="text-xl font-bold mb-4">Link Ready!</h3>
                <p className="text-gray-600 mb-4">Your ranking is saved. Share this link with a friend:</p>
                <div className="relative">
                        <input 
                            type="text"
                            readOnly
                            value={shareableLink}
                            className="w-full p-2 border rounded-lg text-center bg-gray-100 mb-6 cursor-pointer"
                            onClick={handleInputClick}
                        />
                        {isCopied && (
                            <div className="absolute -top-6 right-0 bg-green-500 text-white text-xs font-bold py-1 px-2 rounded-lg">
                                Copied!
                            </div>
                        )}
                    </div>
                <button
                    onClick={onClose}
                    className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition"
                >
                    Close
                </button>
            </div>
        </div>
    );
};

export default SharePopup;