/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { findGroupChildrenByChildId, NavContextMenuPatchCallback } from "@api/ContextMenu";
import { Button, Menu, UserStore } from "@webpack/common";
import definePlugin, { StartAt } from "@utils/types";
import { init as initData } from "./data";
import { autoStartIfNeeded, dispose, isRunning, nextStatus, startCycling, stopCycling } from "./engine";
import { openStatusManagerModal } from "./components/StatusManagerModal";
import "./styles.css";

const CYCLER_ID = "statuscycler-group";

function buildCyclerMenu() {
    return (
        <Menu.MenuItem
            key={CYCLER_ID}
            id={CYCLER_ID}
            label="Status Cycler"
        >
            <Menu.MenuItem
                key="statuscycler-toggle"
                id="statuscycler-toggle"
                label={isRunning() ? "Stop Cycling" : "Start Cycling"}
                action={() => {
                    if (isRunning()) {
                        stopCycling();
                    } else {
                        void startCycling();
                    }
                }}
            />
            <Menu.MenuItem
                key="statuscycler-next"
                id="statuscycler-next"
                label="Next Status"
                disabled={!isRunning()}
                action={() => nextStatus()}
            />
            <Menu.MenuItem
                key="statuscycler-manage"
                id="statuscycler-manage"
                label="Manage Statuses..."
                action={() => openStatusManagerModal()}
            />
        </Menu.MenuItem>
    );
}

const UserContext: NavContextMenuPatchCallback = (children, props) => {
    const user = props.user;
    if (!user?.id) return;

    const me = UserStore?.getCurrentUser()?.id;
    if (me && user.id !== me) return;

    const group = findGroupChildrenByChildId("close-dm", children);
    if (group) {
        if (!group.some(child => child?.props?.id === CYCLER_ID)) {
            group.push(buildCyclerMenu());
        }
        return;
    }

    if (!children.some(child => child?.props?.id === CYCLER_ID)) {
        children.push(buildCyclerMenu());
    }
};

export default definePlugin({
    name: "StatusCycler",
    authors: [{ name: "CipherOS", id: 0n }],
    description: "Automatically cycle through a list of custom statuses. Loop mode, shuffle, per-status delays.",
    tags: ["Utility", "Fun"],

    dependencies: ["UserSettingsAPI"],

    contextMenus: {
        "user-context": UserContext,
    },

    settingsAboutComponent: () => (
        <Button onClick={() => openStatusManagerModal()}>
            Open Status Manager
        </Button>
    ),

    startAt: StartAt.WebpackReady,
    start() {
        initData().then(() => autoStartIfNeeded());
        console.log("[StatusCycler] Plugin started!");
    },

    stop() {
        dispose();
        console.log("[StatusCycler] Plugin stopped!");
    },
});
