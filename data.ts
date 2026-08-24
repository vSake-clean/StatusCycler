/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import * as DataStore from "@api/DataStore";
import { useForceUpdater } from "@utils/react";

const PROFILES_KEY = "StatusCycler_profiles";
const CONFIG_KEY = "StatusCycler_config";
const LEGACY_STATUSES_KEY = "StatusCycler_statuses";

export interface CyclerStatus {
    id: string;
    text: string;
    emoji: string;
    /** Per-status delay in ms. 0 = use profile.defaultDelayMs */
    delayMs: number;
    enabled: boolean;
    createdAt: number;
}

export interface CyclerProfile {
    id: string;
    name: string;
    statuses: CyclerStatus[];
    /** Wrap around to first status after the last one */
    loop: boolean;
    /** Pick statuses in random order */
    shuffle: boolean;
    /** Default delay between changes in ms for this profile */
    defaultDelayMs: number;
}

export interface CyclerConfig {
    activeProfileId: string;
    /** Resume cycling automatically when plugin starts */
    autoStart: boolean;
    /** Restore the status you had before cycling started when stopping */
    restoreOnStop: boolean;
}

const DEFAULT_PROFILE_SETTINGS = {
    loop: true,
    shuffle: false,
    defaultDelayMs: 10_000,
};

let cachedProfiles: CyclerProfile[] = [];
let cachedConfig: CyclerConfig = {
    activeProfileId: "",
    autoStart: false,
    restoreOnStop: true,
};
let forceUpdateCycler: (() => void) | undefined;

function makeId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function migrateLegacyData(): Promise<void> {
    const legacyStatuses = (await DataStore.get<CyclerStatus[]>(LEGACY_STATUSES_KEY)) ?? [];
    if (legacyStatuses.length === 0) return;

    const legacyConfig = (await DataStore.get<Partial<{ loop: boolean; shuffle: boolean; defaultDelayMs: number; }>>(CONFIG_KEY)) ?? {};

    cachedProfiles = [{
        id: makeId(),
        name: "Default",
        statuses: legacyStatuses,
        ...DEFAULT_PROFILE_SETTINGS,
        ...legacyConfig,
    }];
    cachedConfig.activeProfileId = cachedProfiles[0].id;

    await DataStore.set(PROFILES_KEY, cachedProfiles);
    await DataStore.set(CONFIG_KEY, cachedConfig);
    await DataStore.del(LEGACY_STATUSES_KEY);
}

export async function loadAll(): Promise<void> {
    await migrateLegacyData();

    cachedProfiles = (await DataStore.get<CyclerProfile[]>(PROFILES_KEY)) ?? [];
    cachedConfig = {
        activeProfileId: "",
        autoStart: false,
        restoreOnStop: true,
        ...((await DataStore.get<Partial<CyclerConfig>>(CONFIG_KEY)) ?? {}),
    };

    if (cachedProfiles.length === 0) {
        cachedProfiles = [{
            id: makeId(),
            name: "Default",
            statuses: [],
            ...DEFAULT_PROFILE_SETTINGS,
        }];
        await DataStore.set(PROFILES_KEY, cachedProfiles);
    }

    if (!cachedProfiles.some(p => p.id === cachedConfig.activeProfileId)) {
        cachedConfig.activeProfileId = cachedProfiles[0].id;
    }
}

export function init(): Promise<void> {
    return loadAll().then(() => forceUpdateCycler?.());
}

export function useStatusCycler(): () => void {
    forceUpdateCycler = useForceUpdater();
    return forceUpdateCycler;
}

/** Force a rerender from outside React (e.g. loop tick). */
export function notifyChanged(): void {
    forceUpdateCycler?.();
}

async function persistProfiles(): Promise<void> {
    await DataStore.set(PROFILES_KEY, cachedProfiles);
    forceUpdateCycler?.();
}

export async function saveGlobalConfig(patch: Partial<Pick<CyclerConfig, "autoStart" | "restoreOnStop">>): Promise<void> {
    cachedConfig = { ...cachedConfig, ...patch };
    await DataStore.set(CONFIG_KEY, cachedConfig);
    forceUpdateCycler?.();
}

export function getProfiles(): CyclerProfile[] {
    return cachedProfiles;
}

export function getActiveProfile(): CyclerProfile {
    return cachedProfiles.find(p => p.id === cachedConfig.activeProfileId) ?? cachedProfiles[0];
}

