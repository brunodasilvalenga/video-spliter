'use client'

import { useState, useEffect, useRef } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { VideoPlayer } from '@/components/video-player'

export default function VideoSplitter() {
  const [video, setVideo] = useState<File | null>(null)
  const [splitDuration, setSplitDuration] = useState<number>(60)
  const [status, setStatus] = useState<string>('Idle')
  const [progress, setProgress] = useState<number>(0)
  const [outputCount, setOutputCount] = useState<number>(0)
  const ffmpegRef = useRef<FFmpeg>(new FFmpeg())
  const [videoDuration, setVideoDuration] = useState<number>(0)
  const [videosList, setVideosList] = useState<{ url: string; name: string }[]>([])

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
    const ffmpeg = ffmpegRef.current

    ffmpeg.on('log', ({ message }) => {
      console.log(message)
    })

    ffmpeg.on('progress', ({ progress }) => {
      setProgress(Math.round(progress * 100))
    })

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    })
  }

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
  }

  const handleSplitDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (!value) return
    setSplitDuration(parseInt(value))
  }

  const splitVideo = async () => {
    if (!video || !ffmpegRef.current) return

    const ffmpeg = ffmpegRef.current
    const inputName = 'input.mp4'
    setStatus('Starting')
    setProgress(0)
    setVideosList([])

    try {
      await ffmpeg.writeFile(inputName, await fetchFile(video))

      const totalSeconds = videoDuration
      const splitCount = Math.ceil(totalSeconds / splitDuration)
      setOutputCount(splitCount)

      setStatus('Processing')

      const newVideosList = []
      for (let i = 0; i < splitCount; i++) {
        const startTime = i * splitDuration
        const outputName = `output_${i + 1}.mp4`

        await ffmpeg.exec(['-i', inputName, '-ss', startTime.toString(), '-t', splitDuration.toString(), '-c', 'copy', outputName])

        const data = await ffmpeg.readFile(outputName)
        const blob = new Blob([data], { type: 'video/mp4' })
        const url = URL.createObjectURL(blob)
        newVideosList.push({ url, name: outputName })
      }

      setVideosList(newVideosList)
      setStatus('Complete')
    } catch (error) {
      console.error(error)
      setStatus('Error: ' + (error as Error).message)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-xl">
      <h1 className="text-2xl font-bold mb-4">Video Splitter</h1>
      <div className="space-y-4">
        <div>
          <Input type="file" accept="video/*" onChange={e => setVideo(e.target.files?.[0] || null)} className="mb-2" aria-label="Select video file" />
          {video && (
            <>
              <VideoPlayer file={video} onDurationChange={duration => setVideoDuration(duration)} />
              {videoDuration > 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  Video duration: {Math.floor(videoDuration / 60)}m {videoDuration % 60}s
                </p>
              )}
            </>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Input type="number" value={splitDuration} onChange={handleSplitDurationChange} min="1" className="w-24" aria-label="Split duration in seconds" />
          <span>seconds per split</span>
        </div>
        <Button onClick={splitVideo} disabled={!video || status === 'Processing'} aria-busy={status === 'Processing'}>
          Split Video
        </Button>
        <div aria-live="polite">Status: {status}</div>
        {status === 'Processing' && <Progress value={progress} className="w-full" aria-label={`Processing: ${progress}%`} />}
        {outputCount > 0 && <div>Number of output videos: {outputCount}</div>}
        {videosList.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Generated Videos</h2>
            {videosList.map((video, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-gray-100 rounded">
                <span>{video.name}</span>
                <Button onClick={() => handleDownload(video.url, video.name)}>Download</Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
