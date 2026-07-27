import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/** Priority levels for notifications. */
const Priority = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  MUTE: 'mute',
} as const;

type PriorityLevel = typeof Priority[keyof typeof Priority];

/**
 * AI-powered notification filtering and prioritization.
 * Analyzes notification patterns to reduce noise and surface important alerts.
 */
@Injectable()
export class AiNotificationsService {
  private readonly logger = new Logger(AiNotificationsService.name);

  constructor() {}

  /**
   * Categorize and prioritize a notification.
   */
  categorizeNotification(notification: {
    type: string;
    senderId?: string;
    recipientId?: string;
    content?: string;
    metadata?: any;
  }): { priority: string; category: string; shouldNotify: boolean; reason: string } {
    const type = notification.type;

    // CRITICAL: Security and account
    if (type === 'security_alert' || type === 'login_new_device' || type === 'password_changed') {
      return { priority: 'critical', category: 'security', shouldNotify: true, reason: 'Security event' };
    }

    // CRITICAL: Payments
    if (type === 'payment_received' || type === 'payout_processed' || type === 'payout_failed') {
      return { priority: 'critical', category: 'payment', shouldNotify: true, reason: 'Payment event' };
    }

    // HIGH: Direct messages
    if (type === 'dm_received' || type === 'message') {
      return { priority: 'high', category: 'message', shouldNotify: true, reason: 'Direct message' };
    }

    // HIGH: Replies and mentions
    if (type === 'reply' || type === 'mention') {
      return { priority: 'high', category: 'interaction', shouldNotify: true, reason: 'Direct engagement' };
    }

    // MEDIUM: Follow requests
    if (type === 'follow_request') {
      return { priority: 'medium', category: 'social', shouldNotify: true, reason: 'Follow request' };
    }

    // MEDIUM: Reactions on your content
    if (type === 'reaction' || type === 'like') {
      return { priority: 'medium', category: 'engagement', shouldNotify: true, reason: 'Content engagement' };
    }

    // LOW: New followers (non-request)
    if (type === 'new_follower') {
      return { priority: 'low', category: 'social', shouldNotify: true, reason: 'New follower' };
    }

    // LOW: Group activity
    if (type === 'group_invite' || type === 'group_post') {
      return { priority: 'low', category: 'group', shouldNotify: true, reason: 'Group activity' };
    }

    // MUTE: System, promotional, marketing
    if (type === 'system' || type === 'promo' || type === 'marketing' || type === 'newsletter') {
      return { priority: 'mute', category: 'system', shouldNotify: false, reason: 'System/promotional notification' };
    }

    // Default: medium
    return { priority: 'medium', category: 'other', shouldNotify: true, reason: 'General notification' };
  }

  /**
   * Batch process notifications for smart filtering.
   */
  filterNotifications(notifications: any[]): {
    critical: any[];
    high: any[];
    medium: any[];
    low: any[];
    muted: any[];
  } {
    const result = { critical: [], high: [], medium: [], low: [], muted: [] };

    for (const notification of notifications) {
      const { priority, ...rest } = this.categorizeNotification(notification);
      const enriched = { ...notification, ...rest };

      switch (priority) {
        case 'critical': result.critical.push(enriched); break;
        case 'high': result.high.push(enriched); break;
        case 'medium': result.medium.push(enriched); break;
        case 'low': result.low.push(enriched); break;
        case 'mute': result.muted.push(enriched); break;
      }
    }

    return result;
  }

  /**
   * Generate a smart notification digest (daily summary).
   */
  generateDigest(notifications: any[]): {
    summary: string;
    criticalCount: number;
    unreadCount: number;
    topCategories: string[];
    highlights: any[];
  } {
    const filtered = this.filterNotifications(notifications);
    const total = notifications.length;
    const unread = notifications.filter((n: any) => !n.read).length;

    const topCategories = Array.from(
      new Set(
        [...filtered.critical, ...filtered.high, ...filtered.medium]
          .map((n: any) => n.category)
      )
    ).slice(0, 5);

    const highlights = [
      ...filtered.critical,
      ...filtered.high.slice(0, 5),
    ];

    let summary = '';
    if (filtered.critical.length > 0) {
      summary += `${filtered.critical.length} critical notification(s). `;
    }
    if (filtered.high.length > 0) {
      summary += `${filtered.high.length} important update(s). `;
    }
    if (filtered.medium.length > 0) {
      summary += `${filtered.medium.length} new engagement(s). `;
    }
    if (!summary) {
      summary = total === 0 ? 'No new notifications.' : 'Nothing urgent — you\'re all caught up!';
    }

    return {
      summary: summary.trim(),
      criticalCount: filtered.critical.length,
      unreadCount: unread,
      topCategories,
      highlights,
    };
  }
}
