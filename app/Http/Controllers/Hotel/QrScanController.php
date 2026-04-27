<?php

namespace App\Http\Controllers\Hotel;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class QrScanController extends Controller
{
    public function __invoke()
    {
        return Inertia::render('hotel/scan/index');
    }
}

