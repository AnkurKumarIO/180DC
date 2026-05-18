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
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Inquiry Alert</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
          <div style="background-color: #f8fafc; padding: 24px 12px; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <div style="max-width: 580px; width: 100%; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.05); border: 1px solid #e2e8f0;">
              <!-- Header Banner -->
              <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 30px 24px; border-bottom: 4px solid #10b981; text-align: center;">
                <div style="display: inline-block; background-color: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; color: #34d399; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; padding: 6px 14px; border-radius: 9999px; margin-bottom: 12px;">
                  New Portal Submission
                </div>
                <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; tracking-wide: -0.02em;">Inquiry from ${name}</h1>
              </div>

              <!-- Content Body -->
              <div style="padding: 32px 24px;">
                <h2 style="color: #0f172a; margin: 0 0 20px 0; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;">
                  Submission Details
                </h2>

                <!-- Modern Vertical Details List (100% Mobile Responsive) -->
                <div style="margin-bottom: 28px;">
                  <div style="margin-bottom: 16px;">
                    <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Full Name</div>
                    <div style="font-size: 15px; font-weight: 600; color: #0f172a;">${name}</div>
                  </div>

                  <div style="margin-bottom: 16px;">
                    <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Email Address</div>
                    <div style="font-size: 15px; font-weight: 600; color: #0566d9;">
                      <a href="mailto:${email}" style="color: #0566d9; text-decoration: none;">${email}</a>
                    </div>
                  </div>

                  <div style="margin-bottom: 16px;">
                    <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Organization</div>
                    <div style="font-size: 15px; color: #334155;">${organization || 'N/A'}</div>
                  </div>

                  <div style="margin-bottom: 16px;">
                    <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Inquiry Type</div>
                    <div style="font-size: 13px; font-weight: 700; color: #10b981; display: inline-block; background-color: #ecfdf5; padding: 4px 10px; border-radius: 6px; border: 1px solid #d1fae5;">${type}</div>
                  </div>
                </div>

                <!-- Message Box -->
                <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;">
                  Message Content
                </h2>
                <div style="background-color: #f8fafc; border-left: 4px solid #0566d9; border-radius: 4px 12px 12px 4px; padding: 20px; color: #334155; font-size: 14px; line-height: 1.6; font-style: italic; margin-bottom: 32px;">
                  "${message}"
                </div>

                <!-- Quick Action -->
                <div style="text-align: center;">
                  <a href="mailto:${email}" style="background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 14px; font-weight: 700; letter-spacing: 0.03em; display: inline-block; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15); transition: all 0.2s ease;">
                    Reply Directly
                  </a>
                </div>
              </div>

              <!-- Footer -->
              <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px; text-align: center;">
                <p style="color: #94a3b8; font-size: 11px; margin: 0; line-height: 1.5;">
                  This is an automated administrative notification sent securely from your website's contact form portal.
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    // Auto-Reply sent to the User
    const userMailOptions = {
      from: `"180 Degrees Consulting VNIT" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `We've received your message, ${name}!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Thank You for Reaching Out</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
          <div style="background-color: #f8fafc; padding: 24px 12px; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <div style="max-width: 580px; width: 100%; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(16, 185, 129, 0.05); border: 1px solid #e2e8f0;">
              <!-- Beautiful Modern Gradient Header -->
              <div style="background: linear-gradient(135deg, #10b981 0%, #0566d9 100%); padding: 36px 24px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0 0 4px 0; font-size: 20px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase;">180 Degrees Consulting</h1>
                <p style="color: #e2fbf0; margin: 0; font-size: 13px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; opacity: 0.9;">VNIT Nagpur Chapter</p>
              </div>

              <!-- Main Content Body -->
              <div style="padding: 32px 24px;">
                <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 18px; font-weight: 700; line-height: 1.3;">Hello ${name},</h2>
                <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
                  Thank you for connecting with us! We have successfully received your inquiry through our portal, and our leadership team is already reviewing it.
                </p>

                <!-- What Happens Next Step Cards (Optimized vertical stack for mobile) -->
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 28px;">
                  <h3 style="color: #0f172a; margin: 0 0 16px 0; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; text-align: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
                    Next Milestones
                  </h3>
                  
                  <!-- Step 1 -->
                  <div style="margin-bottom: 16px;">
                    <div style="display: inline-block; background-color: #e0f2fe; color: #0369a1; font-weight: 800; font-size: 11px; padding: 3px 8px; border-radius: 9999px; margin-bottom: 4px;">STEP 1</div>
                    <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 2px;">Team Review</div>
                    <div style="font-size: 13px; color: #475569; line-height: 1.5;">Our operations team evaluates your bottlenecks and goals.</div>
                  </div>

                  <!-- Step 2 -->
                  <div style="margin-bottom: 16px;">
                    <div style="display: inline-block; background-color: #dcfce7; color: #15803d; font-weight: 800; font-size: 11px; padding: 3px 8px; border-radius: 9999px; margin-bottom: 4px;">STEP 2</div>
                    <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 2px;">Consultant Matching</div>
                    <div style="font-size: 13px; color: #475569; line-height: 1.5;">We pair you with our dedicated strategy consultants within 2-3 business days.</div>
                  </div>

                  <!-- Step 3 -->
                  <div>
                    <div style="display: inline-block; background-color: #fef3c7; color: #b45309; font-weight: 800; font-size: 11px; padding: 3px 8px; border-radius: 9999px; margin-bottom: 4px;">STEP 3</div>
                    <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 2px;">Kickoff Call</div>
                    <div style="font-size: 13px; color: #475569; line-height: 1.5;">We schedule a short briefing to begin the impact cycle.</div>
                  </div>
                </div>

                <!-- Custom CTA Button -->
                <div style="text-align: center; margin-bottom: 32px;">
                  <a href="https://www.linkedin.com/company/180-degrees-consulting-vnit-nagpur/" target="_blank" style="background: linear-gradient(135deg, #10b981 0%, #0566d9 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 14px; font-weight: 700; letter-spacing: 0.03em; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2); transition: all 0.2s ease;">
                    Discover Our Work on LinkedIn
                  </a>
                </div>

                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 0 0 24px 0;">

                <!-- Styled Signature -->
                <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0;">
                  Warmest regards,<br>
                  <strong style="color: #0f172a;">The 180DC VNIT Nagpur Team</strong><br>
                  <span style="color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Social Impact Consulting Chapter</span>
                </p>
              </div>

              <!-- Footer with LinkedIn/Mail Links -->
              <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 28px 24px; text-align: center;">
                <p style="color: #94a3b8; font-size: 11px; margin: 0 0 16px 0; line-height: 1.6;">
                  © 2026 180 Degrees Consulting VNIT Nagpur.<br>
                  Part of the world's largest university-based consultancy for social enterprises.
                </p>
                <div style="margin-top: 12px;">
                  <a href="https://www.linkedin.com/company/180-degrees-consulting-vnit-nagpur/" style="color: #10b981; text-decoration: none; font-size: 12px; font-weight: 700; margin: 0 12px;">LinkedIn</a>
                  <span style="color: #cbd5e1;">•</span>
                  <a href="mailto:vnitnagpur@180dc.org" style="color: #10b981; text-decoration: none; font-size: 12px; font-weight: 700; margin: 0 12px;">Email Us</a>
                </div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    // Send Emails (Awaited with individual try/catch blocks so that serverless environments like Vercel do not terminate the process prematurely)
    try {
      await transporter.sendMail(adminMailOptions);
      console.log('📨 Admin notification email sent successfully');
    } catch (err) {
      console.error('❌ Error sending admin notification email:', err.message);
    }

    try {
      await transporter.sendMail(userMailOptions);
      console.log('📨 User auto-reply email sent successfully');
    } catch (err) {
      console.error('❌ Error sending user auto-reply email:', err.message);
    }

    res.status(200).json({ success: true, message: 'Message stored successfully in the database!' });
  } catch (error) {
    console.error('Contact Form Error:', error);
    res.status(500).json({ success: false, message: 'Failed to save message in database.' });
  }
});

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

module.exports = app;
