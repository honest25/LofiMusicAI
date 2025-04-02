import { useState, useEffect } from "react";
import Track from "./Track";
import { Track as TrackType } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";

interface TrackListProps {
  tracks: TrackType[];
  isLoading: boolean;
  error?: string;
  onTrackDeleted: () => void;
}

export default function TrackList({ tracks, isLoading, error, onTrackDeleted }: TrackListProps) {
  const [processingTracks, setProcessingTracks] = useState<Set<number>>(new Set());
  const queryClient = useQueryClient();
  
  // Poll for updates on processing tracks
  useEffect(() => {
    const processingIds = tracks
      .filter(track => track.status === 'uploading' || track.status === 'processing')
      .map(track => track.id);
    
    setProcessingTracks(new Set(processingIds));
    
    if (processingIds.length > 0) {
      const interval = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/tracks'] });
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [tracks, queryClient]);

  if (isLoading) {
    return (
      <div className="mb-10">
        <h3 className="text-xl font-semibold mb-4">Your Tracks</h3>
        {[1, 2].map(i => (
          <div key={i} className="bg-gray-800 rounded-xl p-6 mb-6">
            <div className="flex gap-4">
              <Skeleton className="h-16 w-16 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-32 mb-4" />
                <Skeleton className="h-32 w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-10">
        <h3 className="text-xl font-semibold mb-4">Your Tracks</h3>
        <div className="bg-red-900/20 border border-red-700 text-red-100 p-4 rounded-lg">
          <p>Failed to load tracks: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-10" id="tracks-container">
      <h3 className="text-xl font-semibold mb-4">Your Tracks</h3>
      
      {tracks.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p>No tracks uploaded yet. Upload your first track to get started!</p>
        </div>
      ) : (
        tracks.map(track => (
          <Track 
            key={track.id} 
            track={track} 
            isProcessing={processingTracks.has(track.id)}
            onDeleted={onTrackDeleted}
          />
        ))
      )}
    </div>
  );
}
