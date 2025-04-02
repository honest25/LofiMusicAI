import { useState } from "react";
import Header from "@/components/Header";
import FileUpload from "@/components/FileUpload";
import TrackList from "@/components/TrackList";
import InfoSection from "@/components/InfoSection";
import Footer from "@/components/Footer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Track } from "@/lib/types";

export default function Home() {
  const queryClient = useQueryClient();
  
  // Fetch all tracks
  const { data: tracks, isLoading, error } = useQuery<Track[]>({
    queryKey: ['/api/tracks'],
  });

  // For manual refresh
  const refreshTracks = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/tracks'] });
  };

  return (
    <div className="bg-darkbg text-white font-sans min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8 min-h-screen flex flex-col">
        <Header />
        
        <FileUpload onUploadComplete={refreshTracks} />
        
        <TrackList 
          tracks={tracks || []} 
          isLoading={isLoading} 
          error={error ? String(error) : undefined} 
          onTrackDeleted={refreshTracks}
        />
        
        <InfoSection />
        
        <Footer />
      </div>
    </div>
  );
}
