# دليل ربط الواجهة الأمامية — Masa Fashion AI Agent (Backend API)

هذا الملف هو **العقد الكامل** بين الـ backend ولوحة التحكم (Next.js). كل ما يحتاجه مطوّر
الفرونت إند ليفهم: ما هي المسارات (routes)، كيف يستدعيها، ما الذي يرسله، ما الذي يرجع له،
وما النتيجة النهائية المتوقعة لكل عملية.

> المصدر: مُستخرَج مباشرةً من الـ controllers والـ DTOs في `src/`. كل الحقول والمسارات أدناه
> مطابقة للكود الفعلي. للتجربة التفاعلية الحيّة افتح توثيق Scalar على `/docs` (انظر أدناه).

---

## 0. الأساسيات (اقرأها أولاً)

| الموضوع | القيمة |
|---|---|
| Base URL (تطوير) | `http://localhost:3000` |
| بادئة عامة (global prefix) | **لا توجد** — المسار كما هو مكتوب تماماً (`/products`، `/admin/...`) |
| التوثيق التفاعلي (Scalar UI) | `GET /docs` |
| ملف الـ OpenAPI الخام | `GET /docs/openapi.json` و `GET /docs/openapi.yaml` |
| الترميز | `application/json` لكل الطلبات/الردود **عدا** رفع الصور (`multipart/form-data`) |
| CORS | مفعّل، يعكس أي origin، مع `credentials: true` |
| المصادقة | Bearer JWT في ترويسة `Authorization` (لا نستخدم cookies) |

**توليد الأنواع تلقائياً (موصى به):** بدل كتابة الأنواع يدوياً، ولّدها من ملف الـ OpenAPI:
```bash
npx openapi-typescript http://localhost:3000/docs/openapi.json -o src/types/api.d.ts
```
هكذا يبقى الفرونت إند متزامناً مع الـ backend بلا ازدواج في التعريفات.

---

## 1. المصادقة (Authentication) — كيف يعمل الربط

الـ backend يستخدم **JWT** بسيط. التدفّق:

1. المستخدم يسجّل أو يسجّل دخول → الـ backend يرجّع `accessToken` (نص JWT) + بيانات المستخدم.
2. الفرونت يخزّن التوكن (مثلاً في `localStorage` أو cookie آمنة من جهة العميل).
3. في **كل طلب لمسار محمي**، يُرسِل الفرونت الترويسة:
   ```
   Authorization: Bearer <accessToken>
   ```
4. صلاحية التوكن الافتراضية **7 أيام** (`JWT_EXPIRES_IN`). عند انتهائها أي طلب محمي يرجّع `401` →
   على الفرونت أن يعيد التوجيه لصفحة تسجيل الدخول.

**حمولة التوكن (payload)** بعد فكّه: `{ sub: <userId>, email, role }`. لا تعتمد على فكّ
التوكن في الواجهة لأخذ القرارات الأمنية — استخدم `GET /auth/me` كمصدر الحقيقة للمستخدم الحالي.

**الأدوار (roles):** `admin` و `editor`. **كل مسارات `/admin/...` ومسارات رفع/إدارة الصور
تقبل الدورين معاً.** لا يوجد حالياً مسار يتطلّب `admin` حصراً.

---

## 2. اتفاقيات عامة (مهمة جداً — اقرأها قبل أي ربط)

### 2.1 تسمية الحقول (casing) — ⚠️ فخّ شائع
ليست كل المفاتيح بنفس النمط؛ انتبه لكل حالة:

- **أجسام الموارد (create/update لمنتج، معرفة، إلخ):** `camelCase`
  مثل `priceJod`, `colorFamily`, `imageUrls`, `isPublished`, `productId`, `adRef`, `isActive`, `canonicalFamily`.
- **جسم تبديل النشر فقط:** `snake_case` → `{ "is_published": true }` (ليس `isPublished`).
- **معاملات الاستعلام (query params):** مختلطة عمداً:
  - بحث المنتجات يستخدم `colorFamily` (camelCase).
  - فلاتر قوائم الأدمن تستخدم `product_id` و `ad_ref` (snake_case).

