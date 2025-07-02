import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, File } from "lucide-react";
// FIXED IMPORTS - Use shared types and utilities
import { GraphData } from '../../shared/types/graph';
import { processFile } from '../../shared/utils/fileProcessors';

// TYPESCRIPT INTERFACES
interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onDataUploaded: (data: GraphData) => void;
}

const FileUploadModal = ({ isOpen, onClose, isDarkMode, onDataUploaded }: FileUploadModalProps) => {
  
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  // SIMPLIFIED Upload handler - now uses shared utility
  const handleUpload = async () => {
    if (selectedFile) {
      setIsProcessing(true);
      setError(null);
      
      try {
        console.log("Processing file:", selectedFile.name, "Size:", selectedFile.size, "Type:", selectedFile.type);
        // Use the shared file processor
        const processedData = await processFile(selectedFile);
        console.log("Processed data:", processedData);
        console.log("Nodes:", processedData.nodes.length, "Edges:", processedData.edges.length);
        
        // Pass the processed data to the parent component
        console.log("Calling onDataUploaded with:", processedData);
        onDataUploaded(processedData);
        
        onClose(); // Close the modal
      } catch (error) {
        console.error("Error processing file:", error);
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
      } finally {
        setIsProcessing(false);
      }
    } else {
      console.warn("No file selected for upload");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-2xl ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <DialogHeader>
          <DialogTitle className={`text-2xl font-bold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Upload Graph Data
          </DialogTitle>
          <p className={`${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Upload your graph data file to visualize your DAG (supports .txt, .json)
          </p>
        </DialogHeader>
        
        <div className="py-6">
          {/* Error display */}
          {error && (
            <div className={`mb-4 p-3 rounded-lg border ${
              isDarkMode 
                ? 'bg-red-900/20 border-red-800 text-red-400' 
                : 'bg-red-50 border-red-200 text-red-600'
            }`}>
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div
            className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200 ${
              dragActive
                ? isDarkMode 
                  ? 'border-blue-400 bg-blue-900/20'
                  : 'border-blue-400 bg-blue-50'
                : isDarkMode
                  ? 'border-gray-600 hover:border-gray-500'
                  : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept=".json,.txt,.xml,.dot,.graphml"
            />
            
            <div className="space-y-4">
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                {selectedFile ? (
                  <File className={`w-8 h-8 ${
                    isDarkMode ? 'text-green-400' : 'text-green-600'
                  }`} />
                ) : (
                  <Upload className={`w-8 h-8 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                )}
              </div>
              
              <div>
                {selectedFile ? (
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
                    </p>
                  </div>
                ) : (
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
              
              <Button
                onClick={handleChooseFile}
                variant="outline"
                disabled={isProcessing}
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

          {selectedFile && (
            <div className="mt-6 flex justify-end space-x-3">
              <Button
                onClick={() => {
                  setSelectedFile(null);
                  setError(null);
                  onClose();
                }}
                variant="outline"
                disabled={isProcessing}
                className={isDarkMode 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }
              >
                Cancel
              </Button>
              
              <Button
                onClick={handleUpload}
                disabled={isProcessing}
                className={`${
                  isDarkMode 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                } transition-colors duration-200`}
              >
                {isProcessing ? 'Processing...' : 'Upload File'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FileUploadModal;