import React from 'react';

export default function AppWallpaper() {
    return (
        <>
            <div className="absolute inset-0 bg-[#060d1f]" />

            <div
                className="absolute inset-0"
                style={{
                    background: `
      radial-gradient(ellipse 80% 60% at 15% 20%, rgba(14,165,233,0.45) 0%, transparent 55%),
      radial-gradient(ellipse 60% 50% at 80% 10%, rgba(139,92,246,0.40) 0%, transparent 50%),
      radial-gradient(ellipse 70% 55% at 70% 80%, rgba(16,185,129,0.30) 0%, transparent 50%),
      radial-gradient(ellipse 50% 45% at 20% 85%, rgba(59,130,246,0.35) 0%, transparent 50%),
      radial-gradient(ellipse 40% 35% at 50% 50%, rgba(99,102,241,0.20) 0%, transparent 60%)
    `,
                }}
            />

            <div
                className="pointer-events-none absolute inset-0 bg-[#030712]/30"
                style={{
                    mixBlendMode: 'multiply',
                }}
            />

            <div
                className="absolute inset-0 opacity-[0.045]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                    backgroundSize: '180px 180px',
                }}
            />

            <div
                className="pointer-events-none absolute inset-0 animate-[shimmer_10s_ease-in-out_infinite]"
                style={{
                    background:
                        'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.025) 50%, transparent 60%)',
                }}
            />
        </>
    );
}
