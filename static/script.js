function switchTab(evt, tabId) {
    const panes = document.querySelectorAll('.tab-pane');
    const tabs = document.querySelectorAll('.tab-link');
    panes.forEach(p => p.classList.remove('active'));
    tabs.forEach(t => t.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    evt.currentTarget.classList.add('active');
}

function initLobby() {
    // Add this at the top of initLobby
    const pathParts = window.location.pathname.split('/');
    const gameId = pathParts[pathParts.length - 2]; // Extracts ID from /waiting/123/
    const tableBody = document.getElementById("leaderboard-body");
    const statusText = document.getElementById("lobby-status");
    const profilePnl = document.getElementById("profile-pnl");
    
    let users = [{ name: "AlphaTrader (You)", pnl: 0 }];
    const bots = [
        { name: "Satoshi_V", pnl: 2100 },
        { name: "BullishBear", pnl: 3400 },
        { name: "CryptoKing", pnl: 1200 },
        { name: "MarketMaker_X", pnl: -500 },
        { name: "Technex_Bot", pnl: 0 }
    ];

    function renderTable() {
        users.sort((a, b) => b.pnl - a.pnl);
        tableBody.innerHTML = users.map((u, i) => `
            <tr>
                <td>#${i + 1}</td>
                <td>${u.name}</td>
                <td class="${u.pnl >= 0 ? 'pnl-pos' : 'pnl-neg'}">${u.pnl}</td>
            </tr>`).join('');
        statusText.innerText = `LOBBY STATUS: ${users.length}/6 PARTICIPANTS`;
        const myData = users.find(u => u.name.includes("(You)"));
        profilePnl.innerText = myData ? myData.pnl : 0;
        profilePnl.className = myData.pnl >= 0 ? 'pnl-pos' : 'pnl-neg';
    }

    // 1. Establish the connection
    const socket = new WebSocket(
        (window.location.protocol === 'https:' ? 'wss://' : 'ws://') 
        + window.location.host 
        + `/ws/waiting/${gameId}/`
    );

    // 2. Listen for the backend signal
    socket.onmessage = function(e) {
        const data = JSON.parse(e.data);
        
        // When the 6th player joins, the backend sends 'game_started'
        if (data.type === 'game_started') {
            // Clear your existing intervals so they don't interfere
            clearInterval(interval); 
            
            statusText.innerText = `LOBBY FULL! REDIRECTING...`;
            
            // Redirect to the actual Django URL instead of a static .html file
            setTimeout(() => {
                window.location.href = `/game/${gameId}/`;
            }, 1000);
        }

        // Optional: Real-time count update
        if (data.type === 'player_joined') {
            statusText.innerText = `LOBBY STATUS: ${data.player_count}/6 PARTICIPANTS`;
        }
    };

    let bIdx = 0;
    const interval = setInterval(() => {
        if (bIdx < bots.length) {
            users.push(bots[bIdx++]);
            renderTable();
        } else {
            clearInterval(interval);
            let seconds = 10;
            const countdown = setInterval(() => {
                statusText.innerText = `LOBBY FULL! REDIRECTING IN ${seconds}S...`;
                if (seconds <= 0) {
                    clearInterval(countdown);
                    document.getElementById("action-zone").innerHTML = 
                        `<button class="join-btn" onclick="window.location.href='gameplay.html'">JOIN IN!!</button>`;
                }
                seconds--;
            }, 1000);
        }
    }, 1500);
    renderTable();
}