كل الأجسام `strict`: أي مفتاح غير معروف أو خطأ إملائي → `400 Validation failed` (لا يُتجاهَل بصمت).

### 2.2 المال (الأسعار)
`priceJod` **نص (string)** بثلاث خانات عشرية بنظام الدينار الأردني، مثل `"49.990"`.
- النمط المقبول: `^\d+(\.\d{1,3})?$` (أمثلة صحيحة: `"45"`, `"45.5"`, `"45.990"`).
- **لا تُحوّله إلى `number` لإجراء حسابات** — أبقه نصاً أو استخدم decimal library. أرسله نصاً أيضاً.

### 2.3 التواريخ
`createdAt` و `updatedAt` تُرجَع كنصوص **ISO-8601** (مثل `"2026-06-15T12:00:00.000Z"`).

### 2.4 روابط الصور
حقل `imageUrls` في ردود القراءة يحتوي **روابط كاملة جاهزة** للاستخدام مباشرة في `<img src>`.
لا تبنِ الروابط بنفسك ولا تخزّن مفاتيح — الـ backend يحوّل مفاتيح التخزين إلى روابط عند الإخراج.

### 2.5 الترقيم (Pagination)
- `limit` الافتراضي **50**، الحد الأقصى **200**؛ `offset` الافتراضي **0**.
- بعض القوائم تُرجّع **مغلّفاً** `{ items, total, limit, offset }`، وبعضها يُرجّع **مصفوفة مجرّدة**.
  (موضّح لكل مسار أدناه — لا تفترض الشكل.)

### 2.6 شكل الخطأ الموحّد
أي خطأ يرجع بهذا الغلاف:
```json
{
  "timestamp": "2026-06-18T10:00:00.000Z",
  "path": "/admin/products/123",
  "error": { ... }   // أو نص في حالة 500
}
```
- **أخطاء التحقق (400):** `error = { "message": "Validation failed", "issues": [ ...zod issues... ] }`
  → اعرض `issues` للمستخدم (كل عنصر فيه `path` و `message`).
- **بقية أخطاء HTTP (401/403/404/409):** `error = { "statusCode", "message", "error" }`
  → اعرض `error.message`.
- **خطأ خادم (500):** `error = "Internal server error"` (نص).

دالة مساعدة مقترحة على الفرونت: استخرج الرسالة من `body.error.message ?? body.error` وتعامل مع
`body.error.issues` عند وجودها.

---

## 3. الجدول السريع لكل المسارات

