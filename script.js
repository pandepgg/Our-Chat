console.log("Script execution started.");

// DOM Elements
const connectionStatus = document.getElementById('connectionStatus');
const generalInstructions = document.getElementById('generalInstructions');

const roleSelectionContainer = document.getElementById('roleSelectionContainer');
const hostChatBtn = document.getElementById('hostChatBtn');
const joinChatBtn = document.getElementById('joinChatBtn');

const hostContainer = document.getElementById('hostContainer');
const generateHostCodeBtn = document.getElementById('generateHostCodeBtn');
const hostCodeOutput = document.getElementById('hostCodeOutput');
const friendReplyCodeInput = document.getElementById('friendReplyCodeInput');
const finalizeConnectionBtn = document.getElementById('finalizeConnectionBtn');

const joinerContainer = document.getElementById('joinerContainer');
const hostOriginalCodeInput = document.getElementById('hostOriginalCodeInput');
const generateJoinerReplyBtn = document.getElementById('generateJoinerReplyBtn');
const joinerReplyCodeOutput = document.getElementById('joinerReplyCodeOutput');

const resetContainer = document.getElementById('resetContainer');
const resetBtn = document.getElementById('resetBtn');
const chatContainer = document.getElementById('chatContainer');
const chatLog = document.getElementById('chatLog');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
console.log("DOM Elements selected:", {
    roleSelectionContainer, hostChatBtn, joinChatBtn, resetBtn
});
if (!roleSelectionContainer || !hostChatBtn || !joinChatBtn || !resetBtn) {
    console.error("CRITICAL: One or more essential UI elements for role selection or reset were not found!");
}


// WebRTC Variables
let peerConnection;
let dataChannel;
const iceServers = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ] [cite: 27]
[cite_start]};
function initializeApp() {
    console.log("initializeApp() called.");
    if (!roleSelectionContainer) {
        console.error("initializeApp: roleSelectionContainer is null!");
        return; // Critical error
    }
    roleSelectionContainer.classList.remove('hidden');
    hostContainer.classList.add('hidden');
    joinerContainer.classList.add('hidden');
    chatContainer.classList.add('hidden');
    resetContainer.classList.add('hidden');

    hostCodeOutput.value = '';
    friendReplyCodeInput.value = '';
    hostOriginalCodeInput.value = '';
    joinerReplyCodeOutput.value = '';
    messageInput.value = '';
    finalizeConnectionBtn.disabled = true;
    generateJoinerReplyBtn.disabled = true;
    messageInput.disabled = true;
    sendButton.disabled = true;
    
    updateConnectionStatus('Ready. Choose your role.');
    generalInstructions.textContent = '';
    if (peerConnection) {
        console.log("initializeApp: Closing existing peer connection.");
        peerConnection.close();
        peerConnection = null;
    }
    if (dataChannel) {
        console.log("initializeApp: Closing existing data channel.");
        dataChannel.close();
        dataChannel = null;
    }
    console.log("initializeApp() finished.");
}

if(resetBtn) {
    resetBtn.onclick = () => {
        console.log("Reset button clicked.");
        initializeApp();
    };
} else {
    console.error("Reset button not found, cannot attach event listener.");
}


function initializePeerConnection() {
    console.log("initializePeerConnection() called.");
    if (peerConnection) {
        console.log("initializePeerConnection: Closing existing peer connection before creating new one.");
        peerConnection.close();
    }
    peerConnection = new RTCPeerConnection(iceServers);
    console.log("New RTCPeerConnection created.");
    peerConnection.onicecandidate = event => {
        console.log("onicecandidate event:", event);
        if (event.candidate) {
            console.log('New ICE candidate:', JSON.stringify(event.candidate));
            if(peerConnection.localDescription) {
                if (hostCodeOutput.value && hostContainer.classList.contains('hidden') === false) {
                    hostCodeOutput.value = JSON.stringify(peerConnection.localDescription);
                } else if (joinerReplyCodeOutput.value && joinerContainer.classList.contains('hidden') === false) {
                    joinerReplyCodeOutput.value = JSON.stringify(peerConnection.localDescription);
                }
            }
        } else {
            console.log('All ICE candidates have been gathered.');
        }
    };
    peerConnection.onicegatheringstatechange = () => {
        console.log('ICE gathering state changed:', peerConnection ? peerConnection.iceGatheringState : 'N/A');
        if (peerConnection && peerConnection.localDescription) {
            if (hostCodeOutput.value && hostContainer.classList.contains('hidden') === false) {
                hostCodeOutput.value = JSON.stringify(peerConnection.localDescription);
            } else if (joinerReplyCodeOutput.value && joinerContainer.classList.contains('hidden') === false) {
                joinerReplyCodeOutput.value = JSON.stringify(peerConnection.localDescription);
            }
        }
    };
    peerConnection.oniceconnectionstatechange = () => {
        console.log('ICE Connection State:', peerConnection ? peerConnection.iceConnectionState : 'N/A');
        updateConnectionStatus(`ICE State: ${peerConnection ? peerConnection.iceConnectionState : 'N/A'}`);
        if (peerConnection && ['failed', 'disconnected', 'closed'].includes(peerConnection.iceConnectionState)) {
            handleDisconnect(false);
        }
    };
    peerConnection.ondatachannel = event => {
        console.log("ondatachannel event received.", event);
        dataChannel = event.channel;
        setupDataChannelEvents();
    };
    console.log("initializePeerConnection() finished.");
}

