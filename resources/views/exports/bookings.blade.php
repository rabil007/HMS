<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #111; }
        h1 { font-size: 16px; margin: 0 0 12px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 6px 8px; vertical-align: top; }
        th { background: #f5f5f5; text-align: left; }
        .muted { color: #555; }
    </style>
</head>
<body>
    <h1>Bookings Export</h1>
    <p class="muted">Generated at {{ now()->toDateTimeString() }}</p>

    <table>
        <thead>
            <tr>
                <th>Public ID</th>
                <th>Hotel</th>
                <th>Client</th>
                <th>Status</th>
                <th>Scheduled check-in</th>
                <th>Scheduled check-out</th>
                <th>Actual check-in</th>
                <th>Actual check-out</th>
                <th>Guest</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Room type</th>
                <th>Confirmation #</th>
                <th>Remarks</th>
                <th>Created</th>
            </tr>
        </thead>
        <tbody>
            @foreach($bookings as $b)
                <tr>
                    <td>{{ $b->public_id }}</td>
                    <td>{{ $b->hotel?->name }}</td>
                    <td>{{ $b->client?->name }}</td>
                    <td>{{ $b->status->value }}</td>
                    <td>{{ optional($b->check_in_date)->toDateString() }}</td>
                    <td>{{ $b->check_out_date ? $b->check_out_date->toDateString() : 'OPEN' }}</td>
                    <td>{{ $b->actual_check_in_date ? $b->actual_check_in_date->toDateString() : '—' }}</td>
                    <td>{{ $b->actual_check_in_date ? ($b->actual_check_out_date ? $b->actual_check_out_date->toDateString() : 'OPEN') : '—' }}</td>
                    <td>{{ $b->guest_name }}</td>
                    <td>{{ $b->guest_email }}</td>
                    <td>{{ $b->guest_phone }}</td>
                    <td>{{ $b->single_or_twin }}</td>
                    <td>{{ $b->confirmation_number }}</td>
                    <td>{{ $b->remarks }}</td>
                    <td>{{ optional($b->created_at)->toDateTimeString() }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>

