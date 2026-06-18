"""
Outbound notification helpers: SMS (phone OTP) and Email (activation link, OTP).

SMS is pluggable:
  • If Twilio credentials are present in the environment, real SMS is sent.
  • Otherwise the helper runs in DEV MODE — the message is printed to the
    server console and `send_sms` returns False, so the caller can surface the
    OTP for testing. Swapping to real Twilio later needs no code change, just
    add the three env vars below.

Required Twilio env vars (when you want real SMS):
  TWILIO_ACCOUNT_SID
  TWILIO_AUTH_TOKEN
  TWILIO_FROM_NUMBER     e.g. +1234567890   (or a Messaging Service SID)
"""

import os


def sms_provider_configured() -> bool:
    """True only when all Twilio credentials are present."""
    return bool(
        os.getenv("TWILIO_ACCOUNT_SID")
        and os.getenv("TWILIO_AUTH_TOKEN")
        and os.getenv("TWILIO_FROM_NUMBER")
    )


def send_sms(to_number: str, body: str) -> bool:
    """
    Send an SMS. Returns True if handed off to a real provider, False in dev mode.

    In dev mode the message is logged so the OTP flow stays testable without a
    paid SMS account.
    """
    if not sms_provider_configured():
        print(f"[SMS DEV MODE] To {to_number}: {body}")
        return False

    try:
        from twilio.rest import Client  # imported lazily so the app runs without the package

        client = Client(os.getenv("TWILIO_ACCOUNT_SID"), os.getenv("TWILIO_AUTH_TOKEN"))
        client.messages.create(
            body=body,
            from_=os.getenv("TWILIO_FROM_NUMBER"),
            to=to_number,
        )
        return True
    except Exception as e:
        # Never let an SMS outage block registration — log and fall back to dev behaviour.
        print(f"[SMS ERROR] Failed to send to {to_number}: {e}")
        print(f"[SMS DEV MODE FALLBACK] To {to_number}: {body}")
        return False


# ──────────────────────────── Branded email templates ────────────────────────────
# Colors mirror the app theme (see tailwind config / Login.css).
BRAND_PRIMARY = "#50d3a7"
BRAND_DARK = "#131f1b"
BRAND_LIGHT = "#f6f8f7"
BRAND_INK = "#0b1f17"  # readable text on the primary-colored button


def _logo_block() -> str:
    """Logo image if LOGO_URL is set (must be a publicly reachable URL),
    otherwise a styled text wordmark so the header never looks broken."""
    logo_url = os.getenv("LOGO_URL", "").strip()
    if logo_url:
        return (
            f'<img src="{logo_url}" alt="Dentor" width="150" '
            f'style="display:block;margin:0 auto;border:0;outline:none;'
            f'text-decoration:none;height:auto;max-width:150px;">'
        )
    return (
        f'<span style="font-family:Inter,Arial,Helvetica,sans-serif;font-size:28px;'
        f'font-weight:700;letter-spacing:0.5px;color:{BRAND_PRIMARY};">Dentor</span>'
    )


def email_button(text: str, link: str) -> str:
    """A primary-colored call-to-action button (table-based for email clients)."""
    return (
        f'<table role="presentation" cellpadding="0" cellspacing="0" '
        f'style="margin:28px auto;"><tr>'
        f'<td align="center" style="border-radius:10px;background-color:{BRAND_PRIMARY};">'
        f'<a href="{link}" target="_blank" '
        f'style="display:inline-block;padding:14px 34px;font-family:Inter,Arial,Helvetica,sans-serif;'
        f'font-size:15px;font-weight:600;color:{BRAND_INK};text-decoration:none;border-radius:10px;">'
        f'{text}</a></td></tr></table>'
    )


def email_otp_box(code: str) -> str:
    """A highlighted box that displays a one-time code."""
    return (
        f'<div style="margin:28px 0;text-align:center;">'
        f'<div style="display:inline-block;padding:16px 34px;background-color:{BRAND_LIGHT};'
        f'border:1px dashed {BRAND_PRIMARY};border-radius:12px;'
        f'font-family:Inter,Arial,Helvetica,sans-serif;font-size:34px;font-weight:700;'
        f'letter-spacing:10px;color:{BRAND_DARK};">{code}</div></div>'
    )


def render_email(heading: str, body_html: str) -> str:
    """Wrap inner content in the branded Dentor email shell (header logo + footer)."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
</head>
<body style="margin:0;padding:0;background-color:{BRAND_LIGHT};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="background-color:{BRAND_LIGHT};padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="max-width:480px;background-color:#ffffff;border-radius:16px;overflow:hidden;
                    box-shadow:0 10px 30px rgba(0,0,0,0.08);">
        <tr><td style="background-color:{BRAND_DARK};padding:28px 32px;text-align:center;">
          {_logo_block()}
        </td></tr>
        <tr><td style="padding:36px 32px;font-family:Inter,Arial,Helvetica,sans-serif;color:#1f2937;">
          <h1 style="margin:0 0 18px;font-size:22px;font-weight:700;color:{BRAND_DARK};">{heading}</h1>
          {body_html}
        </td></tr>
        <tr><td style="padding:22px 32px;background-color:{BRAND_LIGHT};text-align:center;
                       font-family:Inter,Arial,Helvetica,sans-serif;font-size:12px;color:#9ca3af;
                       border-top:1px solid #eef1f0;">
          <p style="margin:0 0 4px;">Dentor — Your dental student helper platform</p>
          <p style="margin:0;">If you didn't request this, you can safely ignore this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""


def send_email(to_email: str, subject: str, html: str) -> bool:
    """
    Send an email via Resend. Returns True on success, False otherwise.
    Mirrors the existing inline usage in the auth router.
    """
    import resend

    resend.api_key = os.getenv("RESEND_API_KEY")
    if not resend.api_key:
        print(f"[EMAIL DEV MODE] To {to_email} | {subject}\n{html}")
        return False

    try:
        resend.Emails.send({
            "from": os.getenv("EMAIL_FROM", "Dentor <noreply@dentor.tech>"),
            "to": to_email,
            "subject": subject,
            "html": html,
        })
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send to {to_email}: {e}")
        return False
