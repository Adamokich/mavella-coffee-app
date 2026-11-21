import crypto from 'node:crypto';
import type { TrackingTokenResult } from '../types/tracking.token.type.js';

export function getTrackingToken(idempotencyKey: string): TrackingTokenResult {
  const trackingTokenSecret = process.env.TRACKING_TOKEN_SECRET;

  if (!trackingTokenSecret) {
    throw new Error(
      'Tracking token secret is not found in variable environment',
    );
  }

  const trackingToken = crypto
    .createHmac('sha256', trackingTokenSecret)
    .update(`order-tracking:v1:${idempotencyKey}`)
    .digest('hex');

  const trackingTokenHash = crypto
    .createHash('sha256')
    .update(trackingToken)
    .digest('hex');

  return {
    trackingToken,
    trackingTokenHash,
  };
}
