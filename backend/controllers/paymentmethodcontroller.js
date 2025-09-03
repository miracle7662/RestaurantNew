const db = require('../config/db');

exports.getPaymentMethods = (req, res) => {
    try {
        // Define payment methods for India with the requested sequence
        const paymentMethodMap = {
            'IN': [
                { method_id: 1, method_name: 'Cash', description: 'Cash Payment' },
                { method_id: 2, method_name: 'Credit/Debit Card', description: 'Visa/Mastercard/Rupay' },
                { method_id: 3, method_name: 'Google Pay', description: 'Google Pay UPI' },
                { method_id: 4, method_name: 'PhonePe', description: 'PhonePe UPI and Digital Wallet' },
                { method_id: 5, method_name: 'Paytm', description: 'Paytm UPI and Digital Wallet' },
                { method_id: 6, method_name: 'Freecharge', description: 'Freecharge UPI and Digital Wallet' },
                { method_id: 7, method_name: 'BHIM Pay', description: 'BHIM UPI Payment App' },
                { method_id: 8, method_name: 'Zomato Wallet', description: 'Zomato Digital Wallet for food orders' },
                { method_id: 9, method_name: 'Swiggy Money', description: 'Swiggy Digital Wallet for food orders' }
            ]
        };
        
        // Always return payment methods for India
        const paymentMethods = paymentMethodMap['IN'];
        
        res.json(paymentMethods);
    } catch (error) {
        console.error('Error fetching payment methods:', error);
        res.status(500).json({ error: 'Failed to fetch payment methods' });
    }
};