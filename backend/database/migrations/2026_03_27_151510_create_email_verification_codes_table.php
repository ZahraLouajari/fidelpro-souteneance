<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateEmailVerificationCodesTable extends Migration
{
    public function up()
    {
        if (!Schema::hasTable('email_verification_codes')) {
            Schema::create('email_verification_codes', function (Blueprint $table) {
                $table->id();
                $table->string('email');
                $table->string('code', 6);
                $table->timestamp('expires_at');
                $table->timestamps();
                
                $table->index(['email', 'code']);
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('email_verification_codes');
    }
}