function setupDataChannelEvents() {
    console.log("setupDataChannelEvents() called.");
    if (!dataChannel) {
        console.error("setupDataChannelEvents: dataChannel is null!");
        return;
    }
    dataChannel.onopen = () => {
        console.log('Data channel OPENED!');
        updateConnectionStatus('Connected!');
        generalInstructions.textContent = 'You are now connected. Start chatting!';
        messageInput.disabled = false;
        sendButton.disabled = false;
        hostContainer.classList.add('hidden');
        joinerContainer.classList.add('hidden');
        roleSelectionContainer.classList.add('hidden');
        chatContainer.classList.remove('hidden');
        resetContainer.classList.remove('hidden');
    };
    dataChannel.onmessage = event => {
        console.log('Message received:', event.data);
        appendMessage(event.data, 'Peer');
    };
    dataChannel.onclose = () => {
        console.log('Data channel CLOSED!');
        handleDisconnect(false);
    };
    dataChannel.onerror = error => {
        console.error('Data channel error:', error);
        appendMessage(`Data channel error: ${error.message || error}`, 'System');
    };
    console.log("setupDataChannelEvents() finished.");
}

function handleDisconnect(fullReset = true) {
    console.log(`handleDisconnect called. fullReset: ${fullReset}`);
    updateConnectionStatus('Disconnected');
    generalInstructions.textContent = 'Connection lost or closed.';
    messageInput.disabled = true;
    sendButton.disabled = true;
    if (dataChannel) { dataChannel.close(); dataChannel = null;
        console.log("Data channel closed in handleDisconnect."); }
    if (peerConnection) { peerConnection.close();
        peerConnection = null; console.log("Peer connection closed in handleDisconnect."); }
    
    if (fullReset) {
        initializeApp();
    } else {
        chatContainer.classList.add('hidden');
        roleSelectionContainer.classList.remove('hidden');
        hostContainer.classList.add('hidden');
        joinerContainer.classList.add('hidden');
        resetContainer.classList.remove('hidden');
    }
}

function updateConnectionStatus(statusText) {
    if(connectionStatus) connectionStatus.textContent = `Status: ${statusText}`;
}

function appendMessage(message, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('p-2', 'rounded-lg', 'max-w-xs', 'break-words', 'text-sm');
    const senderSpan = document.createElement('span');
    senderSpan.classList.add('font-semibold');
    if (sender === 'Me') {
        messageElement.classList.add('bg-indigo-500', 'text-white', 'ml-auto');
        senderSpan.textContent = 'Me: ';
    } else if (sender === 'Peer') {
        messageElement.classList.add('bg-gray-300', 'text-gray-800', 'mr-auto');
        senderSpan.textContent = 'Peer: ';
    } else {
        messageElement.classList.add('bg-yellow-200', 'text-yellow-800', 'text-center', 'w-full', 'max-w-full');
        senderSpan.textContent = 'System: ';
    }
    messageElement.appendChild(senderSpan);
    messageElement.append(document.createTextNode(message));
    chatLog.appendChild(messageElement);
    chatLog.scrollTop = chatLog.scrollHeight;
}

// Role Selection
if (hostChatBtn) {
    hostChatBtn.onclick = () => {
        console.log("Host Chat button clicked.");
        if (!roleSelectionContainer || !hostContainer || !resetContainer) {
            console.error("HostChatBtn: Critical UI elements missing for host role.");
            return;
        }
        roleSelectionContainer.classList.add('hidden');
        hostContainer.classList.remove('hidden');
        resetContainer.classList.remove('hidden');
        updateConnectionStatus('Host mode selected.');
        generalInstructions.textContent = "Click 'Generate My Connection Code', send it to your friend, then paste their reply and click 'Finalize Connection'.";
    };
} else {
    console.error("hostChatBtn not found, cannot attach event listener.");
}

