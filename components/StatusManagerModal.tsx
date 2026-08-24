/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import {
    CyclerProfile,
    CyclerStatus,
    deleteProfile,
    deleteStatus,
    getActiveProfile,
    getConfig,
    getDelayFor,
    getProfiles,
    getStatuses,
    saveGlobalConfig,
    toggleStatus,
    updateProfileSettings,
    useStatusCycler,
} from "../data";
import { getCurrentStatusId, isRunning, nextStatus, startCycling, stopCycling, switchProfile } from "../engine";
import { openStatusEditModal } from "./StatusEditModal";
import { openBulkAddModal } from "./BulkAddModal";
import { openProfileEditModal } from "./ProfileEditModal";
import { Forms, Modal, openModal, useState, useCallback } from "@webpack/common";
import type { RenderModalProps } from "@vencord/discord-types";

interface ManagerModalProps {
    modalProps: RenderModalProps;
}

function formatDelay(ms: number): string {
    const totalSec = Math.round(ms / 1000);
    if (totalSec < 60) return `${totalSec}s`;
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return sec > 0 ? `${min}m ${sec}s` : `${min}m`;
}

function ProfileBar({ onRefresh }: { onRefresh: () => void }) {
    const profiles = getProfiles();
    const active = getActiveProfile();

    const handleSwitch = useCallback((profileId: string) => {
        void switchProfile(profileId);
        onRefresh();
    }, [onRefresh]);

    const handleNew = useCallback(() => {
        openProfileEditModal(undefined, onRefresh);
    }, [onRefresh]);

    const handleRename = useCallback(() => {
        openProfileEditModal(active, onRefresh);
    }, [active, onRefresh]);

    const handleDelete = useCallback(async () => {
        if (profiles.length <= 1) return;
        await deleteProfile(active.id);
        onRefresh();
    }, [profiles.length, active.id, onRefresh]);

    return (
        <div className="vc-statuscycler-modal-section">
            <Forms.FormTitle tag="h5">Profiles ({profiles.length})</Forms.FormTitle>
            <div className="vc-statuscycler-profile-bar">
                {profiles.map(profile => (
                    <button
                        key={profile.id}
                        className={`vc-statuscycler-profile-chip ${profile.id === active.id ? "active" : ""}`}
                        onClick={() => profile.id === active.id ? undefined : handleSwitch(profile.id)}
                        title={profile.id === active.id ? "Active profile" : `Switch to ${profile.name}`}
                    >
                        {profile.name}
                        <span className="vc-statuscycler-profile-count">{profile.statuses.length}</span>
                    </button>
                ))}
                <button className="vc-statuscycler-profile-add" onClick={handleNew} title="New profile">
                    +
                </button>
            </div>
            <div className="vc-statuscycler-list-item-actions vc-statuscycler-profile-actions">
                <button className="vc-statuscycler-edit-btn" onClick={handleRename} title="Rename current profile">
                    Rename
                </button>
                <button
                    className="vc-statuscycler-delete-btn"
                    onClick={() => void handleDelete()}
                    disabled={profiles.length <= 1}
                    title={profiles.length <= 1 ? "Cannot delete the last profile" : "Delete current profile"}
                >
                    Delete
                </button>
            </div>
        </div>
    );
}

function StatusListItem({ status, onRefresh }: { status: CyclerStatus; onRefresh: () => void }) {
    const running = isRunning();
    const isCurrent = running && getCurrentStatusId() === status.id;

    const handleToggle = useCallback(async () => {
        await toggleStatus(status.id);
        onRefresh();
    }, [status.id, onRefresh]);

    const handleEdit = useCallback(() => {
        openStatusEditModal(status, onRefresh);
    }, [status, onRefresh]);

    const handleDelete = useCallback(async () => {
        await deleteStatus(status.id);
        onRefresh();
    }, [status.id, onRefresh]);

    return (
        <div className={`vc-statuscycler-list-item ${status.enabled ? "" : "disabled"} ${isCurrent ? "current" : ""}`}>
            <div className="vc-statuscycler-list-item-header">
                <div className="vc-statuscycler-item-text">
                    {status.emoji && <span className="vc-statuscycler-item-emoji">{status.emoji}</span>}
                    <span>{status.text}</span>
                </div>
                <div className="vc-statuscycler-list-item-actions">
                    <button
                        className={`vc-statuscycler-toggle-btn ${status.enabled ? "enabled" : ""}`}
                        onClick={handleToggle}
                        title={status.enabled ? "Disable" : "Enable"}
                    >
                        {status.enabled ? "ON" : "OFF"}
                    </button>
                    <button className="vc-statuscycler-edit-btn" onClick={handleEdit} title="Edit">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                        </svg>
                    </button>
                    <button className="vc-statuscycler-delete-btn" onClick={handleDelete} title="Delete">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                        </svg>
                    </button>
                </div>
            </div>
            <div className="vc-statuscycler-list-item-meta">
                {isCurrent && <span className="vc-statuscycler-current-badge">Active</span>}
                <span>Delay: {status.delayMs > 0 ? formatDelay(getDelayFor(status)) : "default"}</span>
            </div>
        </div>
    );
}

function ConfigCheckbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <div className="vc-statuscycler-checkbox-row">
            <label className="vc-statuscycler-checkbox-label">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={e => onChange(e.target.checked)}
                    className="vc-statuscycler-checkbox"
                />
                <span>{label}</span>
            </label>
        </div>
    );
}

