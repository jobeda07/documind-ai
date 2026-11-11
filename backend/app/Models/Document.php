<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Document extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'workspace_id',
        'user_id',
        'title',
        'original_filename',
        'file_path',
        'mime_type',
        'file_size',
        'file_hash',
        'status',
        'error_message',
        'page_count',
        'character_count',
        'word_count',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'file_size' => 'integer',
            'page_count' => 'integer',
            'character_count' => 'integer',
            'word_count' => 'integer',
            'metadata' => 'array',
        ];
    }

    /**
     * The workspace this document belongs to.
     */
    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    /**
     * The user who uploaded the document.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Chunks extracted and embedded from this document.
     */
    public function chunks(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(DocumentChunk::class);
    }
}
