<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Document;
use App\Models\DocumentChunk;
use App\Models\Workspace;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class AnalyticsController extends Controller
{
    use ApiResponse;

    /**
     * Get workspace document overview and analytics metrics.
     */
    public function overview(Request $request, Workspace $workspace): JsonResponse
    {
        Gate::authorize('view', $workspace);

        $range = $request->query('range', '30d');
        $days = match ($range) {
            '7d' => 7,
            '90d' => 90,
            default => 30,
        };

        $startDate = Carbon::now()->subDays($days)->startOfDay();

        // 1. Time-series aggregation for documents and chats
        $datePoints = [];
        $step = max(1, (int) floor($days / 5)); // 5-6 points along X-axis

        for ($i = $days; $i >= 0; $i -= $step) {
            $pointDate = Carbon::now()->subDays($i);
            $datePoints[] = [
                'date' => $pointDate->format('M j'),
                'raw_date' => $pointDate->toDateString(),
                'documents' => 0,
                'chats' => 0,
            ];
        }

        // Aggregate actual document uploads
        $docsByDate = $workspace->documents()
            ->where('created_at', '>=', $startDate)
            ->selectRaw('DATE(created_at) as date, count(*) as count')
            ->groupBy('date')
            ->pluck('count', 'date');

        // Aggregate actual chats
        $chatsByDate = $workspace->conversations()
            ->where('created_at', '>=', $startDate)
            ->selectRaw('DATE(created_at) as date, count(*) as count')
            ->groupBy('date')
            ->pluck('count', 'date');

        foreach ($datePoints as &$point) {
            $point['documents'] = (int) ($docsByDate[$point['raw_date']] ?? 0);
            $point['chats'] = (int) ($chatsByDate[$point['raw_date']] ?? 0);
        }

        // 2. MIME type distribution
        $mimeTypes = $workspace->documents()
            ->selectRaw("
                CASE 
                    WHEN LOWER(mime_type) LIKE '%pdf%' THEN 'PDF'
                    WHEN LOWER(mime_type) LIKE '%word%' THEN 'DOCX'
                    ELSE 'TXT'
                END as format,
                count(*) as count,
                sum(file_size) as total_size
            ")
            ->groupBy('format')
            ->get()
            ->map(fn ($item) => [
                'format' => $item->format,
                'count' => (int) $item->count,
                'size_mb' => round(((int) $item->total_size) / (1024 * 1024), 2),
            ]);

        // 3. Status summary
        $statusCounts = $workspace->documents()
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        // 4. Chunk statistics
        $totalChunks = DocumentChunk::where('workspace_id', $workspace->id)->count();
        $totalDocs = $workspace->documents()->count();
        $avgChunksPerDoc = $totalDocs > 0 ? round($totalChunks / $totalDocs, 1) : 0;

        return $this->success([
            'range' => $range,
            'timeline' => $datePoints,
            'mime_breakdown' => $mimeTypes,
            'status_summary' => [
                'completed' => (int) ($statusCounts['completed'] ?? 0),
                'processing' => (int) ($statusCounts['processing'] ?? 0),
                'pending' => (int) ($statusCounts['pending'] ?? 0),
                'failed' => (int) ($statusCounts['failed'] ?? 0),
            ],
            'total_chunks' => $totalChunks,
            'avg_chunks_per_doc' => $avgChunksPerDoc,
        ], 'Analytics overview retrieved successfully');
    }
}
