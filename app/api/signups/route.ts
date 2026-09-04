import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type SignupPayload = {
  user_id?: unknown;
  phone?: unknown;
  email?: unknown;
  privacy_agreed?: unknown;
  terms_agreed?: unknown;
  sms_marketing_agreed?: unknown;
  email_marketing_agreed?: unknown;
};

type FieldErrors = Partial<
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

function getString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function getBoolean(value: unknown) {
  return value === true;
}

function validatePayload(payload: SignupPayload) {
  const userId = getString(payload.user_id);
  const phone = getString(payload.phone);
  const phoneDigits = phone.replace(/\D/g, '');
  const email = getString(payload.email).toLowerCase();
  const privacyAgreed = getBoolean(payload.privacy_agreed);
  const termsAgreed = getBoolean(payload.terms_agreed);
  const fieldErrors: FieldErrors = {};

  if (!userId) {
    fieldErrors.user_id = '아이디를 입력해주세요.';
  }

  if (!phoneDigits) {
    fieldErrors.phone = '전화번호를 입력해주세요.';
  } else if (!/^01\d{8,9}$/.test(phoneDigits)) {
    fieldErrors.phone = '010-1234-5678 형식의 휴대폰 번호를 입력해주세요.';
  }

  if (!email) {
    fieldErrors.email = '이메일을 입력해주세요.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = '올바른 이메일 형식으로 입력해주세요.';
  }

  if (!privacyAgreed) {
    fieldErrors.privacy_agreed = '개인정보 처리방침 동의가 필요합니다.';
  }

  if (!termsAgreed) {
    fieldErrors.terms_agreed = '이용약관 동의가 필요합니다.';
  }

  return {
    fieldErrors,
    record: {
      user_id: userId,
      phone: phoneDigits,
      email,
      privacy_agreed: privacyAgreed,
      terms_agreed: termsAgreed,
      sms_marketing_agreed: getBoolean(payload.sms_marketing_agreed),
      email_marketing_agreed: getBoolean(payload.email_marketing_agreed),
      coupon_50_issued: true,
      coupon_20_issued: true,
      coupon_10_issued: true,
    },
  };
}

function jsonError(message: string, status: number, fieldErrors?: FieldErrors) {
  return NextResponse.json({ message, fieldErrors }, { status });
}

function duplicateErrorsFromInsert(message: string) {
  const fieldErrors: FieldErrors = {};
  const normalized = message.toLowerCase();

  if (normalized.includes('user_id')) {
    fieldErrors.user_id =
      '이미 가입된 아이디입니다. 다른 아이디를 입력해주세요.';
  }

  if (normalized.includes('email')) {
    fieldErrors.email =
      '이미 가입된 이메일입니다. 다른 이메일로 입력해주세요.';
  }

  if (Object.keys(fieldErrors).length === 0) {
    fieldErrors.form =
      '이미 가입된 정보가 있습니다. 아이디와 이메일을 확인해주세요.';
  }

  return fieldErrors;
}

export async function POST(request: Request) {
  let payload: SignupPayload;

  try {
    payload = (await request.json()) as SignupPayload;
  } catch {
    return jsonError('요청 형식이 올바르지 않습니다.', 400, {
      form: '입력값을 다시 확인해주세요.',
    });
  }

  const { fieldErrors, record } = validatePayload(payload);

  if (Object.keys(fieldErrors).length > 0) {
    return jsonError('입력값을 다시 확인해주세요.', 400, fieldErrors);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    return jsonError('서버 설정이 아직 완료되지 않았습니다.', 500, {
      form: 'Supabase 환경 변수를 설정한 뒤 다시 시도해주세요.',
    });
  }

  const supabase = createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const [existingUserId, existingEmail] = await Promise.all([
    supabase
      .schema('public')
      .from('signups')
      .select('user_id')
      .eq('user_id', record.user_id)
      .limit(1),
    supabase
      .schema('public')
      .from('signups')
      .select('email')
      .eq('email', record.email)
      .limit(1),
  ]);

  if (existingUserId.error || existingEmail.error) {
    return jsonError('가입 여부를 확인하지 못했습니다.', 500, {
      form: '잠시 후 다시 시도해주세요.',
    });
  }

  const duplicateFieldErrors: FieldErrors = {};

  if ((existingUserId.data ?? []).length > 0) {
    duplicateFieldErrors.user_id =
      '이미 가입된 아이디입니다. 다른 아이디를 입력해주세요.';
  }

  if ((existingEmail.data ?? []).length > 0) {
    duplicateFieldErrors.email =
      '이미 가입된 이메일입니다. 다른 이메일로 입력해주세요.';
  }

  if (Object.keys(duplicateFieldErrors).length > 0) {
    return jsonError('이미 가입된 정보가 있습니다.', 409, duplicateFieldErrors);
  }

  const { error } = await supabase.schema('public').from('signups').insert(record);

  if (error) {
    if (error.code === '23505') {
      return jsonError(
        '이미 가입된 정보가 있습니다.',
        409,
        duplicateErrorsFromInsert(`${error.message} ${error.details ?? ''}`),
      );
    }

    return jsonError('회원가입 정보를 저장하지 못했습니다.', 500, {
      form: '잠시 후 다시 시도해주세요.',
    });
  }

  return NextResponse.json({
    ok: true,
    coupons: {
      coupon_50_issued: true,
      coupon_20_issued: true,
      coupon_10_issued: true,
    },
  });
}
