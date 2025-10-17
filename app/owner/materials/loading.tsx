import DotsLoader from '@/components/dots-loader'

export default function Loading() {
  return (
    <div className="min-h-[240px] flex items-center justify-center">
      <div style={{ width: 160, height: 100 }} className="flex items-center justify-center bg-white rounded-lg shadow-md">
        <DotsLoader />
      </div>
    </div>
  )
}
