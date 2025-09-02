import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '@client/components/ui/checkbox';
import { webhookSchema, WebhookFormData, WEBHOOK_EVENT_TYPES } from '../../schemas/webhookSchema';
import { Partner } from '../../schemas/partnerSchema';

interface WebhookFormProps {
  initialData?: Partial<WebhookFormData>;
  partners: Partner[];
  onSubmit: (data: WebhookFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  isEdit?: boolean;
}

export default function WebhookForm({
  initialData,
  partners,
  onSubmit,
  onCancel,
  isLoading = false,
  isEdit = false,
}: WebhookFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<WebhookFormData>({
    resolver: zodResolver(webhookSchema),
    defaultValues: {
      partnerId: '',
      eventType: '',
      url: '',
      isActive: true,
      ...initialData,
    },
  });

  const watchedIsActive = watch('isActive');

  useEffect(() => {
    if (initialData) {
      reset({
        partnerId: initialData.partnerId || '',
        eventType: initialData.eventType || '',
        url: initialData.url || '',
        isActive: initialData.isActive ?? true,
      });
    }
  }, [initialData, reset]);

  const handleFormSubmit = (data: WebhookFormData) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {/* Partner Selection */}
        <div className="space-y-2">
          <Label htmlFor="partnerId">Partner *</Label>
          <Select
            onValueChange={(value) => setValue('partnerId', value)}
            defaultValue={initialData?.partnerId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a partner" />
            </SelectTrigger>
            <SelectContent>
              {partners.map((partner) => (
                <SelectItem key={partner.id} value={partner.id}>
                  {partner.name} ({partner.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.partnerId && (
            <p className="text-sm text-red-600">{errors.partnerId.message}</p>
          )}
        </div>

        {/* Event Type Selection */}
        <div className="space-y-2">
          <Label htmlFor="eventType">Event Type *</Label>
          <Select
            onValueChange={(value) => setValue('eventType', value)}
            defaultValue={initialData?.eventType}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select event type" />
            </SelectTrigger>
            <SelectContent>
              {WEBHOOK_EVENT_TYPES.map((eventType) => (
                <SelectItem key={eventType} value={eventType}>
                  {eventType}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.eventType && (
            <p className="text-sm text-red-600">{errors.eventType.message}</p>
          )}
        </div>

        {/* Webhook URL */}
        <div className="space-y-2">
          <Label htmlFor="url">Webhook URL *</Label>
          <Input
            id="url"
            type="url"
            placeholder="https://partner.example.com/webhooks/events"
            {...register('url')}
          />
          {errors.url && (
            <p className="text-sm text-red-600">{errors.url.message}</p>
          )}
          <p className="text-sm text-gray-500">
            The URL endpoint where webhook events will be sent via HTTP POST.
          </p>
        </div>

        {/* Active Status */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="isActive"
            checked={watchedIsActive}
            onCheckedChange={(checked) => setValue('isActive', checked)}
          />
          <Label htmlFor="isActive">Active</Label>
          <p className="text-sm text-gray-500">
            Only active webhooks will receive event notifications.
          </p>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : isEdit ? 'Update Webhook' : 'Create Webhook'}
        </Button>
      </div>
    </form>
  );
}