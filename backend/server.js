require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const Contact = require('./models/Contact');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/180dc-vnit', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// Nodemailer Transporter Setup
const transporter = nodemailer.createTransport({
  service: 'gmail', // or use SendGrid/Resend
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Contact Route
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, organization, type, message } = req.body;

    // 1. Store in Database
    const newContact = new Contact({ name, email, organization, type, message });
    await newContact.save();

    // 2. Email templates
    
    // Email sent to the Admin (You)
    const adminMailOptions = {
      from: `"${name}" <${process.env.EMAIL_USER}>`,
      replyTo: email,
      to: process.env.ADMIN_EMAIL, // Your email to receive notifications
      subject: `New Portal Inquiry: ${name} (${type})`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #111318; padding: 20px; max-width: 600px;">
          <h2 style="color: #10b981;">New Inquiry Received!</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Organization:</strong> ${organization || 'N/A'}</p>
          <p><strong>Type:</strong> ${type}</p>
          <hr style="border: 1px solid #e2e2e8; margin: 20px 0;">
          <p><strong>Message:</strong></p>
          <p style="background: #f4f4f5; padding: 15px; border-radius: 8px;">${message}</p>
        </div>
      `,
    };

    // Auto-Reply sent to the User
    const userMailOptions = {
      from: `"180 Degrees Consulting VNIT" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `We've received your message, ${name}!`,
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; color: #111318; padding: 30px; max-width: 600px; border: 1px solid #e2e2e8; border-radius: 12px; margin: auto;">
          <h2 style="color: #10b981;">Thank you for reaching out!</h2>
          <p style="font-size: 16px; line-height: 1.6;">Hi ${name},</p>
          <p style="font-size: 16px; line-height: 1.6;">We have successfully received your inquiry through our portal. Our team will review your message and get back to you shortly.</p>
          <br>
          <p style="font-size: 16px; line-height: 1.6;">Best regards,</p>
          <p style="font-size: 16px; font-weight: bold;">The 180DC VNIT Nagpur Team</p>
        </div>
      `,
    };

    // Send Emails asynchronously
    await transporter.sendMail(adminMailOptions);
    await transporter.sendMail(userMailOptions);

    res.status(200).json({ success: true, message: 'Message sent and stored successfully!' });
  } catch (error) {
    console.error('Contact Form Error:', error);
    res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
