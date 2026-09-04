'use client';

import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  CheckCircle2,
  ChevronRight,
  Clock3,
  Gift,
  Mail,
  MessageSquare,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  TicketPercent,
  XCircle,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type FieldName =
  | 'userId'
  | 'phone'
  | 'email'
  | 'privacy'
  | 'terms'
  | 'smsOptIn'
  | 'emailOptIn'
  | 'form';

type FormState = {
  userId: string;
  phone: string;
  email: string;
  privacy: boolean;
  terms: boolean;
  smsOptIn: boolean;
  emailOptIn: boolean;
};

type SignupApiResponse = {
  message?: string;
  fieldErrors?: Partial<
    Record<
      | 'user_id'
      | 'phone'
      | 'email'
      | 'privacy_agreed'
      | 'terms_agreed'
      | 'form',
      string
    >
  >;
};

const initialForm: FormState = {
  userId: '',
  phone: '',
  email: '',
  privacy: false,
  terms: false,
  smsOptIn: true,
  emailOptIn: true,
};

const coupons = [
  {
    rate: '50%',
    label: '첫 구매 전환 쿠폰',
    minimum: '10,000원 이상',
    limit: '최대 10,000원',
    period: '가입일 포함 7일',
    tone: 'bg-[#193c34] text-white',
  },
  {
    rate: '20%',
    label: '추가 구매 쿠폰',
    minimum: '20,000원 이상',
    limit: '최대 10,000원',
    period: '14일',
    tone: 'bg-[#d7b56d] text-[#1c1914]',
  },
  {
    rate: '10%',
    label: '재방문 쿠폰',
    minimum: '30,000원 이상',
    limit: '최대 10,000원',
    period: '30일',
    tone: 'bg-[#f3eee4] text-[#193c34]',
  },
];

const policies = [
  '회원 ID당 각 쿠폰 1회 발급',
  '주문 1건당 쿠폰 1장 사용',
  '다른 장바구니 쿠폰과 중복 불가',
  '배송비 적용 불가',
  '일부 특가 상품 제외 가능',
  '만료 후 재발급 불가',
];

function validateForm(form: FormState) {
  const errors: Partial<Record<FieldName, string>> = {};
  const phoneDigits = form.phone.replace(/\D/g, '');

  if (!form.userId.trim()) {
    errors.userId = '아이디를 입력해주세요.';
  }

  if (!phoneDigits) {
    errors.phone = '전화번호를 입력해주세요.';
  } else if (!/^01\d{8,9}$/.test(phoneDigits)) {
    errors.phone = '010-1234-5678 형식의 휴대폰 번호를 입력해주세요.';
  }

  if (!form.email.trim()) {
    errors.email = '이메일을 입력해주세요.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = '올바른 이메일 형식으로 입력해주세요.';
  }

  if (!form.privacy) {
    errors.privacy = '개인정보 처리방침 동의가 필요합니다.';
  }

  if (!form.terms) {
    errors.terms = '이용약관 동의가 필요합니다.';
  }

  return errors;
}

function mapApiFieldErrors(response: SignupApiResponse | null) {
  const fieldErrors = response?.fieldErrors;

  if (!fieldErrors) {
    return {
      form:
        response?.message ??
        '회원가입 정보를 저장하지 못했습니다. 잠시 후 다시 시도해주세요.',
    };
  }

  return {
    userId: fieldErrors.user_id,
    phone: fieldErrors.phone,
    email: fieldErrors.email,
    privacy: fieldErrors.privacy_agreed,
    terms: fieldErrors.terms_agreed,
    form: fieldErrors.form ?? response?.message,
  };
}