if (joinChatBtn) {
    joinChatBtn.onclick = () => {
        console.log("Join Chat button clicked.");
        if (!roleSelectionContainer || !joinerContainer || !resetContainer) {
            console.error("JoinChatBtn: Critical UI elements missing for joiner role.");
            return;
        }
        roleSelectionContainer.classList.add('hidden');
        joinerContainer.classList.remove('hidden');
        resetContainer.classList.remove('hidden');
        updateConnectionStatus('Joiner mode selected.');
        generalInstructions.textContent = "Paste the Host's code, click 'Submit Host's Code & Get My Reply Code', then send your reply code back to the host.";
    };
} else {
    console.error("joinChatBtn not found, cannot attach event listener.");
}
console.log("Role selection button event listeners attachment attempted.");
// Host Logic
if(generateHostCodeBtn) {
    generateHostCodeBtn.onclick = async () => {
        console.log("Generate Host Code button clicked.");
        try {
            updateConnectionStatus('Generating host code...');
            initializePeerConnection();
            dataChannel = peerConnection.createDataChannel('chatChannel');
            console.log("Host: Data channel created.");
            setupDataChannelEvents();

            const offer = await peerConnection.createOffer();
            console.log("Host: Offer created.");
            await peerConnection.setLocalDescription(offer);
            console.log("Host: Local description (offer) set.");
            
            hostCodeOutput.value = JSON.stringify(peerConnection.localDescription);
            updateConnectionStatus('Host code generated.');
            generalInstructions.textContent = 'Send "My Connection Code" to your friend. Then wait for their reply code.';
            appendMessage('Your connection code is generated. Send it to your friend.', 'System');
        } catch (error) {
            console.error('Error creating offer:', error);
            updateConnectionStatus(`Error: ${error.message}`);
            appendMessage(`Error creating offer: ${error.message}`, 'System');
        }
    };
} else { console.error("generateHostCodeBtn not found."); }

if(friendReplyCodeInput) {
    friendReplyCodeInput.oninput = () => {
        finalizeConnectionBtn.disabled = !friendReplyCodeInput.value.trim();
    };
} else { console.error("friendReplyCodeInput not found."); }


if(finalizeConnectionBtn) {
    finalizeConnectionBtn.onclick = async () => {
        console.log("Finalize Connection button clicked.");
        const friendCode = friendReplyCodeInput.value.trim();
        if (!friendCode) {
            alert('Please paste your friend\'s reply code.');
            return;
        }
        if (!peerConnection || !peerConnection.localDescription) {
            alert('Please generate your host code first.');
            return;
        }
        try {
            updateConnectionStatus('Processing friend\'s code...');
            const answer = JSON.parse(friendCode);
            await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
            console.log("Host: Remote description (answer) set.");
            updateConnectionStatus('Friend\'s code accepted. Attempting to connect...');
            generalInstructions.textContent = 'Trying to connect...';
            appendMessage('Friend\'s reply code accepted. Connection should establish soon.', 'System');
        } catch (error) {
            console.error('Error adding answer:', error);
            updateConnectionStatus(`Error: ${error.message}`);
            appendMessage(`Error processing friend's code: ${error.message}`, 'System');
        }
    };
} else { console.error("finalizeConnectionBtn not found."); }

// Joiner Logic
if(hostOriginalCodeInput) {
    hostOriginalCodeInput.oninput = () => {
        generateJoinerReplyBtn.disabled = !hostOriginalCodeInput.value.trim();
    };
} else { console.error("hostOriginalCodeInput not found."); }

if(generateJoinerReplyBtn) {
    generateJoinerReplyBtn.onclick = async () => {
        console.log("Generate Joiner Reply button clicked.");
        const hostCode = hostOriginalCodeInput.value.trim();
        if (!hostCode) {
            alert('Please paste the host\'s connection code.');
            return;
        }
        try {
            updateConnectionStatus('Processing host\'s code & generating reply...');
            initializePeerConnection();

            const offer = JSON.parse(hostCode);
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            console.log("Joiner: Remote description (offer) set.");
            
            const answer = await peerConnection.createAnswer();
            console.log("Joiner: Answer created.");
            await peerConnection.setLocalDescription(answer);
            console.log("Joiner: Local description (answer) set.");

            joinerReplyCodeOutput.value = JSON.stringify(peerConnection.localDescription);
            updateConnectionStatus('Reply code generated.');
            generalInstructions.textContent = 'Send "My Reply Code" back to the host. Waiting for connection...';
            appendMessage('Your reply code generated. Send it to the host.', 'System');
        } catch (error) {
            console.error('Error creating answer:', error);
            updateConnectionStatus(`Error: ${error.message}`);
            appendMessage(`Error processing host's code: ${error.message}`, 'System');
        }
    };
} else { console.error("generateJoinerReplyBtn not found."); }

// Chat Logic
if(sendButton) {
    sendButton.onclick = () => {
        console.log("Send button clicked.");
        const message = messageInput.value.trim();
        if (message && dataChannel && dataChannel.readyState === 'open') {
            dataChannel.send(message);
            appendMessage(message, 'Me');
            messageInput.value = '';
        } else if (!dataChannel || dataChannel.readyState !== 'open') {
            appendMessage('Cannot send message. Data channel is not open.', 'System');
            console.warn("Attempted to send message, but dataChannel not open. State:", dataChannel ? dataChannel.readyState : "null");
        }
    };
} else { console.error("sendButton not found.");
}

if(messageInput) {
    messageInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            if(sendButton) sendButton.click();
        }
    });
} else { console.error("messageInput not found."); }

// Initialize
console.log("Attempting to call initializeApp().");
try {
    initializeApp();
} catch (e) {
    console.error("Error during initial initializeApp() call:", e);
    if (connectionStatus) connectionStatus.textContent = "Error initializing app. Check console.";
}
console.log("Script execution finished.");
                      
