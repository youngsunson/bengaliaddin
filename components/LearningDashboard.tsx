// components/LearningDashboard.tsx
import React from 'react';
import { learningSystem } from '../learning';

export const LearningDashboard: React.FC = () => {
  const { userPreferences } = learningSystem;
  
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4 font-bengali">শেখা প্রগতি</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
          <h4 className="font-semibold mb-2">ব্যক্তিগত শব্দকোষ</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {userPreferences.personalDictionary.length} টি শব্দ
          </p>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
          <h4 className="font-semibold mb-2">শেখা হয়েছে</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {userPreferences.correctionHistory.filter(h => h.accepted).length} টি শুদ্ধি
          </p>
        </div>
      </div>
      
      <div className="mb-4">
        <h4 className="font-semibold mb-2">সাম্প্রতিক শেখা</h4>
        <div className="max-h-40 overflow-y-auto">
          {userPreferences.correctionHistory.slice(-5).reverse().map((item, index) => (
            <div key={index} className="text-sm p-2 border-b border-gray-200 dark:border-gray-600">
              <span className="font-bengali">{item.word}</span> → 
              <span className="font-bengali ml-2">{item.suggestion}</span>
              <span className="text-xs text-gray-500 ml-2">
                ({item.accepted ? 'গৃহীত' : 'প্রত্যাখ্যাত'})
              </span>
            </div>
          ))}
        </div>
      </div>
      
      <button 
        onClick={() => learningSystem.saveToStorage()}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        ডেটা সংরক্ষণ করুন
      </button>
    </div>
  );
};
