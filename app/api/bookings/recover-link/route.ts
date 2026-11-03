import { NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/lib/server/csrf';
import { checkBookingRateLimit, recordBookingAttempt } from '@/lib/server/rate-limit';
import { requestGuestBookingRecovery } from '@/lib/server/bookings';

function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || 'unknown';
}

/**
 * Public endpoint to request resending a guest booking access link
 * to the registered contact email.
 * - Rate-limited by IP and email.
 * - Generic 200 response regardless of whether matching booking exists,
 *   preventing account/booking enumeration.
 */
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  const ip = clientIp(request);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const email = typeof (body as { email?: unknown })?.email === 'string'
    ? (body as { email: string }).email.trim()
    : '';
  const reference = typeof (body as { reference?: unknown })?.reference === 'string'
    ? (body as { reference: string }).reference.trim()
    : undefined;

  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
  }

  const limit = await checkBookingRateLimit(email, ip);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  await recordBookingAttempt(email, ip);
  await requestGuestBookingRecovery(email, reference);

  return NextResponse.json({
    success: true,
    message: 'If a matching reservation exists for that email, an access link has been sent.',
  });
}
