/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { addStatuses } from "../data";
import { Forms, Modal, openModal, useState, useCallback } from "@webpack/common";
import { RenderModalProps } from "@vencord/discord-types";

interface BulkAddModalProps {
    modalProps: RenderModalProps;
    onSave?: () => void;
}

const EMOJI_PREFIX = /^(\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*)\s+/u;
const DELAY_SUFFIX = /\s*\|\s*(\d+)\s*$/;

export interface ParsedStatusLine {
    text: string;
    emoji: string;
    delayMs: number;
}

export function parseStatusLines(input: string): ParsedStatusLine[] {
    const parsed: ParsedStatusLine[] = [];

    for (const rawLine of input.split("\n")) {
        let line = rawLine.trim();
        if (!line) continue;

        let delayMs = 0;
        const delayMatch = line.match(DELAY_SUFFIX);
        if (delayMatch) {
            const seconds = parseInt(delayMatch[1], 10);
            if (seconds > 0) delayMs = Math.round(seconds * 1000);
            line = line.slice(0, delayMatch.index).trim();
        }
        if (!line) continue;

        let emoji = "";
        const emojiMatch = line.match(EMOJI_PREFIX);
        if (emojiMatch) {
            emoji = emojiMatch[1];
            line = line.slice(emojiMatch[0].length).trim();
        }

        if (line) parsed.push({ text: line, emoji, delayMs });
    }

    return parsed;
}

function BulkAddModalInner({ modalProps, onSave }: BulkAddModalProps) {
    const [input, setInput] = useState("");

    const parsed = parseStatusLines(input);

    const handleSave = useCallback(async () => {
        if (parsed.length === 0) return;

        await addStatuses(parsed);
        onSave?.();
        modalProps.onClose();
    }, [parsed, onSave, modalProps]);

    return (
        <Modal
            {...modalProps}
            title="Bulk Add Statuses"
            actions={[
                {
                    text: "Cancel",
                    variant: "secondary",
                    onClick: modalProps.onClose,
                },
                {
                    text: `Add ${parsed.length || ""} Status${parsed.length === 1 ? "" : "es"}`,
                    variant: "primary",
                    onClick: handleSave,
                    disabled: parsed.length === 0,
                },
            ]}
        >
            <div className="vc-statuscycler-modal-section">
                <Forms.FormTitle tag="h5">One Status per Line</Forms.FormTitle>
                <textarea
                    className="vc-statuscycler-bulk-textarea"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={"🎮 Playing games\n📚 Studying |45\nChilling\n🎵 Music |15"}
                    rows={8}
                    autoFocus
                />
                <div className="vc-statuscycler-hint">
                    Each non-empty line becomes one status. Optional format:
                    an emoji at the start of the line is used as the status emoji,
                    and "|N" at the end sets a per-status delay of N seconds.
                </div>
                {parsed.length > 0 && (
                    <div className="vc-statuscycler-bulk-preview">
                        {parsed.map((entry, i) => (
                            <div key={i} className="vc-statuscycler-bulk-preview-row">
                                {entry.emoji && <span>{entry.emoji}</span>}
                                <span>{entry.text}</span>
                                {entry.delayMs > 0 && <span className="vc-statuscycler-bulk-preview-delay">| {Math.round(entry.delayMs / 1000)}s</span>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
}

export function openBulkAddModal(onSave?: () => void) {
    openModal(modalProps => (
        <BulkAddModalInner modalProps={modalProps} onSave={onSave} />
    ));
}
