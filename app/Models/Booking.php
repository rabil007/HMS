<?php

namespace App\Models;

use App\Enums\BookingStatus;
use App\Models\Traits\BelongsToHotel;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

#[Fillable([
    'hotel_id',
    'user_id',
    'guest_id',
    'public_id',
    'status',
    'check_in_date',
    'check_out_date',
    'actual_check_in_date',
    'actual_check_out_date',
    'guest_check_in',
    'guest_check_out',
    'client_id',
    'rank_id',
    'vessel_id',
    'single_or_twin',
    'confirmation_number',
    'room_number',
    'remarks',
    'import_source',
    'booking_import_history_id',
    'approved_at',
    'approved_by_user_id',
    'rejected_at',
    'rejected_by_user_id',
])]
class Booking extends Model
{
    use BelongsToHotel, HasFactory, LogsActivity, SoftDeletes;

    public const DATE_MODE_SCHEDULED = 'scheduled';

    public const DATE_MODE_PLANNED = 'planned';

    public const DATE_MODE_ACTUAL = 'actual';

    public const DATE_MODE_AUTO = 'auto';

    protected $appends = ['guest_name', 'guest_email', 'guest_phone'];

    public function scopeFilterCheckInRange(Builder $query, ?string $from, ?string $to, string $mode = self::DATE_MODE_AUTO): Builder
    {
        return $this->applyDateRangeFilter($query, 'check_in', $from, $to, $mode);
    }

    public function scopeFilterCheckOutRange(Builder $query, ?string $from, ?string $to, string $mode = self::DATE_MODE_AUTO): Builder
    {
        return $this->applyDateRangeFilter($query, 'check_out', $from, $to, $mode);
    }

    public function scopeFilterStayRangeAny(Builder $query, ?string $from, ?string $to, string $mode = self::DATE_MODE_AUTO): Builder
    {
        if ($from === null && $to === null) {
            return $query;
        }

        $checkInExpr = $this->resolveDateExpression('check_in', $mode);
        $checkOutExpr = $this->resolveDateExpression('check_out', $mode);

        return $query->where(function (Builder $outer) use ($from, $to, $checkInExpr, $checkOutExpr) {
            $outer
                ->where(function (Builder $checkIn) use ($from, $to, $checkInExpr) {
                    if ($from !== null) {
                        $checkIn->whereRaw("{$checkInExpr} >= ?", [$from]);
                    }
                    if ($to !== null) {
                        $checkIn->whereRaw("{$checkInExpr} <= ?", [$to]);
                    }
                })
                ->orWhere(function (Builder $checkOut) use ($from, $to, $checkOutExpr) {
                    $checkOut->whereRaw("{$checkOutExpr} IS NOT NULL");
                    if ($from !== null) {
                        $checkOut->whereRaw("{$checkOutExpr} >= ?", [$from]);
                    }
                    if ($to !== null) {
                        $checkOut->whereRaw("{$checkOutExpr} <= ?", [$to]);
                    }
                });
        });
    }

    public function activities(): MorphMany
    {
        return $this->activitiesAsSubject();
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('booking')
            ->logOnly([
                'hotel_id',
                'user_id',
                'guest_id',
                'client_id',
                'rank_id',
                'vessel_id',
                'public_id',
                'status',
                'check_in_date',
                'check_out_date',
                'actual_check_in_date',
                'actual_check_out_date',
                'guest_check_in',
                'guest_check_out',
                'single_or_twin',
                'confirmation_number',
                'room_number',
                'remarks',
                'approved_at',
                'approved_by_user_id',
                'rejected_at',
                'rejected_by_user_id',
            ])
            ->logOnlyDirty();
    }

    protected function casts(): array
    {
        return [
            'check_in_date' => 'date',
            'check_out_date' => 'date',
            'actual_check_in_date' => 'date',
            'actual_check_out_date' => 'date',
            'guest_check_in' => 'datetime',
            'guest_check_out' => 'datetime',
            'status' => BookingStatus::class,
            'approved_at' => 'datetime',
            'rejected_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function hotel()
    {
        return $this->belongsTo(Hotel::class);
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function rank()
    {
        return $this->belongsTo(Rank::class);
    }

    public function vessel()
    {
        return $this->belongsTo(Vessel::class);
    }

    public function guest()
    {
        return $this->belongsTo(Guest::class);
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }

    public function rejectedBy()
    {
        return $this->belongsTo(User::class, 'rejected_by_user_id');
    }

    public function bookingImportHistory()
    {
        return $this->belongsTo(BookingImportHistory::class);
    }

    protected function guestName(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value) => $this->guest?->full_name
        );
    }

    protected function guestEmail(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value) => $this->guest?->email
        );
    }

    protected function guestPhone(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value) => $this->guest?->phone
        );
    }

    private function applyDateRangeFilter(Builder $query, string $type, ?string $from, ?string $to, string $mode): Builder
    {
        if ($from === null && $to === null) {
            return $query;
        }

        $expr = $this->resolveDateExpression($type, $mode);

        if ($from !== null) {
            $query->whereRaw("{$expr} >= ?", [$from]);
        }
        if ($to !== null) {
            $query->whereRaw("{$expr} <= ?", [$to]);
        }

        return $query;
    }

    private function resolveDateExpression(string $type, string $mode): string
    {
        $isCheckIn = $type === 'check_in';
        $scheduled = $isCheckIn ? 'check_in_date' : 'check_out_date';
        $planned = $isCheckIn ? 'actual_check_in_date' : 'actual_check_out_date';
        $actual = $isCheckIn ? 'guest_check_in' : 'guest_check_out';
        $confirmed = BookingStatus::Confirmed->value;

        return match ($mode) {
            self::DATE_MODE_SCHEDULED => "DATE({$scheduled})",
            self::DATE_MODE_PLANNED => "DATE({$planned})",
            self::DATE_MODE_ACTUAL => "DATE({$actual})",
            default => "CASE
                WHEN {$actual} IS NOT NULL THEN DATE({$actual})
                WHEN status = '{$confirmed}' AND {$planned} IS NOT NULL THEN DATE({$planned})
                ELSE DATE({$scheduled})
            END",
        };
    }
}
