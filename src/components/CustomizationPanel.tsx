import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Square, Diamond, Circle, Bold, Italic } from 'lucide-react';

interface CustomizationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onColorChange?: (color: string) => void;
}

const CustomizationPanel: React.FC<CustomizationPanelProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  onColorChange
}) => {
  const [activeTab, setActiveTab] = useState<'Style' | 'Text'>('Style');
  const [currentColorPage, setCurrentColorPage] = useState(0);
  const [selectedShape, setSelectedShape] = useState<'square' | 'diamond' | 'ellipse'>('square');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [selectedFont, setSelectedFont] = useState('Arial');

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

  const fonts = ['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana', 'Roboto', 'Open Sans'];

  const tabs = ['Style', 'Text'] as const;

  const ShapeIcon = ({ shape }: { shape: 'square' | 'diamond' | 'ellipse' }) => {
    switch (shape) {
      case 'square':
        return <Square size={16} />;
      case 'diamond':
        return <Diamond size={16} />;
      case 'ellipse':
        return <Circle size={16} />;
    }
  };

  // Fixed: This function now properly calls the onColorChange callback
  const handleColorClick = (color: string) => {
    console.log('Color clicked:', color);
    if (onColorChange) {
      onColorChange(color);
    }
  };

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
              <h3 className="text-sm font-medium mb-3">Node Color</h3>
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
                      className="w-8 h-8 rounded cursor-pointer border border-gray-400 hover:scale-110 transition-transform relative group"
                      style={{ backgroundColor: color }}
                      title={`Apply color ${color} to selected nodes`}
                      onClick={() => handleColorClick(color)}
                    >
                      {/* Hover effect overlay */}
                      <div className="absolute inset-0 bg-white bg-opacity-20 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </div>
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

              {/* Instructions */}
              <div className={`p-3 rounded-lg text-center text-sm ${
                isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
              }`}>
                <p>Select nodes on the graph, then click a color to apply</p>
              </div>
            </div>

            {/* Node Shape section */}
            <div>
              <h3 className="text-sm font-medium mb-3">Shape</h3>
              <div className="grid grid-cols-3 gap-2">
                {(['square', 'diamond', 'ellipse'] as const).map((shape) => (
                  <button
                    key={shape}
                    onClick={() => setSelectedShape(shape)}
                    className={`p-3 rounded border-2 transition-colors flex items-center justify-center ${
                      selectedShape === shape
                        ? isDarkMode
                          ? 'border-blue-400 bg-blue-900/20 text-blue-400'
                          : 'border-blue-500 bg-blue-50 text-blue-600'
                        : isDarkMode
                          ? 'border-gray-600 hover:border-gray-500 text-gray-400'
                          : 'border-gray-300 hover:border-gray-400 text-gray-600'
                    }`}
                  >
                    <ShapeIcon shape={shape} />
                  </button>
                ))}
              </div>
            </div>

            {/* Width and Opacity section */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-2">Border Width</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    defaultValue="1"
                    className={`w-16 px-2 py-1 text-sm border rounded ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-gray-300' 
                        : 'bg-white border-gray-300 text-gray-700'
                    }`}
                  />
                  <span className="text-sm">pt</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">Opacity</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    defaultValue="100"
                    min="0"
                    max="100"
                    className={`w-16 px-2 py-1 text-sm border rounded ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-gray-300' 
                        : 'bg-white border-gray-300 text-gray-700'
                    }`}
                  />
                  <span className="text-sm">%</span>
                </div>
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
          <div className="space-y-6">
            {/* Node Name */}
            <div>
              <label className="text-sm font-medium block mb-2">Node Name</label>
              <input
                type="text"
                placeholder="Enter node name..."
                className={`w-full px-3 py-2 text-sm border rounded ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-gray-300 placeholder-gray-500' 
                    : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400'
                }`}
              />
            </div>

            {/* Font Family */}
            <div>
              <label className="text-sm font-medium block mb-2">Font</label>
              <select 
                value={selectedFont}
                onChange={(e) => setSelectedFont(e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-gray-300' 
                    : 'bg-white border-gray-300 text-gray-700'
                }`}
              >
                {fonts.map((font) => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            </div>

            {/* Font Style Controls */}
            <div>
              <label className="text-sm font-medium block mb-3">Style</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsBold(!isBold)}
                  className={`p-2 rounded border transition-colors ${
                    isBold
                      ? isDarkMode
                        ? 'border-blue-400 bg-blue-900/20 text-blue-400'
                        : 'border-blue-500 bg-blue-50 text-blue-600'
                      : isDarkMode
                        ? 'border-gray-600 hover:border-gray-500 text-gray-400'
                        : 'border-gray-300 hover:border-gray-400 text-gray-600'
                  }`}
                >
                  <Bold size={16} />
                </button>
                <button
                  onClick={() => setIsItalic(!isItalic)}
                  className={`p-2 rounded border transition-colors ${
                    isItalic
                      ? isDarkMode
                        ? 'border-blue-400 bg-blue-900/20 text-blue-400'
                        : 'border-blue-500 bg-blue-50 text-blue-600'
                      : isDarkMode
                        ? 'border-gray-600 hover:border-gray-500 text-gray-400'
                        : 'border-gray-300 hover:border-gray-400 text-gray-600'
                  }`}
                >
                  <Italic size={16} />
                </button>
              </div>
            </div>

            {/* Font Color */}
            <div>
              <h3 className="text-sm font-medium mb-3">Text Color</h3>
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
                      className="w-8 h-8 rounded cursor-pointer border border-gray-400 hover:scale-110 transition-transform relative group"
                      style={{ backgroundColor: color }}
                      title={`Apply text color ${color} to selected nodes`}
                      onClick={() => handleColorClick(color)}
                    >
                      {/* Hover effect overlay */}
                      <div className="absolute inset-0 bg-white bg-opacity-20 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </div>
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
              <div className="flex justify-center space-x-1">
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

            {/* Selection Status */}
            <div className={`p-3 rounded-lg text-center ${
              isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
            }`}>
              <p className="text-sm">Select nodes to edit text properties</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomizationPanel;