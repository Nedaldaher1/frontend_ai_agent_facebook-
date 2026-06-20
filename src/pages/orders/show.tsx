/**
 * Order detail — reads the order + its items from a single GET /admin/orders/:id,
 * shows customer / delivery / items / money, and drives status transitions.
 *
 * Status changes go through PATCH /admin/orders/:id/status via `useCustomMutation`
 * (NOT the default update path), behind a confirm dialog, and only for transitions
 * valid from the current status. On success the list + this detail are invalidated
 * so both refetch.
 */

import { useState } from "react";
import {
  useCustomMutation,
  useInvalidate,
  useNavigation,
  useOne,
  useParsed,
  type HttpError,
} from "@refinedev/core";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Loader2,
  MapPin,
  MessagesSquare,
  PackageCheck,
  Phone,
  RotateCw,
  Ruler,
  ShoppingBag,
  TriangleAlert,
  Undo2,
  XCircle,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Money,
  OrderColorSwatch,
  OrderItemThumb,
  OrderSourceIcon,
  OrderStatusBadge,
  formatOrderDate,
  shortOrderId,
} from "@/components/orders/order-visuals";
import {
  ORDER_TRANSITIONS,
  type OrderItemDto,
  type OrderStatus,
  type OrderWithItemsDto,
} from "@/types/order";
import { cn } from "@/lib/utils";

/** Copy/dialog metadata per transition target. */
const STATUS_ACTION: Record<
  OrderStatus,
  {
    button: string;
    toast: string;
    title: string;
    desc: string;
    tone: "default" | "destructive";
    Icon: LucideIcon;
  }
> = {
  confirmed: {
    button: "تأكيد الطلب",
    toast: "تم تأكيد الطلب",
    title: "تأكيد الطلب؟",
    desc: "سيتم تحويل الطلب إلى الحالة «مؤكّد».",
    tone: "default",
    Icon: CheckCircle2,
  },
  fulfilled: {
    button: "تحديد كمكتمل",
    toast: "تم إكمال الطلب",
    title: "إكمال الطلب؟",
    desc: "سيتم تحويل الطلب إلى الحالة «مكتمل». هذا إجراء نهائي.",
    tone: "default",
    Icon: PackageCheck,
  },
  canceled: {
    button: "إلغاء الطلب",
    toast: "تم إلغاء الطلب",
    title: "إلغاء الطلب؟",
    desc: "سيتم إلغاء الطلب نهائياً ولن يمكن التراجع.",
    tone: "destructive",
    Icon: XCircle,
  },
  // `draft` is never a transition target; kept so the record is total.
  draft: {
    button: "إرجاع إلى مسودّة",
    toast: "تم الإرجاع إلى مسودّة",
    title: "إرجاع إلى مسودّة؟",
    desc: "سيتم تحويل الطلب إلى الحالة «مسودّة».",
    tone: "default",
    Icon: Undo2,
  },
};

