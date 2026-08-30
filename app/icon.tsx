import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#fafafa',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg viewBox="0 0 512 512" width="32" height="32">
          <g fill="#000000">
            <rect x="156" y="126" width="52" height="260" rx="4"/>
            <rect x="304" y="126" width="52" height="260" rx="4"/>
            <rect x="156" y="230" width="200" height="52"/>
          </g>
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
