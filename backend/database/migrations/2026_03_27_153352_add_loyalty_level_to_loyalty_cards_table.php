<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddLoyaltyLevelToLoyaltyCardsTable extends Migration
{
    public function up()
    {
        if (!Schema::hasColumn('loyalty_cards', 'loyalty_level')) {
            Schema::table('loyalty_cards', function (Blueprint $table) {
                $table->string('loyalty_level')->default('bronze')->after('status');
            });
        }
    }

    public function down()
    {
        if (Schema::hasColumn('loyalty_cards', 'loyalty_level')) {
            Schema::table('loyalty_cards', function (Blueprint $table) {
                $table->dropColumn('loyalty_level');
            });
        }
    }
}