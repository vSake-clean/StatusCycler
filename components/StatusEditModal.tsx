/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { addStatus, updateStatus, CyclerStatus } from "../data";
import { Forms, Modal, openModal, TextInput, useState, useCallback } from "@webpack/common";
import { RenderModalProps } from "@vencord/discord-types";

interface EditModalProps {
    modalProps: RenderModalProps;
    existingStatus?: CyclerStatus;
    onSave?: () => void;
}

function formatDelay(ms: number): string {
    if (ms <= 0) return "";
    const sec = ms / 1000;
    return String(sec);
}

function StatusEditModalInner({ modalProps, existingStatus, onSave }: EditModalProps) {
    const [text, setText] = useState(existingStatus?.text ?? "");
    const [emoji, setEmoji] = useState(existingStatus?.emoji ?? "");
    const [delaySec, setDelaySec] = useState(formatDelay(existingStatus?.delayMs ?? 0));

    const isEditing = Boolean(existingStatus?.id);

    const handleSave = useCallback(async () => {
        if (!text.trim()) return;

        const parsedDelay = Math.round(parseFloat(delaySec.replace(",", ".")) * 1000);
        const delayMs = Number.isFinite(parsedDelay) && parsedDelay > 0 ? parsedDelay : 0;

        if (isEditing && existingStatus?.id) {
            await updateStatus(existingStatus.id, { text, emoji, delayMs });
        } else {
            await addStatus({ text, emoji, delayMs });
        }
        onSave?.();
        modalProps.onClose();
    }, [text, emoji, delaySec, isEditing, existingStatus, onSave, modalProps]);

    return (
        <Modal
            {...modalProps}
            title={isEditing ? "Edit Status" : "New Status"}
            actions={[
                {
                    text: "Cancel",
                    variant: "secondary",
                    onClick: modalProps.onClose,
                },
                {
                    text: "Save",
                    variant: "primary",
                    onClick: handleSave,
                    disabled: !text.trim(),
                },
            ]}
        >
            <div className="vc-statuscycler-modal-section">
                <Forms.FormTitle tag="h5">Status Text</Forms.FormTitle>
                <TextInput
                    value={text}
                    onChange={setText}
                    placeholder="e.g. Playing Minecraft"
                    autoFocus
                    maxLength={128}
                />
            </div>

            <div className="vc-statuscycler-modal-section">
                <Forms.FormTitle tag="h5">Emoji (optional)</Forms.FormTitle>
                <TextInput
                    value={emoji}
                    onChange={setEmoji}
                    placeholder="Paste any emoji, e.g. 🎮"
                    maxLength={16}
                />
                <div className="vc-statuscycler-hint">
                    Paste a single emoji character. Leave empty for text only.
                </div>
            </div>

            <div className="vc-statuscycler-modal-section">
                <Forms.FormTitle tag="h5">Delay Override (seconds)</Forms.FormTitle>
                <TextInput
                    value={delaySec}
                    onChange={setDelaySec}
                    placeholder="Empty = use default delay from settings"
                />
                <div className="vc-statuscycler-hint">
                    How long this status stays active before switching to the next one. Minimum 5 seconds (Discord rate limit).
                </div>
            </div>
        </Modal>
    );
}

export function openStatusEditModal(existingStatus?: CyclerStatus, onSave?: () => void) {
    openModal((modalProps) => (
        <StatusEditModalInner
            modalProps={modalProps}
            existingStatus={existingStatus}
            onSave={onSave}
        />
    ));
}
