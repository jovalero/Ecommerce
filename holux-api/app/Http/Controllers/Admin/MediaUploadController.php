<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\SupabaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class MediaUploadController extends Controller
{
    /**
     * Upload an image or video to Supabase Storage Bucket or local public storage CDN.
     */
    public function store(Request $request, SupabaseService $supabase): JsonResponse
    {
        $request->validate([
            'file' => 'nullable|file|max:20480', // Up to 20MB
            'base64' => 'nullable|string',
            'bucket' => 'nullable|string|in:product-images,banners,videos'
        ]);

        $bucket = $request->input('bucket', 'product-images');
        $fileName = Str::uuid()->toString();

        try {
            if ($request->hasFile('file')) {
                $file = $request->file('file');
                $extension = $file->getClientOriginalExtension() ?: 'png';
                $mimeType = $file->getClientMimeType() ?: 'image/png';
                $fullPath = "{$fileName}.{$extension}";

                // 1. Try uploading to Supabase Storage Bucket
                try {
                    $publicUrl = $supabase->uploadStorageFile($bucket, $fullPath, file_get_contents($file->getRealPath()), $mimeType);
                    return response()->json([
                        'url' => $publicUrl,
                        'storage' => 'supabase_cdn',
                        'message' => 'Archivo subido exitosamente a Supabase Storage CDN.'
                    ]);
                } catch (\Throwable $e) {
                    Log::warning("Supabase storage upload failed, saving to local public disk: " . $e->getMessage());
                    // Fallback to local Laravel public uploads folder
                    $localPath = $file->storeAs('uploads', $fullPath, 'public');
                    $publicUrl = asset('storage/' . $localPath);
                    return response()->json([
                        'url' => $publicUrl,
                        'storage' => 'local_cdn',
                        'message' => 'Archivo subido a almacenamiento local.'
                    ]);
                }
            }

            if ($request->filled('base64')) {
                $base64Str = $request->input('base64');
                return response()->json([
                    'url' => $base64Str,
                    'storage' => 'data_uri',
                    'message' => 'Imagen almacenada en formato Data URI.'
                ]);
            }

            return response()->json(['message' => 'No se proporcionó ningún archivo.'], 400);
        } catch (\Throwable $err) {
            Log::error("Media upload error: " . $err->getMessage());
            return response()->json(['message' => 'Error al subir el archivo.'], 500);
        }
    }
}
