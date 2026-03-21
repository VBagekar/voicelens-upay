import React from "react";

const LoadingSpinner = ({ message = "Analyzing sentiment..." }) => (
    <div className="flex flex-col items-center justify-center py-10 gap-4">
        <div className="relative w-16 h-16">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
            {/* Spinning ring */}
            <div className="absolute inset-0 rounded-full border-4 border-transparent
                      border-t-yellow-400 animate-spin"
                style={{ borderTopColor: "#F7AC2D" }} />
            {/* Inner dot */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: "#003C64" }} />
            </div>
        </div>
        <p className="text-sm font-medium animate-pulse"
            style={{ color: "#003C64", fontFamily: "Open Sans, sans-serif" }}>
            {message}
        </p>
    </div>
);

export default LoadingSpinner;