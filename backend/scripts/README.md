# Admin Management Scripts

Scripts for managing admin users in the MongoDB Microsite application.

## promote_admin.sh & promote_admin.py

Promote an internal user to admin status.

### Requirements

- User must have email ending with `@peerislands.io` (internal domain)
- User must already exist in the database (registered via `/saveuser`)

### Usage

#### Option 1: Interactive mode

```bash
cd backend/scripts
./promote_admin.sh
```

Then enter the email when prompted.

#### Option 2: Direct argument

```bash
cd backend/scripts
./promote_admin.sh admin@peerislands.io
```

#### Option 3: Python script directly

```bash
cd backend/scripts
python3 promote_admin.py admin@peerislands.io
```

### Examples

**Success case:**
```bash
$ ./promote_admin.sh admin@peerislands.io

======================================
   Promote Internal User to Admin
======================================

Enter user email: admin@peerislands.io

Processing: admin@peerislands.io
--------------------------------------
Changed admin@peerislands.io as Admin
--------------------------------------
✓ Operation completed successfully
```

**Already admin:**
```bash
$ ./promote_admin.sh admin@peerislands.io

Processing: admin@peerislands.io
--------------------------------------
Info: User 'admin@peerislands.io' is already an admin
--------------------------------------
✓ Operation completed successfully
```

**Not internal user:**
```bash
$ ./promote_admin.sh user@gmail.com

Processing: user@gmail.com
--------------------------------------
Error: User with email 'user@gmail.com' is not an internal user
Only users with email ending in '@peerislands.io' can be promoted to admin
--------------------------------------
✗ Operation failed
```

**User not found:**
```bash
$ ./promote_admin.sh notfound@peerislands.io

Processing: notfound@peerislands.io
--------------------------------------
Error: User with email 'notfound@peerislands.io' not found in database
--------------------------------------
✗ Operation failed
```

### How It Works

1. **Validation**: Checks if email format is valid
2. **Internal Check**: Verifies user email ends with `@peerislands.io`
3. **User Lookup**: Searches database for user with given email
4. **Admin Promotion**: Sets `is_admin` to `true` in user record
5. **Confirmation**: Prints success message

### Database

- Uses **MongoDB** for persistent storage
- Requires MongoDB connection (configured in `.env` file)
- Changes are **permanent** and persist across server restarts

### Security Notes

- Only internal users (with `@peerislands.io` email) can be promoted
- Script connects directly to MongoDB database
- Changes take effect immediately in the database
- User must log in again to get new admin privileges in JWT token

### Troubleshooting

**Script not executable:**
```bash
chmod +x promote_admin.sh promote_admin.py
```

**Python module not found:**
Make sure you run the script from the `backend/scripts` directory, or adjust the Python path.

**Database connection error:**
- Ensure MongoDB is running
- Check `.env` file for correct `MONGODB_URI` and `MONGODB_DB_NAME`
- Verify network access to MongoDB server

**Module 'dotenv' not found:**
```bash
cd backend
pip install python-dotenv
```

