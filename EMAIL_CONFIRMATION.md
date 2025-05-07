# Email Confirmation Guide

Supabase requires email confirmation by default for added security. Here's how to manage it:

## Option 1: Keep Email Confirmation (Recommended for Production)

When a user registers, they'll receive an email with a confirmation link. They **must** click this link before they can log in.

### What users should do:
1. Register with a valid email
2. Check their email inbox (and spam folder)
3. Click the confirmation link
4. Return to the app and log in

### If users don't receive the confirmation email:
1. They can click "Resend confirmation email" on the login screen
2. Check spam/junk folders
3. Make sure they entered the correct email address

## Option 2: Disable Email Confirmation (For Development)

If you're just testing the app, you can disable the email confirmation requirement:

1. Go to your [Supabase dashboard](https://app.supabase.com)
2. Select your project
3. Click on "Authentication" in the left sidebar
4. Go to "Settings" tab
5. Under "Email Auth" section, find "Confirm email" and toggle it OFF
6. Save changes

## Option 3: Manually Confirm Emails (For Admins)

You can manually confirm a user's email using SQL:

1. Go to your Supabase SQL Editor
2. Run this query (replace with the actual email):

```sql
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'user@example.com';
```

## Troubleshooting

### User can't log in:
- Error message "Email not confirmed" - The user needs to confirm their email
- Invalid credentials - Check if the email is confirmed and if the password is correct

### Confirmation email not received:
- Check spam folders
- Make sure the email address was entered correctly
- Use the "Resend confirmation email" feature

### Email confirmations not working:
- Make sure your Supabase project has email configured properly
- Check the logs in the Supabase dashboard for errors
- Consider using a different email provider if deliverability is an issue 