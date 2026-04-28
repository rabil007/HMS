import { Form, Head } from '@inertiajs/react';
import { Mail, Lock, ArrowRight, CheckCircle } from 'lucide-react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({
    status,
    canResetPassword,
}: Props) {
    return (
        <>
            <Head title="Log in" />

            {/* Status message */}
            {status && (
                <div className="mb-6 flex items-center gap-2.5 rounded-xl bg-primary/10 border border-border/60 px-4 py-3">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    <p className="text-sm font-medium text-foreground">
                        {status}
                    </p>
                </div>
            )}

            <Form
                action={store.url()}
                method="post"
                resetOnSuccess={['password']}
                className="flex flex-col gap-5"
            >
                {({ processing, errors }) => (
                    <>
                        {/* Email field */}
                        <div className="space-y-1.5">
                            <Label
                                htmlFor="email"
                                className="text-[13px] font-semibold text-foreground tracking-wide"
                            >
                                Email Address
                            </Label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="you@example.com"
                                    className="pl-10 h-11 rounded-xl bg-background"
                                />
                            </div>
                            <InputError message={errors.email} />
                        </div>

                        {/* Password field */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label
                                    htmlFor="password"
                                    className="text-[13px] font-semibold text-foreground tracking-wide"
                                >
                                    Password
                                </Label>
                                {canResetPassword && (
                                    <TextLink
                                        href={request()}
                                        className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                                        tabIndex={5}
                                    >
                                        Forgot password?
                                    </TextLink>
                                )}
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Enter your password"
                                    className="pl-10 h-11 rounded-xl bg-background"
                                />
                            </div>
                            <InputError message={errors.password} />
                        </div>

                        {/* Remember me */}
                        <div className="flex items-center gap-2.5">
                            <Checkbox
                                id="remember"
                                name="remember"
                                tabIndex={3}
                                className="rounded-md"
                            />
                            <Label
                                htmlFor="remember"
                                className="text-[13px] text-muted-foreground cursor-pointer select-none"
                            >
                                Keep me signed in
                            </Label>
                        </div>

                        {/* Divider */}
                        <div className="w-full border-t border-border/60 my-1" />

                        {/* Submit button */}
                        <Button
                            type="submit"
                            tabIndex={4}
                            disabled={processing}
                            data-test="login-button"
                            className="w-full h-11 rounded-xl font-semibold tracking-wide text-[14px] transition-all duration-200 group disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {processing ? (
                                <>
                                    <Spinner className="mr-2" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    Sign In to HMS
                                    <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                                </>
                            )}
                        </Button>


                    </>
                )}
            </Form>
        </>
    );
}

Login.layout = {
    title: 'Welcome back',
    description: 'Sign in to your HMS account to continue',
};
