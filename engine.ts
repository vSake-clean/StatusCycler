/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Logger } from "@utils/Logger";
import { getUserSettingLazy } from "@api/UserSettings";
import {
    CyclerStatus,
    getActiveProfile,
    getDelayFor,
    getEnabledStatuses,
    getConfig,
    notifyChanged,
    setActiveProfile,
} from "./data";

export interface CustomStatusValue {
    text: string;
    emojiName?: string;
    emojiId?: string;
}

const logger = new Logger("StatusCycler");

/**
 * Verified method (2025-2026): Discord stores custom status in the
 * PreloadedUserSettings proto under status.customStatus. Vencord's
 * UserSettingsAPI exposes it as getUserSettingLazy("status", "customStatus"),
 * whose updateSetting() runs Discord's own updateAsync() path
 * (proto encode + server sync), the same one the native UI uses.
 */
const CustomStatusSettings = getUserSettingLazy<CustomStatusValue | null>("status", "customStatus")!;

let timerId: ReturnType<typeof setTimeout> | undefined;
let running = false;
/** Status ids in play order (shuffled up-front when shuffle is on) */
let order: string[] = [];
let orderIndex = -1;
let currentStatusId: string | null = null;
/** Original custom status captured when cycling starts (undefined = not captured) */
let savedStatus: CustomStatusValue | null | undefined;

export function isRunning(): boolean {
    return running;
}

export function getCurrentStatusId(): string | null {
    return currentStatusId;
}

function shuffleIds(ids: string[]): string[] {
    const arr = [...ids];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

async function writeCustomStatus(value: CustomStatusValue | null): Promise<boolean> {
    try {
        if (value == null) {
            await CustomStatusSettings.updateSetting(null);
        } else {
            const payload: CustomStatusValue = { text: value.text };
            if (value.emojiName) payload.emojiName = value.emojiName;
            await CustomStatusSettings.updateSetting(payload);
        }
        return true;
    } catch (err) {
        logger.error("Failed to update custom status:", err);
        return false;
    }
}

/** Rebuild the play order from currently enabled statuses. */
function rebuildOrder(): string[] {
    const ids = getEnabledStatuses().map(s => s.id);
    order = getActiveProfile().shuffle ? shuffleIds(ids) : ids;
    return order;
}

function clearTimer(): void {
    if (timerId !== undefined) {
        clearTimeout(timerId);
        timerId = undefined;
    }
}

function scheduleNext(delayMs: number): void {
    clearTimer();
    timerId = setTimeout(() => { void cycleOnce(); }, delayMs);
}

async function cycleOnce(): Promise<void> {
    if (!running) return;

    const statuses = getEnabledStatuses();
    if (statuses.length === 0) {
        stopCycling();
        return;
    }

    // Drop entries that were deleted/disabled while running
    const validIds = new Set(statuses.map(s => s.id));
    order = order.filter(id => validIds.has(id));
    if (order.length === 0) {
        rebuildOrder();
        orderIndex = -1;
    }

    orderIndex++;
    if (orderIndex >= order.length) {
        if (!getActiveProfile().loop) {
            stopCycling();
            return;
        }
        rebuildOrder();
        orderIndex = 0;
    }

    const status: CyclerStatus = statuses.find(s => s.id === order[orderIndex]) ?? statuses[0];
    currentStatusId = status.id;

    await writeCustomStatus({ text: status.text, emojiName: status.emoji || undefined });
    notifyChanged();

    if (running) {
        scheduleNext(getDelayFor(status));
    }
}

export async function startCycling(): Promise<void> {
    if (running) return;
    if (getEnabledStatuses().length === 0) {
        logger.warn("No enabled statuses to cycle through.");
        return;
    }

    running = true;
    order = [];
    orderIndex = -1;

    // Capture the original status once, so it can be restored later
    if (savedStatus === undefined) {
        try {
            savedStatus = CustomStatusSettings.getSetting() ?? null;
        } catch {
            savedStatus = null;
        }
    }

    notifyChanged();
    await cycleOnce();
}

export function stopCycling(): void {
    if (!running && timerId === undefined) return;

    running = false;
    clearTimer();
    currentStatusId = null;
    orderIndex = -1;

    const restore = savedStatus;
    savedStatus = undefined;
    if (restore !== undefined && getConfig().restoreOnStop) {
        void writeCustomStatus(restore);
    }

    notifyChanged();
}

/** Skip ahead to the next status immediately. */
export function nextStatus(): void {
    if (!running) return;
    clearTimer();
    void cycleOnce();
}

/** Switch profiles; keeps cycling seamlessly when it is already running. */
export async function switchProfile(profileId: string): Promise<void> {
    const wasRunning = running;
    const currentId = getActiveProfile().id;
    if (profileId === currentId) return;

    if (wasRunning) stopCycling();

    await setActiveProfile(profileId);
    notifyChanged();

    if (wasRunning) await startCycling();
}

/** Called from plugin start() after data has been loaded. */
export function autoStartIfNeeded(): void {
    if (getConfig().autoStart) {
        void startCycling();
    }
}

/** Hard cleanup for plugin stop(). */
export function dispose(): void {
    running = false;
    clearTimer();
    currentStatusId = null;
    orderIndex = -1;
}
