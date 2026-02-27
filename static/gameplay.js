document.addEventListener('DOMContentLoaded', () => {
    // Basic init
});

/**
 * Robust helper to get Django CSRF Token from cookies or DOM
 */
function getCsrfToken() {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, 10) === ('csrftoken=')) {
                cookieValue = decodeURIComponent(cookie.substring(10));
                break;
            }
        }
    }
    if (!cookieValue) {
        const csrfInput = document.querySelector('[name=csrfmiddlewaretoken]');
        if (csrfInput) cookieValue = csrfInput.value;
    }
    return cookieValue;
}

/**
 * Connects to the backend API to place an order
 */
async function executeTrade(action) {
    const answerInput = document.getElementById('answer-input').value.trim();
    const priceInput = document.getElementById('price-input').value;
    
    // 1. TRUE ANSWER VALIDATION
    const expectedAnswerSpan = document.getElementById("correct-math-answer");
    const expectedAnswer = expectedAnswerSpan ? expectedAnswerSpan.textContent.trim().toLowerCase() : "";

    // If the backend provided an answer, check it strictly
    if (expectedAnswer && expectedAnswer !== "none" && expectedAnswer !== "waiting...") {
        const providedStr = answerInput.toLowerCase();
        
        // Checks if they match as strict text OR as numbers (so 45.0 == 45)
        const isNumericMatch = !isNaN(expectedAnswer) && !isNaN(providedStr) && Number(expectedAnswer) === Number(providedStr);
        
        // Helpful debugging tool in your browser console (F12)
        console.log("Expected Math Answer:", expectedAnswer, "| You Typed:", providedStr);
        
        if (expectedAnswer !== providedStr && !isNumericMatch) {
            alert("Wrong answer! Try again.");
            return; // Stops the trade immediately
        }
    } else if (!answerInput) {
        // Fallback if no specific answer was passed but they left it blank
        alert("Please enter your answer before trading.");
        return;
    }

    // 2. Price Validation
    if (!priceInput || priceInput <= 0) {
        alert("Enter a valid quote price greater than 0.");
        return;
    }

    const csrfToken = getCsrfToken();
    if (!csrfToken) {
        alert("Security Token Missing! Please refresh the page.");
        return;
    }

    const orderData = new URLSearchParams({
        'type': action === 'Buy' ? 'BID' : 'ASK',
        'price': parseInt(priceInput),
        'game_id': window.currentGameId
    });

    try {
        const response = await fetch('/api/order/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-CSRFToken': csrfToken
            },
            body: orderData
        });

        const result = await response.json();

        if (result.status === 'queued') {
            addOrderToUI(action, priceInput);
            document.getElementById('price-input').value = '';
            document.getElementById('answer-input').value = ''; // clear answer on success
        } else {
            let msg = result.message || "Failed to place order.";
            
            // Intercept and change backend message
            if (msg.includes("Only ONE")) {
                if (action === 'Buy') {
                    msg = "Some user already made a bid for this round.";
                } else {
                    msg = "Some user already sold for this round.";
                }
            }
            alert(msg);
        }

    } catch (error) {
        console.error('Error placing order:', error);
        alert("Connection error. Make sure your server is running.");
    }
}

/**
 * Internal UI helper to render the Working Orders row
 */
function addOrderToUI(action, price) {
    const actionColor = action === 'Buy' ? '#38a169' : '#e53e3e';
    const ordersList = document.getElementById('working-orders-list');
    
    if (!ordersList) return;
    
    const orderRow = document.createElement('div');
    orderRow.className = 'data-row order-item';
    orderRow.style.display = "grid";
    orderRow.style.gridTemplateColumns = "1fr 1fr 1fr";
    orderRow.style.textAlign = "center";
    orderRow.style.padding = "8px 0";
    orderRow.style.borderBottom = "1px solid #3d2b56";
    
    orderRow.innerHTML = `
        <span style="color: ${actionColor}; font-weight: bold;">${action.toUpperCase()}</span>
        <span>₹${price}</span>
        <span style="cursor: pointer; color: #a0aec0;" onclick="this.parentElement.remove()">✕</span>
    `;

    ordersList.appendChild(orderRow);
}

/**
 * Populate Global Trades Table from LocalStorage
 */
document.addEventListener("DOMContentLoaded", () => {
    const globalTradeContainer = document.getElementById("global-trades-list");
    if (!globalTradeContainer) return;

    const gameIdKey = "globalTrades_" + window.currentGameId;
    const savedTrades = JSON.parse(localStorage.getItem(gameIdKey)) || {};
    
    globalTradeContainer.innerHTML = "";
    let hasAnyTrades = false;

    for (let r = 1; r <= 6; r++) {
        if (savedTrades[r] && savedTrades[r].length > 0) {
            hasAnyTrades = true;
            
            savedTrades[r].forEach(trade => {
                const row = document.createElement("div");
                row.className = "data-row";
                row.style.display = "grid";
                row.style.gridTemplateColumns = "1fr 1.5fr 1.5fr 1fr";
                row.style.textAlign = "center";
                row.style.borderBottom = "1px solid #3d2b56";
                row.style.padding = "8px 0";

                row.innerHTML = `
                    <span style="color:#aaa;">R${r}</span>
                    <span style="color:#38a169; font-weight:bold;">${trade.buyer}</span>
                    <span style="color:#e53e3e; font-weight:bold;">${trade.seller}</span>
                    <span style="color:#fce34d;">₹${trade.price}</span>
                `;
                globalTradeContainer.appendChild(row);
            });
        }
    }

    if (!hasAnyTrades) {
        globalTradeContainer.innerHTML = `
            <div class="data-row" style="display:block; text-align:center; padding: 15px; color: #888;">
                No trades have occurred globally yet.
            </div>
        `;
    }
});
