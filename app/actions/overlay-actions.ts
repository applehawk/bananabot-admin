'use server';

import { prisma } from '@/lib/prisma';
import { OverlayType, LifecycleState, Overlay, OverlayVariant } from '@prisma/client';
import { revalidatePath } from 'next/cache';

// --- OVERLAYS ---

export async function getOverlays() {
    return await prisma.overlay.findMany({
        orderBy: { priority: 'desc' },
        include: {
            variants: true,
            _count: {
                select: { activations: true, events: true }
            }
        }
    });
}

export async function getOverlay(id: string) {
    return await prisma.overlay.findUnique({
        where: { id },
        include: {
            variants: {
                orderBy: { weight: 'desc' }
            }
        }
    });
}

export async function createOverlay(data: any) {
    try {
        const overlay = await prisma.overlay.create({
            data: {
                code: data.code,
                type: data.type as OverlayType,
                priority: Number(data.priority) || 0,
                isActive: data.isActive ?? true,

                ttlSeconds: data.ttlSeconds ? Number(data.ttlSeconds) : null,
                cooldownSeconds: data.cooldownSeconds ? Number(data.cooldownSeconds) : null,
                maxImpressions: data.maxImpressions ? Number(data.maxImpressions) : null,

                defaultDelaySeconds: data.defaultDelaySeconds ? Number(data.defaultDelaySeconds) : null,
                allowedTimeWindow: data.allowedTimeWindow || null,

                allowedLifecycleStates: data.allowedLifecycleStates || [],
                blockedByTypes: data.blockedByTypes || [],

                payload: data.payload || {},
            }
        });
        revalidatePath('/overlays');
        return { success: true, overlay };
    } catch (error: any) {
        console.error('Failed to create overlay:', error);
        return { success: false, error: error.message };
    }
}

export async function updateOverlay(id: string, data: any) {
    try {
        const overlay = await prisma.overlay.update({
            where: { id },
            data: {
                code: data.code,
                type: data.type as OverlayType,
                priority: Number(data.priority) || 0,
                isActive: data.isActive ?? true,

                ttlSeconds: data.ttlSeconds ? Number(data.ttlSeconds) : null,
                cooldownSeconds: data.cooldownSeconds ? Number(data.cooldownSeconds) : null,
                maxImpressions: data.maxImpressions ? Number(data.maxImpressions) : null,

                defaultDelaySeconds: data.defaultDelaySeconds ? Number(data.defaultDelaySeconds) : null,
                allowedTimeWindow: data.allowedTimeWindow || null,

                allowedLifecycleStates: data.allowedLifecycleStates || [],
                blockedByTypes: data.blockedByTypes || [],

                payload: data.payload || {},
            }
        });
        revalidatePath('/overlays');
        revalidatePath(`/overlays/${id}`);
        return { success: true, overlay };
    } catch (error: any) {
        console.error('Failed to update overlay:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteOverlay(id: string) {
    try {
        await prisma.overlay.delete({ where: { id } });
        revalidatePath('/overlays');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// --- VARIANTS ---

export async function saveVariant(overlayId: string, variant: any) {
    try {
        if (variant.id) {
            await prisma.overlayVariant.update({
                where: { id: variant.id },
                data: {
                    name: variant.name,
                    weight: Number(variant.weight),
                    payload: variant.payload,
                    isActive: variant.isActive
                }
            });
        } else {
            await prisma.overlayVariant.create({
                data: {
                    overlayId,
                    name: variant.name,
                    weight: Number(variant.weight),
                    payload: variant.payload,
                    isActive: variant.isActive ?? true
                }
            });
        }
        revalidatePath(`/overlays/${overlayId}`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteVariant(id: string, overlayId: string) {
    try {
        await prisma.overlayVariant.delete({ where: { id } });
        revalidatePath(`/overlays/${overlayId}`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// --- ANALYTICS Helper ---

export async function getOverlayAnalytics() {
    // Return aggregated stats
    const totalImpressions = await prisma.overlayEvent.count({ where: { event: 'DELIVERED' } });
    const totalClicks = await prisma.overlayEvent.count({ where: { event: 'CLICKED' } });
    const totalConversions = await prisma.overlayEvent.count({ where: { event: 'CONVERTED' } });

    return {
        totalImpressions,
        totalClicks,
        totalConversions,
        ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
    };
}

export async function getOverlayEvents(limit = 50) {
    return await prisma.overlayEvent.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
            overlay: { select: { code: true } },
            variant: { select: { name: true } }
        }
    });
}

// --- QUEUE / SCHEDULED ---

export async function getScheduledOverlays() {
    // Fetch UserOverlays that are scheduled for the future
    return await prisma.userOverlay.findMany({
        where: {
            scheduledFor: { gt: new Date() },
            state: { not: 'EXPIRED' }
        },
        orderBy: { scheduledFor: 'asc' },
        take: 100,
        include: {
            user: { select: { telegramId: true, username: true, id: true } },
            overlay: { select: { code: true } }
        }
    });
}
