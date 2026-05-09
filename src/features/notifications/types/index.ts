export type NotificationType =
  | 'inquiry_update'
  | 'visit_reminder'
  | 'new_property'
  | 'price_drop'
  | 'message'
  | 'system';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  actionId?: string;
  imageUrl?: string;
}
