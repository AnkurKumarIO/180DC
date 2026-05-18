const dns = require('dns');
dns.setDefaultResultOrder('ipv4first'); // Force IPv4 first to bypass Render IPv6 routing issues

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
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/180dc-vnit')
.then(() => console.log('✅ MongoDB connected successfully'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// Nodemailer Transporter Setup
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  family: 4, // Force IPv4 resolution on SMTP transporter to prevent Render IPv6 ENETUNREACH errors
  connectionTimeout: 10000 // 10s connection timeout
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
        <div style="background-color: #f8fafc; padding: 40px 20px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
            <!-- Alert Header -->
            <div style="background-color: #0f172a; padding: 30px 40px; border-bottom: 3px solid #10b981;">
              <div style="display: inline-block; background-color: #10b981; color: #ffffff; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; padding: 4px 10px; border-radius: 4px; margin-bottom: 12px;">
                New Inquiry
              </div>
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; line-height: 1.3;">Inquiry: ${name}</h1>
              <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 13px;">Type: <strong style="color: #10b981;">${type}</strong></p>
            </div>

            <!-- Inquiry Details -->
            <div style="padding: 40px;">
              <h3 style="color: #0f172a; margin: 0 0 20px 0; font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
                Contact Details
              </h3>
              
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 10px 0; width: 35%; color: #64748b; font-size: 14px; font-weight: 600; border-bottom: 1px solid #f8fafc;">Full Name</td>
                  <td style="padding: 10px 0; color: #0f172a; font-size: 14px; font-weight: 600; border-bottom: 1px solid #f8fafc;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #64748b; font-size: 14px; font-weight: 600; border-bottom: 1px solid #f8fafc;">Email Address</td>
                  <td style="padding: 10px 0; color: #0566d9; font-size: 14px; font-weight: 600; border-bottom: 1px solid #f8fafc;">
                    <a href="mailto:${email}" style="color: #0566d9; text-decoration: none;">${email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #64748b; font-size: 14px; font-weight: 600; border-bottom: 1px solid #f8fafc;">Organization</td>
                  <td style="padding: 10px 0; color: #0f172a; font-size: 14px; border-bottom: 1px solid #f8fafc;">${organization || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #64748b; font-size: 14px; font-weight: 600; border-bottom: 1px solid #f8fafc;">Inquiry Category</td>
                  <td style="padding: 10px 0; color: #10b981; font-size: 14px; font-weight: 700; border-bottom: 1px solid #f8fafc;">${type}</td>
                </tr>
              </table>

              <!-- Message block -->
              <h3 style="color: #0f172a; margin: 0 0 15px 0; font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
                Inquiry Message
              </h3>
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 25px; border-radius: 12px; color: #334155; font-size: 15px; line-height: 1.6; font-style: italic; margin-bottom: 35px;">
                "${message}"
              </div>

              <!-- Action Buttons -->
              <div style="text-align: center;">
                <a href="mailto:${email}" style="background-color: #10b981; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 9999px; font-size: 14px; font-weight: bold; letter-spacing: 0.05em; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);">
                  Reply Directly
                </a>
              </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 40px; text-align: center;">
              <p style="color: #94a3b8; font-size: 11px; margin: 0; line-height: 1.5;">
                This email was auto-generated by the 180DC VNIT Nagpur Portal Backend.
              </p>
            </div>
          </div>
        </div>
      `,
    };

    // Auto-Reply sent to the User
    const userMailOptions = {
      from: `"180 Degrees Consulting VNIT" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `We've received your message, ${name}!`,
      html: `
        <div style="background-color: #f8fafc; padding: 40px 20px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
            <!-- Brand Header -->
            <div style="background: linear-gradient(135deg, #10b981 0%, #0566d9 100%); padding: 35px 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;">180 Degrees Consulting</h1>
              <p style="color: #e2fbf0; margin: 5px 0 0 0; font-size: 14px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;">VNIT Nagpur Chapter</p>
            </div>
            
            <!-- Body Content -->
            <div style="padding: 40px;">
              <h2 style="color: #0f172a; margin: 0 0 20px 0; font-size: 20px; font-weight: 700; line-height: 1.4;">Thank you for reaching out, ${name}!</h2>
              
              <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
                We have received your message submitted through the 180DC VNIT Nagpur portal. We appreciate your interest in collaborating or connecting with us!
              </p>
              
              <!-- What Happens Next Section -->
              <div style="background-color: #f1f5f9; border-left: 4px solid #10b981; padding: 20px; border-radius: 0 8px 8px 0; margin-bottom: 30px;">
                <h4 style="color: #0f172a; margin: 0 0 8px 0; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">What Happens Next?</h4>
                <ul style="margin: 0; padding-left: 18px; color: #475569; font-size: 14px; line-height: 1.6;">
                  <li style="margin-bottom: 6px;"><strong>Review:</strong> Our consulting and operations team will review your message.</li>
                  <li style="margin-bottom: 6px;"><strong>Response:</strong> A representative will get in touch with you within 2-3 business days.</li>
                  <li><strong>Discussion:</strong> We will arrange a briefing call to understand how we can maximize your social impact.</li>
                </ul>
              </div>

              <!-- Button -->
              <div style="text-align: center; margin-bottom: 35px;">
                <a href="https://linkedin.com/company/180dc-vnit-nagpur" target="_blank" style="background: linear-gradient(135deg, #10b981 0%, #0566d9 100%); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 9999px; font-size: 14px; font-weight: bold; letter-spacing: 0.05em; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);">
                  Visit Our LinkedIn
                </a>
              </div>

              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 0 0 25px 0;">

              <!-- Signature -->
              <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0;">
                Warm regards,<br>
                <strong style="color: #0f172a;">The 180DC VNIT Nagpur Team</strong><br>
                <span style="color: #64748b; font-size: 12px;">Social Impact Consulting</span>
              </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 25px 40px; text-align: center;">
              <p style="color: #94a3b8; font-size: 11px; margin: 0 0 10px 0; line-height: 1.5;">
                © 2026 180 Degrees Consulting VNIT Nagpur. All rights reserved.<br>
                Part of the world's largest university-based consultancy for social enterprises.
              </p>
              <div style="margin-top: 15px;">
                <a href="https://linkedin.com/company/180dc-vnit-nagpur" style="color: #10b981; text-decoration: none; font-size: 12px; font-weight: 600; margin: 0 10px;">LinkedIn</a>
                <span style="color: #cbd5e1;">•</span>
                <a href="mailto:vnitnagpur@180dc.org" style="color: #10b981; text-decoration: none; font-size: 12px; font-weight: 600; margin: 0 10px;">Email Us</a>
              </div>
            </div>
          </div>
        </div>
      `,
    };

    // Send Emails in the background (non-blocking) so that placeholder/invalid email credentials do not crash the database submission
    transporter.sendMail(adminMailOptions)
      .then(() => console.log('📨 Admin notification email sent successfully'))
      .catch(err => console.error('❌ Error sending admin notification email:', err.message));

    transporter.sendMail(userMailOptions)
      .then(() => console.log('📨 User auto-reply email sent successfully'))
      .catch(err => console.error('❌ Error sending user auto-reply email:', err.message));

    res.status(200).json({ success: true, message: 'Message stored successfully in the database!' });
  } catch (error) {
    console.error('Contact Form Error:', error);
    res.status(500).json({ success: false, message: 'Failed to save message in database.' });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
