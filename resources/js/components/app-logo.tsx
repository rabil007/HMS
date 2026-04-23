import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-10 items-center justify-center rounded-md bg-transparent">
                <AppLogoIcon className="size-8" />
            </div>
            <div className="ml-2 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-bold text-lg text-primary">
                    Overseas
                </span>
                <span className="truncate text-[10px] uppercase font-medium text-muted-foreground tracking-wider">
                    Marine Solutions
                </span>
            </div>
        </>
    );
}
