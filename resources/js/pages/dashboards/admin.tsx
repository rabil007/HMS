import Overview from '@/pages/overview';

export default function AdminDashboard(props: any) {
    return <Overview {...props} title="Admin Dashboard" />;
}

AdminDashboard.layout = (page: React.ReactNode) => page;

