import { useState, useRef } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Upload, Music, FileAudio, Headphones, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";

interface FileUploadProps {
  onUploadComplete: () => void;
}

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Check file type
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload MP3 or WAV files only",
        variant: "destructive"
      });
      return;
    }
    
    // Check file size (20MB max)
    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 20MB",
        variant: "destructive"
      });
      return;
    }
    
    uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setCurrentFile(file);
    setIsUploading(true);
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append('audioFile', file);
    
    try {
      // Create a custom XMLHttpRequest to track progress
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });
      
      xhr.addEventListener('load', async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          // Upload successful
          setIsUploading(false);
          setCurrentFile(null);
          onUploadComplete();
          toast({
            title: "Upload Successful",
            description: "Your track has been uploaded and is being processed",
          });
        } else {
          // Handle error response
          const errorMessage = xhr.responseText ? JSON.parse(xhr.responseText).message : 'Upload failed';
          throw new Error(errorMessage);
        }
      });
      
      xhr.addEventListener('error', () => {
        throw new Error('Network error occurred');
      });
      
      xhr.open('POST', '/api/tracks/upload');
      xhr.send(formData);
      
    } catch (error) {
      setIsUploading(false);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <motion.div 
      className="mb-14"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <AnimatePresence mode="wait">
        {isUploading ? (
          <motion.div 
            key="uploading"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card rounded-xl p-10 relative overflow-hidden"
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[60px]"></div>
            <div className="absolute bottom-0 left-10 w-40 h-40 bg-secondary/10 rounded-full blur-[80px]"></div>
            
            <div className="flex flex-col items-center relative z-10">
              <motion.div 
                className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-6 glow-primary"
                animate={{ 
                  scale: [1, 1.05, 1],
                  rotate: [0, 5, 0, -5, 0],
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Music className="h-12 w-12 text-primary" />
              </motion.div>
              
              <h3 className="text-2xl font-bold mb-3">Processing Audio</h3>
              <p className="text-gray-300 mb-6 max-w-md text-center">
                <span className="font-medium">{currentFile?.name}</span> is being uploaded and prepared for Lo-Fi transformation
              </p>
              
              <div className="w-full max-w-lg mb-4 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-600/20 rounded-full blur-md"></div>
                <Progress 
                  value={uploadProgress} 
                  className="h-3 rounded-full"
                />
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-base font-medium text-primary">{uploadProgress}%</div>
                <div className="text-sm text-gray-400">
                  {uploadProgress < 100 ? 'Uploading...' : 'Preparing for processing...'}
                </div>
              </div>
              
              {/* Animated upload steps */}
              <div className="mt-8 flex items-center gap-4 text-sm">
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center mr-2">
                    <Check className="h-3 w-3 text-green-500" />
                  </div>
                  <span className="text-gray-300">Upload</span>
                </div>
                <div className="w-10 h-px bg-gray-700"></div>
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded-full ${uploadProgress === 100 ? 'bg-green-500/20' : 'bg-gray-600/30'} flex items-center justify-center mr-2`}>
                    {uploadProgress === 100 ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <span className="text-gray-400 text-xs">2</span>
                    )}
                  </div>
                  <span className="text-gray-400">Process</span>
                </div>
                <div className="w-10 h-px bg-gray-700"></div>
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-gray-600/30 flex items-center justify-center mr-2">
                    <span className="text-gray-400 text-xs">3</span>
                  </div>
                  <span className="text-gray-400">Complete</span>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="dropzone"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`glass-card border-2 border-dashed ${isDragging ? 'border-primary' : 'border-white/10'} rounded-xl p-12 text-center cursor-pointer hover-lift relative overflow-hidden`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            {/* Background elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 to-blue-900/5 z-0"></div>
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-[80px]"></div>
            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-secondary/5 rounded-full blur-[80px]"></div>
            
            {/* Music node decorative elements */}
            <div className="absolute top-6 left-10 opacity-20">
              <FileAudio className="h-10 w-10 text-gray-400" />
            </div>
            <div className="absolute bottom-6 right-10 opacity-20">
              <Headphones className="h-10 w-10 text-gray-400" />
            </div>
            
            <div className="flex flex-col items-center relative z-10">
              <motion.div
                className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6"
                animate={{ 
                  y: [0, -10, 0],
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Upload className="h-12 w-12 text-primary" />
              </motion.div>
              
              <h3 className="text-2xl md:text-3xl font-bold text-gradient mb-3">
                Drop your audio masterpiece
              </h3>
              
              <p className="text-gray-300 text-lg mb-6 max-w-lg">
                Drag & drop your audio files here or click to browse
              </p>
              
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                <span className="px-3 py-1.5 rounded-full bg-white/5 text-xs text-gray-300 border border-white/10">MP3</span>
                <span className="px-3 py-1.5 rounded-full bg-white/5 text-xs text-gray-300 border border-white/10">WAV</span>
                <span className="px-3 py-1.5 rounded-full bg-white/5 text-xs text-gray-300 border border-white/10">Max 20MB</span>
              </div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button className="bg-gradient-to-r from-primary to-secondary text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-primary/20 transition-all">
                  <Music className="h-5 w-5 mr-2" />
                  Select Audio Files
                </Button>
              </motion.div>
              
              <p className="text-gray-500 text-sm mt-6">
                Your tracks are processed securely and never shared
              </p>
              
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept=".mp3,.wav" 
                onChange={(e) => handleFileSelect(e.target.files)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
