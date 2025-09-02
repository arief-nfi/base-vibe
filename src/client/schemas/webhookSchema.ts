import { z } from 'zod';

export const webhookSchema = z.object({
  partnerId: z.string().uuid('Invalid partner ID'),
  eventType: z.string().min(1).max(100),
  url: z.string().url().max(1000),
  isActive: z.boolean().default(true),
});

export const webhookEditSchema = webhookSchema.extend({
  id: z.string().uuid('Invalid webhook ID'),
});

export type WebhookFormData = z.infer<typeof webhookSchema>;
export type WebhookEditFormData = z.infer<typeof webhookEditSchema>;

export interface Webhook {
  id: string;
  partnerId: string;
  tenantId: string;
  eventType: string;
  url: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  partnerName?: string;
  partnerCode?: string;
}

export interface WebhookListResponse {
  success: boolean;
  data: Webhook[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export interface WebhookResponse {
  success: boolean;
  data: Webhook;
}

export interface WebhookQueryParams {
  page?: number;
  perPage?: number;
  eventType?: string;
  isActive?: boolean;
}

// Available event types for webhooks
export const WEBHOOK_EVENT_TYPES = [
  'user.created',
  'user.updated',
  'user.deleted',
  'partner.created',
  'partner.updated',
  'partner.deleted',
  'integration.key.created',
  'integration.key.updated',
  'integration.key.deleted',
] as const;

export type WebhookEventType = typeof WEBHOOK_EVENT_TYPES[number];