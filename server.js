const os = require('os');
const fs = require('fs');
const path = require('path');
const axios = require('axios'); // Import axios instead of request

// Global variable to store the mod directory
let modDir = null;

// Handlers for mod manager functionality
function handle_set_directory(params) {
    modDir = params.mod_dir;
    if (!fs.existsSync(modDir)) {
        return { messages: [{ category: 'error', text: 'Directory does not exist!' }] };
    }
    return { messages: [{ category: 'success', text: 'Directory set successfully!' }] };
}

async function handle_install_mod(params) {
    if (!modDir) {
        return { messages: [{ category: 'error', text: 'Set the mod directory first!' }] };
    }
    const modUrl = params.mod_url;
    if (!modUrl) {
        return { messages: [{ category: 'error', text: 'Please enter a mod URL.' }] };
    }
    const modName = path.basename(modUrl);
    const modFilePath = path.join(modDir, modName);

    try {
        const response = await axios.get(modUrl, { responseType: 'stream' });
        const writeStream = fs.createWriteStream(modFilePath);
        response.data.pipe(writeStream);

        return new Promise((resolve, reject) => {
            writeStream.on('finish', () => {
                resolve({ messages: [{ category: 'success', text: `Mod ${modName} installed successfully!` }] });
            });

            writeStream.on('error', (err) => {
                reject({ messages: [{ category: 'error', text: `Failed to save mod file: ${err.message}` }] });
            });
        });
    } catch (error) {
        return { messages: [{ category: 'error', text: `Failed to download mod: ${error.message}` }] };
    }
}

async function handle_check_for_updates(params) {
    if (!modDir) {
        return { messages: [{ category: 'error', text: 'Set the mod directory first!' }] };
    }
    // Example URL for mod updates JSON
    const updateUrl = 'https://example.com/mod-updates.json';

    try {
        const response = await axios.get(updateUrl);
        const updates = response.data;

        const promises = Object.entries(updates).map(async ([mod, updateUrl]) => {
            const modName = path.basename(updateUrl);
            const modFilePath = path.join(modDir, modName);

            const response = await axios.get(updateUrl, { responseType: 'stream' });
            const writeStream = fs.createWriteStream(modFilePath);
            response.data.pipe(writeStream);

            return new Promise((resolve, reject) => {
                writeStream.on('finish', () => {
                    resolve({ messages: [{ category: 'success', text: `Mod ${modName} updated successfully!` }] });
                });

                writeStream.on('error', (err) => {
                    reject({ messages: [{ category: 'error', text: `Failed to update mod ${modName}: ${err.message}` }] });
                });
            });
        });

        await Promise.all(promises);
        return { messages: [{ category: 'success', text: 'All mods updated successfully!' }] };
    } catch (error) {
        return { messages: [{ category: 'error', text: `Failed to check for updates: ${error.message}` }] };
    }
}

module.exports = {
    handle_set_directory,
    handle_install_mod,
    handle_check_for_updates
};
