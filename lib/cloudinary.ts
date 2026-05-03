/**
 * Cloudinary unsigned upload utility.
 * Uses the unsigned upload preset configured in NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.
 * Returns the secure URL of the uploaded asset.
 */

export type CloudinaryFolder = 'products' | 'avatars' | 'landing'

export async function uploadToCloudinary(
  file: File,
  folder: CloudinaryFolder = 'products',
): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary environment variables are not configured.')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)
  formData.append('folder', `ava/${folder}`)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData },
  )

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? 'Cloudinary upload failed.')
  }

  const data = await response.json()
  return data.secure_url as string
}
