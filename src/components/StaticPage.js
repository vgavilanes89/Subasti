import React from 'react';

export const StaticPage = ({ title, subtitle, children }) => (
    <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md border max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
        {subtitle && <p className="text-gray-500 mb-8">{subtitle}</p>}
        <div className="space-y-8 text-gray-700">{children}</div>
    </div>
);

export const StaticSection = ({ heading, children }) => (
    <section>
        <h2 className="text-xl font-bold text-gray-900 mb-3">{heading}</h2>
        <div className="text-gray-600 leading-relaxed space-y-2">{children}</div>
    </section>
);
