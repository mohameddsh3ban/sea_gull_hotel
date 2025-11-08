import requests
from app.core.config import settings
from firebase_admin import firestore
from google.cloud.firestore_v1 import SERVER_TIMESTAMP

def build_email_html(name: str, **kwargs) -> str:
    """Build HTML email template."""
    date = kwargs.get('date', '')
    time = kwargs.get('time', '')
    guests = kwargs.get('guests', 0)
    room = kwargs.get('room', '')
    restaurant = kwargs.get('restaurant', '')
    cancel_token = kwargs.get('cancel_token', '')
    main_courses = kwargs.get('main_courses', [])
    upsell_items = kwargs.get('upsell_items', {})
    upsell_total_price = kwargs.get('upsell_total_price', 0)

    main_course_html = ""
    if restaurant.lower() in ['chinese', 'indian', 'italian'] and main_courses:
        def display_course(c):
            if c.strip().lower() == 'petto_chicken':
                return "Petto di Pollo (Chicken Breast)"
            elif c.strip().lower() == 'quatro_formagi':
                return "Quattro Formaggi"
            elif c.strip().lower() == 'chicken_pizza':
                return "Chicken Pizza"
            return c.replace('_', ' ').title()

        course_list_html = "<ul style='margin-top: 4px; padding-left: 20px;'>"
        for i, course in enumerate(main_courses, 1):
            course_list_html += f"<li>Guest {i}: {display_course(course)}</li>"
        course_list_html += "</ul>"
        main_course_html = f"<p><strong>🍽 Main Course(s):</strong> {course_list_html}</p>"

    sushi_html = ""
    if upsell_items:
        sushi_list_html = "<ul style='margin-top: 4px; padding-left: 20px;'>"
        for item_name, qty in upsell_items.items():
            if qty > 0:
                sushi_list_html += f"<li>{item_name} × {qty}</li>"
        sushi_list_html += "</ul>"
        sushi_html = f"<p><strong>🍣 Sushi Order:</strong> {sushi_list_html}</p>"
        if upsell_total_price and upsell_total_price > 0:
            sushi_html += f"<p><strong>💰 Sushi Total:</strong> ${upsell_total_price:.2f}</p>"

    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <h1 style="text-align: center; color: #333;">Reservation Confirmation</h1>
        <div style="max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 8px;">
          <p>Hello <strong>{name}</strong>,</p>
          <p>Thank you for booking a table at <strong>Seagull Restaurants</strong>!</p>
          <hr style="margin: 20px 0;">
          <p><strong>🍽 Restaurant:</strong> {restaurant.capitalize()}</p>
          <p><strong>🔢 Room:</strong> {room}</p>
          <p><strong>🗓 Date:</strong> {date}</p>
          <p><strong>⏰ Time:</strong> {time}</p>
          {main_course_html}
          {sushi_html}
          <p><strong>👥 Guests:</strong> {guests}</p>
          <hr style="margin: 20px 0;">
          <p>We look forward to serving you.</p>
          <p style="margin-top: 20px;">
            If you need to cancel your reservation, click below:<br>
            <a href="{settings.FRONTEND_BASE_URL}/cancel/{cancel_token}" style="color: #d9534f;">
              Cancel Reservation
            </a>
          </p>
        </div>
      </body>
    </html>
    """
    return html_content

def send_confirmation_email(
    email: str,
    name: str,
    reservation_id: str,
    **kwargs
):
    """Send confirmation email via Mailgun with retry."""
    max_retries = 3
    db = firestore.client()
    
    for attempt in range(max_retries):
        try:
            html_content = build_email_html(name=name, **kwargs)
            
            response = requests.post(
                f"https://api.mailgun.net/v3/{settings.MAILGUN_DOMAIN}/messages",
                auth=("api", settings.MAILGUN_API_KEY),
                data={
                    "from": f"Seagull Restaurant <{settings.EMAIL_FROM}>",
                    "to": [email],
                    "subject": "Reservation Confirmation",
                    "html": html_content
                },
                timeout=30
            )
            response.raise_for_status()
            
            # Update status
            db.collection("reservations").document(reservation_id).update({
                "email_status": "sent",
                "email_sent_at": SERVER_TIMESTAMP
            })
            
            return True
            
        except Exception as e:
            if attempt == max_retries - 1:
                # Final failure
                db.collection("reservations").document(reservation_id).update({
                    "email_status": "failed",
                    "email_error": str(e)
                })
                return False

def send_review_request_email(to_email, guest_name, restaurant, token):
    """Send review request email."""
    review_url = f"{settings.FRONTEND_BASE_URL}/review/{token}"
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <div style="max-width: 640px; margin: auto; background: #ffffff; padding: 24px; border-radius: 12px;">
          <h2 style="color: #0C6DAE;">How was your dinner at {restaurant} Restaurant?</h2>
          <p>Hello {guest_name if guest_name else 'Guest'},</p>
          <p>We'd love a quick 1–10 rating of your experience.</p>
          <p>
            <a href="{review_url}" style="display:inline-block; padding:12px 18px; border-radius:8px; background:#0C6DAE; color:#fff; text-decoration:none;">
              Rate your dinner
            </a>
          </p>
        </div>
      </body>
    </html>
    """
    
    response = requests.post(
        f"https://api.mailgun.net/v3/{settings.MAILGUN_DOMAIN}/messages",
        auth=("api", settings.MAILGUN_API_KEY),
        data={
            "from": f"Seagull Reviews <reviews@{settings.MAILGUN_DOMAIN}>",
            "to": [to_email],
            "subject": f"Rate your {restaurant} dinner",
            "html": html_content
        },
        timeout=15
    )
    response.raise_for_status()
