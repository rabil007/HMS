import type { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon(props: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img 
            {...props} 
            src="/images/logo.png" 
            alt="Overseas Marine Logo" 
            className={`${props.className || ''} object-contain`} 
        />
    );
}