function ProfileLoopOptions({ profile, onRefresh }: { profile: CyclerProfile; onRefresh: () => void; }) {
    const [delaySec, setDelaySec] = useState(String(Math.round(profile.defaultDelayMs / 1000)));

    const updateProfile = useCallback(async (patch: Partial<Pick<CyclerProfile, "loop" | "shuffle" | "defaultDelayMs">>) => {
        await updateProfileSettings(profile.id, patch);
        onRefresh();
    }, [profile.id, onRefresh]);

    const handleDelayChange = useCallback((value: string) => {
        setDelaySec(value);
        const parsedMs = Math.round(parseFloat(value.replace(",", ".")) * 1000);
        if (Number.isFinite(parsedMs) && parsedMs >= 5) {
            void updateProfile({ defaultDelayMs: parsedMs });
        }
    }, [updateProfile]);

    return (
        <div className="vc-statuscycler-modal-section">
            <Forms.FormTitle tag="h5">Loop Options (profile: {profile.name})</Forms.FormTitle>

            <Forms.FormTitle tag="h5">Default Delay (seconds)</Forms.FormTitle>
            <input
                className="vc-statuscycler-delay-input"
                type="number"
                min={5}
                value={delaySec}
                onChange={e => handleDelayChange(e.target.value)}
            />
            <div className="vc-statuscycler-hint">
                Time between changes for statuses without their own delay override. Minimum 5 seconds (Discord rate limit).
            </div>

            <ConfigCheckbox
                label="Loop forever (restart from the first status after the last one)"
                checked={profile.loop}
                onChange={v => void updateProfile({ loop: v })}
            />
            <ConfigCheckbox
                label="Shuffle order (random sequence)"
                checked={profile.shuffle}
                onChange={v => void updateProfile({ shuffle: v })}
            />
        </div>
    );
}

function StatusManagerModalInner({ modalProps }: ManagerModalProps) {
    useStatusCycler();

    const config = getConfig();
    const profile = getActiveProfile();
    const statuses = getStatuses();

    const [, setRefreshKey] = useState(0);

    const handleRefresh = useCallback(() => {
        setRefreshKey(k => k + 1);
    }, []);

    const handleToggleRunning = useCallback(async () => {
        if (isRunning()) {
            stopCycling();
        } else {
            await startCycling();
        }
        handleRefresh();
    }, [handleRefresh]);

    const running = isRunning();

    return (
        <Modal
            {...modalProps}
            title="Status Cycler"
            actions={[
                {
                    text: "Add New",
                    variant: "primary",
                    onClick: () => openStatusEditModal(undefined, handleRefresh),
                },
                {
                    text: "Bulk Add",
                    variant: "secondary",
                    onClick: () => openBulkAddModal(handleRefresh),
                },
            ]}
        >
            {/* Profile selector */}
            <ProfileBar onRefresh={handleRefresh} />

            {/* Loop controls */}
            <div className="vc-statuscycler-modal-section">
                <Forms.FormTitle tag="h5">Cycling</Forms.FormTitle>
                <div className="vc-statuscycler-controls">
                    <button
                        className={`vc-statuscycler-toggle-btn ${running ? "enabled" : ""}`}
                        onClick={handleToggleRunning}
                        title={running ? "Stop cycling" : "Start cycling"}
                    >
                        {running ? "STOP" : "START"}
                    </button>
                    <button
                        className="vc-statuscycler-edit-btn"
                        onClick={() => { nextStatus(); handleRefresh(); }}
                        disabled={!running}
                        title="Skip to next status now"
                    >
                        NEXT
                    </button>
                    <div className={`vc-statuscycler-controls-state ${running ? "running" : ""}`}>
                        {running
                            ? `Running - ${statuses.filter(s => s.enabled).length} status(es) in rotation`
                            : "Stopped"}
                    </div>
                </div>
            </div>

            {/* Profile loop options */}
            <ProfileLoopOptions key={profile.id} profile={profile} onRefresh={handleRefresh} />

            {/* Global options */}
            <div className="vc-statuscycler-modal-section">
                <Forms.FormTitle tag="h5">Global Options</Forms.FormTitle>
                <ConfigCheckbox
                    label="Start cycling automatically when Discord loads"
                    checked={config.autoStart}
                    onChange={v => void saveGlobalConfig({ autoStart: v }).then(handleRefresh)}
                />
                <ConfigCheckbox
                    label="Restore original status when stopping"
                    checked={config.restoreOnStop}
                    onChange={v => void saveGlobalConfig({ restoreOnStop: v }).then(handleRefresh)}
                />
            </div>

            {/* Status list */}
            <div className="vc-statuscycler-modal-section">
                <Forms.FormTitle tag="h5">Statuses ({statuses.length})</Forms.FormTitle>
                {statuses.length === 0 ? (
                    <div className="vc-statuscycler-list-empty">
                        <p>No statuses in this profile yet.</p>
                        <p>Use &quot;Add New&quot; or &quot;Bulk Add&quot; to fill it up.</p>
                    </div>
                ) : (
                    <div className="vc-statuscycler-list-container">
                        <div className="vc-statuscycler-list">
                            {statuses.map(status => (
                                <StatusListItem key={status.id} status={status} onRefresh={handleRefresh} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}

export function openStatusManagerModal() {
    openModal(modalProps => (
        <StatusManagerModalInner modalProps={modalProps} />
    ));
}
