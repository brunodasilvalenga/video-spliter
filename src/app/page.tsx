'use client'

import NoSSRWrapper from '@/components/no-ssr-wrapper'
import VideoSplitter from '@/components/video-splitter'

export default function Page() {
  return (
    <NoSSRWrapper>
      <VideoSplitter />
    </NoSSRWrapper>
  )
}
