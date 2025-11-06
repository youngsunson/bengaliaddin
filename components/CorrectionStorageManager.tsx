// components/CorrectionStorageManager.tsx
import React, { useState } from 'react';
import { learningSystem } from '../learning';

export const CorrectionStorageManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const storedCorrections = learningSystem.userPreferences.storedCorrections
    .filter(c => 
      c.incorrect.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.correct.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => b.confidence - a.confidence);
  
  const userAcceptedWords = learningSystem.userPreferences.userAcceptedWords
    .filter(w => w.word.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const handleDeleteCorrection = (incorrect: string, correct: string) => {
    learningSystem.updatePreferences({
      storedCorrections: learningSystem.userPreferences.storedCorrections.filter(
        c => !(c.incorrect === incorrect && c.correct === correct)
      )
    });
  };

  const handleDeleteUserWord = (word: string) => {
    learningSystem.updatePreferences({
      userAcceptedWords: learningSystem.userPreferences.userAcceptedWords.filter(
        w => w.word !== word
      )
    });
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4 font-bengali">সংশোধন সংরক্ষণ</h3>
      
      <div className="mb-4">
        <input
          type="text"
          placeholder="খুঁজুন..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stored Corrections */}
        <div>
          <h4 className="font-semibold mb-2 font-bengali">AI থেকে সংরক্ষিত সংশোধন</h4>
          <div className="max-h-60 overflow-y-auto">
            {storedCorrections.length > 0 ? (
              storedCorrections.map((correction, index) => (
                <div key={index} className="p-2 border-b border-gray-200 dark:border-gray-600">
                  <div className="font-bengali text-sm">
                    <span className="line-through text-red-600">{correction.incorrect}</span>
                    <span className="mx-2">→</span>
                    <span className="text-green-600">{correction.correct}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    বিশ্বাস: {(correction.confidence * 100).toFixed(0)}% | 
                    ব্যবহার: {correction.usageCount} | 
                    {correction.acceptedByUser ? ' ✓ গৃহীত' : ' ⚪ অগৃহীত'}
                  </div>
                  <button 
                    onClick={() => handleDeleteCorrection(correction.incorrect, correction.correct)}
                    className="text-xs text-red-500 hover:text-red-700 mt-1"
                  >
                    মুছুন
                  </button>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">কোনো সংরক্ষিত সংশোধন নেই</p>
            )}
          </div>
        </div>

        {/* User Accepted Words */}
        <div>
          <h4 className="font-semibold mb-2 font-bengali">ব্যবহারকারী গৃহীত শব্দ</h4>
          <div className="max-h-60 overflow-y-auto">
            {userAcceptedWords.length > 0 ? (
              userAcceptedWords.map((word, index) => (
                <div key={index} className="p-2 border-b border-gray-200 dark:border-gray-600">
                  <div className="font-bengali text-sm text-green-600">
                    {word.word}
                  </div>
                  <div className="text-xs text-gray-500">
                    গৃহীত: {word.acceptedFrom} | 
                    তারিখ: {word.timestamp.toLocaleDateString()}
                  </div>
                  <button 
                    onClick={() => handleDeleteUserWord(word.word)}
                    className="text-xs text-red-500 hover:text-red-700 mt-1"
                  >
                    মুছুন
                  </button>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">কোনো গৃহীত শব্দ নেই</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex space-x-2">
        <button 
          onClick={() => learningSystem.saveToStorage()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          সংরক্ষণ করুন
        </button>
        <button 
          onClick={() => learningSystem.loadFromStorage()}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          রিফ্রেশ করুন
        </button>
      </div>
    </div>
  );
};
