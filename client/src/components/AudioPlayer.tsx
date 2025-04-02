import { useEffect, useState, useRef } from "react";
import { Play, Pause, Music, Headphones, Disc3, Volume2, VolumeX, SkipBack, SkipForward } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Track, TrackProgress } from "@/lib/types";
import { getAudioInstance, togglePlay, pauseAllExcept, removeAudioInstance, formatTime } from "@/lib/audio";
import { motion, AnimatePresence } from "framer-motion";

interface AudioPlayerProps {
  track: Track;
  originalProgress: TrackProgress;
  lofiProgress: TrackProgress;
  setOriginalProgress: (progress: TrackProgress) => void;
  setLofiProgress: (progress: TrackProgress) => void;
}

export default function AudioPlayer({ 
  track, 
  originalProgress, 
  lofiProgress, 
  setOriginalProgress, 
  setLofiProgress 
}: AudioPlayerProps) {
  const originalIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lofiIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [activeTrack, setActiveTrack] = useState<'original' | 'lofi'>('lofi');
  const [isHoveringSeek, setIsHoveringSeek] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);
  
  // Generate audio IDs
  const originalAudioId = `original_${track.id}`;
  const lofiAudioId = `lofi_${track.id}`;
  
  // Get file paths from track
  const originalPath = `/api/audio/${track.originalPath.split('/').pop()}`;
  const lofiPath = track.lofiPath ? `/api/audio/${track.lofiPath.split('/').pop()}` : '';
  
  // Setup audio instances
  useEffect(() => {
    if (originalPath) {
      const originalInstance = getAudioInstance(originalAudioId, originalPath);
      
      originalInstance.howl?.on('load', () => {
        setOriginalProgress(prev => ({
          ...prev,
          duration: originalInstance.howl?.duration() || 0
        }));
      });
      
      originalInstance.howl?.on('play', () => {
        startOriginalProgressInterval();
        setOriginalProgress(prev => ({ ...prev, playing: true }));
      });
      
      originalInstance.howl?.on('pause', () => {
        stopOriginalProgressInterval();
        setOriginalProgress(prev => ({ ...prev, playing: false }));
      });
      
      originalInstance.howl?.on('stop', () => {
        stopOriginalProgressInterval();
        setOriginalProgress(prev => ({ 
          ...prev, 
          playing: false,
          currentTime: 0
        }));
      });
      
      originalInstance.howl?.on('end', () => {
        stopOriginalProgressInterval();
        setOriginalProgress(prev => ({ 
          ...prev, 
          playing: false,
          currentTime: 0
        }));
      });

      // Set volume
      if (originalInstance.howl) {
        originalInstance.howl.volume(volume);
        originalInstance.howl.mute(isMuted);
      }
    }
    
    if (lofiPath) {
      const lofiInstance = getAudioInstance(lofiAudioId, lofiPath);
      
      lofiInstance.howl?.on('load', () => {
        setLofiProgress(prev => ({
          ...prev,
          duration: lofiInstance.howl?.duration() || 0
        }));
      });
      
      lofiInstance.howl?.on('play', () => {
        startLofiProgressInterval();
        setLofiProgress(prev => ({ ...prev, playing: true }));
      });
      
      lofiInstance.howl?.on('pause', () => {
        stopLofiProgressInterval();
        setLofiProgress(prev => ({ ...prev, playing: false }));
      });
      
      lofiInstance.howl?.on('stop', () => {
        stopLofiProgressInterval();
        setLofiProgress(prev => ({ 
          ...prev, 
          playing: false,
          currentTime: 0
        }));
      });
      
      lofiInstance.howl?.on('end', () => {
        stopLofiProgressInterval();
        setLofiProgress(prev => ({ 
          ...prev, 
          playing: false,
          currentTime: 0
        }));
      });

      // Set volume
      if (lofiInstance.howl) {
        lofiInstance.howl.volume(volume);
        lofiInstance.howl.mute(isMuted);
      }
    }
    
    return () => {
      stopOriginalProgressInterval();
      stopLofiProgressInterval();
      removeAudioInstance(originalAudioId);
      if (lofiPath) removeAudioInstance(lofiAudioId);
    };
  }, [originalPath, lofiPath, track.id]);
  
  // Start interval to update original track progress
  const startOriginalProgressInterval = () => {
    stopOriginalProgressInterval();
    
    originalIntervalRef.current = setInterval(() => {
      const instance = getAudioInstance(originalAudioId, originalPath);
      if (instance.howl && instance.playing) {
        setOriginalProgress(prev => ({
          ...prev,
          currentTime: instance.howl?.seek() || 0
        }));
      }
    }, 100);
  };
  
  // Stop interval for original track progress
  const stopOriginalProgressInterval = () => {
    if (originalIntervalRef.current) {
      clearInterval(originalIntervalRef.current);
      originalIntervalRef.current = null;
    }
  };
  
  // Start interval to update lofi track progress
  const startLofiProgressInterval = () => {
    stopLofiProgressInterval();
    
    lofiIntervalRef.current = setInterval(() => {
      const instance = getAudioInstance(lofiAudioId, lofiPath);
      if (instance.howl && instance.playing) {
        setLofiProgress(prev => ({
          ...prev,
          currentTime: instance.howl?.seek() || 0
        }));
      }
    }, 100);
  };
  
  // Stop interval for lofi track progress
  const stopLofiProgressInterval = () => {
    if (lofiIntervalRef.current) {
      clearInterval(lofiIntervalRef.current);
      lofiIntervalRef.current = null;
    }
  };
  
  // Toggle playback based on active track
  const togglePlayback = () => {
    if (activeTrack === 'original') {
      toggleOriginalPlayback();
    } else {
      toggleLofiPlayback();
    }
  };
  
  // Toggle original track playback
  const toggleOriginalPlayback = () => {
    const isPlaying = togglePlay(originalAudioId);
    setOriginalProgress(prev => ({ ...prev, playing: isPlaying }));
    
    if (isPlaying) {
      pauseLofi();
    }
  };
  
  // Toggle lofi track playback
  const toggleLofiPlayback = () => {
    if (!lofiPath) return;
    
    const isPlaying = togglePlay(lofiAudioId);
    setLofiProgress(prev => ({ ...prev, playing: isPlaying }));
    
    if (isPlaying) {
      pauseOriginal();
    }
  };

  // Pause original track
  const pauseOriginal = () => {
    const instance = getAudioInstance(originalAudioId, originalPath);
    if (instance.howl && instance.playing) {
      instance.howl.pause();
      setOriginalProgress(prev => ({ ...prev, playing: false }));
    }
  };

  // Pause lofi track
  const pauseLofi = () => {
    if (!lofiPath) return;
    
    const instance = getAudioInstance(lofiAudioId, lofiPath);
    if (instance.howl && instance.playing) {
      instance.howl.pause();
      setLofiProgress(prev => ({ ...prev, playing: false }));
    }
  };
  
  // Switch between original and lofi track
  const switchTrack = (trackType: 'original' | 'lofi') => {
    if (trackType === activeTrack) return;
    
    setActiveTrack(trackType);
    
    // Auto-play the selected track if the other one was playing
    if (trackType === 'original' && lofiProgress.playing) {
      pauseLofi();
      toggleOriginalPlayback();
    } else if (trackType === 'lofi' && originalProgress.playing) {
      pauseOriginal();
      toggleLofiPlayback();
    }
  };
  
  // Handle seek based on active track
  const handleSeek = (value: number[]) => {
    if (activeTrack === 'original') {
      handleOriginalSeek(value);
    } else {
      handleLofiSeek(value);
    }
  };
  
  // Handle original track seek
  const handleOriginalSeek = (value: number[]) => {
    const seekTime = value[0];
    const instance = getAudioInstance(originalAudioId, originalPath);
    
    if (instance.howl) {
      instance.howl.seek(seekTime);
      setOriginalProgress(prev => ({ ...prev, currentTime: seekTime }));
    }
  };
  
  // Handle lofi track seek
  const handleLofiSeek = (value: number[]) => {
    if (!lofiPath) return;
    
    const seekTime = value[0];
    const instance = getAudioInstance(lofiAudioId, lofiPath);
    
    if (instance.howl) {
      instance.howl.seek(seekTime);
      setLofiProgress(prev => ({ ...prev, currentTime: seekTime }));
    }
  };

  // Handle direct click on progress bar
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    
    const currentDuration = activeTrack === 'original' 
      ? originalProgress.duration 
      : lofiProgress.duration;
      
    if (!currentDuration) return;
    
    const newTime = clickPosition * currentDuration;
    handleSeek([newTime]);
  };

  // Handle volume change
  const handleVolumeChange = (newVolume: number[]) => {
    const volumeValue = newVolume[0];
    setVolume(volumeValue);
    
    const originalInstance = getAudioInstance(originalAudioId, originalPath);
    if (originalInstance.howl) {
      originalInstance.howl.volume(volumeValue);
    }
    
    if (lofiPath) {
      const lofiInstance = getAudioInstance(lofiAudioId, lofiPath);
      if (lofiInstance.howl) {
        lofiInstance.howl.volume(volumeValue);
      }
    }
    
    if (volumeValue === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };
  
  // Toggle mute
  const handleMuteToggle = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    
    const originalInstance = getAudioInstance(originalAudioId, originalPath);
    if (originalInstance.howl) {
      originalInstance.howl.mute(newMuteState);
    }
    
    if (lofiPath) {
      const lofiInstance = getAudioInstance(lofiAudioId, lofiPath);
      if (lofiInstance.howl) {
        lofiInstance.howl.mute(newMuteState);
      }
    }
  };
  
  // Skip forward/back 10 seconds
  const handleSkip = (seconds: number) => {
    const currentProgress = activeTrack === 'original' ? originalProgress : lofiProgress;
    const currentTime = currentProgress.currentTime;
    const duration = currentProgress.duration || 0;
    
    let newTime = currentTime + seconds;
    newTime = Math.max(0, Math.min(newTime, duration));
    
    handleSeek([newTime]);
  };
  
  // Get current progress and status based on active track
  const currentProgress = activeTrack === 'original' ? originalProgress : lofiProgress;
  const progressPercentage = currentProgress.duration ? (currentProgress.currentTime / currentProgress.duration) * 100 : 0;
  const isPlaying = currentProgress.playing;
  
  // Generate waveform data points for visual effect
  const waveformPoints = Array.from({ length: 40 }, (_, i) => {
    // Generate a pseudo-random height based on index and current time for visual effect
    const seed = (currentProgress.currentTime + i) % 10;
    const height = 10 + Math.sin(seed * (i * 0.2)) * 10;
    return Math.abs(height) % 30;
  });
  
  return (
    <motion.div 
      className="mt-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="glass-card rounded-xl p-6 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-[80px]"></div>
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-secondary/5 rounded-full blur-[80px]"></div>
        
        {/* Vinyl record animation that spins when playing */}
        <AnimatePresence>
          {isPlaying && (
            <motion.div 
              className="absolute -right-16 top-1/2 transform -translate-y-1/2 opacity-10"
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: "linear"
              }}
            >
              <div className="w-36 h-36 rounded-full border-8 border-gray-300">
                <div className="w-full h-full rounded-full border-2 border-gray-300 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-gray-300"></div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 relative z-10">
          <div className="flex items-center">
            {/* Play/Pause button with animation */}
            <motion.button 
              onClick={togglePlayback}
              className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center mr-4 shadow-lg hover:shadow-primary/30 transition-shadow"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <AnimatePresence mode="wait">
                {isPlaying ? (
                  <motion.div
                    key="pause"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Pause className="h-6 w-6 text-white" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="play"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Play className="h-6 w-6 text-white ml-1" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
            
            <div>
              <div className="text-lg font-bold flex items-center mb-1">
                {activeTrack === 'original' ? (
                  <><Music className="h-4 w-4 mr-2 text-primary" /> Original Track</>
                ) : (
                  <><Headphones className="h-4 w-4 mr-2 text-purple-400" /> Lo-Fi Version</>
                )}
              </div>
              <div className="text-sm text-gray-300 flex items-center">
                <Disc3 className="h-3 w-3 mr-1 text-gray-400" />
                <span className="text-primary font-medium">{formatTime(currentProgress.currentTime)}</span>
                <span className="mx-1 text-gray-500">/</span>
                <span>{formatTime(currentProgress.duration || 0)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Skip backward button */}
            <motion.button
              onClick={() => handleSkip(-10)}
              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-300 hover:bg-white/10 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <SkipBack className="h-4 w-4" />
            </motion.button>
            
            {/* Skip forward button */}
            <motion.button
              onClick={() => handleSkip(10)}
              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-300 hover:bg-white/10 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <SkipForward className="h-4 w-4" />
            </motion.button>
            
            {/* Track switch buttons */}
            <div className="flex rounded-full bg-black/20 p-1 ml-2">
              <motion.button
                onClick={() => switchTrack('original')}
                className={`px-4 py-1.5 text-sm rounded-full ${activeTrack === 'original' ? 'bg-primary text-white shadow-lg' : 'text-gray-300 hover:text-white'}`}
                whileHover={activeTrack !== 'original' ? { scale: 1.05 } : {}}
                whileTap={activeTrack !== 'original' ? { scale: 0.95 } : {}}
                layout
              >
                Original
              </motion.button>
              <motion.button
                onClick={() => switchTrack('lofi')}
                className={`px-4 py-1.5 text-sm rounded-full ${activeTrack === 'lofi' ? 'bg-primary text-white shadow-lg' : 'text-gray-300 hover:text-white'}`}
                whileHover={activeTrack !== 'lofi' ? { scale: 1.05 } : {}}
                whileTap={activeTrack !== 'lofi' ? { scale: 0.95 } : {}}
                disabled={!track.lofiPath}
                layout
              >
                Lo-Fi
              </motion.button>
            </div>
            
            {/* Volume controls */}
            <div className="flex items-center ml-1 gap-2">
              <motion.button 
                onClick={handleMuteToggle} 
                className="text-gray-300 hover:text-white transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <AnimatePresence mode="wait">
                  {isMuted ? (
                    <motion.div
                      key="muted"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <VolumeX className="h-5 w-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="volume"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Volume2 className="h-5 w-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
              <div className="w-20">
                <Slider
                  value={[volume]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={handleVolumeChange}
                  className="h-1.5"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Waveform visualization */}
        <div 
          className="mt-4 mb-2 relative waveform-animated h-14 flex items-center cursor-pointer group"
          onMouseEnter={() => setIsHoveringSeek(true)}
          onMouseLeave={() => setIsHoveringSeek(false)}
          onClick={handleProgressBarClick}
          ref={progressBarRef}
        >
          {/* Time tooltip */}
          <AnimatePresence>
            {isHoveringSeek && (
              <motion.div 
                className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-8 bg-black/70 px-2 py-1 rounded text-xs z-10"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {formatTime(currentProgress.currentTime)} / {formatTime(currentProgress.duration || 0)}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Visual waveform bars */}
          <div className="w-full h-full flex items-center justify-between px-3 relative">
            {waveformPoints.map((height, index) => {
              // Determine if this bar should be highlighted based on current progress
              const highlightThreshold = (index / waveformPoints.length) * 100;
              const isHighlighted = progressPercentage >= highlightThreshold;
              
              return (
                <div 
                  key={index}
                  className={`w-1.5 rounded-full transition-all duration-300 ${isHighlighted ? 'bg-primary' : 'bg-gray-600'}`}
                  style={{ 
                    height: `${height}%`,
                    opacity: isHighlighted ? 1 : 0.5 + (height / 60),
                    transform: isPlaying ? `scaleY(${1 + Math.sin(Date.now() * 0.005 + index * 0.2) * 0.1})` : 'none'
                  }}
                />
              );
            })}
          </div>
          
          {/* Progress overlay */}
          <div 
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary/20 to-purple-600/10 rounded-r-sm pointer-events-none"
            style={{ width: `${progressPercentage}%` }}
          ></div>
          
          {/* Animated playback indicator */}
          <motion.div 
            className="absolute top-0 h-full w-0.5 bg-white rounded-full pointer-events-none"
            style={{ left: `${progressPercentage}%` }}
            initial={{ height: '30%' }}
            animate={{ 
              height: ['30%', '90%', '30%'],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{ 
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          ></motion.div>
        </div>
        
        {/* Progress bar - visually thin but functionally easy to click */}
        <div className="mt-2 relative h-6 group flex items-center cursor-pointer" onClick={handleProgressBarClick}>
          <div className="h-2 absolute inset-x-0 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/5 rounded-full"></div>
          <div className="h-1 absolute inset-x-0 top-1/2 transform -translate-y-1/2 bg-gray-700/70 backdrop-blur-sm rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-purple-600"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          
          {/* Animated dot indicator */}
          <motion.div 
            className="absolute top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `calc(${progressPercentage}% - 6px)` }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          ></motion.div>
        </div>
        
        {/* Status indicator */}
        <div className="mt-2 flex justify-end">
          <div className="flex items-center text-xs text-gray-400">
            <div className={`w-2 h-2 rounded-full mr-1.5 ${isPlaying ? 'bg-green-500' : 'bg-gray-500'}`}></div>
            {isPlaying ? 'Playing' : 'Paused'}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
