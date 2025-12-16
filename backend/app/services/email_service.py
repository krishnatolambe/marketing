import smtplib
import os
import urllib.request
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from email.mime.base import MIMEBase
from email import encoders
from typing import Optional, List
from ..database import settings
from ..logging_config import get_logger

logger = get_logger(__name__)

class EmailService:
    def __init__(self):
        self.host = settings.email_host
        self.port = settings.email_port
        self.username = settings.email_username
        self.password = settings.email_password
        self.use_tls = settings.email_use_tls
        
    def send_email_with_image(
        self, 
        to_emails: List[str], 
        subject: str, 
        content: str, 
        image_url: Optional[str] = None,
        image_path: Optional[str] = None
    ) -> bool:
        """
        Send an email with AI-generated content and optional image attachment
        
        Args:
            to_emails: List of recipient email addresses
            subject: Email subject
            content: Email content/body
            image_url: URL of image to attach (optional)
            image_path: Local path to image file (optional)
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            # Create message
            msg = MIMEMultipart()
            msg['From'] = self.username
            msg['To'] = ', '.join(to_emails)
            msg['Subject'] = subject
            
            # Add body to email
            msg.attach(MIMEText(content, 'plain'))
            
            # Add image if provided
            if image_path and os.path.exists(image_path):
                with open(image_path, 'rb') as f:
                    img_data = f.read()
                image = MIMEImage(img_data)
                image.add_header('Content-Disposition', 'attachment', filename=os.path.basename(image_path))
                msg.attach(image)
            elif image_url:
                try:
                    # Download image from URL and attach it
                    with urllib.request.urlopen(image_url) as response:
                        img_data = response.read()
                    image = MIMEImage(img_data)
                    # Extract filename from URL or use default
                    filename = image_url.split('/')[-1] or 'image.jpg'
                    # Ensure filename has an extension
                    if '.' not in filename:
                        filename += '.jpg'
                    image.add_header('Content-Disposition', 'attachment', filename=filename)
                    msg.attach(image)
                except Exception as e:
                    logger.warning(f"Failed to download or attach image from URL {image_url}: {str(e)}")
                    # Add note about the image in the content instead
                    note = f"\n\nNote: This email was intended to include an image from: {image_url}"
                    msg.attach(MIMEText(note, 'plain'))
            
            # Create SMTP session
            server = smtplib.SMTP(self.host, self.port)
            
            # Enable TLS if required
            if self.use_tls:
                server.starttls()
                
            # Login with sender's email and password
            server.login(self.username, self.password)
            
            # Send email
            text = msg.as_string()
            server.sendmail(self.username, to_emails, text)
            server.quit()
            
            logger.info(f"Email sent successfully to {', '.join(to_emails)}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
            return False

# Create a global instance of the email service
email_service = EmailService()