| # | Method | Path | الحماية | الوصف |
|---|---|---|---|---|
| **Auth** ||||
| 1 | POST | `/auth/register` | عام | إنشاء حساب أدمن + إصدار توكن |
| 2 | POST | `/auth/login` | عام | تسجيل دخول + إصدار توكن |
| 3 | GET | `/auth/me` | Bearer | المستخدم الحالي |
| **Products — قراءة (للعميل/الوكيل)** ||||
| 4 | GET | `/products` | عام | بحث في الكتالوج المنشور |
| 5 | GET | `/products/:id` | عام | منتج منشور واحد |
| **Products — كتابة (أدمن)** ||||
| 6 | POST | `/admin/products` | Bearer + admin/editor | إنشاء منتج (مسودّة) |
| 7 | PATCH | `/admin/products/:id` | Bearer + admin/editor | تعديل حقول منتج |
| 8 | DELETE | `/admin/products/:id` | Bearer + admin/editor | حذف منتج |
| 9 | PATCH | `/admin/products/:id/publish` | Bearer + admin/editor | ضبط حالة النشر |
| 10 | GET | `/admin/products` | Bearer + admin/editor | قائمة المنتجات (تشمل المسودّات) |
| **Product Images** ||||
| 11 | POST | `/products/:id/images` | Bearer + admin/editor | رفع صورة/صور لمنتج |
| 12 | GET | `/admin/products/:id/images` | Bearer + admin/editor | سرد صور المنتج |
| 13 | DELETE | `/admin/products/:id/images/:imageId` | Bearer + admin/editor | حذف صورة واحدة |
| 14 | PATCH | `/admin/products/:id/images/:imageId/primary` | Bearer + admin/editor | تعيين صورة رئيسية |
| **Knowledge (قاعدة المعرفة)** ||||
| 15 | POST | `/admin/knowledge` | Bearer + admin/editor | إنشاء مدخل معرفة (مسودّة) |
| 16 | PATCH | `/admin/knowledge/:id` | Bearer + admin/editor | تعديل مدخل |
| 17 | DELETE | `/admin/knowledge/:id` | Bearer + admin/editor | حذف مدخل |
| 18 | PATCH | `/admin/knowledge/:id/publish` | Bearer + admin/editor | ضبط حالة النشر |
| 19 | GET | `/admin/knowledge` | Bearer + admin/editor | قائمة المداخل (تشمل المسودّات) |
| **Color Synonyms (مرادفات الألوان)** ||||
| 20 | POST | `/admin/color-synonyms` | Bearer + admin/editor | إنشاء مرادف لون |
| 21 | GET | `/admin/color-synonyms` | Bearer + admin/editor | قائمة المرادفات |
| 22 | PATCH | `/admin/color-synonyms/:id` | Bearer + admin/editor | تعديل مرادف |
| 23 | DELETE | `/admin/color-synonyms/:id` | Bearer + admin/editor | حذف مرادف |
| **Ad Links (ربط الإعلانات)** ||||
| 24 | POST | `/admin/ad-links` | Bearer + admin/editor | ربط إعلان بمنتج |
| 25 | GET | `/admin/ad-links` | Bearer + admin/editor | قائمة الروابط |
| 26 | PATCH | `/admin/ad-links/:id` | Bearer + admin/editor | تعديل رابط |
| 27 | DELETE | `/admin/ad-links/:id` | Bearer + admin/editor | حذف رابط |
| **Agent / Health** ||||
| 28 | POST | `/agent/message` | عام | إرسال رسالة عميل للوكيل (مؤقّت/تجريبي) |
| 29 | GET | `/health` | عام | فحص حيوية الخدمة + اتصال القاعدة |

> `/orders` و `/conversations` معرّفان لكن **بلا مسارات بعد** (لا تربطهما الآن).

---

## 4. تفصيل أشكال البيانات (Schemas)

### Product (شكل الرد الكامل — `ProductDto`)
```jsonc
{
  "id": "uuid",
  "createdBy": "uuid | null",
  "name": "string",
  "description": "string | null",
  "sku": "string | null",
  "priceJod": "string",                 // "49.990" — نص دائماً
  "colorFamily": "string | null",       // عائلة اللون الموحّدة، مثل "red"
  "colorShade": "string | null",
  "sleeveType": "string | null",
  "fabric": "string | null",
  "embellishment": "string | null",
  "occasion": "string | null",
  "sizes": ["string"] ,                 // أو null
  "stockStatus": "in_stock | low | out",
  "imageUrls": ["https://..."],         // روابط كاملة عند القراءة، أو null
  "tags": ["string"],                   // أو null
  "attributes": { },                    // jsonb حرّ، أو null
  "isPublished": true,
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601"
}
```
**جسم الإنشاء (`POST /admin/products`):** نفس الحقول عدا `id/createdAt/updatedAt`.
المطلوب فقط: `name` و `priceJod`. الباقي اختياري. `isPublished` اختياري ويُفترَض `false` (مسودّة)
إن لم يُرسَل. **لا ترسل `imageUrls` هنا** — الصور تُرفَع عبر مسار الرفع المخصّص.
**جسم التعديل (PATCH):** كل الحقول اختيارية (أرسل ما تريد تغييره فقط).

### KnowledgeEntry (`KnowledgeEntryDto`)
```jsonc
{
  "id": "uuid",
  "createdBy": "uuid | null",
  "category": "faq | policy | shipping | returns | sizing | payment | care | canned_response | product_info | general",
  "title": "string",
  "content": "string",
  "tags": ["string"],          // أو null
  "priority": 0,               // integer
  "isPublished": false,
  "productId": "uuid | null",  // null = معرفة عامة؛ قيمة = خاصة بمنتج
  "situation": "string | null",// الحالة/السؤال الذي يجيب عنه المدخل
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601"
}
```
**الإنشاء:** المطلوب `category`, `title`, `content`. الباقي اختياري.

