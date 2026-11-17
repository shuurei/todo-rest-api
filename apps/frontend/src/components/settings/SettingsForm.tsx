import type { FormHTMLAttributes } from 'react';

interface SettingsFormProps extends FormHTMLAttributes<HTMLFormElement> {
    isPending: boolean;
}

const SettingsForm = ({ children, isPending, ...props }: SettingsFormProps) => (
    <form aria-busy={isPending} className="flex flex-col gap-6" {...props}>
        <fieldset disabled={isPending} className="flex min-w-0 flex-col gap-6 disabled:opacity-60">
            {children}
        </fieldset>
    </form>
);

export default SettingsForm;
