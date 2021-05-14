// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

const path = require('path');
const electron = require('electron');

const {spawn} = require('electron-notarize/lib/spawn.js');

const SETUID_PERMISSIONS = '4755';

const {flipFuses, FuseVersion, FuseV1Options} = require('@electron/fuses');

function fixSetuid(context) {
    return async (target) => {
        if (!['appimage', 'snap'].includes(target.name.toLowerCase())) {
            const result = await spawn('chmod', [SETUID_PERMISSIONS, path.join(context.appOutDir, 'chrome-sandbox')]);
            if (result.code !== 0) {
                throw new Error(
                    `Failed to set proper permissions for linux arch on ${target.name}`,
                );
            }
        }
    };
}

exports.default = async function afterPack(context) {
    await flipFuses(
        electron, // Returns the path to the electron binary
        {
            version: FuseVersion.V1,
            [FuseV1Options.RunAsNode]: false, // Disables ELECTRON_RUN_AS_NODE
        });

    if (context.electronPlatformName === 'linux') {
        context.targets.forEach(fixSetuid(context));
    }
};
