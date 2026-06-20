import { useState } from "react";

import { useLink, useRegister } from "@refinedev/core";

import { AuthLayout } from "@/components/auth/auth-layout";
import { InputPassword } from "@/components/refine-ui/form/input-password";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type RegisterVariables = {
  name: string;
  email: string;
  password: string;
};

export const Register = () => {
  const Link = useLink();
  const { mutate: register } = useRegister<RegisterVariables>();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password.length < 8) {
      setError("كلمة المرور يجب ألّا تقلّ عن ٨ أحرف");
      return;
    }
    if (password !== confirm) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }

    setError(null);
    setSubmitting(true);
    register(
      { name, email, password },
      { onSettled: () => setSubmitting(false) }
    );
  };

  const fieldClass = cn("h-11 rounded-xl bg-card");

  return (
    <AuthLayout
      heading="إنشاء حساب"
      subheading="أنشئ حسابك لإدارة كتالوج ماسة فاشن."
    >
      <Card className="rounded-2xl border-line shadow-sm dark:shadow-none">
        <CardContent className="p-6 sm:p-7">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">الاسم</Label>
              <Input
                id="name"
                autoComplete="name"
                required
                placeholder="اسمك الكامل"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={fieldClass}
              />
            </div>

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
              <Label htmlFor="password">كلمة المرور</Label>
              <InputPassword
                id="password"
                autoComplete="new-password"
                required
                placeholder="٨ أحرف على الأقل"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={fieldClass}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="confirm">تأكيد كلمة المرور</Label>
              <InputPassword
                id="confirm"
                autoComplete="new-password"
                required
                placeholder="أعد إدخال كلمة المرور"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={fieldClass}
              />
            </div>

            {error && (
              <p className="text-sm font-medium text-destructive">{error}</p>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="h-11 w-full rounded-xl"
            >
              {submitting ? "جارٍ الإنشاء…" : "إنشاء الحساب"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-sm text-ink-muted">
        لديك حساب بالفعل؟{" "}
        <Link
          to="/login"
          className="font-semibold text-primary hover:underline"
        >
          سجّل الدخول
        </Link>
      </p>
    </AuthLayout>
  );
};

Register.displayName = "Register";
