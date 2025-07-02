import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface CustomizationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

const CustomizationPanel: React.FC<CustomizationPanelProps> = ({
  isOpen,
  onClose,
  isDarkMode
}) => {
  const [activeTab, setActiveTab] = useState<'Style' | 'Text'>('Style');
  const [currentColorPage, setCurrentColorPage] = useState(0);

  // Color swatches data (mimicking the draw.io interface)
  const colorPages = [
    [
      '#2C2C2C', '#82B366', '#6AC25A', '#5B9BD5',
      '#4A90E2', '#9C5AE2', '#E25A9C', '#E2675A'
    ],
    [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
      '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
    ],
    [
      '#34495E', '#E74C3C', '#3498DB', '#2ECC71',
      '#F39C12', '#9B59B6', '#1ABC9C', '#E67E22'
    ]
  ];

  const tabs = ['Style', 'Text'] as const;

  if (!isOpen) return null;

  return (
    <div className={`fixed top-0 right-0 h-full w-80 z-50 border-l transition-all duration-300 ${
      isDarkMode 
        ? 'bg-gray-900 border-gray-700 text-white' 
        : 'bg-white border-gray-200 text-gray-900'
    } shadow-xl`}>
      
      {/* Header with tabs */}
      <div className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        {/* Close button */}
        <div className="flex justify-end p-2">
          <button
            onClick={onClose}
            className={`p-1 rounded hover:bg-opacity-10 hover:bg-gray-500 transition-colors ${
              isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? isDarkMode
                    ? 'border-blue-400 text-blue-400 bg-gray-800'
                    : 'border-blue-500 text-blue-600 bg-gray-50'
                  : isDarkMode
                    ? 'border-transparent text-gray-400 hover:text-gray-300 hover:bg-gray-800'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content area */}
      <div className="p-4 h-full overflow-y-auto">
        {activeTab === 'Style' && (
          <div className="space-y-6">
            {/* Color palette section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setCurrentColorPage(Math.max(0, currentColorPage - 1))}
                  disabled={currentColorPage === 0}
                  className={`p-1 rounded ${
                    currentColorPage === 0
                      ? 'opacity-30 cursor-not-allowed'
                      : isDarkMode
                        ? 'hover:bg-gray-700 text-gray-400'
                        : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <ChevronLeft size={16} />
                </button>

                {/* Color swatches grid */}
                <div className="grid grid-cols-4 gap-2 mx-4">
                  {colorPages[currentColorPage].map((color, index) => (
                    <div
                      key={index}
                      className="w-8 h-8 rounded cursor-pointer border border-gray-400 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>

                <button
                  onClick={() => setCurrentColorPage(Math.min(colorPages.length - 1, currentColorPage + 1))}
                  disabled={currentColorPage === colorPages.length - 1}
                  className={`p-1 rounded ${
                    currentColorPage === colorPages.length - 1
                      ? 'opacity-30 cursor-not-allowed'
                      : isDarkMode
                        ? 'hover:bg-gray-700 text-gray-400'
                        : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Color page indicators */}
              <div className="flex justify-center space-x-1 mb-4">
                {colorPages.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full cursor-pointer transition-colors ${
                      index === currentColorPage
                        ? isDarkMode ? 'bg-blue-400' : 'bg-blue-500'
                        : isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                    }`}
                    onClick={() => setCurrentColorPage(index)}
                  />
                ))}
              </div>
            </div>

            {/* Fill options */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="fill"
                  defaultChecked
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="fill" className="text-sm font-medium">Fill</label>
                <select className={`ml-auto px-2 py-1 text-xs rounded border ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-gray-300' 
                    : 'bg-white border-gray-300 text-gray-700'
                }`}>
                  <option>Auto</option>
                  <option>Solid</option>
                  <option>Gradient</option>
                </select>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="gradient"
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="gradient" className="text-sm">Gradient</label>
              </div>
            </div>

            {/* Line options */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="line"
                  defaultChecked
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="line" className="text-sm font-medium">Line</label>
                <div className={`ml-auto w-6 h-4 border-2 ${
                  isDarkMode ? 'border-white' : 'border-black'
                }`}></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Width</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      defaultValue="1"
                      className={`w-12 px-1 py-1 text-xs border rounded ${
                        isDarkMode 
                          ? 'bg-gray-800 border-gray-600 text-gray-300' 
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    />
                    <span className="text-xs">pt</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-500 block mb-1">Perimeter</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      defaultValue="0"
                      className={`w-12 px-1 py-1 text-xs border rounded ${
                        isDarkMode 
                          ? 'bg-gray-800 border-gray-600 text-gray-300' 
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    />
                    <span className="text-xs">pt</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">Opacity</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    defaultValue="100"
                    className={`w-16 px-1 py-1 text-xs border rounded ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-gray-300' 
                        : 'bg-white border-gray-300 text-gray-700'
                    }`}
                  />
                  <span className="text-xs">%</span>
                </div>
              </div>
            </div>

            {/* Additional options */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="sketch"
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="sketch" className="text-sm">Sketch</label>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="shadow"
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="shadow" className="text-sm">Shadow</label>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-4 border-t space-y-2">
              <button className={`w-full py-2 px-3 text-sm rounded border ${
                isDarkMode 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-800' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}>
                Copy Style
              </button>
              <button className={`w-full py-2 px-3 text-sm rounded border ${
                isDarkMode 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-800' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}>
                Set as Default Style
              </button>
            </div>
          </div>
        )}

        {activeTab === 'Text' && (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${
              isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <h3 className="font-medium mb-2">Text Properties</h3>
              <p className="text-sm text-gray-500">Text customization options will be available here.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomizationPanel;