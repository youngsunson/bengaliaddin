
import React from 'react';

interface RibbonProps {
  onUndo: () => void;
  canUndo: boolean;
  onSettingsClick: () => void;
}

const BengaliSpellCheckIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block">
    <path d="M5.5 14.5C5.5 13.5 6 13 7 12.5C7.5 12.25 8 12 8.5 11.5C9 11 9.5 10.5 9.5 9.5C9.5 8.5 9 8 8 7.5C7.5 7.25 7 7 6.5 6.5C6 6 5.5 5.5 5.5 4.5" className="stroke-gray-600 dark:stroke-gray-400" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12.5 4.5C11.5 5 11 5.5 10.5 6C10 6.5 9.5 7 9.5 7.5" className="stroke-gray-600 dark:stroke-gray-400" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 20L10.5714 13L13.1429 20" className="stroke-gray-600 dark:stroke-gray-400" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8.85714 17.2H12.2857" className="stroke-gray-600 dark:stroke-gray-400" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15 13.5L17 15.5L21 11.5" stroke="#38A169" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SettingsIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
);


const RibbonButton: React.FC<{ children: React.ReactNode, active?: boolean, onClick?: () => void; disabled?: boolean; }> = ({ children, active, onClick, disabled }) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    className={`px-3 py-1 text-sm rounded transition-colors duration-150 ${active ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' : ''} ${disabled ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed bg-gray-100 dark:bg-gray-700/50' : 'text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700'}`}>
    {children}
  </button>
);

export const Ribbon: React.FC<RibbonProps> = ({ onUndo, canUndo, onSettingsClick }) => {
  return (
    <div className="bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 px-4 py-1">
      <div className="flex items-center space-x-4 text-sm text-gray-800 dark:text-gray-300">
        <span className="text-blue-700 dark:text-blue-400 font-semibold">File</span>
        <span className="font-semibold bg-white dark:bg-gray-900 px-2 py-0.5 rounded-t-md border-t border-l border-r border-gray-300 dark:border-gray-700 -mb-[5px]">Home</span>
        <span>Insert</span>
        <span>Design</span>
        <span>Layout</span>
        <span>References</span>
      </div>
      <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-600 mt-1 pt-1">
        <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-1 border-r border-gray-300 dark:border-gray-600 pr-4">
                <RibbonButton onClick={onUndo} disabled={!canUndo}>Undo</RibbonButton>
                <RibbonButton>Paste</RibbonButton>
                <RibbonButton>Cut</RibbonButton>
                <RibbonButton>Copy</RibbonButton>
            </div>
            <div className="flex items-center space-x-1 border-r border-gray-300 dark:border-gray-600 pr-4">
                <RibbonButton><strong>B</strong></RibbonButton>
                <RibbonButton><em>I</em></RibbonButton>
                <RibbonButton><u>U</u></RibbonButton>
            </div>
            <div className="flex items-center space-x-1">
                <button className="flex flex-col items-center p-2 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 ring-2 ring-blue-500 bg-white dark:bg-gray-800/50">
                    <BengaliSpellCheckIcon />
                    <span className="text-xs mt-1">Bengali</span>
                </button>
            </div>
        </div>
        <div className="flex items-center">
             <button onClick={onSettingsClick} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors">
                <SettingsIcon className="w-5 h-5" />
            </button>
        </div>
      </div>
    </div>
  );
};