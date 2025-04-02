import { useState, useEffect, useRef } from "react";
import { Music, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import AudioPlayer from "./AudioPlayer";
import EffectControls from "./EffectControls";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Track as TrackType, TrackProgress, Effects } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import { formatFileSize } from "@/lib/audio";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TrackProps {
  track: TrackType;
  isProcessing: boolean;
  onDeleted: () => void;
}

export default function Track({ track, isProcessing, onDeleted }: TrackProps) {
  const [originalProgress, setOriginalProgress] = useState<TrackProgress>({
    currentTime: 0,
    duration: track.duration || 0,
    playing: false
  });
  
  const [lofiProgress, setLofiProgress] = useState<TrackProgress>({
    currentTime: 0,
    duration: track.duration || 0,
    playing: false
  });
  
  const [processingProgress, setProcessingProgress] = useState(0);
  const { toast } = useToast();
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Simulate processing progress for visual feedback
    if (track.status === 'processing' || track.status === 'uploading') {
      const targetProgress = track.status === 'uploading' ? 90 : 95;
      const increment = track.status === 'uploading' ? 15 : 5;
      
      progressInterval.current = setInterval(() => {
        setProcessingProgress(current => {
          if (current >= targetProgress) {
            if (progressInterval.current) {
              clearInterval(progressInterval.current);
            }
            return current;
          }
          return current + increment;
        });
      }, 500);
      
      return () => {
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
        }
      };
    } else {
      setProcessingProgress(100);
    }
  }, [track.status]);
  
  // Reset progress when track changes
  useEffect(() => {
    setProcessingProgress(
      track.status === 'completed' ? 100 : 
      track.status === 'error' ? 0 : 
      track.status === 'processing' ? 50 : 25
    );
  }, [track.id, track.status]);

  const handleDelete = async () => {
    try {
      await apiRequest('DELETE', `/api/tracks/${track.id}`);
      toast({
        title: "Track Deleted",
        description: "The track has been successfully deleted"
      });
      onDeleted();
    } catch (error) {
      toast({
        title: "Deletion Failed",
        description: error instanceof Error ? error.message : "Failed to delete track",
        variant: "destructive"
      });
    }
  };

  const handleDownload = () => {
    if (!track.lofiPath) {
      toast({
        title: "Download Failed",
        description: "Lo-Fi version is not available yet",
        variant: "destructive"
      });
      return;
    }
    
    // Extract filename from path
    const filename = track.lofiPath.split('/').pop();
    const downloadUrl = `/api/audio/${filename}`;
    
    // Create a temporary link to trigger download
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `lofi_${track.originalFilename}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Render based on track status
  if (track.status === 'uploading' || track.status === 'processing') {
    return (
      <motion.div 
        className="bg-gray-800 rounded-xl p-6 mb-6 scale-in"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-shrink-0 w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
            <Music className="h-8 w-8 text-gray-500" />
          </div>
          <div className="flex-grow">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-medium">{track.originalFilename}</h4>
                <p className="text-gray-400 text-sm">
                  {track.originalFilename.split('.').pop()?.toUpperCase()} • {track.duration ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}` : '?:??'} • {formatFileSize(track.fileSize)}
                </p>
              </div>
              <div className="flex items-center space-x-2 mt-2 md:mt-0">
                <span className="text-sm font-medium text-secondary">
                  {track.status === 'uploading' ? 'Uploading' : 'Converting'} ({processingProgress}%)
                </span>
              </div>
            </div>
            <Progress value={processingProgress} className="w-full h-2 animate-pulse" />
          </div>
        </div>
      </motion.div>
    );
  }

  if (track.status === 'error') {
    return (
      <motion.div 
        className="bg-gray-800 rounded-xl p-6 mb-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-shrink-0 w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
            <Music className="h-8 w-8 text-red-500" />
          </div>
          <div className="flex-grow">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-medium fade-in">{track.originalFilename}</h4>
                <p className="text-gray-400 text-sm fade-in" style={{ animationDelay: '0.1s' }}>
                  {track.originalFilename.split('.').pop()?.toUpperCase()} • {formatFileSize(track.fileSize)}
                </p>
              </div>
              <motion.div 
                className="flex items-center space-x-2 mt-2 md:mt-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Badge variant="destructive">Processing Failed</Badge>
              </motion.div>
            </div>
            <motion.div 
              className="text-red-400 text-sm mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              There was an error processing this track. Please try uploading it again.
            </motion.div>
            <motion.div 
              className="flex justify-end"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="scale-in">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete this track and cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </motion.div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Completed track with players
  return (
    <motion.div 
      className="bg-gray-800 rounded-xl p-6 mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
    >
      <div className="flex flex-col md:flex-row md:items-start gap-4">
        <motion.div 
          className="flex-shrink-0 w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <Music className="h-8 w-8 text-primary" />
        </motion.div>
        <div className="flex-grow w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 stagger-fade-in">
            <div>
              <h4 className="text-lg font-medium">{track.originalFilename}</h4>
              <p className="text-gray-400 text-sm">
                {track.originalFilename.split('.').pop()?.toUpperCase()} • {track.duration ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}` : '?:??'} • {formatFileSize(track.fileSize)}
              </p>
            </div>
            <div className="flex items-center space-x-2 mt-2 md:mt-0">
              <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30 fade-in">Completed</Badge>
            </div>
          </div>
          
          {/* Native HTML5 Audio players for better compatibility */}
          <div className="mb-6 space-y-4">
            <div className="p-4 border border-gray-700 rounded-md bg-gray-800/50">
              <h4 className="text-md font-bold mb-3 flex items-center">
                <Music className="h-4 w-4 mr-2 text-primary" /> 
                Original Track
              </h4>
              <audio 
                controls 
                className="w-full" 
                src={`/api/audio/${track.originalPath.split('/').pop()}`}
                preload="metadata"
              >
                Your browser does not support the audio element.
              </audio>
            </div>
            
            {track.lofiPath && (
              <div className="p-4 border border-gray-700 rounded-md bg-gray-800/50">
                <h4 className="text-md font-bold mb-3 flex items-center">
                  <Music className="h-4 w-4 mr-2 text-purple-400" /> 
                  Lo-Fi Version
                </h4>
                <audio 
                  controls 
                  className="w-full" 
                  src={`/api/audio/${track.lofiPath.split('/').pop()}`}
                  preload="metadata"
                >
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
          </div>
          
          <EffectControls 
            track={track}
            onEffectsUpdated={onDeleted}
          />
          
          <motion.div 
            className="flex justify-end gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.3 }}
          >
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="bg-gray-700 hover:bg-gray-600">
                  <Trash2 className="h-5 w-5 mr-1" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="scale-in">
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this track and cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            <Button className="bg-primary hover:bg-primary/90" onClick={handleDownload}>
              <Download className="h-5 w-5 mr-1" />
              Download Lo-Fi
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
