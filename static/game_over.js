document.addEventListener('DOMContentLoaded', () => {
    // This is where your actual game data would go
    const players = [
        { name: "Player A", pnl: 2500 },
        { name: "Player B", pnl: -1200 },
        { name: "Player C", pnl: 850 },
        { name: "Player D", pnl: -300 },
        { name: "Player E", pnl: 0 },
        { name: "Player F", pnl: -2150 }
    ];

    const tableBody = document.getElementById('results-body');

    players.forEach(player => {
        const row = document.createElement('tr');
        
        let pnlText = "";
        let pnlClass = "";

        if (player.pnl > 0) {
            pnlText = `+$${player.pnl.toLocaleString()}`;
            pnlClass = "pos-amount";
        } else if (player.pnl < 0) {
            pnlText = `-$${Math.abs(player.pnl).toLocaleString()}`;
            pnlClass = "neg-amount";
        } else {
            pnlText = `$0`;
            pnlClass = ""; 
        }

        row.innerHTML = `
            <td>${player.name}</td>
            <td class="${pnlClass}">${pnlText}</td>
        `;

        tableBody.appendChild(row);
    });
});