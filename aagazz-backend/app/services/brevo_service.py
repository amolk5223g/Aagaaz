import requests
import json
from typing import Tuple, List
from app.config import settings

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"

def build_otp_html(student_name: str, usn: str, otp_code: str) -> str:
    """Generates luxury dark gold themed HTML email for AAGAZZ 2K26 OTP verification."""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AAGAZZ 2K26 Passcode</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #080604; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F8F2E8;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #080604; padding: 40px 16px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 520px; background-color: #15100C; border: 1px solid rgba(217, 172, 99, 0.4); border-radius: 20px; overflow: hidden; box-shadow: 0 16px 40px rgba(0,0,0,0.8);">
              <!-- Top Gold Accent -->
              <tr>
                <td style="height: 4px; background: linear-gradient(90deg, #B88643, #FFD78A, #B88643);"></td>
              </tr>
              <!-- Card Body -->
              <tr>
                <td style="padding: 36px 32px; text-align: center;">
                  <!-- Badge -->
                  <div style="display: inline-block; padding: 4px 14px; border-radius: 100px; background-color: #221F1B; border: 1px solid rgba(217, 172, 99, 0.5); color: #FFD78A; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 20px;">
                    Department of AI &amp; DS • SGBIT
                  </div>
                  
                  <h1 style="margin: 0 0 6px 0; color: #F8F2E8; font-size: 28px; font-weight: 800; letter-spacing: 1px;">
                    AAGAZZ 2K26
                  </h1>
                  <p style="margin: 0 0 24px 0; color: #D9AC63; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px;">
                    Grand Freshers Gala • 26 February 2026
                  </p>
                  
                  <hr style="border: 0; border-top: 1px dashed rgba(217, 172, 99, 0.25); margin: 20px 0;">
                  
                  <p style="font-size: 15px; color: #E9E1DB; margin: 0 0 10px 0;">
                    Hello <strong style="color: #FFD78A;">{student_name}</strong>,
                  </p>
                  <p style="font-size: 13px; color: #B9ADA0; line-height: 1.6; margin: 0 0 24px 0;">
                    Your one-time verification passcode to claim and unlock your official <strong>VIP Food Pass</strong> for AAGAZZ 2K26 is:
                  </p>
                  
                  <!-- 6-digit OTP Box -->
                  <div style="background-color: #080604; border: 2px solid #FFD78A; border-radius: 14px; padding: 18px 24px; margin: 0 auto 24px auto; display: inline-block; box-shadow: 0 0 25px rgba(255, 215, 138, 0.15);">
                    <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #FFD78A; display: block;">
                      {otp_code}
                    </span>
                  </div>
                  
                  <!-- Metadata Pill -->
                  <div style="background-color: #221F1B; border-radius: 10px; padding: 10px 16px; margin: 0 auto 24px auto; max-width: 380px; font-size: 12px; color: #B9ADA0; text-align: left;">
                    <div style="margin-bottom: 4px;">
                      <span style="color: #7C766B;">Student USN:</span> <strong style="color: #F8F2E8; font-family: monospace;">{usn}</strong>
                    </div>
                    <div>
                      <span style="color: #7C766B;">Passcode Validity:</span> <strong style="color: #FFD78A;">Expires in 5 minutes</strong>
                    </div>
                  </div>
                  
                  <!-- Security Warning -->
                  <p style="font-size: 11px; color: #D9AC63; background-color: rgba(217, 172, 99, 0.08); border-left: 3px solid #D9AC63; padding: 10px 14px; margin: 0 0 28px 0; text-align: left; border-radius: 0 8px 8px 0; line-height: 1.5;">
                    🔒 <strong>Security Warning:</strong> Do not share this passcode with anyone. This OTP can only be used once to bind and display your personal Food Coupon QR code.
                  </p>
                  
                  <p style="font-size: 11px; color: #7C766B; margin: 0;">
                    S. G. Balekundri Institute of Technology, Belagavi<br>
                    Event Date: <strong>26 February 2026</strong>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """

def build_food_pass_html(student_name: str, usn: str, coupon_code: str, qr_token: str, portal_url: str = "https://aagaaz-two.vercel.app/register") -> str:
    """Generates luxury dark gold themed HTML email delivering the student's official VIP Food Pass."""
    # Free reliable QR code image generator for email rendering
    qr_img_url = f"https://api.qrserver.com/v1/create-qr-code/?size=220x220&data={qr_token}&color=080604&bgcolor=FFFFFF&margin=10"
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AAGAZZ 2K26 VIP Food Pass</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #080604; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F8F2E8;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #080604; padding: 36px 12px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 520px; background-color: #15100C; border: 1px solid rgba(217, 172, 99, 0.45); border-radius: 20px; overflow: hidden; box-shadow: 0 16px 40px rgba(0,0,0,0.85);">
              <!-- Top Gold Gradient Accent -->
              <tr>
                <td style="height: 5px; background: linear-gradient(90deg, #B88643, #FFF0CF, #FFD78A, #B88643);"></td>
              </tr>
              <!-- Card Body -->
              <tr>
                <td style="padding: 32px 28px; text-align: center;">
                  <!-- Top Badge -->
                  <div style="display: inline-block; padding: 4px 14px; border-radius: 100px; background-color: #221F1B; border: 1px solid rgba(217, 172, 99, 0.5); color: #FFD78A; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 16px;">
                    Department of AI &amp; DS • SGBIT
                  </div>
                  
                  <h1 style="margin: 0 0 6px 0; color: #F8F2E8; font-size: 28px; font-weight: 800; letter-spacing: 1.5px;">
                    AAGAZZ 2K26
                  </h1>
                  <p style="margin: 0 0 20px 0; color: #D9AC63; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px;">
                    Grand Freshers Gala • 26 February 2026
                  </p>
                  
                  <!-- Food Voucher Subheading Pill -->
                  <div style="display: inline-block; background-color: #FFD78A; color: #080604; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; padding: 5px 16px; border-radius: 100px; margin-bottom: 24px;">
                    ✦ OFFICIAL VIP FOOD PASS ✦
                  </div>
                  
                  <hr style="border: 0; border-top: 1px dashed rgba(217, 172, 99, 0.3); margin: 0 0 24px 0;">
                  
                  <p style="font-size: 15px; color: #E9E1DB; margin: 0 0 8px 0;">
                    Dear <strong style="color: #FFD78A;">{student_name}</strong>,
                  </p>
                  <p style="font-size: 13px; color: #B9ADA0; line-height: 1.6; margin: 0 0 24px 0;">
                    Here is your official <strong>VIP Food Pass</strong> for the AAGAZZ 2K26 Grand Freshers Gala. Present this digital pass or QR code at Banquet Counter C102 to redeem your gala meal.
                  </p>
                  
                  <!-- Student Details & Coupon Info Card -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #080604; border: 1px solid rgba(217, 172, 99, 0.3); border-radius: 14px; margin-bottom: 24px; text-align: left;">
                    <tr>
                      <td style="padding: 16px 20px;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="padding-bottom: 8px;">
                              <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #7C766B; display: block;">Student Name</span>
                              <strong style="font-size: 14px; color: #F8F2E8;">{student_name}</strong>
                            </td>
                            <td style="padding-bottom: 8px; text-align: right;">
                              <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #7C766B; display: block;">College USN</span>
                              <strong style="font-size: 14px; font-family: monospace; color: #FFD78A;">{usn}</strong>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding-top: 8px; border-top: 1px solid #1E1914;">
                              <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #7C766B; display: block;">Department</span>
                              <strong style="font-size: 12px; color: #E9E1DB;">AI &amp; DS (Batch 2025–29)</strong>
                            </td>
                            <td style="padding-top: 8px; border-top: 1px solid #1E1914; text-align: right;">
                              <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #7C766B; display: block;">Coupon ID</span>
                              <strong style="font-size: 13px; font-family: monospace; color: #FFD78A;">{coupon_code}</strong>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- High-Res QR Code Card -->
                  <div style="background-color: #FFFFFF; border: 3px solid #FFD78A; border-radius: 16px; padding: 14px; display: inline-block; box-shadow: 0 0 25px rgba(255, 215, 138, 0.2); margin-bottom: 20px;">
                    <img src="{qr_img_url}" width="200" height="200" alt="Food Pass QR Code" style="display: block; border-radius: 8px;" />
                  </div>
                  
                  <p style="font-size: 11px; font-family: monospace; color: #FFD78A; letter-spacing: 2px; margin: 0 0 24px 0;">
                    COUPON: {coupon_code}
                  </p>
                  
                  <!-- Terms & Warning Notice -->
                  <div style="background-color: rgba(217, 172, 99, 0.08); border-left: 3px solid #D9AC63; padding: 12px 16px; margin: 0 0 24px 0; text-align: left; border-radius: 0 8px 8px 0; line-height: 1.5; font-size: 11px; color: #D9AC63;">
                    📌 <strong>Pass Rules:</strong> Exactly <strong>ONE</strong> food pass is permitted per student USN. This QR code will be invalidated immediately upon volunteer counter scanning.
                  </div>
                  
                  <p style="font-size: 11px; color: #7C766B; margin: 0; line-height: 1.5;">
                    S. G. Balekundri Institute of Technology, Belagavi<br>
                    Event Date: <strong>26 February 2026</strong> • Venue: <strong>Counter C102</strong>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """

def get_brevo_api_keys() -> List[str]:
    """Returns active Brevo API keys in priority order (Key 1 -> Key 2)."""
    keys = []
    if settings.BREVO_API_KEY_1 and settings.BREVO_API_KEY_1.strip():
        keys.append(settings.BREVO_API_KEY_1.strip())
    if settings.BREVO_API_KEY_2 and settings.BREVO_API_KEY_2.strip():
        keys.append(settings.BREVO_API_KEY_2.strip())
    return keys

def send_brevo_otp(to_email: str, student_name: str, usn: str, otp_code: str) -> Tuple[bool, str]:
    """
    Sends 6-digit OTP to student's email using Brevo Transactional Email API.
    Supports 400+ students with automatic API key failover (Key 1 -> Key 2).
    Returns (success: bool, info_or_error: str).
    """
    keys = get_brevo_api_keys()
    if not keys:
        print(f"[BREVO SERVICE] No API keys configured. Running in DEV mode for {student_name} ({to_email}): OTP = {otp_code}")
        return True, "DEV_MODE"

    sender_name = settings.BREVO_SENDER_NAME or "Aagaaz"
    sender_email = settings.BREVO_SENDER_EMAIL or "asamol918@gmail.com"

    payload = {
        "sender": {
            "name": sender_name,
            "email": sender_email
        },
        "to": [
            {
                "email": to_email,
                "name": student_name
            }
        ],
        "subject": f"AAGAZZ 2K26 - Verification Passcode: {otp_code}",
        "htmlContent": build_otp_html(student_name=student_name, usn=usn, otp_code=otp_code)
    }

    last_error = ""

    # Attempt delivery with failover across configured Brevo keys
    for index, key in enumerate(keys, 1):
        headers = {
            "accept": "application/json",
            "api-key": key,
            "content-type": "application/json"
        }

        try:
            response = requests.post(
                BREVO_API_URL,
                headers=headers,
                data=json.dumps(payload),
                timeout=7
            )

            if response.status_code in (200, 201, 202):
                res_data = response.json()
                message_id = res_data.get("messageId", "ok")
                print(f"[BREVO SERVICE] Key #{index} delivered OTP successfully to {to_email} (Msg ID: {message_id})")
                return True, f"Delivered via Brevo (Key #{index})"
            else:
                last_error = f"Key #{index} error HTTP {response.status_code}: {response.text}"
                print(f"[BREVO SERVICE] {last_error}. Failing over to next key...")
        except Exception as exc:
            last_error = f"Key #{index} network exception: {str(exc)}"
            print(f"[BREVO SERVICE] {last_error}. Failing over to next key...")

    # If both keys returned errors, log clearly
    print(f"[BREVO SERVICE] All Brevo API keys exhausted. Last error: {last_error}")
    
    if "unrecognised IP address" in last_error or "authorised_ips" in last_error:
        user_msg = "Brevo email sending is blocked by IP restriction. Please disable 'Authorised IPs' in your Brevo account at: https://app.brevo.com/security/authorised_ips"
    elif "sender" in last_error.lower() or "not allowed" in last_error.lower():
        user_msg = f"Brevo sender '{sender_email}' is not validated. Please verify this sender email in your Brevo dashboard."
    else:
        user_msg = f"Email delivery failed via Brevo: {last_error}"

    return False, user_msg

def send_brevo_food_pass(
    to_email: str,
    student_name: str,
    usn: str,
    coupon_code: str,
    qr_token: str,
    portal_url: str = "https://aagaaz-two.vercel.app/register"
) -> Tuple[bool, str]:
    """
    Sends the official VIP Food Pass (with QR code and coupon details)
    directly to the student's email via Brevo Transactional Email API.
    """
    keys = get_brevo_api_keys()
    if not keys:
        print(f"[BREVO SERVICE] No API keys configured. Simulating pass email to {student_name} ({to_email})")
        return True, "DEV_MODE"

    sender_name = settings.BREVO_SENDER_NAME or "Aagaaz"
    sender_email = settings.BREVO_SENDER_EMAIL or "asamol918@gmail.com"

    html_content = build_food_pass_html(
        student_name=student_name,
        usn=usn,
        coupon_code=coupon_code,
        qr_token=qr_token,
        portal_url=portal_url
    )

    payload = {
        "sender": {
            "name": sender_name,
            "email": sender_email
        },
        "to": [
            {
                "email": to_email,
                "name": student_name
            }
        ],
        "subject": f"🎟️ Your Official VIP Food Pass for AAGAZZ 2K26 - {student_name} ({usn})",
        "htmlContent": html_content
    }

    last_error = ""
    for index, key in enumerate(keys, 1):
        headers = {
            "accept": "application/json",
            "api-key": key,
            "content-type": "application/json"
        }
        try:
            response = requests.post(
                BREVO_API_URL,
                headers=headers,
                data=json.dumps(payload),
                timeout=7
            )
            if response.status_code in (200, 201, 202):
                res_data = response.json()
                message_id = res_data.get("messageId", "ok")
                print(f"[BREVO SERVICE] Food Pass delivered to {to_email} (Msg ID: {message_id})")
                return True, f"Delivered (Key #{index})"
            else:
                last_error = f"HTTP {response.status_code}: {response.text}"
        except Exception as exc:
            last_error = f"Exception: {str(exc)}"

    return False, f"Failed to deliver Food Pass: {last_error}"

