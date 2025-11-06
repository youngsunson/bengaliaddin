// components/SettingsPanel.tsx
import React, { useState } from 'react';
import { CorrectionStorageManager } from './CorrectionStorageManager';
import { LearningDashboard } from './LearningDashboard';
import { learningSystem } from '../learning';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
  isOpen, 
  onClose, 
  theme, 
  setTheme 
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'learning' | 'storage'>('general');
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-xl font-semibold font-bengali">সেটিংস</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            className={`px-4 py-2 font-bengali ${activeTab === 'general' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            onClick={() => setActiveTab('general')}
          >
            সাধারণ
          </button>
          <button
            className={`px-4 py-2 font-bengali ${activeTab === 'learning' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            onClick={() => setActiveTab('learning')}
          >
            শেখা প্রগতি
          </button>
          <button
            className={`px-4 py-2 font-bengali ${activeTab === 'storage' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            onClick={() => setActiveTab('storage')}
          >
            সংশোধন সংরক্ষণ
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 font-bengali">থিম</label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                >
                  <option value="light">হালকা</option>
                  <option value="dark">গাঢ়</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 font-bengali">শেখা স্তর</label>
                <select
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                >
                  <option value="basic">মৌলিক</option>
                  <option value="intermediate">মাঝারি</option>
                  <option value="advanced">উন্নত</option>
                </select>
              </div>
            </div>
          )}
          
          {activeTab === 'learning' && (
            <LearningDashboard />
          )}
          
          {activeTab === 'storage' && (
            <CorrectionStorageManager />
          )}
        </div>
      </div>
    </div>
  );
};
