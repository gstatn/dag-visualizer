import { useState, useRef } from "react";              // React hooks for state and references
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"; // Pop-up window components
import { Button } from "@/components/ui/button";       // Button component
import { Upload, File } from "lucide-react";           // Icons for upload and file

// TYPESCRIPT INTERFACE - Defining what props this component expects
interface FileUploadModalProps {
  isOpen: boolean;        // see if modal window is open or closed
  onClose: () => void;    // Function to call when closing the modal
  isDarkMode: boolean;    // dark/light mode
}

// MAIN COMPONENT FUNCTION
const FileUploadModal = ({ isOpen, onClose, isDarkMode }: FileUploadModalProps) => {
  
  // STATE VARIABLES - Things that can change and cause re-renders
  const [dragActive, setDragActive] = useState(false);           // Is user dragging a file over the drop zone?
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // Which file did user select?
  const fileInputRef = useRef<HTMLInputElement>(null);          // Reference to hidden file input element

  // DRAG AND DROP HANDLERS - Functions that run when user drags files
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();        // Stop browser's default drag behavior
    e.stopPropagation();       // Don't let other elements handle this event
    
    // Check what type of drag event happened
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);     // User is dragging over our drop zone - highlight it
    } else if (e.type === "dragleave") {
      setDragActive(false);    // User dragged away - remove highlight
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();        // Stop browser from opening the file
    e.stopPropagation();       // Don't let other elements handle this
    setDragActive(false);      // Remove drag highlighting
    
    // If user dropped a file, save it
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  // FILE SELECTION HANDLER - When user clicks "Choose File" button
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    // If user selected a file, save it
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // TRIGGER FILE PICKER - Opens the file selection dialog
  const handleChooseFile = () => {
    fileInputRef.current?.click();  // Programmatically click the hidden file input
  };

  // UPLOAD HANDLER - What happens when user clicks "Upload"
  const handleUpload = () => {
    if (selectedFile) {
      console.log("Uploading file:", selectedFile.name);  // For now, just log to console
      
      // ****************************************************************************
      // TODO: Here you would use the file to process and visualize data // <-------
      // ****************************************************************************

      onClose();                 // Close the modal
      setSelectedFile(null);     // Clear the selected file
    }
  };

  // RENDER THE COMPONENT - What gets shown on screen
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* Pop-up window that appears over everything else */}
      
      <DialogContent className={`max-w-2xl ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        {/* Content area with conditional dark/light styling */}
        
        <DialogHeader>
          {/* Modal title section */}
          <DialogTitle className={`text-2xl font-bold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Upload Graph Data
          </DialogTitle>
          <p className={`${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Upload your graph data file to visualize your DAG 
          </p>
        </DialogHeader>
        
        <div className="py-6">
          {/* FILE DROP ZONE - The big area where users can drag/drop files */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200 ${
              dragActive
                ? isDarkMode 
                  ? 'border-blue-400 bg-blue-900/20'    // Highlighted when dragging (dark mode)
                  : 'border-blue-400 bg-blue-50'        // Highlighted when dragging (light mode)
                : isDarkMode
                  ? 'border-gray-600 hover:border-gray-500'  // Normal state (dark mode)
                  : 'border-gray-300 hover:border-gray-400'  // Normal state (light mode)
            }`}
            onDragEnter={handleDrag}    // User starts dragging over
            onDragLeave={handleDrag}    // User drags away
            onDragOver={handleDrag}     // User is dragging over
            onDrop={handleDrop}         // User drops the file
          >
            {/* HIDDEN FILE INPUT - Invisible but functional file picker */}
            <input
              ref={fileInputRef}              // Reference so we can trigger it
              type="file"                     // File input type
              className="hidden"              // Make it invisible
              onChange={handleFileSelect}     // What to do when file is selected
              accept=".json,.csv,.txt,.xml"   // Only allow these file types
            />
            
            <div className="space-y-4">
              {/* ICON SECTION - Shows upload icon or file icon */}
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                {selectedFile ? (
                  // If file is selected, show file icon in green
                  <File className={`w-8 h-8 ${
                    isDarkMode ? 'text-green-400' : 'text-green-600'
                  }`} />
                ) : (
                  // If no file, show upload icon
                  <Upload className={`w-8 h-8 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                )}
              </div>
              
              {/* TEXT SECTION - Shows different text based on whether file is selected */}
              <div>
                {selectedFile ? (
                  // Show file info when file is selected
                  <div>
                    <p className={`text-lg font-medium ${
                      isDarkMode ? 'text-green-400' : 'text-green-600'
                    }`}>
                      File Selected: {selectedFile.name}
                    </p>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Size: {(selectedFile.size / 1024).toFixed(2)} KB
                      {/* Convert bytes to KB and round to 2 decimal places */}
                    </p>
                  </div>
                ) : (
                  // Show instructions when no file selected
                  <div>
                    <p className={`text-lg font-medium mb-2 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Drop your file here
                    </p>
                    <p className={`${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Or click to browse and select a file
                    </p>
                  </div>
                )}
              </div>
              
              {/* CHOOSE FILE BUTTON - Triggers the hidden file input */}
              <Button
                onClick={handleChooseFile}      // Open file picker when clicked
                variant="outline"               // Outlined button style
                className={`transition-colors duration-200 ${
                  isDarkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Choose File
              </Button>
            </div>
          </div>

          {/* UPLOAD BUTTON SECTION - Only shows when file is selected */}
          {selectedFile && (
            <div className="mt-6 flex justify-end space-x-3">
              {/* CANCEL BUTTON */}
              <Button
                onClick={() => {
                  setSelectedFile(null);    // Clear selected file
                  onClose();                // Close modal
                }}
                variant="outline"
                className={isDarkMode 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }
              >
                Cancel
              </Button>
              
              {/* UPLOAD BUTTON */}
              <Button
                onClick={handleUpload}        // Actually upload the file
                className={`${
                  isDarkMode 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                } transition-colors duration-200`}
              >
                Upload File
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// EXPORT - Make this component available to other files
export default FileUploadModal;