'use client'

import { useRef, useEffect } from 'react'

interface VideoPlayerProps {
  file: File
  onDurationChange?: (duration: number) => void
}

export function VideoPlayer({ file, onDurationChange }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.src = URL.createObjectURL(file)

      const handleLoadedMetadata = () => {
        if (videoRef.current && onDurationChange) {
          onDurationChange(Math.floor(videoRef.current.duration))
        }
      }

      videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata)

      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata)
          URL.revokeObjectURL(videoRef.current.src)
        }
      }
    }
  }, [file, onDurationChange])
  return (
    <div className="max-w-sm mx-auto mt-4">
      <video ref={videoRef} controls className="w-full rounded-lg shadow-lg" preload="metadata">
        Your browser does not support the video tag.
      </video>
    </div>
  )
}
