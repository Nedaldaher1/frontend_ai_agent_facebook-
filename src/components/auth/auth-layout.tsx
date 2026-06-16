import type { PropsWithChildren } from "react";
import { Check, Diamond } from "lucide-react";

import { brand } from "@/constants/theme";
import { cn } from "@/lib/utils";

const FEATURES = [
  "إدارة كتالوج العبايات بالكامل",
  "مراجعة خصائص الذكاء الاصطناعي واعتمادها",
  "تحكّم بالنشر لما يراه الزبائن",
] as const;

type AuthLayoutProps = PropsWithChildren<{
  /** Short Arabic heading shown above the form (e.g. "تسجيل الدخول"). */
  heading: string;
  /** Supporting line under the heading. */
  subheading: string;
}>;

/**
 * Split-screen auth shell in the Masa design language (the_goal.html):
 * a dark branded panel beside a light form area. The brand panel is hidden on
 * small screens, where a compact brand mark appears above the form instead.
 */
export const AuthLayout = ({
  heading,
  subheading,
  children,
}: AuthLayoutProps) => {
  return (
    <div className={cn("grid min-h-svh", "lg:grid-cols-2")}>
      {/* Brand panel (right in RTL) */}
      <aside
        className={cn(
          "relative hidden overflow-hidden p-12 lg:flex lg:flex-col lg:justify-between",
          "bg-[#14161B] text-[#E7E8EC]"
        )}
      >
        {/* soft accent glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -start-24 size-72 rounded-full bg-primary/25 blur-3xl"
        />

        <BrandMark name={brand.name} />

        <div className="relative z-10 max-w-md">
          <h2 className="text-2xl font-semibold leading-snug text-white">
            أدِر كتالوجك، ودع المساعد الذكي يتولّى البيع.
          </h2>
          <p className="mt-4 text-sm leading-7 text-[#9AA0A9]">
            يقرأ المساعد الذكي هذا الكتالوج مباشرةً للردّ على زبائنك — هذه اللوحة
            هي مصدر الحقيقة لكل ما يعرضه لهم.
          </p>
          <ul className="mt-8 flex flex-col gap-4">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-3">
                <span className="flex size-6 flex-none items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Check className="size-3.5" />
                </span>
                <span className="text-sm text-[#D4D7DD]">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-[#5C6068]">
          بيانات تجريبية — غير مربوطة بالخادم
        </p>
      </aside>

      {/* Form area (left in RTL) */}
      <main className="flex items-center justify-center bg-[#F4F5F7] p-6 sm:p-10">
        <div className="w-full max-w-[420px]">
          {/* compact brand mark for small screens */}
          <div className="mb-8 flex justify-center lg:hidden">
            <BrandMark name={brand.name} compact />
          </div>

          <div className="mb-7 text-center sm:text-start">
            <h1 className="text-2xl font-semibold tracking-tight text-[#14161B]">
              {heading}
            </h1>
            <p className="mt-2 text-sm text-[#7A7F88]">{subheading}</p>
          </div>

          {children}
        </div>
      </main>
    </div>
  );
};

AuthLayout.displayName = "AuthLayout";

const BrandMark = ({ name, compact }: { name: string; compact?: boolean }) => (
  <div className="relative z-10 flex items-center gap-3">
    <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-white shadow-[0_6px_16px_-6px_#2b50d6]">
      <Diamond className="size-5" />
    </div>
    <div>
      <div
        className={cn(
          "font-semibold leading-tight",
          compact ? "text-[#14161B]" : "text-white"
        )}
      >
        {name}
      </div>
      <div className="text-xs text-[#7C808A]">لوحة التحكّم</div>
    </div>
  </div>
);