export const OrderShow = () => {
  const { id } = useParsed();
  const { list } = useNavigation();

  const { result, query } = useOne<OrderWithItemsDto>({
    resource: "orders",
    id: id ?? "",
    dataProviderName: "orders",
    queryOptions: { enabled: id != null },
  });
  // useOne's `result` is the record itself (unlike useList's `{ data, total }`).
  const order = result;
  const { isLoading, isError, refetch } = query;

  const { mutate, mutation } = useCustomMutation();
  const invalidate = useInvalidate();
  // The transition awaiting confirmation (null = no dialog open).
  const [pending, setPending] = useState<OrderStatus | null>(null);

  const confirmChange = () => {
    if (!order || !pending) return;
    const next = pending;
    mutate(
      {
        url: `admin/orders/${order.id}/status`,
        method: "patch",
        values: { status: next },
        dataProviderName: "orders",
        successNotification: {
          type: "success",
          message: STATUS_ACTION[next].toast,
        },
        errorNotification: (error?: HttpError) => ({
          type: "error",
          message: error?.message ?? "تعذّر تحديث حالة الطلب",
        }),
      },
      {
        onSuccess: () => {
          invalidate({
            resource: "orders",
            dataProviderName: "orders",
            invalidates: ["list"],
          });
          invalidate({
            resource: "orders",
            dataProviderName: "orders",
            invalidates: ["detail"],
            id: order.id,
          });
          setPending(null);
        },
        onError: () => setPending(null),
      },
    );
  };

  if (isError || (!isLoading && !order)) {
    return <ErrorState onRetry={() => refetch()} onBack={() => list("orders")} />;
  }

  return (
    <div>
      {/* Back */}
      <Button
        variant="ghost"
        className="mb-4 h-auto gap-2 px-2 py-1.5 text-[13px] font-semibold text-ink-muted hover:text-ink"
        onClick={() => list("orders")}
      >
        <ArrowRight className="size-4" />
        العودة إلى الطلبات
      </Button>

      {isLoading || !order ? (
        <DetailSkeleton />
      ) : (
        <>
          {/* Header */}
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1
                  dir="ltr"
                  className="m-0 text-[26px] font-semibold tracking-[-0.4px] text-ink"
                  style={{ fontFeatureSettings: "'tnum'" }}
                >
                  {shortOrderId(order.id)}
                </h1>
                <OrderStatusBadge status={order.status} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-muted">
                <span>{formatOrderDate(order.createdAt, true)}</span>
                <OrderSourceIcon source={order.source} withLabel />
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            {/* Items */}
            <Card title="عناصر الطلب" icon={<ShoppingBag className="size-[18px]" />}>
              {order.items.length === 0 ? (
                <p className="px-1 py-2 text-[13px] text-ink-faint">
                  لا توجد عناصر في هذا الطلب.
                </p>
              ) : (
                <ul role="list" className="flex flex-col gap-3">
                  {order.items.map((item) => (
                    <OrderLine key={item.id} item={item} currency={order.currency} />
                  ))}
                </ul>
              )}
            </Card>

            {/* Side column */}
            <div className="flex flex-col gap-5">
              {/* Status actions */}
              <Card title="الحالة" icon={<CheckCircle2 className="size-[18px]" />}>
                <div className="mb-3">
                  <OrderStatusBadge status={order.status} />
                </div>
                <StatusActions
                  status={order.status}
                  onPick={(next) => setPending(next)}
                />
              </Card>

              {/* Customer / delivery */}
              <Card title="الزبون والتوصيل" icon={<Phone className="size-[18px]" />}>
                <dl className="flex flex-col gap-3">
                  <Field label="رقم الهاتف">
                    {order.phone ? (
                      <CopyPhone phone={order.phone} />
                    ) : (
                      <Muted />
                    )}
                  </Field>
                  <Field label="العنوان" icon={<MapPin className="size-4" />}>
                    {order.address ? (
                      <span className="text-[13.5px] leading-relaxed text-ink-2">
                        {order.address}
                      </span>
                    ) : (
                      <Muted />
                    )}
                  </Field>
                  {order.unifiedSize && (
                    <Field label="المقاس الموحّد" icon={<Ruler className="size-4" />}>
                      <span className="text-[13.5px] text-ink-2">
                        {order.unifiedSize}
                      </span>
                    </Field>
                  )}
                  {order.conversationId && (
                    <Field
                      label="رقم المحادثة"
                      icon={<MessagesSquare className="size-4" />}
                    >
                      <span
                        dir="ltr"
                        className="truncate text-[12.5px] text-ink-muted"
                      >
                        {order.conversationId}
                      </span>
                    </Field>
                  )}
                </dl>
              </Card>

              {/* Money summary */}
              <Card title="الملخّص المالي">
                <dl className="flex flex-col gap-2.5">
                  <SummaryRow label="المجموع الفرعي">
                    <Money value={order.subtotal} currency={order.currency} />
                  </SummaryRow>
                  <SummaryRow label="رسوم التوصيل">
                    <Money value={order.deliveryFee} currency={order.currency} />
                  </SummaryRow>
                  <div className="mt-1 border-t border-line pt-2.5">
                    <SummaryRow label="الإجمالي" strong>
                      <Money
                        value={order.total}
                        currency={order.currency}
                        strong
                        className="text-[15px] text-ink"
                      />
                    </SummaryRow>
                  </div>
                </dl>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Confirm transition */}
      <AlertDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open && !mutation.isPending) setPending(null);
        }}
      >
        <AlertDialogContent className="max-w-[380px] rounded-[20px] p-[26px]">
          {pending && (
            <>
              <div
                className={cn(
                  "mb-4 flex size-[52px] items-center justify-center rounded-[15px] border",
                  STATUS_ACTION[pending].tone === "destructive"
                    ? "border-danger-line bg-danger-bg text-danger-fg"
                    : "border-accent-line bg-accent-soft text-primary",
                )}
              >
                {(() => {
                  const Icon = STATUS_ACTION[pending].Icon;
                  return <Icon className="size-5" />;
                })()}
              </div>
              <AlertDialogTitle className="text-lg font-semibold text-ink">
                {STATUS_ACTION[pending].title}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-[13.5px] leading-relaxed text-ink-muted">
                {STATUS_ACTION[pending].desc}
              </AlertDialogDescription>
              <AlertDialogFooter className="mt-[22px] gap-2.5 sm:justify-stretch">
                <Button
                  variant={
                    STATUS_ACTION[pending].tone === "destructive"
                      ? "destructive"
                      : "default"
                  }
                  className="h-auto flex-1 gap-2 rounded-[12px] py-[11px] font-semibold"
                  disabled={mutation.isPending}
                  onClick={confirmChange}
                >
                  {mutation.isPending && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  تأكيد
                </Button>
                <AlertDialogCancel
                  disabled={mutation.isPending}
                  className="m-0 h-auto flex-1 rounded-[12px] py-[11px] font-semibold"
                >
                  تراجع
                </AlertDialogCancel>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

/** The valid-transition action buttons (or a terminal note). */
function StatusActions({
  status,
  onPick,
}: {
  status: OrderStatus;
  onPick: (next: OrderStatus) => void;
}) {
  const transitions = ORDER_TRANSITIONS[status];
  if (transitions.length === 0) {
    return (
      <p className="text-[13px] leading-relaxed text-ink-faint">
        لا توجد إجراءات متاحة — هذه حالة نهائية.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {transitions.map((next) => {
        const action = STATUS_ACTION[next];
        const Icon = action.Icon;
        return (
          <Button
            key={next}
            variant={action.tone === "destructive" ? "outline" : "default"}
            className={cn(
              "h-auto w-full justify-start gap-2 rounded-[12px] py-[11px] font-semibold",
              action.tone === "destructive" &&
                "border-danger-line text-danger-fg hover:bg-danger-bg",
            )}
            onClick={() => onPick(next)}
          >
            <Icon className="size-[17px]" />
            {action.button}
          </Button>
        );
      })}
    </div>
  );
}

/** A single line item row. */
function OrderLine({
  item,
  currency,
}: {
  item: OrderItemDto;
  currency: string;
}) {
  return (
    <li className="flex items-center gap-3 rounded-[14px] border border-line bg-surface-1 p-2.5">
      <OrderItemThumb
        imageUrl={item.imageUrl}
        storageKey={item.storageKey}
        className="size-[58px]"
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-ink">
          {item.productName || "منتج غير معروف"}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-ink-muted">
          {item.colorName && <OrderColorSwatch colorName={item.colorName} />}
          {item.size && <span>المقاس: {item.size}</span>}
          <span style={{ fontFeatureSettings: "'tnum'" }}>
            الكمية: {item.qty}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-0.5 text-end">
        <Money
          value={item.lineTotal}
          currency={currency}
          className="text-sm font-semibold text-ink"
        />
        <span className="text-[11.5px] text-ink-faint">
          <Money value={item.unitPrice} currency={currency} /> × {item.qty}
        </span>
      </div>
    </li>
  );
}

/** Phone value with a copy-to-clipboard button (LTR). */
function CopyPhone({ phone }: { phone: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (e.g. insecure context) — silently no-op.
    }
  };
  return (
    <div className="inline-flex items-center gap-2">
      <span
        dir="ltr"
        className="text-[13.5px] font-medium text-ink-2"
        style={{ fontFeatureSettings: "'tnum'" }}
      >
        {phone}
      </span>
      <button
        type="button"
        onClick={copy}
        title="نسخ الرقم"
        aria-label="نسخ رقم الهاتف"
        className="flex size-7 items-center justify-center rounded-[8px] border border-neutral-line bg-card text-ink-muted transition-colors hover:border-accent-line hover:bg-accent-soft hover:text-primary"
      >
        {copied ? (
          <Check className="size-[14px] text-ok-fg" />
        ) : (
          <Copy className="size-[14px]" />
        )}
      </button>
    </div>
  );
}

const cardClass =
  "rounded-[18px] border border-line bg-card p-5 shadow-[0_1px_2px_rgba(16,18,22,.04)]";

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className={cardClass}>
      <h2 className="mb-4 flex items-center gap-2 text-[13px] font-semibold text-ink-faint">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="mb-1 flex items-center gap-1.5 text-[12px] font-medium text-ink-faint">
        {icon}
        {label}
      </dt>
      <dd className="m-0">{children}</dd>
    </div>
  );
}

function SummaryRow({
  label,
  strong = false,
  children,
}: {
  label: string;
  strong?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span
        className={cn(
          "text-[13px]",
          strong ? "font-semibold text-ink" : "text-ink-muted",
        )}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

function Muted() {
  return <span className="text-[13.5px] text-ink-faint">—</span>;
}

function DetailSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className={cn(cardClass, "animate-pulse")}>
        <div className="mb-4 h-3 w-24 rounded bg-line" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-[78px] rounded-[14px] bg-line/60" />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={cn(cardClass, "h-[140px] animate-pulse")}>
            <div className="h-3 w-20 rounded bg-line" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorState({
  onRetry,
  onBack,
}: {
  onRetry: () => void;
  onBack: () => void;
}) {
  return (
    <div>
      <Button
        variant="ghost"
        className="mb-4 h-auto gap-2 px-2 py-1.5 text-[13px] font-semibold text-ink-muted hover:text-ink"
        onClick={onBack}
      >
        <ArrowRight className="size-4" />
        العودة إلى الطلبات
      </Button>
      <div className="rounded-[18px] border border-danger-line bg-card px-[30px] py-[60px] text-center shadow-[0_1px_2px_rgba(16,18,22,.04)]">
        <div className="mx-auto mb-5 flex size-[78px] items-center justify-center rounded-[22px] border border-danger-line bg-danger-bg text-danger-fg">
          <TriangleAlert className="size-8" />
        </div>
        <h2 className="mb-2 text-xl font-semibold text-ink">تعذّر تحميل الطلب</h2>
        <p className="mx-auto mb-6 max-w-[380px] text-sm leading-[1.7] text-ink-muted">
          قد يكون الطلب غير موجود أو حدث خطأ في الاتصال. حاول مرّة أخرى.
        </p>
        <Button
          variant="outline"
          className="mx-auto h-auto gap-2 rounded-[12px] px-5 py-[11px] font-semibold"
          onClick={onRetry}
        >
          <RotateCw className="size-4" />
          إعادة المحاولة
        </Button>
      </div>
    </div>
  );
}
