import { Link, usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { name } = usePage().props;

    return (
        <div className="relative grid h-dvh flex-col items-center justify-center px-8 sm:px-0 lg:max-w-none lg:grid-cols-2 lg:px-0 bg-background text-foreground">
            <div className="relative hidden h-full flex-col p-10 text-white lg:flex shadow-[10px_0_20px_-10px_rgba(0,0,0,0.3)] z-10">
                <div 
                    className="absolute inset-0 bg-zinc-900 bg-cover bg-center" 
                    style={{ backgroundImage: "url('/images/auth-bg.png')" }} 
                />
                <div className="absolute inset-0 bg-black/30 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <Link
                    href={home()}
                    className="relative z-20 flex items-center drop-shadow-lg"
                >
                    <AppLogoIcon className="mr-3 size-12" />
                    <div className="flex flex-col text-left leading-tight">
                        <span className="text-2xl font-extrabold tracking-tight text-primary drop-shadow-md">
                            Overseas
                        </span>
                        <span className="text-[11px] uppercase font-bold tracking-[0.2em] text-zinc-300 drop-shadow-sm">
                            Marine Solutions
                        </span>
                    </div>
                </Link>
                <div className="relative z-20 mt-auto mb-10">
                    <blockquote className="space-y-3 max-w-lg">
                        <p className="text-xl font-medium leading-relaxed drop-shadow-md text-zinc-100">
                            "Experience unparalleled luxury and seamless hospitality. Your premium stay begins the moment you check in."
                        </p>
                        <footer className="text-sm font-semibold tracking-wide text-zinc-400 uppercase">The Grand Horizon Hotel</footer>
                    </blockquote>
                </div>
            </div>
            <div className="w-full lg:p-8 flex items-center justify-center relative overflow-hidden bg-zinc-50 dark:bg-zinc-950">
                {/* Decorative blobs for modern ambient lighting */}
                <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
                
                <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[420px] relative z-10 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 p-10 rounded-3xl shadow-2xl">
                    <Link
                        href={home()}
                        className="relative z-20 flex items-center justify-center lg:hidden mb-4"
                    >
                        <AppLogoIcon className="h-12 fill-current text-foreground" />
                    </Link>
                    <div className="flex flex-col items-start gap-2 text-left">
                        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
                        <p className="text-sm text-balance text-muted-foreground">
                            {description}
                        </p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