### ColorSynonym (`ColorSynonymDto`)
```jsonc
{
  "id": "uuid",
  "term": "string",            // مصطلح اللهجة، مثل "نبيتي"
  "canonicalFamily": "string", // العائلة الموحّدة، مثل "red"
  "createdAt": "ISO-8601"
}
```
**الإنشاء:** المطلوب `term` و `canonicalFamily`.

### AdProductLink (`AdProductLinkDto`)
```jsonc
{
  "id": "uuid",
  "adRef": "string",           // slug مرجع الإعلان
  "productId": "uuid",
  "position": 0,               // ترتيب العرض (تصاعدي)
  "isActive": true,            // الوكيل يقرأ النشط فقط
  "campaign": "string | null",
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601"
}
```
**الإنشاء:** المطلوب `adRef` و `productId`. الباقي اختياري.

### User + Auth
```jsonc
// UserResponseDto
{ "id": "uuid", "email": "string", "name": "string | null", "role": "admin | editor" }

// AuthResponseDto (رد register/login)
{ "accessToken": "string(JWT)", "user": { ...UserResponseDto } }
```

---

## 5. تفصيل المسارات (request ⇄ response ⇄ النتيجة المتوقعة)

### 🔑 Auth

#### `POST /auth/register` — عام
- **الجسم:** `{ "name": string, "email": string(email), "password": string(min 8) }`
- **الرد `201`:** `{ accessToken, user }`
- **أخطاء:** `409` البريد مسجّل مسبقاً • `400` تحقق فاشل.
- **النتيجة المتوقعة:** حساب أدمن جديد + توكن جاهز للاستخدام فوراً (سجّل الدخول تلقائياً).

#### `POST /auth/login` — عام
- **الجسم:** `{ "email": string(email), "password": string(min 1) }`
- **الرد `200`:** `{ accessToken, user }`
- **أخطاء:** `401` بريد أو كلمة مرور خاطئة (رسالة عامة عمداً لا تكشف أي الحقلين خاطئ).
- **النتيجة المتوقعة:** خزّن `accessToken` وابدأ إرساله في كل طلب محمي.

#### `GET /auth/me` — Bearer
- **الرد `200`:** `UserResponseDto`.
- **أخطاء:** `401` توكن مفقود/غير صالح.
- **النتيجة المتوقعة:** مصدر الحقيقة للمستخدم الحالي ودوره (لإظهار/إخفاء عناصر الواجهة).

---

### 🛍️ Products — قراءة عامة (واجهة العميل/الوكيل، المنشور فقط)

#### `GET /products` — عام
- **الاستعلام (كلها اختيارية، camelCase، strict):**
  | param | مثال | ملاحظة |
  |---|---|---|
  | `color` | `نبيتي` | مصطلح العميل الخام؛ يُطَبَّع تلقائياً لعائلة لون عبر color synonyms |
  | `colorFamily` | `red` | العائلة الموحّدة؛ **تتقدّم على** `color` عند إرسالهما معاً |
  | `size` | `M` | |
  | `fabric` | `crepe` | |
  | `occasion` | `evening` | |
- **الرد `200`:** `ProductDto[]` (مصفوفة، **بلا** غلاف pagination) — منشورة فقط، بروابط صور كاملة.
- **أخطاء:** `400` معامل غير معروف أو قيمة غير صالحة.
- **النتيجة المتوقعة:** نتائج بحث الكتالوج المرئي للعميل. بلا فلاتر → كامل الكتالوج المنشور.

#### `GET /products/:id` — عام
- **المسار:** `:id` لازم أن يكون **UUID** (غير ذلك `400`).
- **الرد `200`:** `ProductDto`.
- **أخطاء:** `404` لا يوجد منتج **منشور** بهذا المعرّف (المسودّات غير مرئية هنا).

---

### 🛠️ Products — كتابة (أدمن، Bearer + admin/editor)

#### `POST /admin/products`
- **الجسم:** `CreateProduct` (المطلوب `name`, `priceJod`؛ الباقي اختياري). مثال:
  ```json
  { "name": "عباية كلوش", "priceJod": "39.990", "colorFamily": "black",
    "fabric": "crepe", "sizes": ["S","M","L"], "stockStatus": "in_stock" }
  ```
