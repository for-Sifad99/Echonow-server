const nodemailer = require('nodemailer');
require('dotenv').config();

// In-memory storage for OTPs (in production, use Redis or database)
const otpStorage = new Map();

// Generate a random 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Create nodemailer transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

// Send OTP email
const sendOTPEmail = async (email, otp) => {
    const transporter = createTransporter();
    
    // Check if email configuration is available
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error('Email configuration is missing. Please check EMAIL_USER and EMAIL_PASS in .env file');
    }
    
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'EchoNow Email Verification',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">EchoNow Email Verification</h2>
                <p>Hello,</p>
                <p>Your verification code is:</p>
                <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
                    ${otp}
                </div>
                <p>This code will expire in 1 minute.</p>
                <p>If you didn't request this verification, please ignore this email.</p>
                <br>
                <p>Best regards,<br>The EchoNow Team</p>
            </div>
        `
    };
    
    try {
        return await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send verification email. Please check your email configuration.');
    }
};

// Request OTP
const requestOTP = (dbCollections) => {
    return async (req, res) => {
        try {
            const { email } = req.body;
            
            if (!email) {
                return res.status(400).json({ error: 'Email is required' });
            }
            
            // Check if user exists
            const user = await dbCollections.usersCollection.findOne({ email });
            
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            // Check if there's a recent OTP (less than 1 minute old)
            const existingOTP = otpStorage.get(email);
            if (existingOTP && Date.now() - existingOTP.timestamp < 60000) {
                return res.status(429).json({ 
                    error: 'Please wait before requesting a new OTP',
                    retryAfter: 60 - Math.floor((Date.now() - existingOTP.timestamp) / 1000)
                });
            }
            
            // Generate new OTP
            const otp = generateOTP();
            
            // Store OTP with timestamp
            otpStorage.set(email, {
                otp: otp,
                timestamp: Date.now()
            });
            
            // Send OTP email
            await sendOTPEmail(email, otp);
            
            res.json({ 
                message: 'OTP sent successfully',
                expiresAt: new Date(Date.now() + 60000).toISOString()
            });
        } catch (error) {
            console.error('Error requesting OTP:', error);
            if (error.message.includes('Email configuration')) {
                res.status(500).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Failed to send OTP. Please try again later.' });
            }
        }
    };
};

// Verify OTP
const verifyOTP = (dbCollections) => {
    return async (req, res) => {
        try {
            const { email, otp } = req.body;
            
            if (!email || !otp) {
                return res.status(400).json({ error: 'Email and OTP are required' });
            }
            
            // Get stored OTP
            const storedOTP = otpStorage.get(email);
            
            if (!storedOTP) {
                return res.status(400).json({ error: 'OTP not found or expired' });
            }
            
            // Check if OTP is expired (1 minute)
            if (Date.now() - storedOTP.timestamp > 60000) {
                otpStorage.delete(email);
                return res.status(400).json({ error: 'OTP has expired' });
            }
            
            // Verify OTP
            if (storedOTP.otp !== otp) {
                return res.status(400).json({ error: 'Invalid OTP' });
            }
            
            // Remove OTP from storage
            otpStorage.delete(email);
            
            // Update user verification status
            await dbCollections.usersCollection.updateOne(
                { email },
                { 
                    $set: { 
                        isEmailVerified: true,
                        emailVerifiedAt: new Date()
                    }
                }
            );
            
            res.json({ message: 'Email verified successfully' });
        } catch (error) {
            console.error('Error verifying OTP:', error);
            res.status(500).json({ error: 'Failed to verify OTP' });
        }
    };
};

// Check verification status
const checkVerificationStatus = (dbCollections) => {
    return async (req, res) => {
        try {
            const { email } = req.params;
            
            if (!email) {
                return res.status(400).json({ error: 'Email is required' });
            }
            
            // Check if user exists
            const user = await dbCollections.usersCollection.findOne({ email });
            
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            res.json({ 
                isEmailVerified: user.isEmailVerified || false,
                emailVerifiedAt: user.emailVerifiedAt || null
            });
        } catch (error) {
            console.error('Error checking verification status:', error);
            res.status(500).json({ error: 'Failed to check verification status' });
        }
    };
};

module.exports = {
    requestOTP,
    verifyOTP,
    checkVerificationStatus
};