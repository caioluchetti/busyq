"use client";

import { UserPhoto } from "@/types";
import { timeAgo } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui";
import { Camera } from "lucide-react";
import { useRouter } from "next/navigation";

interface PhotoFeedProps {
  photos: UserPhoto[];
  placeId: string;
  placeName: string;
}

export default function PhotoFeed({ photos, placeId, placeName }: PhotoFeedProps) {
  const router = useRouter();

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Recent Photos</h3>
        <button
          onClick={() => router.push(`/upload?placeId=${placeId}`)}
          className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700"
        >
          <Camera className="h-4 w-4" />
          Add Photo
        </button>
      </div>

      {photos.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-8 text-gray-400">
            <Camera className="h-10 w-10 mb-2" />
            <p className="text-sm">No photos yet. Be the first to share the vibe!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.slice(0, 9).map(photo => (
            <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100">
              <img
                src={photo.thumbnailUrl ?? photo.url}
                alt={photo.caption ?? `Photo from ${placeName}`}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />
              {photo.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <p className="text-xs text-white truncate">{photo.caption}</p>
                  <p className="text-xs text-white/70">{timeAgo(photo.createdAt)}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