- **الرد `201`:** `ProductDto` (مسودّة، `isPublished=false`).
- **أخطاء:** `400` • `401` • `403`.
- **النتيجة المتوقعة:** منتج مسودّة غير مرئي للعميل/الوكيل حتى تنشره لاحقاً.

#### `PATCH /admin/products/:id`
- **الجسم:** أي مجموعة جزئية من حقول المنتج (تُغيَّر المُرسَلة فقط).
- **الرد `200`:** `ProductDto` بعد التحديث. **أخطاء:** `404` • `400` • `401` • `403`.

#### `DELETE /admin/products/:id`
- **الرد `200`:** `ProductDto` المحذوف (حذف نهائي hard delete). **أخطاء:** `404` • `401` • `403`.

#### `PATCH /admin/products/:id/publish`
- **الجسم (snake_case!):** `{ "is_published": true }` أو `{ "is_published": false }`.
- **الرد `200`:** `ProductDto` بحالة النشر الجديدة. **أخطاء:** `404` • `400` • `401` • `403`.
- **النتيجة المتوقعة:** التحكم بظهور المنتج للعميل/الوكيل (بوابة النشر).

#### `GET /admin/products`
- **الاستعلام:** `published` = `"true"`/`"false"` (اختياري) • `limit` • `offset`.
  (افتراضياً تشمل المسودّات؛ `published=false` = المسودّات فقط.)
- **الرد `200` (مغلّف):** `{ "items": ProductDto[], "total": number, "limit": number, "offset": number }`.
- **أخطاء:** `401` • `403`.

---

### 🖼️ Product Images

> ⚠️ ملاحظة مسار: الرفع على `POST /products/:id/images` (تحت `/products` لا `/admin`) لكنه
> **يتطلّب مصادقة أدمن/محرّر** كبقية مسارات الإدارة. أما السرد/الحذف/التعيين فتحت `/admin/...`.

#### `POST /products/:id/images` — Bearer + admin/editor
- **الترميز:** `multipart/form-data`.
- **الحقل:** `files` — ملف واحد أو أكثر (حقل متكرّر باسم `files`).
- **الاستعلام:** `replace` (اختياري) — `"true"` يستبدل كل الصور بدل الإضافة.
- **القيود:** الأنواع المسموحة `image/jpeg`, `image/png`, `image/webp` • حتى **20 ملف**/طلب •
  الحجم الأقصى **5 MiB**/ملف (افتراضي).
- **الرد `200`:** `ProductDto` بعد إضافة الصور، مع `imageUrls` كروابط كاملة.
- **أخطاء:** `400` لا ملفات • `404` لا منتج • `415` نوع غير مسموح • `413` ملف أكبر من الحد • `401` • `403`.
- **مثال (fetch):**
  ```js
  const fd = new FormData();
  for (const file of selectedFiles) fd.append('files', file);
  await fetch(`/products/${id}/images`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }, // لا تضع Content-Type يدوياً
    body: fd,
  });
  ```
- **النتيجة المتوقعة:** الصور تُحفَظ وتُربَط بالمنتج؛ أول صورة (index 0) هي الرئيسية.

#### `GET /admin/products/:id/images` — Bearer + admin/editor
- **الرد `200`:** `[{ "key": "abc123.jpg", "url": "https://...", "isPrimary": true }]`
  (`isPrimary=true` للعنصر الأول فقط). **أخطاء:** `404` • `401` • `403`.
- **مهم:** `:imageId` في المسارين التاليين هو **`key`** (مثل `abc123.jpg`) وليس UUID.

#### `DELETE /admin/products/:id/images/:imageId` — Bearer + admin/editor
- **الرد `200`:** `ProductDto` بعد إزالة الصورة (تُحذف من التخزين ومن المنتج).
- **أخطاء:** `404` لا منتج أو المفتاح غير موجود • `401` • `403`.

#### `PATCH /admin/products/:id/images/:imageId/primary` — Bearer + admin/editor
- **بلا جسم.** يعيد ترتيب `imageUrls` ليصبح المفتاح المحدّد في index 0.
- **الرد `200`:** `ProductDto` بعد إعادة الترتيب. **أخطاء:** `404` • `401` • `403`.

