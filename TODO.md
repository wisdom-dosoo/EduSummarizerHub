# Refactor EduSummarizerHub to Remove Payment and Authentication Code

## Backend Changes
- [x] Delete backend/routes/stripe.py
- [ ] Edit backend/models.py to remove User model and tier-related fields
- [ ] Edit backend/database.py to remove users collection
- [ ] Edit backend/main.py to remove stripe router references
- [ ] Edit backend/requirements.txt to remove payment/auth dependencies

## Frontend Changes
- [ ] Edit frontend/index.html to remove auth UI elements
- [ ] Edit frontend/upload.html to remove auth UI elements
- [x] Edit frontend/dashboard.html to remove auth UI elements
- [ ] Edit frontend/script.js to remove auth-related code
- [x] Delete frontend/referral.js

## Documentation Changes
- [x] Edit README.md to remove freemium/payment mentions

## Testing
- [ ] Test application functionality after changes
- [ ] Ensure all routes work without authentication
- [ ] Update any remaining documentation
