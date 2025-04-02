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
      <div className="bg-gray-800 rounded-xl p-6 mb-6">
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
            <Progress value={processingProgress} className="w-full h-2" />
          </div>
        </div>
      </div>
    );
  }

  if (track.status === 'error') {
    return (
      <div className="bg-gray-800 rounded-xl p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-shrink-0 w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
            <Music className="h-8 w-8 text-red-500" />
          </div>
          <div className="flex-grow">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-medium">{track.originalFilename}</h4>
                <p className="text-gray-400 text-sm">
                  {track.originalFilename.split('.').pop()?.toUpperCase()} • {formatFileSize(track.fileSize)}
                </p>
              </div>
              <div className="flex items-center space-x-2 mt-2 md:mt-0">
                <Badge variant="destructive">Processing Failed</Badge>
              </div>
            </div>
            <div className="text-red-400 text-sm mb-4">
              There was an error processing this track. Please try uploading it again.
            </div>
            <div className="flex justify-end">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
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
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Completed track with players
  return (
    <div className="bg-gray-800 rounded-xl p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-start gap-4">
        <div className="flex-shrink-0 w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
          <Music className="h-8 w-8 text-primary" />
        </div>
        <div className="flex-grow w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-medium">{track.originalFilename}</h4>
              <p className="text-gray-400 text-sm">
                {track.originalFilename.split('.').pop()?.toUpperCase()} • {track.duration ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}` : '?:??'} • {formatFileSize(track.fileSize)}
              </p>
            </div>
            <div className="flex items-center space-x-2 mt-2 md:mt-0">
              <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30">Completed</Badge>
            </div>
          </div>
          
          <AudioPlayer 
            track={track}
            originalProgress={originalProgress}
            lofiProgress={lofiProgress}
            setOriginalProgress={setOriginalProgress}
            setLofiProgress={setLofiProgress}
          />
          
          <EffectControls 
            track={track}
            onEffectsUpdated={onDeleted}
          />
          
          <div className="flex justify-end gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="bg-gray-700 hover:bg-gray-600">
                  <Trash2 className="h-5 w-5 mr-1" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
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
          </div>
        </div>
      </div>
    </div>
  );
}
