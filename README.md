## HMS (Hotel Management System)

Multi-tenant (tenant-per-row) hotel booking request system built with **Laravel 13 + Fortify**, **Inertia v3 + React**, **MySQL**, and **Wayfinder**.

### Roles
- **Admin**: platform operator (no `hotel_id`), can view all bookings and manage reference data.
- **Hotel**: hotel-side users (`hotel_id` required), review/approve/reject bookings for their hotel.
- **Client**: company/booker users (`client_id` required), create booking requests to hotels.

### Booking flow
- **Client submits request** (status: `pending`)
  - Scheduled/requested dates: `check_in_date`, `check_out_date` (`NULL` checkout means **OPEN**)
  - Guest info is **required** on the form (no auto-fill).
- **Hotel approves**
  - Sets **actual** dates in the same approve modal:
    - `actual_check_in_date`, `actual_check_out_date`
  - Adds `confirmation_number` + optional `remarks`
  - Status becomes `confirmed`
- **Hotel rejects**
  - Adds required `remarks`
  - Status becomes `rejected`

### Exports
The bookings list supports server-side filters/sorting/pagination and export to **CSV/XLSX/PDF**.

### Favicon
The favicon uses the project logo from `public/images/logo_transparent.png` and is served via:
- `public/favicon.ico`
- `public/favicon.png`
- `public/apple-touch-icon.png`

### Development
- Backend tests: `php artisan test --compact`
- Frontend dev server: `npm run dev`

