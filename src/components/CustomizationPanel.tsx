import { useState, useCallback, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Square, Diamond, Circle, Bold, Italic, ChevronDown, ChevronUp, RectangleHorizonta } from 'lucide-react';

/**
 * Sidebar panel for customizing node styles and text.
 * - Keeps comments simple and adds consistent indentation.
 */
interface CustomizationPanelProps {
  isOpen: boolean; // show/hide the panel
  onClose: () => void; // close panel callback
  isDarkMode: boolean; // theme toggle
  onColorChange?: (color: string) => void; // apply fill color to nodes
  onBorderChange?: (borderColor: string, borderWidth: number) => void; // apply border changes
  onShapeChange?: (shape: 'circle' | 'rectangle' | 'diamond' | 'ellipse' | 'square') => void; // apply shape
  onResetNodes?: () => void; // reset selected nodes to defaults
}

const CustomizationPanel: React.FC<CustomizationPanelProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  onColorChange,
  onBorderChange,
  onShapeChange,
  onResetNodes
}) => {
  // Debug: quick visibility into which props are connected
  useEffect(() => {
    console.log('CustomizationPanel: Received props:', {
      isOpen,
      onColorChange: !!onColorChange,
      onBorderChange: !!onBorderChange,
      onShapeChange: !!onShapeChange,
      onResetNodes: !!onResetNodes
    });
  }, [isOpen, onColorChange, onBorderChange, onShapeChange, onResetNodes]);

  // ----- Local UI state -----
  const [activeTab, setActiveTab] = useState<'Style' | 'Text'>('Style');
  const [currentColorPage, setCurrentColorPage] = useState(0);
  const [selectedShape, setSelectedShape] = useState<'circle' | 'rectangle' | 'diamond' | 'ellipse' | 'square'>('circle');

  // Text controls
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [selectedFont, setSelectedFont] = useState('Arial');

  // ----- Theme-based defaults -----
  const getDefaultNodeColor = useCallback(() => (isDarkMode ? '#3B82F6' : '#2563EB'), [isDarkMode]);
  const getDefaultBorderColor = useCallback(() => (isDarkMode ? '#1E40AF' : '#1D4ED8'), [isDarkMode]);

  // Colors & border
  const [customNodeColor, setCustomNodeColor] = useState(() => (isDarkMode ? '#3B82F6' : '#2563EB'));
  const [customBorderColor, setCustomBorderColor] = useState(() => (isDarkMode ? '#1E40AF' : '#1D4ED8'));
  const [borderWidth, setBorderWidth] = useState(2);

  // Dropdown open/closed states
  const [nodeColorOpen, setNodeColorOpen] = useState(true);
  const [borderOpen, setBorderOpen] = useState(true);
  const [shapeOpen, setShapeOpen] = useState(true);
  const [opacityOpen, setOpacityOpen] = useState(true);

  // When theme flips, refresh default colors
  useEffect(() => {
    setCustomNodeColor(getDefaultNodeColor());
    setCustomBorderColor(getDefaultBorderColor());
  }, [isDarkMode, getDefaultNodeColor, getDefaultBorderColor]);

  // Simple color pages like draw.io
  const colorPages = [
    ['#2C2C2C', '#82B366', '#6AC25A', '#5B9BD5', '#4A90E2', '#9C5AE2', '#E25A9C', '#E2675A'],
    ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'],
    ['#34495E', '#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C', '#E67E22']
  ];

  // Font choices for text tab
  const fonts = ['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana', 'Roboto', 'Open Sans'];

  // Tab labels
  const tabs = ['Style', 'Text'] as const;

  /**
   * Small helper: show an icon for the chosen shape.
   */
  const ShapeIcon = ({ shape }: { shape: 'circle' | 'rectangle' | 'diamond' | 'ellipse' | 'square' }) => {
    switch (shape) {
      case 'circle':
        return <Circle size={16} />;
      case 'rectangle':
        return <RectangleHorizontal size={16} />;
      case 'diamond':
        return <Diamond size={16} />;
      case 'ellipse':
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <ellipse cx="8" cy="8" rx="6" ry="4" />
          </svg>
        );
      case 'square':
        return <Square size={16} />;
    }
  };

  /**
   * Quick check for valid CSS color strings.
   */
  const isValidColor = (color: string): boolean => {
    const tempElement = document.createElement('div');
    tempElement.style.color = color;
    return tempElement.style.color !== '';
  };

  /**
   * Apply node fill color.
   */
  const handleNodeColorClick = (color: string) => {
    console.log('Node color clicked:', color);

    if (!isValidColor(color)) {
      alert('Invalid color format. Please use hex (#FF0000), rgb(255,0,0), or color names.');
      return;
    }

    setCustomNodeColor(color);
    onColorChange?.(color);
  };

  /**
   * Apply border color/width together.
   */
  const handleBorderChange = (borderColor?: string, width?: number) => {
    const finalBorderColor = borderColor || customBorderColor;
    const finalWidth = width !== undefined ? width : borderWidth;

    console.log('Border change called:', finalBorderColor, finalWidth);

    if (!isValidColor(finalBorderColor)) {
      alert('Invalid border color format.');
      return;
    }

    if (onBorderChange) {
      console.log('Calling onBorderChange with:', finalBorderColor, finalWidth);
      onBorderChange(finalBorderColor, finalWidth);
    } else {
      console.log('onBorderChange prop is not available');
    }
  };

  /**
   * Apply shape change to selected nodes.
   */
  const handleShapeClick = (shape: 'circle' | 'rectangle' | 'diamond' | 'ellipse' | 'square') => {
    console.log('CustomizationPanel: Shape button clicked:', shape);
    console.log('CustomizationPanel: onShapeChange function available:', !!onShapeChange);

    setSelectedShape(shape);

    if (onShapeChange) {
      console.log('CustomizationPanel: Calling onShapeChange with shape:', shape);
      try {
        onShapeChange(shape);
        console.log('CustomizationPanel: onShapeChange call completed successfully');
      } catch (error) {
        console.error('CustomizationPanel: Error calling onShapeChange:', error);
      }
    } else {
      console.log('CustomizationPanel: onShapeChange prop is not available');
      alert('Shape change function is not available. Please check the connection between components.');
    }
  };

  /**
   * Update border color from text input (live apply if valid).
   */
  const handleBorderColorInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newColor = e.target.value;
      setCustomBorderColor(newColor);
      if (onBorderChange && isValidColor(newColor)) onBorderChange(newColor, borderWidth);
    },
    [borderWidth, onBorderChange]
  );

  /**
   * Update border width (live apply).
   */
  const handleBorderWidthChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const numValue = parseInt(value) || 0;
      setBorderWidth(numValue);
      if (onBorderChange && numValue >= 0) onBorderChange(customBorderColor, numValue);
    },
    [customBorderColor, onBorderChange]
  );

  /**
   * Update node color from text input (live apply if valid).
   */
  const handleCustomNodeColorInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newColor = e.target.value;
      setCustomNodeColor(newColor);
      if (onColorChange && isValidColor(newColor)) onColorChange(newColor);
    },
    [onColorChange]
  );

  /**
   * Update node color from color picker.
   */
  const handleNodeColorPickerChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newColor = e.target.value;
      setCustomNodeColor(newColor);
      onColorChange?.(newColor);
    },
    [onColorChange]
  );

  /**
   * Update border color from color picker.
   */
  const handleBorderColorPickerChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newColor = e.target.value;
      setCustomBorderColor(newColor);
      onBorderChange?.(newColor, borderWidth);
    },
    [borderWidth, onBorderChange]
  );

  /**
   * Generic collapsible section used across the panel.
   */
  const DropdownSection = ({
    title,
    isOpen,
    onToggle,
    children
  }: {
    title: string;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
  }) => (
    <div className={`border rounded-lg ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-3 text-left font-medium transition-colors ${
          isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
        }`}
      >
        <span>{title}</span>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {isOpen && <div className={`p-3 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>{children}</div>}
    </div>
  );

  // If panel is closed, render nothing
  if (!isOpen) return null;

  return (
    <div
      className={`fixed top-0 right-0 h-full w-80 z-50 border-l transition-all duration-300 ${
        isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
      } shadow-xl`}
    >
      {/* ----- Header / Tabs ----- */}
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

        {/* Tabs */}
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

      {/* ----- Body ----- */}
      <div className="p-4 h-full overflow-y-auto space-y-4">
        {/* Reset all styles on selected nodes */}
        <button
          onClick={() => onResetNodes && onResetNodes()}
          className={`w-full py-2 px-3 text-sm rounded transition-colors ${
            isDarkMode ? 'bg-gray-600 text-white hover:bg-gray-700' : 'bg-gray-500 text-white hover:bg-gray-600'
          }`}
        >
          Reset to Original Style
        </button>

        {/* ----- Style Tab ----- */}
        {activeTab === 'Style' && (
          <>
            {/* Node Color */}
            <DropdownSection title="Node Color" isOpen={nodeColorOpen} onToggle={() => setNodeColorOpen(!nodeColorOpen)}>
              <div className="space-y-4">
                {/* Swatch pager */}
                <div className="flex items-center justify-between">
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

                  {/* Swatches */}
                  <div className="grid grid-cols-4 gap-2 mx-4">
                    {colorPages[currentColorPage].map((color, index) => (
                      <div
                        key={index}
                        className="w-8 h-8 rounded cursor-pointer border border-gray-400 hover:scale-110 transition-transform relative group"
                        style={{ backgroundColor: color }}
                        title={`Apply color ${color} to selected nodes`}
                        onClick={() => handleNodeColorClick(color)}
                      >
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

                {/* Page dots */}
                <div className="flex justify-center space-x-1">
                  {colorPages.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full cursor-pointer transition-colors ${
                        index === currentColorPage ? (isDarkMode ? 'bg-blue-400' : 'bg-blue-500') : isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                      }`}
                      onClick={() => setCurrentColorPage(index)}
                    />
                  ))}
                </div>

                {/* Custom color input/picker */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Custom Color</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={customNodeColor}
                      onChange={handleNodeColorPickerChange}
                      className="w-10 h-10 rounded border border-gray-400 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={customNodeColor}
                      onChange={handleCustomNodeColorInputChange}
                      placeholder="#3B82F6"
                      className={`flex-1 min-w-0 px-2 py-2 text-sm border rounded ${
                        isDarkMode ? 'bg-gray-800 border-gray-600 text-gray-300' : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    />
                    <button
                      onClick={() => handleNodeColorClick(customNodeColor)}
                      className={`px-3 py-2 text-sm rounded transition-colors ${
                        isDarkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </DropdownSection>

            {/* Border */}
            <DropdownSection title="Border" isOpen={borderOpen} onToggle={() => setBorderOpen(!borderOpen)}>
              <div className="space-y-4">
                {/* Border color */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Border Color</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={customBorderColor}
                      onChange={handleBorderColorPickerChange}
                      className="w-16 h-10 rounded border border-gray-400 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={customBorderColor}
                      onChange={handleBorderColorInputChange}
                      placeholder="#1E40AF"
                      className={`flex-1 px-2 py-2 text-sm border rounded ${
                        isDarkMode ? 'bg-gray-800 border-gray-600 text-gray-300' : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    />
                  </div>
                </div>

                {/* Border width */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Border Width</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={borderWidth}
                      onChange={handleBorderWidthChange}
                      min="0"
                      max="20"
                      className={`w-20 px-2 py-2 text-sm border rounded ${
                        isDarkMode ? 'bg-gray-800 border-gray-600 text-gray-300' : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    />
                    <span className="text-sm">px</span>
                  </div>
                </div>
              </div>
            </DropdownSection>

            {/* Shape */}
            <DropdownSection title="Shape" isOpen={shapeOpen} onToggle={() => setShapeOpen(!shapeOpen)}>
              <div className="space-y-3">
                {/* First row: 3 shapes */}
                <div className="grid grid-cols-3 gap-2">
                  {(['circle', 'rectangle', 'diamond'] as const).map((shape) => (
                    <button
                      key={shape}
                      onClick={() => {
                        console.log(`🔵 Shape button clicked: ${shape}`);
                        handleShapeClick(shape);
                      }}
                      className={`p-3 rounded border-2 transition-all duration-200 flex items-center justify-center hover:scale-105 ${
                        selectedShape === shape
                          ? isDarkMode
                            ? 'border-blue-400 bg-blue-900/30 text-blue-400 shadow-lg'
                            : 'border-blue-500 bg-blue-50 text-blue-600 shadow-lg'
                          : isDarkMode
                          ? 'border-gray-600 hover:border-gray-500 text-gray-400 hover:bg-gray-800'
                          : 'border-gray-300 hover:border-gray-400 text-gray-600 hover:bg-gray-50'
                      }`}
                      title={`Change selected nodes to ${shape} shape`}
                    >
                      <ShapeIcon shape={shape} />
                    </button>
                  ))}
                </div>

                {/* Second row: 2 shapes */}
                <div className="flex justify-center">
                  <div className="grid grid-cols-2 gap-2 w-2/3">
                    {(['ellipse', 'square'] as const).map((shape) => (
                      <button
                        key={shape}
                        onClick={() => {
                          console.log(`🔵 Shape button clicked: ${shape}`);
                          handleShapeClick(shape);
                        }}
                        className={`p-3 rounded border-2 transition-all duration-200 flex items-center justify-center hover:scale-105 ${
                          selectedShape === shape
                            ? isDarkMode
                              ? 'border-blue-400 bg-blue-900/30 text-blue-400 shadow-lg'
                              : 'border-blue-500 bg-blue-50 text-blue-600 shadow-lg'
                            : isDarkMode
                            ? 'border-gray-600 hover:border-gray-500 text-gray-400 hover:bg-gray-800'
                            : 'border-gray-300 hover:border-gray-400 text-gray-600 hover:bg-gray-50'
                        }`}
                        title={`Change selected nodes to ${shape} shape`}
                      >
                        <ShapeIcon shape={shape} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Current selection info */}
                <div className={`text-center text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Currently selected: <span className="font-semibold capitalize">{selectedShape}</span>
                </div>
              </div>
            </DropdownSection>

            {/* Opacity (UI stub; wire to graph lib if needed) */}
            <DropdownSection title="Opacity" isOpen={opacityOpen} onToggle={() => setOpacityOpen(!opacityOpen)}>
              <div className="space-y-2">
                <label className="text-sm font-medium">Node Opacity</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    defaultValue="100"
                    min="0"
                    max="100"
                    className={`w-20 px-2 py-1 text-sm border rounded ${
                      isDarkMode ? 'bg-gray-800 border-gray-600 text-gray-300' : 'bg-white border-gray-300 text-gray-700'
                    }`}
                  />
                  <span className="text-sm">%</span>
                </div>
              </div>
            </DropdownSection>
          </>
        )}

        {/* ----- Text Tab ----- */}
        {activeTab === 'Text' && (
          <>
            {/* Small hint area */}
            <div
              className={`p-3 rounded-lg text-center text-sm ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}
            >
              <p>Select nodes to edit text properties</p>
            </div>

            {/* Node Name (bind this to selection state if needed) */}
            <DropdownSection title="Node Name" isOpen={true} onToggle={() => {}}>
              <input
                type="text"
                placeholder="Enter node name..."
                className={`w-full px-3 py-2 text-sm border rounded ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-600 text-gray-300 placeholder-gray-500'
                    : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400'
                }`}
              />
            </DropdownSection>

            {/* Font and basic styles */}
            <DropdownSection title="Font" isOpen={true} onToggle={() => {}}>
              <div className="space-y-4">
                {/* Family */}
                <div>
                  <label className="text-sm font-medium block mb-2">Font Family</label>
                  <select
                    value={selectedFont}
                    onChange={(e) => setSelectedFont(e.target.value)}
                    className={`w-full px-3 py-2 text-sm border rounded ${
                      isDarkMode ? 'bg-gray-800 border-gray-600 text-gray-300' : 'bg-white border-gray-300 text-gray-700'
                    }`}
                  >
                    {fonts.map((font) => (
                      <option key={font} value={font}>
                        {font}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bold / Italic toggles (hook these to graph text style) */}
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
              </div>
            </DropdownSection>
          </>
        )}
      </div>
    </div>
  );
};

export default CustomizationPanel;
