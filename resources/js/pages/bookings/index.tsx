import { Head, Link } from '@inertiajs/react';
import PageLayout from '@/layouts/page-layout';
import { dashboard } from '@/routes';
import { create } from '@/routes/bookings';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, MapPin, Bed } from 'lucide-react';
import React from 'react';

export default function BookingsIndex({ bookings }: { bookings: any[] }) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <PageLayout title="My Bookings" backHref={dashboard()}>
            <Head title="My Bookings" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground drop-shadow-sm">Reservations</h2>
                    <p className="text-muted-foreground mt-1.5 text-[15px]">View and manage your upcoming stays.</p>
                </div>
                <Button asChild className="rounded-full px-6 shadow-lg shadow-primary/20 h-11 text-[14px] w-full sm:w-auto">
                    <Link href={create()}>
                        <Plus className="mr-2 size-4" />
                        New Booking
                    </Link>
                </Button>
            </div>

            {bookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 sm:p-16 text-center rounded-[2rem] border border-dashed border-border/60 bg-muted/30 backdrop-blur-sm">
                    <div className="h-24 w-24 rounded-[1.5rem] bg-primary/10 flex items-center justify-center mb-6 shadow-inner">
                        <Calendar className="size-10 text-primary" />
                    </div>
                    <h3 className="text-2xl font-semibold mb-3">No active bookings</h3>
                    <p className="text-muted-foreground max-w-sm mb-8 text-[15px] leading-relaxed">
                        You haven't made any reservations yet. Book a room to experience unparalleled luxury.
                    </p>
                    <Button asChild variant="outline" className="rounded-full h-11 px-8 w-full sm:w-auto border-border shadow-sm hover:bg-primary/5">
                        <Link href={create()}>Book a Room</Link>
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {bookings.map((booking) => (
                        <div key={booking.id} className="group relative flex flex-col rounded-[2rem] border border-border/80 bg-card/60 backdrop-blur-xl p-7 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/40 hover:-translate-y-1">
                            <div className="flex items-center justify-between mb-6">
                                <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider
                                    ${booking.status === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300' : ''}
                                    ${booking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300' : ''}
                                    ${booking.status === 'cancelled' ? 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300' : ''}
                                `}>
                                    {booking.status}
                                </span>
                                <span className="text-[11px] text-muted-foreground font-mono bg-muted/60 px-2.5 py-1 rounded-md border border-border/50">
                                    #{booking.public_id.substring(0, 8)}
                                </span>
                            </div>
                            
                            <h3 className="text-xl font-bold mb-2 flex items-center gap-2.5 text-foreground">
                                <MapPin className="size-[18px] text-primary" />
                                {booking.hotel.name}
                            </h3>
                            <div className="flex items-center gap-2.5 text-[15px] text-muted-foreground mb-8 font-medium">
                                <Bed className="size-[18px]" />
                                Room {booking.room.room_number}
                            </div>
                            
                            <div className="mt-auto grid grid-cols-2 gap-4 rounded-2xl bg-muted/40 p-5 border border-border/40">
                                <div>
                                    <span className="block text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1.5">Check In</span>
                                    <span className="text-[15px] font-semibold text-foreground">{formatDate(booking.check_in_date)}</span>
                                </div>
                                <div>
                                    <span className="block text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1.5">Check Out</span>
                                    <span className="text-[15px] font-semibold text-foreground">{formatDate(booking.check_out_date)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </PageLayout>
    );
}

BookingsIndex.layout = (page: React.ReactNode) => page;
