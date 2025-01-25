document.getElementById('card-button').addEventListener('click', function() {
    // Make a POST request to your Laravel backend to create a Terminal Checkout
    fetch(paymentRoute, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': token,
        },
        body: JSON.stringify({
            amount: 1, // e.g. $10.00 in cents
        })
    })
    .then(response => response.json())
    .then(data => {
        // Handle response from Laravel, which contains the checkout ID or errors
        if (data.errors) {
            console.error('Error creating checkout:', data.errors);
        } else {
            console.log('Checkout created:', data);
            // Proceed to ask the Square Terminal to complete the checkout using the terminal checkout ID
        }
    })
    .catch(error => console.error('Error:', error));

});
