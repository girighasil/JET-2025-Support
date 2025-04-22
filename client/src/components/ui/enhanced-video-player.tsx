import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  SkipBack,
  SkipForward,
  Settings,
  Download,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface EnhancedVideoPlayerProps {
  src: string;
  title?: string;
  onLoadComplete?: () => void;
  onError?: () => void;
  onDownload?: () => void;
  className?: string;
}

export function EnhancedVideoPlayer({
  src,
  title,
  onLoadComplete,
  onError,
  onDownload,
  className,
}: EnhancedVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [loading, setLoading] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Control visibility of the controls overlay
  const showControlsTemporarily = () => {
    setShowControls(true);
    
    // Clear any existing timeout
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    // Set new timeout to hide controls after 3 seconds of inactivity
    controlsTimeoutRef.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  };

  // Handle metadata loaded
  const handleMetadataLoaded = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      if (onLoadComplete) onLoadComplete();
      setLoading(false);
    }
  };

  // Handle video error
  const handleError = () => {
    if (onError) onError();
    setLoading(false);
  };

  // Handle time update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      setCurrentTime(current);
      setProgress((current / duration) * 100);
    }
  };

  // Toggle play/pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setPlaying(!playing);
      showControlsTemporarily();
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !muted;
      setMuted(!muted);
      showControlsTemporarily();
    }
  };

  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    if (videoRef.current) {
      const newVolume = value[0];
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      if (newVolume === 0) {
        videoRef.current.muted = true;
        setMuted(true);
      } else if (muted) {
        videoRef.current.muted = false;
        setMuted(false);
      }
      showControlsTemporarily();
    }
  };

  // Handle seek
  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      const newTime = (value[0] / 100) * duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      showControlsTemporarily();
    }
  };

  // Set playback rate
  const setSpeed = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
      showControlsTemporarily();
    }
  };

  // Enter fullscreen
  const enterFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
      showControlsTemporarily();
    }
  };

  // Skip forward/backward
  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
      showControlsTemporarily();
    }
  };

  // Format time in MM:SS
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Clean up event listeners and timeouts
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className={cn('relative group w-full h-[70vh]', className)}
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => {
        if (playing) setShowControls(false);
      }}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain bg-black"
        onClick={togglePlay}
        onLoadedMetadata={handleMetadataLoaded}
        onTimeUpdate={handleTimeUpdate}
        onError={handleError}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
        onEnded={() => setPlaying(false)}
        playsInline
      />
      
      {/* Loading state */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}
      
      {/* Controls overlay */}
      <div
        className={cn(
          'absolute inset-0 transition-opacity duration-300',
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      >
        {/* Center play/pause button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePlay}
            className="h-16 w-16 rounded-full bg-black/40 text-white hover:bg-black/60"
          >
            {playing ? (
              <Pause className="h-8 w-8" />
            ) : (
              <Play className="h-8 w-8 ml-1" />
            )}
          </Button>
        </div>
        
        {/* Bottom controls bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 transition-opacity duration-300">
          {/* Progress bar */}
          <Slider
            value={[progress]}
            onValueChange={handleSeek}
            max={100}
            step={0.1}
            className="mb-2"
          />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Play/Pause button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlay}
                className="h-8 w-8 text-white hover:bg-white/10"
              >
                {playing ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4 ml-0.5" />
                )}
              </Button>
              
              {/* Skip backward */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => skip(-10)}
                className="h-8 w-8 text-white hover:bg-white/10"
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              
              {/* Skip forward */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => skip(10)}
                className="h-8 w-8 text-white hover:bg-white/10"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
              
              {/* Volume control */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className="h-8 w-8 text-white hover:bg-white/10"
                >
                  {muted || volume === 0 ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
                <Slider
                  value={[muted ? 0 : volume]}
                  onValueChange={handleVolumeChange}
                  max={1}
                  step={0.01}
                  className="w-16"
                />
              </div>
              
              {/* Time display */}
              <div className="text-white text-xs ml-2">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Playback speed dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/10"
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    {playbackRate}x
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Playback Speed</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                    <DropdownMenuItem
                      key={rate}
                      onClick={() => setSpeed(rate)}
                      className={playbackRate === rate ? "bg-accent" : ""}
                    >
                      {rate}x
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Download button */}
              {onDownload && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDownload}
                  className="h-8 w-8 text-white hover:bg-white/10"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
              
              {/* Fullscreen button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={enterFullscreen}
                className="h-8 w-8 text-white hover:bg-white/10"
              >
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}