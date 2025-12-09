# Security Policy  
AllergyAlert – Security Guidelines

## 1. Supported Versions
The following versions of AllergyAlert currently receive security updates:

## Current version :v1.0.0

| Version | Supported |
|--------|-----------|
| main (active development) | Yes |
| v1.0.0 | Limited fixes |
| Older versions | No |

---

## 2. Reporting a Vulnerability

If you find a security vulnerability, **do not open a public issue**.

Instead, contact the maintainer privately:

**Email:** veldhanush2004@gmail.com

Include the following in your report:

- Description of the issue  
- Steps to reproduce  
- Expected vs. actual behavior  
- Potential security impact  
- Logs, screenshots, or proof-of-concept if available  

We aim to respond within **48 hours** and resolve critical issues within **7 days**.

---

## 3. Security Guidelines for Developers

### 3.1 Authentication & Authorization
- Validate all JWT tokens using `get_current_user()`.
- Do not expose raw tokens or sensitive user data.
- Never log sensitive authentication details.

### 3.2 Password Handling
- Passwords must always be hashed using bcrypt.
- Never store or transmit plaintext passwords.
- Use `verify_password()` for login authentication.

### 3.3 Input Validation
- Validate all inputs using Pydantic models.
- Sanitize user inputs, especially ingredient lists or custom allergens.
- Never trust client-side data.

### 3.4 Database Protection
- Do not expose MongoDB `_id` values.
- Convert ObjectIds to strings before returning responses.
- Use `$set` updates to avoid overwriting entire documents accidentally.

### 3.5 API Security
- Restrict CORS in production environments.
- Require authentication for all sensitive endpoints.
- Add rate limiting (recommended during deployment).

### 3.6 File Upload Security
- Allow image types only (PNG/JPG).
- Re-encode images using Pillow before analysis.
- Enforce image size limits to prevent denial-of-service attacks.

---

## 4. Dependencies & Patching
- Keep all backend packages updated:
  - passlib  
  - python-jose  
  - motor  
  - Pillow  
  - google-generativeai  
- Patch vulnerabilities immediately when detected.
- Review dependency updates regularly.

---

## 5. Secure Deployment Recommendations

### Backend
- Always run API under HTTPS.
- Store secrets in environment variables:
  - MONGO_URL  
  - JWT_SECRET_KEY  
  - GEMINI_API_KEY  
- Use strong JWT secrets (minimum 32 characters).
- Disable wide-open CORS settings in production.

### Frontend
- Do not store sensitive data in localStorage beyond tokens.
- Use HTTP-only cookies if hosting on the web.
- Avoid exposing backend internal URLs.

### Database
- Do not expose MongoDB publicly.
- Enable authentication and IP whitelisting.
- Schedule automated backups.

---

## 6. Public Disclosure Policy
If a major vulnerability is discovered:

- A public advisory will be released.
- A patch will be applied immediately.
- A new version (e.g., v1.1.x) will be published.
- A summary and recommended actions will be provided.

---

## 7. Appreciation
Thank you for helping improve the security of AllergyAlert.  
Your responsible disclosures help protect users who rely on the system for allergy safety.

If you have any questions or concerns, contact us anytime.
