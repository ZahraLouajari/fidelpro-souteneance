<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddRoleToNotificationsCustomTable extends Migration
{
    public function up()
    {
        if (!Schema::hasColumn('notifications_custom', 'role')) {
            Schema::table('notifications_custom', function (Blueprint $table) {
                $table->string('role')->after('user_id')->nullable();
            });
        }
    }

    public function down()
    {
        if (Schema::hasColumn('notifications_custom', 'role')) {
            Schema::table('notifications_custom', function (Blueprint $table) {
                $table->dropColumn('role');
            });
        }
    }
}