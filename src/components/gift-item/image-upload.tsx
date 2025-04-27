'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Image as ImageIcon, X, Star } from 'lucide-react'
import Image from 'next/image'

interface GiftItemImage {
  id: string
  url: string
  is_primary: boolean
}

interface ImageUploadProps {
  giftItemId: string
  existingImages?: GiftItemImage[]
  onImagesChange?: (images: GiftItemImage[]) => void
}

export function ImageUpload({
  giftItemId,
  existingImages = [],
  onImagesChange
}: ImageUploadProps) {
  const [images, setImages] = useState<GiftItemImage[]>(existingImages)
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  const uploadImage = useCallback(async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `gift-items/${giftItemId}/${fileName}`

      // Upload image to storage
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      // Add image to database
      const { data: imageData, error: dbError } = await supabase
        .from('gift_item_images')
        .insert({
          gift_item_id: giftItemId,
          url: publicUrl,
          is_primary: images.length === 0 // First image is primary
        })
        .select('id, url, is_primary')
        .single()

      if (dbError) throw dbError

      const newImage = imageData as GiftItemImage
      const updatedImages = [...images, newImage]
      setImages(updatedImages)
      if (onImagesChange) onImagesChange(updatedImages)

      toast.success('Image uploaded successfully')
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload image')
    }
  }, [giftItemId, images, onImagesChange])

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        await uploadImage(files[i])
      }
    } finally {
      setUploading(false)
    }
  }, [uploadImage])

  const deleteImage = async (imageId: string, imageUrl: string) => {
    try {
      // Delete from storage
      const filePath = imageUrl.split('/').pop()
      if (filePath) {
        await supabase.storage
          .from('images')
          .remove([`gift-items/${giftItemId}/${filePath}`])
      }

      // Delete from database
      const { error } = await supabase
        .from('gift_item_images')
        .delete()
        .eq('id', imageId)

      if (error) throw error

      const updatedImages = images.filter(img => img.id !== imageId)
      setImages(updatedImages)
      if (onImagesChange) onImagesChange(updatedImages)

      toast.success('Image deleted successfully')
    } catch (error) {
      console.error('Error deleting image:', error)
      toast.error('Failed to delete image')
    }
  }

  const setPrimaryImage = async (imageId: string) => {
    try {
      // Update all images to not primary
      await supabase
        .from('gift_item_images')
        .update({ is_primary: false })
        .eq('gift_item_id', giftItemId)

      // Set selected image as primary
      const { error } = await supabase
        .from('gift_item_images')
        .update({ is_primary: true })
        .eq('id', imageId)

      if (error) throw error

      const updatedImages = images.map(img => ({
        ...img,
        is_primary: img.id === imageId
      }))
      setImages(updatedImages)
      if (onImagesChange) onImagesChange(updatedImages)

      toast.success('Primary image updated')
    } catch (error) {
      console.error('Error updating primary image:', error)
      toast.error('Failed to update primary image')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => document.getElementById('image-upload')?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <>
              <ImageIcon className="w-4 h-4 mr-2" />
              Add Images
            </>
          )}
        </Button>
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image) => (
          <div
            key={image.id}
            className="relative group aspect-square rounded-lg overflow-hidden border"
          >
            <Image
              src={image.url}
              alt="Gift item"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:text-yellow-400"
                onClick={() => setPrimaryImage(image.id)}
              >
                <Star
                  className={`w-4 h-4 ${
                    image.is_primary ? 'fill-yellow-400' : ''
                  }`}
                />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:text-red-400"
                onClick={() => deleteImage(image.id, image.url)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            {image.is_primary && (
              <div className="absolute top-2 right-2 bg-yellow-400 text-black text-xs px-2 py-1 rounded">
                Primary
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
} 