---

### 📚 Knowledge (قاعدة المعرفة، Bearer + admin/editor)

#### `POST /admin/knowledge`
- **الجسم:** المطلوب `category` (من القائمة)، `title`، `content`. اختياري: `tags`, `priority`,
  `isPublished`, `productId` (لربط المدخل بمنتج)، `situation`.
- **الرد `201`:** `KnowledgeEntryDto` (مسودّة افتراضياً).
- **أخطاء:** `400` • `401` • `403` • `404` (إن أُرسِل `productId` لمنتج غير موجود).

#### `PATCH /admin/knowledge/:id`
- **الجسم:** أي حقول جزئية. **الرد `200`:** `KnowledgeEntryDto`. **أخطاء:** `404` • `400` • `401` • `403`.

#### `DELETE /admin/knowledge/:id`
- **الرد `200`:** `KnowledgeEntryDto` المحذوف. **أخطاء:** `404` • `401` • `403`.

#### `PATCH /admin/knowledge/:id/publish`
- **الجسم (snake_case!):** `{ "is_published": true | false }`.
- **الرد `200`:** `KnowledgeEntryDto`. **أخطاء:** `404` • `400` • `401` • `403`.

#### `GET /admin/knowledge`
- **الاستعلام:** `category` • `product_id` (**snake_case**, UUID) • `published` (`"true"`/`"false"`) •
  `limit` • `offset`.
- **الرد `200` (مغلّف):** `{ items: KnowledgeEntryDto[], total, limit, offset }`. **أخطاء:** `401` • `403`.

---

### 🎨 Color Synonyms (Bearer + admin/editor)

#### `POST /admin/color-synonyms`
- **الجسم:** `{ "term": "نبيتي", "canonicalFamily": "red" }`.
- **الرد `201`:** `ColorSynonymDto`. **أخطاء:** `400` • `401` • `403`.
- **النتيجة المتوقعة:** الوكيل يطبّع لهجة العميل ("نبيتي") لعائلة لون ("red") أثناء البحث.

#### `GET /admin/color-synonyms`
- **الاستعلام:** `limit` • `offset`.
- **الرد `200`:** `ColorSynonymDto[]` (**مصفوفة مجرّدة، بلا غلاف pagination**)، الأحدث أولاً.
- **أخطاء:** `401` • `403`.

#### `PATCH /admin/color-synonyms/:id`
- **الجسم:** `term` و/أو `canonicalFamily`. **الرد `200`:** `ColorSynonymDto`. **أخطاء:** `404` • `400` • `401` • `403`.

#### `DELETE /admin/color-synonyms/:id`
- **الرد `200`:** `ColorSynonymDto` المحذوف. **أخطاء:** `404` • `401` • `403`.

---

### 📢 Ad Links (ربط الإعلانات بالمنتجات، Bearer + admin/editor)

#### `POST /admin/ad-links`
- **الجسم:** المطلوب `adRef` و `productId`. اختياري: `position`, `isActive`, `campaign`.
  ```json
  { "adRef": "summer_2025_abaya", "productId": "uuid", "position": 0, "isActive": true }
  ```
- **الرد `201`:** `AdProductLinkDto`. **أخطاء:** `404` منتج غير موجود • `400` • `401` • `403`.

#### `GET /admin/ad-links`
- **الاستعلام:** `ad_ref` (**snake_case**) • `limit` • `offset`. مرتّبة حسب `position` ثم `created_at`.
- **الرد `200`:** `AdProductLinkDto[]` (**مصفوفة مجرّدة**). **أخطاء:** `401` • `403`.

#### `PATCH /admin/ad-links/:id`
- **الجسم:** أي حقول جزئية (يشمل تبديل `isActive` وإعادة الترتيب بـ `position`).
  تعطيل `isActive` يُخفي الرابط عن الوكيل دون حذفه.
- **الرد `200`:** `AdProductLinkDto`. **أخطاء:** `404` • `400` • `401` • `403`.

#### `DELETE /admin/ad-links/:id`
- **الرد `200`:** `AdProductLinkDto` المحذوف. **أخطاء:** `404` • `401` • `403`.

