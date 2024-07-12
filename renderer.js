const { ipcRenderer } = require('electron');

document.getElementById('setDirectoryForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const modDir = document.getElementById('modDir').value;
    ipcRenderer.send('setDirectory', modDir);
});

document.getElementById('installModForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const modUrl = document.getElementById('modUrl').value;
    ipcRenderer.send('installMod', modUrl);
});

document.getElementById('checkUpdatesButton').addEventListener('click', function() {
    ipcRenderer.send('checkUpdates');
});

ipcRenderer.on('message', function(event, message) {
    const messagesDiv = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(message.category);
    messageDiv.textContent = message.text;
    messagesDiv.appendChild(messageDiv);
});
