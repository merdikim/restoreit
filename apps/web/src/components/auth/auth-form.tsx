import { useState } from 'react';

type AuthFormProps = {
  title: string;
  subtitle: string;
  submitLabel: string;
  error?: string | null;
  isSubmitting?: boolean;
  onSubmit: (values: { email: string; password: string }) => void;
};

export function AuthForm(props: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        props.onSubmit({ email, password });
      }}
    >
      <div>
        <h1 className="text-3xl font-semibold">{props.title}</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">{props.subtitle}</p>
      </div>
      <label className="block space-y-2">
        <span className="text-sm text-[var(--muted)]">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none"
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm text-[var(--muted)]">Password</span>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none"
        />
      </label>
      {props.error ? <p className="text-sm text-[var(--danger)]">{props.error}</p> : null}
      <button
        type="submit"
        disabled={props.isSubmitting}
        className="w-full rounded-full bg-[var(--brand)] px-5 py-3 font-semibold text-white disabled:opacity-60"
      >
        {props.isSubmitting ? 'Please wait...' : props.submitLabel}
      </button>
    </form>
  );
}
