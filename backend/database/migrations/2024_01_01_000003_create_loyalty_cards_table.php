<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('loyalty_cards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('restaurant_id')->constrained('restaurants')->onDelete('cascade');
            $table->integer('current_visits')->default(0);
            $table->enum('status', ['active', 'completed', 'expired'])->default('active');
            $table->timestamp('last_visit_at')->nullable();
            $table->timestamps();

            $table->unique(['client_id', 'restaurant_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loyalty_cards');
    }
};