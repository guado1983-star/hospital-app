import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

GMAIL_USER = os.getenv("GMAIL_USER")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


def send_reset_password_email(to_email: str, full_name: str, token: str):
    if not GMAIL_USER or not GMAIL_APP_PASSWORD:
        raise RuntimeError("GMAIL_USER and GMAIL_APP_PASSWORD must be set in .env")

    reset_url = f"{FRONTEND_URL}/reset-password?token={token}"

    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; color: #333;">
        <h2>Hello {full_name},</h2>
        <p>We received a request to reset your Hospital App password.</p>
        <p>Click the button below to choose a new password:</p>
        <a href="{reset_url}"
           style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;
                  text-decoration:none;border-radius:6px;font-weight:bold;">
            Reset Password
        </a>
        <p style="margin-top:16px;color:#666;font-size:13px;">
            Or copy this link into your browser:<br>
            <a href="{reset_url}">{reset_url}</a>
        </p>
        <p style="color:#999;font-size:12px;">This link expires in 1 hour. If you did not request a reset, you can ignore this email.</p>
    </body>
    </html>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Reset your Hospital App password"
    msg["From"] = GMAIL_USER
    msg["To"] = to_email
    msg.attach(MIMEText(body, "html"))

    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
        server.sendmail(GMAIL_USER, to_email, msg.as_string())


def send_verification_email(to_email: str, full_name: str, token: str):
    if not GMAIL_USER or not GMAIL_APP_PASSWORD:
        raise RuntimeError("GMAIL_USER and GMAIL_APP_PASSWORD must be set in .env")

    verify_url = f"{FRONTEND_URL}/verify-email?token={token}"

    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; color: #333;">
        <h2>Hello {full_name},</h2>
        <p>Thank you for registering at Hospital App.</p>
        <p>Please click the button below to verify your email address:</p>
        <a href="{verify_url}"
           style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;
                  text-decoration:none;border-radius:6px;font-weight:bold;">
            Verify Email
        </a>
        <p style="margin-top:16px;color:#666;font-size:13px;">
            Or copy this link into your browser:<br>
            <a href="{verify_url}">{verify_url}</a>
        </p>
        <p style="color:#999;font-size:12px;">If you did not create this account, you can ignore this email.</p>
    </body>
    </html>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Verify your Hospital App account"
    msg["From"] = GMAIL_USER
    msg["To"] = to_email
    msg.attach(MIMEText(body, "html"))

    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
        server.sendmail(GMAIL_USER, to_email, msg.as_string())
