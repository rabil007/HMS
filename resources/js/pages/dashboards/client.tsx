import Overview from '@/pages/overview';

export default function ClientDashboard(props: any) {
    return <Overview {...props} title="Client Dashboard" />;
}

ClientDashboard.layout = (page: React.ReactNode) => page;

