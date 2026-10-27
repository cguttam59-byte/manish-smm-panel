MANISH SMM PANEL — PAYMENT PROOF + ADMIN APPROVE/REJECT

Features
- Customer chooses a package, enters a YouTube channel link and uploads payment screenshot.
- Submission is stored on the server with status Pending.
- Admin signs in at /admin.html and can view screenshot, approve, or reject.
- Screenshots are served only through the authenticated admin route.
- Default packages: ₹10, ₹99, ₹999.

Run locally
1. Install Node.js 20+.
2. In this folder run: npm install

   You can override it before starting:
   Linux/macOS: ADMIN_PASSWORD='your-new-password' npm start
   Windows PowerShell: $env:ADMIN_PASSWORD='your-new-password'; npm start
4. Open http://localhost:3000
5. Admin page: http://localhost:3000/admin.html

Important
- Localhost works only on your own device. For customers to submit from elsewhere, deploy this project to a server/hosting provider that supports Node.js and persistent disk storage.

- The JSON file and uploads directory must persist across restarts/deploys. Some free hosting plans erase local files; use persistent storage/database there.
- This is manual proof review, not automatic UPI verification. Check the payment in your own bank/UPI app before approving.
- Keep customer payment screenshots private and delete records when no longer needed.
- YouTube decides monetization and subscriber/watch-hour eligibility; no outcome is guaranteed.
