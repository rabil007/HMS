import { Head, useForm } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';
import React from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import PageLayout from '@/layouts/page-layout';
import { toUrl } from '@/lib/utils';
import { index as bookingsIndex, store as storeBooking } from '@/routes/bookings';

export default function BookingsCreate({ hotels }: { hotels: any[] }) {
    const { data, setData, post, processing, errors } = useForm({
        hotel_id: '',
        room_id: '',
        check_in_date: '',
        check_out_date: '',
        guest_name: '',
        guest_email: '',
        guest_phone: '',
    });

    const selectedHotel = hotels.find(h => h.id.toString() === data.hotel_id);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(toUrl(storeBooking()));
    };

    return (
        <PageLayout title="New Booking" backHref={toUrl(bookingsIndex())}>
            <Head title="Create Booking" />

            <div className="max-w-3xl mx-auto">
                <div className="mb-10 text-center">
                    <h2 className="text-4xl font-extrabold tracking-tight text-foreground drop-shadow-sm">Reserve a Room</h2>
                    <p className="text-muted-foreground mt-3 text-base">Select your destination and dates below to secure your luxury stay.</p>
                </div>

                <div className="bg-card/60 backdrop-blur-2xl rounded-[2rem] sm:rounded-[2.5rem] border border-border/80 shadow-2xl p-6 sm:p-12">
                    <form onSubmit={submit} className="space-y-10">
                        {/* Location & Room */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold flex items-center gap-3">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-primary text-xs shadow-inner">1</span>
                                Destination
                            </h3>
                            
                            <div className="grid gap-6 sm:grid-cols-2 pl-0 sm:pl-10 mt-4 sm:mt-0">
                                <div className="space-y-3">
                                    <Label htmlFor="hotel_id" className="text-muted-foreground font-semibold">Hotel Property</Label>
                                    <Select 
                                        value={data.hotel_id} 
                                        onValueChange={(val) => {
 setData('hotel_id', val); setData('room_id', ''); 
}}
                                    >
                                        <SelectTrigger className="rounded-2xl h-14 bg-muted/30 border-border/60 shadow-sm transition-all focus:ring-primary/30">
                                            <SelectValue placeholder="Select a hotel" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-border/80">
                                            {hotels.map((hotel) => (
                                                <SelectItem key={hotel.id} value={hotel.id.toString()} className="rounded-xl my-1">
                                                    {hotel.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.hotel_id} />
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="room_id" className="text-muted-foreground font-semibold">Available Room</Label>
                                    <Select 
                                        value={data.room_id} 
                                        onValueChange={(val) => setData('room_id', val)}
                                        disabled={!data.hotel_id}
                                    >
                                        <SelectTrigger className="rounded-2xl h-14 bg-muted/30 border-border/60 shadow-sm transition-all focus:ring-primary/30">
                                            <SelectValue placeholder="Select a room" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-border/80">
                                            {selectedHotel?.rooms.map((room: any) => (
                                                <SelectItem key={room.id} value={room.id.toString()} className="rounded-xl my-1">
                                                    Room {room.room_number}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.room_id} />
                                </div>
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold flex items-center gap-3">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-primary text-xs shadow-inner">2</span>
                                Dates
                            </h3>
                            
                            <div className="grid gap-6 sm:grid-cols-2 pl-0 sm:pl-10 mt-4 sm:mt-0">
                                <div className="space-y-3">
                                    <Label htmlFor="check_in_date" className="text-muted-foreground font-semibold">Check-in Date</Label>
                                    <Input
                                        id="check_in_date"
                                        type="date"
                                        value={data.check_in_date}
                                        onChange={(e) => setData('check_in_date', e.target.value)}
                                        className="rounded-2xl h-14 bg-muted/30 border-border/60 shadow-sm transition-all focus:ring-primary/30 [color-scheme:light] dark:[color-scheme:dark]"
                                    />
                                    <InputError message={errors.check_in_date} />
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="check_out_date" className="text-muted-foreground font-semibold">Check-out Date</Label>
                                    <Input
                                        id="check_out_date"
                                        type="date"
                                        value={data.check_out_date}
                                        onChange={(e) => setData('check_out_date', e.target.value)}
                                        className="rounded-2xl h-14 bg-muted/30 border-border/60 shadow-sm transition-all focus:ring-primary/30 [color-scheme:light] dark:[color-scheme:dark]"
                                    />
                                    <InputError message={errors.check_out_date} />
                                </div>
                            </div>
                        </div>

                        {/* Guest Details */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold flex items-center gap-3">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-primary text-xs shadow-inner">3</span>
                                Guest Details
                            </h3>
                            
                            <div className="grid gap-6 sm:grid-cols-2 pl-0 sm:pl-10 mt-4 sm:mt-0">
                                <div className="space-y-3">
                                    <Label htmlFor="guest_name" className="text-muted-foreground font-semibold">Full Name (Optional)</Label>
                                    <Input
                                        id="guest_name"
                                        type="text"
                                        value={data.guest_name}
                                        onChange={(e) => setData('guest_name', e.target.value)}
                                        className="rounded-2xl h-14 bg-muted/30 border-border/60 shadow-sm transition-all focus:ring-primary/30"
                                        placeholder="Leave blank to use profile name"
                                    />
                                    <InputError message={errors.guest_name} />
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="guest_phone" className="text-muted-foreground font-semibold">Phone Number (Optional)</Label>
                                    <Input
                                        id="guest_phone"
                                        type="tel"
                                        value={data.guest_phone}
                                        onChange={(e) => setData('guest_phone', e.target.value)}
                                        className="rounded-2xl h-14 bg-muted/30 border-border/60 shadow-sm transition-all focus:ring-primary/30"
                                        placeholder="+1 234 567 890"
                                    />
                                    <InputError message={errors.guest_phone} />
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-border/60 flex justify-end">
                            <Button 
                                type="submit" 
                                disabled={processing} 
                                className="w-full sm:w-auto sm:px-12 rounded-full h-14 text-[16px] shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform"
                            >
                                {processing ? <Spinner className="mr-2" /> : <CheckCircle2 className="mr-2 size-5" />}
                                Confirm Reservation
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </PageLayout>
    );
}

BookingsCreate.layout = (page: React.ReactNode) => page;
