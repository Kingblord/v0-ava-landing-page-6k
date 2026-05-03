'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Upload, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { uploadToCloudinary, type CloudinaryFolder } from '@/lib/cloudinary'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  folder?: CloudinaryFolder
  /** 'square' renders as a round avatar; 'rect' renders as a 16:9 product card */
  variant?: 'square' | 'rect'
  label?: string
  className?: string
}

export function ImageUpload({
  value,
  onChange,
  folder = 'products',
  variant = 'rect',
  label = 'Upload Image',
  className,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10 MB.')
      return
    }

    setError(null)
    setUploading(true)
    try {
      const url = await uploadToCloudinary(file, folder)
      onChange(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const isAvatar = variant === 'square'

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div
        className={cn(
          'relative overflow-hidden border-2 border-dashed border-[#6C5CE7]/30 bg-[#0d1120] transition-colors hover:border-[#6C5CE7]/60 cursor-pointer group',
          isAvatar ? 'w-24 h-24 rounded-full' : 'w-full rounded-xl aspect-video',
        )}
        onClick={() => !uploading && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && !uploading && inputRef.current?.click()}
        aria-label={label}
      >
        {value ? (
          <>
            <Image
              src={value}
              alt="Uploaded image"
              fill
              className="object-cover"
              sizes={isAvatar ? '96px' : '400px'}
            />
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {uploading ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              ) : (
                <Upload className="w-6 h-6 text-white" />
              )}
            </div>
            {/* Clear button */}
            {!uploading && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onChange('') }}
                className={cn(
                  'absolute bg-black/70 rounded-full p-0.5 text-white hover:bg-red-600 transition-colors z-10',
                  isAvatar ? 'top-0 right-0' : 'top-2 right-2',
                )}
                aria-label="Remove image"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[#8892a4] group-hover:text-[#b0b8c8] transition-colors">
            {uploading ? (
              <Loader2 className="w-7 h-7 animate-spin text-[#6C5CE7]" />
            ) : (
              <>
                <Upload className={cn(isAvatar ? 'w-6 h-6' : 'w-8 h-8')} />
                {!isAvatar && (
                  <span className="text-xs text-center px-2">{label}</span>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
        disabled={uploading}
      />
    </div>
  )
}