export async function setActiveProfile(profileId: string): Promise<void> {
    if (!cachedProfiles.some(p => p.id === profileId)) return;

    cachedConfig = { ...cachedConfig, activeProfileId: profileId };
    await DataStore.set(CONFIG_KEY, cachedConfig);
    forceUpdateCycler?.();
}

export function getConfig(): CyclerConfig {
    return cachedConfig;
}

export async function addProfile(name: string): Promise<CyclerProfile> {
    const trimmed = name.trim() || `Profile ${cachedProfiles.length + 1}`;
    const profile: CyclerProfile = {
        id: makeId(),
        name: trimmed,
        statuses: [],
        ...DEFAULT_PROFILE_SETTINGS,
    };
    cachedProfiles.push(profile);
    await persistProfiles();
    return profile;
}

export async function renameProfile(profileId: string, name: string): Promise<void> {
    const profile = cachedProfiles.find(p => p.id === profileId);
    if (!profile || !name.trim()) return;

    profile.name = name.trim();
    await persistProfiles();
}

export async function deleteProfile(profileId: string): Promise<boolean> {
    if (cachedProfiles.length <= 1) return false;

    cachedProfiles = cachedProfiles.filter(p => p.id !== profileId);
    if (cachedConfig.activeProfileId === profileId) {
        cachedConfig = { ...cachedConfig, activeProfileId: cachedProfiles[0].id };
        await DataStore.set(CONFIG_KEY, cachedConfig);
    }
    await persistProfiles();
    return true;
}

export async function updateProfileSettings(profileId: string, patch: Partial<Pick<CyclerProfile, "loop" | "shuffle" | "defaultDelayMs">>): Promise<void> {
    const profile = cachedProfiles.find(p => p.id === profileId);
    if (!profile) return;

    Object.assign(profile, patch);
    await persistProfiles();
}

export function getStatuses(): CyclerStatus[] {
    return getActiveProfile().statuses;
}

export function getEnabledStatuses(): CyclerStatus[] {
    return getActiveProfile().statuses.filter(s => s.enabled && s.text.trim().length > 0);
}

export function getDelayFor(status: CyclerStatus): number {
    // Discord rate limits custom status changes - keep a 5s hard floor
    const delay = status.delayMs > 0 ? status.delayMs : getActiveProfile().defaultDelayMs;
    return Math.max(delay, 5000);
}

function nextStatusId(profile: CyclerProfile): string {
    let id = makeId();
    while (profile.statuses.some(s => s.id === id)) {
        id = makeId();
    }
    return id;
}

export async function addStatus(data: Pick<CyclerStatus, "text" | "emoji" | "delayMs">): Promise<CyclerStatus> {
    const profile = getActiveProfile();
    const status: CyclerStatus = {
        id: nextStatusId(profile),
        text: data.text.trim(),
        emoji: data.emoji.trim(),
        delayMs: data.delayMs,
        enabled: true,
        createdAt: Date.now(),
    };
    profile.statuses.push(status);
    await persistProfiles();
    return status;
}

/** Bulk add parsed lines; returns the number of statuses created. */
export async function addStatuses(entries: Array<Pick<CyclerStatus, "text" | "emoji" | "delayMs">>): Promise<number> {
    const profile = getActiveProfile();
    const now = Date.now();
    for (const entry of entries) {
        profile.statuses.push({
            id: nextStatusId(profile),
            text: entry.text.trim(),
            emoji: entry.emoji.trim(),
            delayMs: entry.delayMs,
            enabled: true,
            createdAt: now,
        });
    }
    await persistProfiles();
    return entries.length;
}

export async function updateStatus(id: string, patch: Partial<Omit<CyclerStatus, "id" | "createdAt">>): Promise<void> {
    const status = getStatuses().find(s => s.id === id);
    if (!status) return;

    if (patch.text !== undefined) status.text = patch.text.trim();
    if (patch.emoji !== undefined) status.emoji = patch.emoji.trim();
    if (patch.delayMs !== undefined) status.delayMs = patch.delayMs;
    if (patch.enabled !== undefined) status.enabled = patch.enabled;

    await persistProfiles();
}

export async function toggleStatus(id: string): Promise<void> {
    const status = getStatuses().find(s => s.id === id);
    if (!status) return;

    status.enabled = !status.enabled;
    await persistProfiles();
}

export async function deleteStatus(id: string): Promise<void> {
    const profile = getActiveProfile();
    profile.statuses = profile.statuses.filter(s => s.id !== id);
    await persistProfiles();
}
