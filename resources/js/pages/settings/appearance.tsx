import { Form, Head, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AppearanceTabs from '@/components/appearance-tabs';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { edit as editAppearance } from '@/routes/appearance';

export default function Appearance() {
    const page = usePage();
    const currentSize = ((page.props as any)?.dashboardIconSize as
        | 'sm'
        | 'md'
        | 'lg'
        | undefined) ?? 'lg';
    const [size, setSize] = useState<'sm' | 'md' | 'lg'>(currentSize);

    const label = useMemo(() => {
        return size === 'sm' ? 'Small' : size === 'lg' ? 'Large' : 'Medium';
    }, [size]);

    return (
        <>
            <Head title="Appearance settings" />

            <h1 className="sr-only">Appearance settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Appearance settings"
                    description="Update your account's appearance settings"
                />
                <AppearanceTabs />

                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Dashboard icons"
                        description="Adjust the size of the app icons"
                    />

                    <Form
                        action="/settings/dashboard-icon-size"
                        method="put"
                        options={{ preserveScroll: true }}
                        className="space-y-4"
                    >
                        {({ processing }) => (
                            <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border/50 bg-card/40 p-5 sm:flex-row sm:items-center">
                                <div className="space-y-1">
                                    <div className="text-sm font-semibold text-foreground">
                                        Icon size
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Current: {label}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="grid gap-1.5">
                                        <Label
                                            htmlFor="dashboard_icon_size"
                                            className="sr-only"
                                        >
                                            Icon size
                                        </Label>
                                        <select
                                            id="dashboard_icon_size"
                                            name="size"
                                            value={size}
                                            onChange={(e) =>
                                                setSize(
                                                    e.target.value as
                                                        | 'sm'
                                                        | 'md'
                                                        | 'lg',
                                                )
                                            }
                                            className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs"
                                        >
                                            <option value="sm">Small</option>
                                            <option value="md">Medium</option>
                                            <option value="lg">Large</option>
                                        </select>
                                    </div>

                                    <Button type="submit" disabled={processing}>
                                        Save
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Form>
                </div>
            </div>
        </>
    );
}

Appearance.layout = {
    breadcrumbs: [
        {
            title: 'Appearance settings',
            href: editAppearance(),
        },
    ],
};
