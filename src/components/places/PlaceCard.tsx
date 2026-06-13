"use client";

import { Place, BusynessReport, busynessLevel, busynessColor } from "@/types";
import { timeAgo, formatWaitTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Badge, Button } from "@/components/ui";
import { MapPin, Star, Users, Camera } from "lucide-react";
import { useRouter } from "next/navigation";

interface PlaceCardProps {
  place: Place;
  queueCount?: number;
  recentReports?: BusynessReport[];
  className?: string;
}

export default function PlaceCard({ place, queueCount = 0, className }: PlaceCardProps) {
  const router = useRouter();
  const level = busynessLevel(place.currentPopularity);
  const color = busynessColor(level);
  const label =
    level === "quiet" ? "Quiet" :
    level === "moderate" ? "Moderate" :
    level === "busy" ? "Busy" : "Packed";

  const badgeVariant =
    level === "quiet" ? "green" :
    level === "moderate" ? "yellow" :
    level === "busy" ? "red" : "purple";

  return (
    <div
      className={cn(
        "group cursor-pointer rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5",
        className
      )}
      onClick={() => router.push(`/place/${place.id}`)}
    >
      <div className="relative aspect-[2/1] overflow-hidden rounded-t-xl">
        <img
          src={place.photos[0]?.url ?? "/placeholder.jpg"}
          alt={place.name}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <Badge variant={badgeVariant} className="font-semibold shadow-sm">
            {label}
          </Badge>
          <div className="flex items-center gap-1 text-white text-xs font-medium">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            {place.rating}
            <span className="opacity-70">({place.userRatingsTotal})</span>
          </div>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate">{place.name}</h3>
        <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
          <MapPin className="h-3 w-3" />
          <span className="truncate">{place.address}</span>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <span>{queueCount > 0 ? `${queueCount} in queue` : "No queue"}</span>
          </div>
          {queueCount > 0 && (
            <span className="text-sm text-gray-500">
              ~{formatWaitTime(queueCount * 12 + 15)}
            </span>
          )}
        </div>

        <div className="mt-3 h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${place.currentPopularity}%`,
              backgroundColor: color,
            }}
          />
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/place/${place.id}?action=queue`);
            }}
          >
            <Users className="mr-1 h-3.5 w-3.5" />
            Join Queue
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/place/${place.id}?action=reserve`);
            }}
          >
            Reserve
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/upload?placeId=${place.id}`);
            }}
          >
            <Camera className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
