document.addEventListener('DOMContentLoaded', () => {
    // 1. DATA EXTRACTION
    // Extract Game ID from URL: /game/123/ -> 123
    // const pathParts = window.location.pathname.split('/');
    // const gameId = pathParts[pathParts.length - 2];

    // 2. OTP-STYLE ANSWER BLOCKS LOGIC
    const blocks = document.querySelectorAll('.answer-block');
    
    blocks.forEach((block, index) => {
        block.addEventListener('input', (e) => {
            if (e.target.value.length === 1) {
                if (index < blocks.length - 1) {
                    blocks[index + 1].focus();
                }
            }
        });

        block.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && e.target.value === '') {
                if (index > 0) {
                    blocks[index - 1].focus();
                }
            }
        });
    });

    if(blocks.length > 0) {
        blocks[0].focus();
    }

    // 3. EXPOSE GAME ID GLOBALLY FOR FUNCTIONS
    // window.currentGameId = gameId;
});

/**
 * Helper to get Django CSRF Token from cookies
 */
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

/**
 * Connects to the backend API to place an order
 */
async function executeTrade(action) {
    const priceInput = document.getElementById('price-input');
    const price = priceInput.value;

    if (!price) {
        alert("Please enter a price first!");
        return;
    }


    // This sends the data to your Django 'api_order' view
    fetch('/api/order/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': '{{ csrf_token }}' // Standard security
        },
        body: JSON.stringify({
            price: price,
            order_type: 'BID' // Or 'ASK' based on button clicked
        })
    })
    .then(response => response.json())
    .then(data => alert(data.message));




    // Prepare data for Django View (api_place_order)
    const orderData = {
        'order_type': action === 'Buy' ? 'BID' : 'ASK',
        'price': parseInt(price),
        'game_id': window.currentGameId
    };

    try {
        const response = await fetch('/api/order/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(orderData)
        });

        const result = await response.json();

        if (result.status === 'queued') {
            // Success: Add to the "Working Orders" UI
            addOrderToUI(action, price);
            priceInput.value = '';
        } else {
            // Failure: Show error from backend (e.g., "No assets to sell")
            alert(result.message);
        }
    } catch (error) {
        console.error('Error placing order:', error);
        alert("Connection lost. Could not place order.");
    }
}

/**
 * Internal UI helper to render the row
 */
function addOrderToUI(action, price) {
    const actionColor = action === 'Buy' ? '#38a169' : '#e53e3e';
    const ordersList = document.getElementById('working-orders-list');
    
    const orderRow = document.createElement('div');
    orderRow.className = 'data-row order-item';
    
    orderRow.innerHTML = `
        <span style="color: ${actionColor}; font-weight: bold;">${action}</span>
        <span>$${price}</span>
        <span style="cursor: pointer; color: #a0aec0;" onclick="this.parentElement.remove()">✕</span>
    `;

    ordersList.appendChild(orderRow);
}