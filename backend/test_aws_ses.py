import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# --- Configuration ---
SMTP_SERVER = "email-smtp.us-east-1.amazonaws.com"
SMTP_PORT = 465  # TLS port

# Your Credentials
SMTP_USERNAME = "AKIAWCE7WYAVYCX6RKYD"
SMTP_PASSWORD = "BJdppJDo9TgsoGJywUtFDYKTnDUPwKb69CFi3GRrlKdr"

# Update these with your verified email addresses
SENDER_EMAIL = "no-reply@zygotrix.com"
RECIPIENT_EMAIL = "working.nouman.ejaz@gmail.com"
SUBJECT = "Test Email from Python & AWS SES"
BODY_TEXT = "This is a test email sent using Python smtplib and AWS SES credentials."

def send_test_email():
    # Create the email message
    message = MIMEMultipart()
    message["From"] = SENDER_EMAIL
    message["To"] = RECIPIENT_EMAIL
    message["Subject"] = SUBJECT

    # Attach the email body
    message.attach(MIMEText(BODY_TEXT, "plain"))

    # Create a secure SSL context
    context = ssl.create_default_context()

    try:
        print("Connecting to AWS SES...")
        # Connect to the server
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls(context=context) # Secure the connection
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            
            print("Login successful. Sending email...")
            server.sendmail(SENDER_EMAIL, RECIPIENT_EMAIL, message.as_string())
            print(f"✅ Email successfully sent to {RECIPIENT_EMAIL}")

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    send_test_email()