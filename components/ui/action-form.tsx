"use client";

import {
  createContext,
  startTransition,
  useActionState,
  useContext,
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  type ComponentProps,
  type FormEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import type { ActionState } from "@/lib/types";
import { cn } from "@/lib/utils";

export type FormAction = (state: ActionState, formData: FormData) => Promise<ActionState>;

type FormContextValue = { errors: Record<string, string[] | undefined>; pending: boolean };
const FormContext = createContext<FormContextValue>({ errors: {}, pending: false });

/** Validation errors and pending state of the surrounding <ActionForm>. */
export function useActionForm() {
  return useContext(FormContext);
}

/**
 * A <form> wired to a Server Action.
 * - shows the action's message as a toast (green on success, red on failure)
 * - gives field errors to the <TextField>/<SelectField>/<TextAreaField> inside it
 * - keeps what the user typed when validation fails
 */
export function ActionForm({
  action,
  onSuccess,
  resetOnSuccess = false,
  className,
  children,
}: {
  action: FormAction;
  onSuccess?: () => void;
  resetOnSuccess?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const [state, dispatch, pending] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleResult = useEffectEvent((result: NonNullable<ActionState>) => {
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success(result.message);
    if (resetOnSuccess) formRef.current?.reset();
    onSuccess?.();
  });

  useEffect(() => {
    if (state) handleResult(state);
  }, [state]);

  // Once the page is interactive we submit through onSubmit: unlike the action prop,
  // this does not clear the inputs after a failed submit. `action` is still set so a
  // submit before JavaScript has loaded is a proper POST to the Server Action
  // (never a GET that would put the password in the URL).
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => dispatch(formData));
  }

  const errors = state && !state.ok ? (state.errors ?? {}) : {};

  return (
    <FormContext value={{ errors, pending }}>
      <form ref={formRef} action={dispatch} onSubmit={handleSubmit} className={className}>
        {children}
      </form>
    </FormContext>
  );
}

export const controlStyles = cn(
  "w-full rounded-lg border border-line bg-white px-3 text-sm text-ink transition-colors",
  "placeholder:text-muted",
  "focus-visible:border-pine-500 focus-visible:outline-2 focus-visible:outline-pine-500/25",
  "aria-[invalid=true]:border-brick-500",
  "disabled:bg-paper disabled:text-muted",
);

type FieldShellProps = { label: string; name: string; hint?: string };

// Label + control + hint + error message, linked together for screen readers.
function FieldShell({
  label,
  name,
  hint,
  required,
  children,
}: FieldShellProps & {
  required?: boolean;
  children: (control: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => ReactNode;
}) {
  const id = useId();
  const error = useActionForm().errors[name]?.[0];
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
        {required && <span className="text-brick-600"> *</span>}
      </label>
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": describedBy })}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-brick-600">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-xs text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

export function TextField({
  label,
  hint,
  className,
  ...props
}: FieldShellProps & Omit<ComponentProps<"input">, "name" | "id">) {
  return (
    <FieldShell label={label} name={props.name} hint={hint} required={props.required}>
      {(control) => <input {...props} {...control} className={cn(controlStyles, "h-10", className)} />}
    </FieldShell>
  );
}

export function TextAreaField({
  label,
  hint,
  className,
  rows = 4,
  ...props
}: FieldShellProps & Omit<ComponentProps<"textarea">, "name" | "id">) {
  return (
    <FieldShell label={label} name={props.name} hint={hint} required={props.required}>
      {(control) => (
        <textarea {...props} {...control} rows={rows} className={cn(controlStyles, "py-2", className)} />
      )}
    </FieldShell>
  );
}

/** Pass the choices as `options`; `placeholder` adds an empty first choice. */
export function SelectField({
  label,
  hint,
  className,
  options,
  placeholder,
  ...props
}: FieldShellProps &
  Omit<ComponentProps<"select">, "name" | "id" | "children"> & {
    options: readonly (string | { value: string | number; label: string })[];
    placeholder?: string;
  }) {
  return (
    <FieldShell label={label} name={props.name} hint={hint} required={props.required}>
      {(control) => (
        <select {...props} {...control} className={cn(controlStyles, "h-10", className)}>
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => {
            const { value, label: text } =
              typeof option === "string" ? { value: option, label: option } : option;
            return (
              <option key={value} value={value}>
                {text}
              </option>
            );
          })}
        </select>
      )}
    </FieldShell>
  );
}
