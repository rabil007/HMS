import Overview from '@/pages/overview';

export default function HotelDashboard(props: any) {
    return <Overview {...props} title="Hotel Dashboard" />;
}

HotelDashboard.layout = (page: React.ReactNode) => page;