export default function Home() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [completed, setCompleted] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsClosed(params.get('status') === 'closed');
  }, []);

  const selectedChannels = useMemo(() => {
    return [
      form.smsOptIn ? '문자' : null,
      form.emailOptIn ? '이메일' : null,
    ].filter(Boolean);
  }, [form.emailOptIn, form.smsOptIn]);

  const updateField = <K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateForm(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/signups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: form.userId.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          privacy_agreed: form.privacy,
          terms_agreed: form.terms,
          sms_marketing_agreed: form.smsOptIn,
          email_marketing_agreed: form.emailOptIn,
        }),
      });
      const result = (await response
        .json()
        .catch(() => null)) as SignupApiResponse | null;

      if (!response.ok) {
        setErrors(mapApiFieldErrors(result));
        return;
      }

      setCompleted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setErrors({
        form: '저장 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isClosed) {
    return <ClosedPromotion />;
  }

  if (completed) {
    return (
      <CompletionScreen
        channels={selectedChannels as string[]}
        userId={form.userId.trim()}
      />
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-[#d7d0c2] bg-[#fbfaf7]/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-full bg-[#193c34] text-sm font-semibold text-white">
              N
            </span>
            <div>
              <p className="text-sm font-semibold text-[#193c34]">
                조선미녀
              </p>
              <p className="text-xs text-muted-foreground">
                신규 회원 웰컴 혜택
              </p>
            </div>
          </div>
          <Badge className="h-7 rounded-md bg-[#e7d7aa] px-3 text-[#1f2f2a]">
            가입 즉시 발급
          </Badge>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-[#ded6c7]">
        <img
          alt=""
          className="absolute inset-y-0 right-0 hidden h-full w-[58%] object-cover object-center lg:block"
          src="/hero-coupon-pack.png"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#fbfaf7_0%,#fbfaf7_44%,rgba(251,250,247,0.72)_62%,rgba(251,250,247,0.1)_100%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-5 py-8 sm:px-8 lg:min-h-[calc(100vh-64px)] lg:grid-cols-[minmax(0,1fr)_430px] lg:items-center lg:py-10">
          <div className="max-w-2xl">
            <Badge
              variant="outline"
              className="h-7 rounded-md border-[#b7a16a] bg-white/75 px-3 text-[#193c34]"
            >
              신규 회원 전원
            </Badge>
            <h1 className="mt-5 text-5xl font-semibold leading-none text-[#17251f] sm:text-6xl lg:text-7xl">
              가입쿠폰팩
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[#4f5a54]">
              신규 회원으로 가입해주셔서 첫 구매에 사용할 수 있는 최대 50%
              쿠폰팩을 드립니다.
            </p>
            <div className="mt-7 flex flex-wrap items-end gap-5">
              <div>
                <p className="text-sm font-medium text-[#64736b]">최대 혜택</p>
                <p className="text-6xl font-semibold leading-none text-[#193c34] sm:text-7xl">
                  50%
                </p>
              </div>
              <div className="mb-2 grid gap-2 text-sm text-[#4f5a54] sm:grid-cols-2">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-[#193c34]" />
                  신규 회원 한정
                </span>
                <span className="flex items-center gap-2">
                  <TicketPercent className="size-4 text-[#193c34]" />
                  회원 ID당 1회
                </span>
                <span className="flex items-center gap-2">
                  <Clock3 className="size-4 text-[#193c34]" />
                  50% 쿠폰 7일
                </span>
                <span className="flex items-center gap-2">
                  <Gift className="size-4 text-[#193c34]" />
                  쿠폰 3종 발급
                </span>
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {coupons.map((coupon) => (
                <article
                  className={`rounded-lg p-4 shadow-sm ring-1 ring-black/5 ${coupon.tone}`}
                  key={coupon.rate}
                >
                  <p className="text-sm opacity-80">{coupon.label}</p>
                  <p className="mt-3 text-4xl font-semibold leading-none">
                    {coupon.rate}
                  </p>
                  <p className="mt-4 text-sm opacity-85">{coupon.period}</p>
                </article>
              ))}
            </div>
          </div>

          <form
            className="rounded-lg border border-[#d7d0c2] bg-white/[0.94] p-5 shadow-[0_24px_70px_rgba(25,60,52,0.14)] backdrop-blur sm:p-6"
            noValidate
            onSubmit={handleSubmit}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#64736b]">신청 정보</p>
                <h2 className="mt-1 text-2xl font-semibold text-[#17251f]">
                  회원가입하고 쿠폰 받기
                </h2>
              </div>
              <Gift className="mt-1 size-6 text-[#b08b36]" />
            </div>

            <div className="mt-6 space-y-4">
              <FormField error={errors.userId} id="userId" label="아이디">
                <Input
                  aria-describedby={errors.userId ? 'userId-error' : undefined}
                  aria-invalid={Boolean(errors.userId)}
                  autoComplete="username"
                  className="h-11 border-[#cfc7b8] bg-[#fbfaf7]"
                  disabled={isSubmitting}
                  id="userId"
                  onChange={(event) =>
                    updateField('userId', event.target.value)
                  }
                  placeholder="예: beauty2026"
                  value={form.userId}
                />
              </FormField>

              <FormField error={errors.phone} id="phone" label="전화번호">
                <Input
                  aria-describedby={errors.phone ? 'phone-error' : undefined}
                  aria-invalid={Boolean(errors.phone)}
                  autoComplete="tel"
                  className="h-11 border-[#cfc7b8] bg-[#fbfaf7]"
                  disabled={isSubmitting}
                  id="phone"
                  inputMode="tel"
                  onChange={(event) => updateField('phone', event.target.value)}
                  placeholder="010-1234-5678"
                  value={form.phone}
                />
              </FormField>

              <FormField error={errors.email} id="email" label="이메일">
                <Input
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  aria-invalid={Boolean(errors.email)}
                  autoComplete="email"
                  className="h-11 border-[#cfc7b8] bg-[#fbfaf7]"
                  disabled={isSubmitting}
                  id="email"
                  onChange={(event) => updateField('email', event.target.value)}
                  placeholder="name@example.com"
                  type="email"
                  value={form.email}
                />
              </FormField>
            </div>

            <div className="mt-6 space-y-3 rounded-lg border border-[#e4dccd] bg-[#fbfaf7] p-4">
              <AgreementRow
                checked={form.privacy}
                error={errors.privacy}
                id="privacy"
                label="개인정보 처리방침에 동의합니다."
                disabled={isSubmitting}
                onChange={(checked) => updateField('privacy', checked)}
                required
              />
              <AgreementRow
                checked={form.terms}
                error={errors.terms}
                id="terms"
                label="이용약관에 동의합니다."
                disabled={isSubmitting}
                onChange={(checked) => updateField('terms', checked)}
                required
              />
              <div className="border-t border-[#e1d9cb] pt-3">
                <p className="mb-3 text-sm font-medium text-[#4f5a54]">
                  제품 선런칭, 프로모션 및 시크릿 할인 정보를 받아볼게요.
                </p>
                <AgreementRow
                  checked={form.smsOptIn}
                  id="smsOptIn"
                  label="문자(SMS/LMS)로 받겠습니다."
                  disabled={isSubmitting}
                  onChange={(checked) => updateField('smsOptIn', checked)}
                />
                <AgreementRow
                  checked={form.emailOptIn}
                  id="emailOptIn"
                  label="이메일로 받겠습니다."
                  disabled={isSubmitting}
                  onChange={(checked) => updateField('emailOptIn', checked)}
                />
                <p className="mt-3 text-sm leading-6 text-[#69756f]">
                  둘 다 선택하지 않아도 회원가입과 쿠폰 발급은 가능합니다.
                </p>
              </div>
            </div>

            {errors.form ? (
              <p className="mt-3 text-sm text-destructive">{errors.form}</p>
            ) : null}

            <Button
              aria-busy={isSubmitting}
              className="mt-6 h-12 w-full rounded-lg bg-[#193c34] text-base text-white hover:bg-[#244b42]"
              disabled={isSubmitting}
              type="submit"
            >
              <Gift className="size-5" />
              {isSubmitting ? '쿠폰 발급 중...' : '회원가입하고 쿠폰 받기'}
              <ChevronRight className="size-5" />
            </Button>
          </form>
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-7 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <Badge className="h-7 rounded-md bg-[#193c34] px-3 text-white">
                쿠폰 정책
              </Badge>
              <h2 className="mt-4 text-3xl font-semibold text-[#17251f]">
                첫 구매는 크게 낮추고, 다음 구매까지 이어갑니다.
              </h2>
              <p className="mt-4 text-base leading-7 text-[#5b665f]">
                50% 쿠폰은 가입 직후 첫 구매 결정을 돕고, 20%와 10% 쿠폰은
                이후 문자와 이메일 CRM에서 재방문 이유로 활용합니다.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {coupons.map((coupon) => (
                <article
                  className="rounded-lg border border-[#ded6c7] bg-[#fbfaf7] p-5"
                  key={coupon.rate}
                >
                  <p className="text-sm font-medium text-[#64736b]">
                    {coupon.label}
                  </p>
                  <p className="mt-3 text-5xl font-semibold leading-none text-[#193c34]">
                    {coupon.rate}
                  </p>
                  <dl className="mt-5 space-y-3 text-sm">
                    <div>
                      <dt className="text-[#7a817d]">최소 구매금액</dt>
                      <dd className="font-medium text-[#17251f]">
                        {coupon.minimum}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[#7a817d]">최대 할인금액</dt>
                      <dd className="font-medium text-[#17251f]">
                        {coupon.limit}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[#7a817d]">유효기간</dt>
                      <dd className="font-medium text-[#17251f]">
                        {coupon.period}
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {policies.map((policy) => (
              <p
                className="flex items-center gap-2 rounded-md border border-[#e4dccd] bg-[#fbfaf7] px-4 py-3 text-sm text-[#4f5a54]"
                key={policy}
              >
                <CheckCircle2 className="size-4 text-[#193c34]" />
                {policy}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[#ded6c7] bg-[#f5f7f1] py-12">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 sm:px-8 lg:grid-cols-3">
          <FlowStep
            icon={<Sparkles className="size-5" />}
            label="혜택 확인"
            text="Meta 광고, SNS 콘텐츠, 브랜드 프로모션 페이지에서 최대 50% 쿠폰팩을 확인합니다."
          />
          <FlowStep
            icon={<ShieldCheck className="size-5" />}
            label="회원가입"
            text="아이디, 전화번호, 이메일과 필수 약관 동의를 확인하고 회원 계정을 만듭니다."
          />
          <FlowStep
            icon={<MessageSquare className="size-5" />}
            label="CRM 전환"
            text="문자 또는 이메일 중 1개 이상 수신 동의하면 1차 전환 고객으로 집계합니다."
          />
        </div>
      </section>
    </main>
  );
}

function FormField({
  children,
  error,
  id,
  label,
}: {
  children: ReactNode;
  error?: string;
  id: string;
  label: string;
}) {
  return (
    <div>
      <Label className="mb-2 text-[#25342f]" htmlFor={id}>
        {label}
      </Label>
      {children}
      {error ? (
        <p className="mt-2 text-sm text-destructive" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function AgreementRow({
  checked,
  disabled,
  error,
  id,
  label,
  onChange,
  required,
}: {
  checked: boolean;
  disabled?: boolean;
  error?: string;
  id: string;
  label: string;
  onChange: (checked: boolean) => void;
  required?: boolean;
}) {
  return (
    <div className="py-1">
      <div className="flex items-start gap-3">
        <Checkbox
          aria-describedby={error ? `${id}-error` : undefined}
          aria-invalid={Boolean(error)}
          checked={checked}
          className="mt-0.5"
          disabled={disabled}
          id={id}
          onCheckedChange={(value) => onChange(value === true)}
        />
        <Label
          className="flex-1 text-sm leading-6 text-[#25342f]"
          htmlFor={id}
        >
          <span>{label}</span>
          {required ? (
            <span className="rounded-sm bg-[#e7d7aa] px-1.5 py-0.5 text-xs text-[#1f2f2a]">
              필수
            </span>
          ) : null}
        </Label>
      </div>
      {error ? (
        <p className="ml-7 mt-1 text-sm text-destructive" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function FlowStep({
  icon,
  label,
  text,
}: {
  icon: ReactNode;
  label: string;
  text: string;
}) {
  return (
    <article className="rounded-lg border border-[#d7d0c2] bg-white p-5">
      <div className="mb-4 grid size-10 place-items-center rounded-md bg-[#193c34] text-white">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-[#17251f]">{label}</h3>
      <p className="mt-3 text-sm leading-6 text-[#5b665f]">{text}</p>
    </article>
  );
}

function CompletionScreen({
  channels,
  userId,
}: {
  channels: string[];
  userId: string;
}) {
  const channelMessage =
    channels.length > 0
      ? `${channels.join('·')} CRM 리스트에 포함되었습니다.`
      : '마케팅 수신은 선택하지 않았습니다. 쿠폰은 정상 발급되었습니다.';

  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#17251f]">
      <section className="relative overflow-hidden border-b border-[#ded6c7]">
        <img
          alt=""
          className="absolute inset-y-0 right-0 h-full w-full object-cover opacity-[0.28]"
          src="/hero-coupon-pack.png"
        />
        <div className="relative mx-auto max-w-6xl px-5 py-12 sm:px-8 lg:py-16">
          <Badge className="h-7 rounded-md bg-[#193c34] px-3 text-white">
            회원가입 완료
          </Badge>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
            {userId}님, 쿠폰 3종이 발급되었습니다.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-[#4f5a54]">
            50% 쿠폰은 가입일 포함 7일 동안 사용할 수 있습니다.
            첫 구매에 먼저 적용해주세요.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button className="h-11 rounded-lg bg-[#193c34] px-4 text-white hover:bg-[#244b42]">
              <TicketPercent className="size-5" />
              쿠폰함 바로가기
            </Button>
            <Button
              className="h-11 rounded-lg border-[#b9ad98] bg-white/80 px-4"
              variant="outline"
            >
              <ShoppingBag className="size-5" />
              제품 보러가기
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-[#d7d0c2] bg-white p-4 text-[#25342f]">
          <CheckCircle2 className="size-5 text-[#193c34]" />
          <p className="text-sm font-medium">{channelMessage}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {coupons.map((coupon) => (
            <article
              className="rounded-lg border border-[#ded6c7] bg-white p-5 shadow-sm"
              key={coupon.rate}
            >
              <p className="text-sm text-[#64736b]">{coupon.label}</p>
              <p className="mt-3 text-5xl font-semibold leading-none text-[#193c34]">
                {coupon.rate}
              </p>
              <dl className="mt-5 space-y-3 text-sm">
                <div>
                  <dt className="text-[#7a817d]">최소 구매금액</dt>
                  <dd className="font-medium">{coupon.minimum}</dd>
                </div>
                <div>
                  <dt className="text-[#7a817d]">최대 할인금액</dt>
                  <dd className="font-medium">{coupon.limit}</dd>
                </div>
                <div>
                  <dt className="text-[#7a817d]">유효기간</dt>
                  <dd className="font-medium">{coupon.period}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function ClosedPromotion() {
  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#17251f]">
      <section className="relative grid min-h-screen place-items-center overflow-hidden px-5 py-12">
        <img
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-[0.22]"
          src="/hero-coupon-pack.png"
        />
        <div className="relative max-w-xl rounded-lg border border-[#d7d0c2] bg-white/[0.92] p-7 text-center shadow-[0_24px_70px_rgba(25,60,52,0.14)] backdrop-blur">
          <XCircle className="mx-auto size-10 text-[#8f523e]" />
          <h1 className="mt-5 text-3xl font-semibold">
            신규 회원 쿠폰팩 프로모션이 종료되었습니다.
          </h1>
          <p className="mt-4 text-base leading-7 text-[#5b665f]">
            다음 신규 회원 혜택이 열리면 문자와 이메일 채널에서 먼저 안내해
            드리겠습니다.
          </p>
          <Button
            className="mt-6 h-11 rounded-lg bg-[#193c34] px-4 text-white hover:bg-[#244b42]"
            onClick={() => {
              window.location.href = window.location.pathname;
            }}
          >
            <Mail className="size-5" />
            진행 중 혜택 보기
          </Button>
        </div>
      </section>
    </main>
  );
}