---

### 🤖 Agent — مسار تجريبي (مؤقّت)

#### `POST /agent/message` — عام
> هذا المسار يحاكي حمولة ManyChat External Request، وهو **مؤقّت** للتطوير/التكامل حتى يُبنى
> الـ webhook الحقيقي. **ليس** شاشة أدمن نمطية، لكن يمكن استخدامه لبناء شاشة "تجربة الوكيل" داخل اللوحة.

- **الجسم:** المطلوب `contactId` و `text`. اختياري: `lastImageUrl` (URL)، `adRef`، `name`.
  ```json
  { "contactId": "12345", "text": "بدي عباية حمرا مقاس M", "adRef": "summer_2025_abaya" }
  ```
- **الرد `200`:** `{ "reply": "string", "products"?: [{ "id", "name", "price" }] }`
  (`products` يظهر فقط عند وجود نتائج كتالوج؛ `price` نص JOD).
- **النتيجة المتوقعة:** ردّ الوكيل النصّي + بطاقات منتجات اختيارية لعرضها.

---

### ❤️ Health

#### `GET /health` — عام
- **الرد `200`:** `{ "status": "ok", "timestamp": "ISO-8601" }` (ينفّذ `select 1` على القاعدة).
- **الاستخدام:** فحص جاهزية الـ backend قبل الإقلاع/في شاشة الحالة.

---

## 6. سيناريوهات ربط شائعة (end-to-end)

### أ) دخول ثم عرض لوحة المنتجات
```
POST /auth/login            → خزّن accessToken
GET  /auth/me               → اعرف الدور (admin/editor)
GET  /admin/products?limit=50&offset=0   (مع Authorization)
                            → اعرض items + اضبط الترقيم على total
```

### ب) إنشاء منتج كامل ونشره
```
POST  /admin/products                        → خذ id من الرد (مسودّة)
POST  /products/:id/images   (multipart)     → ارفع الصور (أول صورة = رئيسية)
PATCH /admin/products/:id/images/:key/primary (اختياري) → غيّر الرئيسية
PATCH /admin/products/:id/publish  { "is_published": true } → انشره
```
**النتيجة:** منتج منشور بصوره يظهر فوراً في `GET /products` للعميل/الوكيل.

### ج) إدارة معرفة مرتبطة بمنتج
```
POST  /admin/knowledge  { category, title, content, productId }  → مسودّة
PATCH /admin/knowledge/:id/publish  { "is_published": true }     → نشر
GET   /admin/knowledge?product_id=<uuid>                         → تحقّق
```

---

## 7. قائمة تحقّق للفرونت إند (Checklist)

- [ ] حقن `Authorization: Bearer <token>` في كل طلب محمي عبر interceptor مركزي.
- [ ] عند `401` على أي طلب → امسح التوكن وأعد التوجيه لتسجيل الدخول.
- [ ] عند رفع الصور: **لا** تضبط `Content-Type` يدوياً (دع المتصفح يضبط boundary).
- [ ] عامل `priceJod` كنص دائماً (لا parseFloat للحساب)، وأرسله نصاً بالنمط الصحيح.
- [ ] استخدم `is_published` (snake) في مسارات النشر فقط، و camelCase في بقية الأجسام.
- [ ] استخدم `product_id` و `ad_ref` (snake) في فلاتر القوائم المعنية.
- [ ] فرّق بين القوائم المغلّفة (`products`, `knowledge`) والمصفوفات المجرّدة (`color-synonyms`, `ad-links`).
- [ ] استخدم `imageUrls` كما هي (روابط جاهزة) بلا أي بناء يدوي.
- [ ] وحّد معالجة الأخطاء على غلاف `{ timestamp, path, error }` مع التقاط `error.issues` للتحقق.
- [ ] ولّد الأنواع من `/docs/openapi.json` بدل كتابتها يدوياً.

---

*آخر تحديث: مُولَّد من حالة الكود على فرع `feature/openapi-write-surface-docs`. للأشكال الدقيقة
والأمثلة الحيّة راجع `/docs` (Scalar) و `/docs/openapi.json`.*
