import { useState } from "react";

import { useLink, useLogin } from "@refinedev/core";

import { AuthLayout } from "@/components/auth/auth-layout";
import { InputPassword } from "@/components/refine-ui/form/input-password";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type LoginVariables = {
  email: string;
  password: string;
  remember: boolean;
};

export const Login = () => {
  const Link = useLink();
  const { mutate: login } = useLogin<LoginVariables>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    login(
      { email, password, remember },
      { onSettled: () => setSubmitting(false) }
    );
  };

  const fieldClass = cn("h-11 rounded-xl bg-card");

  return (
    <AuthLayout
      heading="تسجيل الدخول"
      subheading="أهلاً بعودتك — ادخل إلى لوحة تحكّم الكتالوج."
    >
      <Card className="rounded-2xl border-line shadow-sm dark:shadow-none">
        <CardContent className="p-6 sm:p-7">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                placeholder="name@masa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={fieldClass}
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">كلمة المرور</Label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  نسيت كلمة المرور؟
                </Link>
              </div>
              <InputPassword
                id="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={fieldClass}
              />
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-2">
              <Checkbox
                checked={remember}
                onCheckedChange={(checked) => setRemember(checked === true)}
              />
              تذكّرني
            </label>

            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="h-11 w-full rounded-xl"
            >
              {submitting ? "جارٍ الدخول…" : "تسجيل الدخول"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-sm text-ink-muted">
        ليس لديك حساب؟{" "}
        <Link
          to="/register"
          className="font-semibold text-primary hover:underline"
        >
          أنشئ حساباً
        </Link>
      </p>
    </AuthLayout>
  );
};

Login.displayName = "Login";
