'use client';

import React, { useState } from 'react';
import SupportTicketsList from './SupportTicketsList';
import LearningVaultManager from './LearningVaultManager';

export default function SupportEnginePage() {
    const [activeTab, setActiveTab] = useState<'tickets' | 'videos'>('tickets');

    return (
        <div className="p-8 space-y-6">
            <header className="flex justify-between items-center bg-white/5 p-6 rounded-2xl glass-morphism">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        Support Engine
                    </h1>
                    <p className="text-gray-400 mt-1">Manage global support tickets and the learning vault across all clients.</p>
                </div>
            </header>

            <div className="flex gap-4 border-b border-white/10 pb-4">
                <button
                    onClick={() => setActiveTab('tickets')}
                    className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
                        activeTab === 'tickets' 
                        ? 'bg-brand text-black shadow-[0_0_15px_#4cba49]' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    Tickets Manager
                </button>
                <button
                    onClick={() => setActiveTab('videos')}
                    className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
                        activeTab === 'videos' 
                        ? 'bg-brand text-black shadow-[0_0_15px_#4cba49]' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    Learning Vault Editor
                </button>
            </div>

            <div className="mt-6">
                {activeTab === 'tickets' ? <SupportTicketsList /> : <LearningVaultManager />}
            </div>
        </div>
    );
}
