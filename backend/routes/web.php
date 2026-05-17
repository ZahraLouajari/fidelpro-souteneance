<?php

use Illuminate\Support\Facades\Route;

// Hada kigoul l-Laravel: Ay wa7ed dkhul (machi l-API), 3tih l-interface dyal React
Route::get('{any?}', function () {
    return file_get_contents(public_path('index.html'));
})->where('any', '.*');