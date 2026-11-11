<?php

namespace Database\Factories;

use App\Models\Document;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Document>
 */
class DocumentFactory extends Factory
{
    protected $model = Document::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'uuid' => (string) Str::uuid(),
            'workspace_id' => Workspace::factory(),
            'user_id' => User::factory(),
            'title' => fake()->sentence(3),
            'original_filename' => 'doc.txt',
            'file_path' => 'documents/sample.txt',
            'mime_type' => 'text/plain',
            'file_size' => 1024,
            'file_hash' => hash('sha256', 'fake-doc-content'),
            'status' => 'completed',
            'page_count' => 1,
            'character_count' => 100,
            'word_count' => 20,
        ];
    }
}
