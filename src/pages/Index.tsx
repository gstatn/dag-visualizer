import { useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import FileUploadModal from "@/components/FileUploadModal";

const Index = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Apply dark mode to document
  if (isDarkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Main Layout */}
      <div className="flex h-screen">
        {/* Left Section */}
        <div className={`w-80 border-r transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } p-6 flex flex-col`}>
          <div className="flex-1 flex flex-col justify-center items-center">
            <h2 className="text-xl font-semibold mb-6">Graph Data Tools</h2>
            <Button
              onClick={() => setIsUploadModalOpen(true)}
              className={`w-full py-6 text-lg transition-all duration-200 hover:scale-105 ${
                isDarkMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              Upload Graph Data
            </Button>
          </div>
        </div>

        {/* Right Section - Empty for now */}
        <div className={`flex-1 transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
        } flex items-center justify-center`}>
          <div className="text-center">
            <div className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center ${
              isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-500'
            }`}>
              <div className="w-12 h-12 border-2 border-dashed border-current rounded"></div>
            </div>
            <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Visualization area - ready for your data
            </p>
          </div>
        </div>
      </div>

      {/* Settings Icon - Bottom Left */}
      <div className="fixed bottom-6 left-6">
        <Dialog>
          <DialogTrigger asChild>
            <Button
              size="icon"
              className={`rounded-full shadow-lg transition-all duration-200 hover:scale-110 ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-white hover:bg-gray-100 text-gray-900'
              }`}
            >
              <Settings className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className={`${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <DialogHeader>
              <DialogTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                Settings
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="dark-mode"
                  checked={isDarkMode}
                  onCheckedChange={setIsDarkMode}
                />
                <Label htmlFor="dark-mode" className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                  Dark Mode
                </Label>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* File Upload Modal */}
      <FileUploadModal 
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};

export default Index;
