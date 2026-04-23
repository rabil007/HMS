<?php

namespace App\Enums;

enum Role: string
{
    case Admin = 'admin';
    case Hotel = 'hotel';
    case Client = 'client';
}
