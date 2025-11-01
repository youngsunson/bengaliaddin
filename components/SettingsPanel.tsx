import React from 'react';

type Theme = 'light' | 'dark';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const SunIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m4.93 17.66 1.41-1.41"/><path d="m17.66 4.93 1.41-1.41"/></svg>
);

const MoonIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
);

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose, theme, setTheme }) => {
  if (!isOpen) return null;

  const ThemeButton: React.FC<{ value: Theme, current: Theme, children: React.ReactNode }> = ({ value, current, children }) => {
    const isActive = value === current;
    return (
        <button
            onClick={() => setTheme(value)}
            className={`w-full flex items-center justify-center p-4 rounded-lg border-2 transition-colors duration-200 ${
                isActive 
                ? 'bg-blue-100 dark:bg-blue-900/50 border-blue-500 text-blue-700 dark:text-blue-300' 
                : 'bg-gray-100 dark:bg-gray-700/50 border-transparent hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-300'
            }`}
        >
            {children}
        </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md m-4 animate-slide-up border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Settings</h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </header>

        <main className="p-6">
            <div className="space-y-1 mb-6">
                <label className="text-base font-medium text-gray-700 dark:text-gray-300">Appearance</label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Choose how the application looks.</p>
            </div>
          
            <div className="grid grid-cols-2 gap-4">
                <ThemeButton value="light" current={theme}>
                    <div className="text-center">
                        <SunIcon className="w-8 h-8 mx-auto mb-2"/>
                        <span className="font-medium">Light</span>
                    </div>
                </ThemeButton>
                <ThemeButton value="dark" current={theme}>
                     <div className="text-center">
                        <MoonIcon className="w-8 h-8 mx-auto mb-2"/>
                        <span className="font-medium">Dark</span>
                    </div>
                </ThemeButton>
            </div>
        </main>
      </div>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};