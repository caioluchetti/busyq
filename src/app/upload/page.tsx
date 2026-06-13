"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAuth } from "@/lib/auth/store";
import { getPlaces } from "@/lib/db/mock";
import { Place } from "@/types";
import { Button, Card, CardContent } from "@/components/ui";
import { Camera, MapPin, ImageIcon } from "lucide-react";

function UploadContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPlaceId = searchParams.get("placeId");

  const user = typeof window !== "undefined" ? getAuth() : null;
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setPlaces(getPlaces());
  }, []);

  useEffect(() => {
    if (preselectedPlaceId) {
      const place = places.find(p => p.id === preselectedPlaceId);
      if (place) setSelectedPlace(place);
    }
  }, [preselectedPlaceId, places]);

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <Camera className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-gray-700">Sign in to share photos</h2>
        <p className="text-gray-500 mt-1">Share the vibe at your favorite places.</p>
        <Button className="mt-4" onClick={() => router.push("/auth/login")}>Sign In</Button>
      </div>
    );
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      alert("File too large. Max 20MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleUpload = async () => {
    if (!preview || !selectedPlace || !user) return;
    setUploading(true);
    try {
      const res = await fetch("/api/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeId: selectedPlace.id,
          userId: user.id,
          userName: user.name,
          url: preview,
          caption,
          width: 1200,
          height: 900,
        }),
      });
      if (res.ok) {
        setSuccess(true);
        setPreview(null);
        setCaption("");
      }
    } catch {
      // ignore
    }
    setUploading(false);
  };

  if (success) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mx-auto mb-4">
          <ImageIcon className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-700">Photo shared!</h2>
        <p className="text-gray-500 mt-1">Your photo is now live at {selectedPlace?.name}.</p>
        <div className="flex gap-3 justify-center mt-6">
          <Button variant="outline" onClick={() => setSuccess(false)}>Upload Another</Button>
          {selectedPlace && (
            <Button onClick={() => router.push(`/place/${selectedPlace.id}`)}>View Place</Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Camera className="h-6 w-6 text-brand-600" />
          Share the Vibe
        </h1>
        <p className="text-gray-500 mt-1">Add a photo to show how the crowd looks right now.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Place</label>
        <select
          value={selectedPlace?.id ?? ""}
          onChange={e => {
            const place = places.find(p => p.id === e.target.value);
            setSelectedPlace(place ?? null);
          }}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="">Choose a place...</option>
          {places.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {!preview ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-12">
            <Camera className="h-10 w-10 text-gray-300 mb-4" />
            <p className="text-sm text-gray-500 mb-4">Snap a photo or choose from gallery</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleCameraCapture}>
                <Camera className="mr-1.5 h-4 w-4" /> Take Photo
              </Button>
              <label className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
                <ImageIcon className="mr-1.5 h-4 w-4" /> Gallery
                <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              </label>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-100">
            <img src={preview} alt="Preview" className="h-full w-full object-contain" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Caption (optional)</label>
            <input
              type="text"
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Describe the vibe..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              maxLength={200}
            />
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleUpload} disabled={!selectedPlace || uploading}>
              {uploading ? "Sharing..." : "Share Photo"}
            </Button>
            <Button variant="ghost" onClick={() => { setPreview(null); setCaption(""); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {selectedPlace && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <MapPin className="h-4 w-4" />
          Sharing to: <span className="font-medium text-gray-700">{selectedPlace.name}</span>
        </div>
      )}
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={<div className="max-w-xl mx-auto px-4 py-16 text-center text-gray-400">Loading...</div>}>
      <UploadContent />
    </Suspense>
  );
}
