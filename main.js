const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { handle_set_directory, handle_install_mod, handle_check_for_updates } = require('./server');
const fs = require('fs').promises;
const axios = require('axios');

let splashWindow;
let mainWindow;

const CURRENT_VERSION = require('./version.json').version;
const GITHUB_REPO = 'your-github-username/your-repo-name'; // Replace with your GitHub repository

function createSplashWindow() {
    splashWindow = new BrowserWindow({
        width: 400,
        height: 300,
        frame: false,
        resizable: false,
        center: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    splashWindow.loadFile('splash.html');
    splashWindow.once('ready-to-show', () => {
        splashWindow.show();
        checkForUpdates();
    });
}

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile('index.html');

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.on('ready', createSplashWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createMainWindow();
    }
});

// IPC handler for setting mod directory
ipcMain.handle('set-directory', async (event, args) => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    });

    if (!result.canceled && result.filePaths.length > 0) {
        const selectedDirectory = result.filePaths[0];
        mainWindow.webContents.send('directory-selected', selectedDirectory);
        return handle_set_directory({ mod_dir: selectedDirectory });
    } else {
        return { messages: [{ category: 'error', text: 'No directory selected!' }] };
    }
});

// IPC handler for fetching JAR files from the selected directory
ipcMain.handle('get-jar-files', async (event, args) => {
    const directoryPath = args;

    try {
        const files = await fs.readdir(directoryPath);
        return files.filter(file => file.toLowerCase().endsWith('.jar'));
    } catch (error) {
        console.error(error);
        return [];
    }
});

// IPC handlers for install-mod and check-for-updates (unchanged)
ipcMain.handle('install-mod', async (event, args) => {
    return handle_install_mod(args);
});

ipcMain.handle('check-for-updates', async (event, args) => {
    return handle_check_for_updates(args);
});

// Function to check for updates and update splash screen text
async function checkForUpdates() {
    try {
        splashWindow.webContents.send('update-status', 'Checking for Updates...');

        const response = await axios.get(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`);
        const latestVersion = response.data.tag_name;

        if (latestVersion === `v${CURRENT_VERSION}`) {
            splashWindow.webContents.send('update-status', 'No Updates Available');
            await sleep(2000);
        } else {
            splashWindow.webContents.send('update-status', 'Downloading Updates...');
            await sleep(2000); // Simulate delay for downloading updates

            splashWindow.webContents.send('update-status', 'Applying Updates...');
            await sleep(2000); // Simulate delay for applying updates

            splashWindow.webContents.send('update-status', 'Updates Completed!');
            await sleep(1000); // Wait for user to see final message
        }

        // Close splash window and open main window
        createMainWindow();
        splashWindow.close();
    } catch (error) {
        console.error(error);
        splashWindow.webContents.send('update-status', 'Failed to Check Updates!');
        await sleep(2000);
        // Close splash window and open main window even if update check failed
        createMainWindow();
        splashWindow.close();
    }
}

// Helper function to simulate delay
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
