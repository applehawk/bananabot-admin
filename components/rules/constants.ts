// Enum Constants
export const RULE_TRIGGERS = [
    'BOT_START', 'GENERATION_REQUESTED', 'GENERATION_COMPLETED', 'CREDITS_CHANGED',
    'PAYMENT_COMPLETED', 'PAYMENT_FAILED', 'TIME', 'ADMIN_EVENT', 'OVERLAY_ACTIVATED',
    'OVERLAY_EXPIRED', 'STATE_CHANGED', 'REFERRAL_INVITE', 'REFERRAL_PAID', 'STREAK_REACHED', 'INSUFFICIENT_CREDITS',
    'CHANNEL_SUBSCRIPTION'
];

export const TRIGGER_DESCRIPTIONS: Record<string, string> = {
    'BOT_START': 'Fired when user sends /start or runs the bot for the first time.',
    'GENERATION_REQUESTED': 'Fired when generation enters PENDING state (before processing).',
    'GENERATION_COMPLETED': 'Fired after successful image generation.',
    'CREDITS_CHANGED': 'Fired when user balance changes (positive or negative).',
    'PAYMENT_COMPLETED': 'Fired when a payment is successfully validated.',
    'PAYMENT_FAILED': 'Fired when payment is explicitly cancelled or fails.',
    'TIME': 'Reserved for scheduled events (Currently Inactive).',
    'ADMIN_EVENT': 'Manual trigger via Admin Console.',
    'OVERLAY_ACTIVATED': 'Fired when Tripwire overlay is shown to user.',
    'OVERLAY_EXPIRED': 'Fired when an overlay (Bonus/Tripwire) expires.',
    'STATE_CHANGED': 'Fired when FSM State transition occurs.',
    'REFERRAL_INVITE': 'Fired for the NEW USER when they join via referral link.',
    'REFERRAL_PAID': 'Fired for the REFERRER when their invitee starts the bot.',
    'STREAK_REACHED': 'Reserved / Not Implemented.',
    'INSUFFICIENT_CREDITS': 'Fired when user attempts generation without enough credits (Tripwire).',
    'CHANNEL_SUBSCRIPTION': 'Fired when user subscribes to the channel.'
};

export const CONDITION_OPERATORS = [
    'EQUALS', 'NOT_EQUALS', 'GT', 'GTE', 'LT', 'LTE', 'IN', 'NOT_IN', 'EXISTS', 'NOT_EXISTS'
];

export const ACTION_TYPES = [
    'ACTIVATE_OVERLAY', 'DEACTIVATE_OVERLAY',
    'EMIT_EVENT', 'TAG_USER', 'LOG_EVENT', 'NO_OP'
];

export const OVERLAY_TYPES = [
    'TRIPWIRE', 'BONUS', 'REFERRAL', 'SPECIAL_OFFER', 'ONBOARDING', 'INFO'
];

export const LIFECYCLE_STATES = [
    'NEW',
    'ACTIVATING',
    'ACTIVE_FREE',
    'PAYWALL',
    'PAID_ACTIVE',
    'INACTIVE',
    'CHURNED',
    'BLOCKED'
];

export const FSM_CONTEXT_VARIABLES = [
    // Core User Data
    'userId',
    'userTags',
    'credits',
    'totalGenerations',
    'totalPayments',
    'createdAt',
    'preferredModel',
    'lastGenerationAt',
    'lastPaymentAt',
    'lastPaymentFailed',

    // Virtual
    'isPaidUser',
    'isLowBalance',
    'daysSinceCreated',
    'hoursSinceLastPay',
    'hoursSinceLastGen',
    'hoursSinceLastActivity',

    // Payload / FSM Specific
    'payload',
    'triggerEvent',
    'toStateName',
    'fromStateId',

    // Explicitly mentioned in prompts or useful
    'lifecycle', // Virtual mapping to user state
    'overlay.TRIPWIRE', // Specific overlay states if needed
];
