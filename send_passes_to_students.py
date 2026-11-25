"""
AAGAZZ 2K26 - Student Food Pass Bulk Email Dispatcher
Reads students (USN, Name, Email) from CSV or Excel, creates unique Food Passes in database,
and delivers the official VIP Food Pass with QR code directly to their email via Brevo.
"""

import sys
import os
import time
import argparse
import pandas as pd

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'aagazz-backend'))

from app.database import SessionLocal
from app.models import EligibleStudent, Student, FoodCoupon, Event
from app.security import normalize_usn
from app.services.coupon_service import get_or_create_food_coupon
from app.services.brevo_service import send_brevo_food_pass

def process_file(file_path: str, live_send: bool = True):
    if not os.path.exists(file_path):
        print(f"Error: File '{file_path}' not found.")
        return

    print(f"\n========================================================")
    print(f"  AAGAZZ 2K26 - FOOD PASS EMAIL DISPATCHER")
    print(f"  Source file: {file_path}")
    print(f"  Live delivery: {'ENABLED' if live_send else 'DRY RUN (No emails sent)'}")
    print(f"========================================================\n")

    # Load file
    if file_path.lower().endswith(('.xlsx', '.xls')):
        df = pd.read_excel(file_path)
    else:
        df = pd.read_csv(file_path)

    # Normalize column names
    col_map = {}
    for col in df.columns:
        c = str(col).strip().lower().replace("_", " ")
        if 'usn' in c:
            col_map['usn'] = col
        elif 'name' in c or 'student' in c:
            col_map['name'] = col
        elif 'email' in c or 'mail' in c:
            col_map['email'] = col
        elif 'dept' in c or 'department' in c:
            col_map['dept'] = col
        elif 'year' in c:
            col_map['year'] = col

    if 'usn' not in col_map:
        print("Error: Spreadsheet must contain a column for 'USN'.")
        return
    if 'email' not in col_map:
        print("Error: Spreadsheet must contain a column for 'Email' / 'Email ID'.")
        return

    db = SessionLocal()
    event = db.query(Event).order_by(Event.created_at.desc()).first()
    if not event:
        print("Error: No active event found in database.")
        db.close()
        return

    total_records = len(df)
    succeeded = 0
    failed = 0
    skipped = 0

    print(f"Found {total_records} student records. Beginning dispatch...\n")

    for index, row in df.iterrows():
        raw_usn = str(row[col_map['usn']]).strip()
        raw_email = str(row[col_map['email']]).strip().lower()
        raw_name = str(row[col_map['name']]).strip() if 'name' in col_map and pd.notna(row[col_map['name']]) else "Student"
        department = str(row[col_map['dept']]).strip() if 'dept' in col_map and pd.notna(row[col_map['dept']]) else "AI & DS"

        usn = normalize_usn(raw_usn)
        if not usn or not raw_email or '@' not in raw_email:
            print(f"[{index + 1}/{total_records}] ⚠️ Skipping invalid row: USN='{raw_usn}', Email='{raw_email}'")
            skipped += 1
            continue

        try:
            # 1. Whitelist EligibleStudent
            whitelisted = db.query(EligibleStudent).filter(EligibleStudent.usn == usn).first()
            if not whitelisted:
                whitelisted = EligibleStudent(
                    usn=usn,
                    student_name=raw_name,
                    email=raw_email,
                    department=department,
                    year=1,
                    is_active=True,
                    is_registered=True
                )
                db.add(whitelisted)
                db.commit()
                db.refresh(whitelisted)
            else:
                whitelisted.email = raw_email
                whitelisted.is_registered = True
                db.commit()

            # 2. Register Student
            student = db.query(Student).filter(Student.usn == usn).first()
            if not student:
                student = Student(
                    eligible_student_id=whitelisted.id,
                    event_id=event.id,
                    usn=usn,
                    student_name=raw_name,
                    email=raw_email,
                    department=department,
                    batch=event.batch,
                    auth_user_id=whitelisted.id
                )
                db.add(student)
                db.commit()
                db.refresh(student)
            else:
                student.email = raw_email
                db.commit()

            # 3. Generate or retrieve unique food coupon
            coupon, raw_token, is_new = get_or_create_food_coupon(db, student=student, event=event)
            qr_payload = raw_token if raw_token else coupon.coupon_code

            # 4. Dispatch Email via Brevo
            if live_send:
                sent, msg = send_brevo_food_pass(
                    to_email=raw_email,
                    student_name=raw_name,
                    usn=usn,
                    coupon_code=coupon.coupon_code,
                    qr_token=qr_payload
                )
                if sent:
                    print(f"[{index + 1}/{total_records}] ✅ Sent Pass to {usn} ({raw_name}) -> {raw_email} [{coupon.coupon_code}]")
                    succeeded += 1
                else:
                    print(f"[{index + 1}/{total_records}] ❌ Failed sending to {usn} ({raw_email}): {msg}")
                    failed += 1
                
                # Small pause to respect API rate limits
                time.sleep(0.3)
            else:
                print(f"[{index + 1}/{total_records}] 🔍 [DRY RUN] Ready to send to {usn} ({raw_name}) -> {raw_email} [{coupon.coupon_code}]")
                succeeded += 1

        except Exception as e:
            print(f"[{index + 1}/{total_records}] ❌ Error processing {usn}: {e}")
            failed += 1
            db.rollback()

    db.close()
    print(f"\n========================================================")
    print(f"  DISPATCH COMPLETE")
    print(f"  Total records: {total_records}")
    print(f"  Succeeded:     {succeeded}")
    print(f"  Failed:        {failed}")
    print(f"  Skipped:       {skipped}")
    print(f"========================================================\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Send Food Passes to students via email")
    parser.add_argument("file", nargs="?", default="database/sample_students_with_emails.csv", help="Path to CSV or Excel file")
    parser.add_argument("--dry-run", action="store_true", help="Run without sending emails to verify data")
    args = parser.parse_args()

    process_file(args.file, live_send=not args.dry_run)
