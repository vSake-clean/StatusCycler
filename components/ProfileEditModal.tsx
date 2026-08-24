/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { CyclerProfile, addProfile, renameProfile } from "../data";
import { Forms, Modal, openModal, TextInput, useState, useCallback } from "@webpack/common";
import { RenderModalProps } from "@vencord/discord-types";

interface ProfileModalProps {
    modalProps: RenderModalProps;
    existingProfile?: CyclerProfile;
    onSave?: () => void;
}

function ProfileEditModalInner({ modalProps, existingProfile, onSave }: ProfileModalProps) {
    const [name, setName] = useState(existingProfile?.name ?? "");
    const isEditing = Boolean(existingProfile?.id);

    const handleSave = useCallback(async () => {
        if (!name.trim()) return;

        if (isEditing && existingProfile?.id) {
            await renameProfile(existingProfile.id, name);
        } else {
            await addProfile(name);
        }
        onSave?.();
        modalProps.onClose();
    }, [name, isEditing, existingProfile, onSave, modalProps]);

    return (
        <Modal
            {...modalProps}
            title={isEditing ? "Rename Profile" : "New Profile"}
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
                    disabled: !name.trim(),
                },
            ]}
        >
            <div className="vc-statuscycler-modal-section">
                <Forms.FormTitle tag="h5">Profile Name</Forms.FormTitle>
                <TextInput
                    value={name}
                    onChange={setName}
                    placeholder="e.g. Gaming"
                    autoFocus
                    maxLength={32}
                />
            </div>
        </Modal>
    );
}

export function openProfileEditModal(existingProfile?: CyclerProfile, onSave?: () => void) {
    openModal(modalProps => (
        <ProfileEditModalInner
            modalProps={modalProps}
            existingProfile={existingProfile}
            onSave={onSave}
        />
    ));
}
