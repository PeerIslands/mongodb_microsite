# Security Guidelines

This document outlines security practices and tools configured for this project to prevent accidental credential leaks.

## 🔒 Pre-Commit Hook

This repository includes a **pre-commit hook** that automatically scans for credentials and sensitive data before allowing commits.

### What It Detects

The pre-commit hook checks for:

#### 🔑 Credentials & Keys
- AWS Access Keys (`AKIA...`)
- GitHub Personal Access Tokens (`ghp_...`, `gho_...`, `ghs_...`)
- Google API Keys (`AIza...`)
- Slack Tokens (`xoxb-...`, `xoxp-...`)
- Azure Storage Connection Strings
- Generic API keys and tokens

#### 🔐 Sensitive Files
- Private keys (`.pem`, `.key`, `.p12`, `.pfx`, `.jks`)
- Environment files (`.env`, `.env.local`, etc.)
- SSH keys (`id_rsa`, `id_dsa`, `.ppk`)
- Service account JSON files
- Secrets files (`secrets.yml`, `credentials.json`)

#### 💾 Database Credentials
- Connection strings with embedded credentials
- MongoDB, PostgreSQL, MySQL, Redis URLs with passwords

#### 🔓 Hardcoded Secrets
- Hardcoded passwords
- Client secrets
- Bearer tokens
- API keys in code

### How It Works

1. **Automatic Scanning**: When you run `git commit`, the hook automatically scans all staged files
2. **Pattern Matching**: Uses regex patterns to detect common credential formats
3. **Blocks Commits**: If credentials are detected, the commit is blocked with a detailed error message
4. **Exit Codes**: Returns exit code 1 (blocked) or 0 (allowed)

### Hook Installation Status

✅ **Already Installed**: The pre-commit hook is already active in `.git/hooks/pre-commit`

For new team members who clone the repository:

```bash
# The hook is already in .git/hooks/pre-commit and is automatically active
# Just ensure it's executable (already done):
chmod +x .git/hooks/pre-commit
```

### Testing the Hook

You can test if the hook is working:

```bash
# This should be BLOCKED:
echo 'AWS_KEY = "AKIAIOSFODNN7EXAMPLE"' > test.txt
git add test.txt
git commit -m "test"
# Expected: Commit blocked with error message

# Clean up:
rm test.txt
git reset HEAD test.txt
```

### Bypassing the Hook (⚠️ NOT RECOMMENDED)

If you absolutely must bypass the hook (e.g., for false positives):

```bash
git commit --no-verify -m "Your message"
```

**Warning**: Only use `--no-verify` if you're certain there are no credentials in your commit!

## 📋 .gitignore Configuration

The `.gitignore` file has been enhanced to prevent committing sensitive files:

### Python-specific
- Virtual environments (`venv/`, `.venv/`, `ENV/`)
- Cache files (`__pycache__/`, `*.pyc`)
- Distribution files (`*.egg-info`, `dist/`, `build/`)

### Node.js-specific
- Dependencies (`node_modules/`)
- Build outputs (`dist/`, `build/`)
- Cache (`*.cache`, `.eslintcache`)

### Credentials & Secrets
- Environment files (`.env`, `.env.*` except `.env.example`)
- Backup env files (`.env.backup`)
- Secrets files (`secrets.yml`, `credentials.json`)
- Service accounts (`service-account*.json`)

### Security Files
- Private keys (`*.key`, `*.pem`, `*.p12`, `*.pfx`)
- Certificates (`*.crt`, `*.cer`, `*.der`)
- SSH keys (`id_rsa`, `id_dsa`, `*.ppk`)
- Keystores (`*.jks`, `*.keystore`)

### Database Files
- SQLite databases (`*.db`, `*.sqlite`, `*.sqlite3`)
- Database dumps (`*.sql`, `*.dump`)
- Backups (`*.backup`, `*.bak`)

### Other
- IDE files (`.vscode/`, `.idea/`)
- OS files (`.DS_Store`, `Thumbs.db`)
- Logs (`*.log`, `logs/`)
- Uploads (`uploads/`, `media/`)

## 🛡️ Best Practices

### 1. Use Environment Variables

**Never** hardcode credentials in your code:

❌ **Bad**:
```python
DB_PASSWORD = "mySecurePassword123"
API_KEY = "sk_live_1234567890abcdef"
```

✅ **Good**:
```python
import os
DB_PASSWORD = os.getenv("DB_PASSWORD")
API_KEY = os.getenv("API_KEY")
```

### 2. Use .env.example

Create `.env.example` with dummy values for documentation:

```bash
# .env.example
DB_PASSWORD=your_password_here
API_KEY=your_api_key_here
AZURE_STORAGE_CONNECTION_STRING=your_connection_string_here
```

Then copy and fill with real values:
```bash
cp .env.example .env
# Edit .env with real credentials
```

### 3. Azure Key Vault / Secrets Management

For production, use proper secrets management:
- **Azure Key Vault** for Azure deployments
- **AWS Secrets Manager** for AWS
- **GitHub Secrets** for CI/CD pipelines

### 4. Regular Audits

Periodically check for accidentally committed secrets:

```bash
# Check git history for potential secrets
git log -p | grep -i "password\|api_key\|secret"

# Use tools like gitleaks or truffleHog
# pip install trufflehog
trufflehog filesystem .
```

### 5. Rotate Compromised Credentials

If you accidentally commit credentials:

1. **Immediately rotate** the compromised credentials
2. Remove from git history:
   ```bash
   # Use git filter-branch or BFG Repo-Cleaner
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch path/to/file" \
     --prune-empty --tag-name-filter cat -- --all
   ```
3. Force push (coordinate with team)
4. Update all environments with new credentials

## 🚨 What to Do If You Detect Credentials in Your Commit

If the pre-commit hook blocks your commit:

1. **Don't panic** - the credentials haven't been pushed yet
2. **Remove the credentials** from your files
3. **Move to environment variables** (`.env` file)
4. **Add to .gitignore** if it's a file that should never be committed
5. **Commit again** - the hook will re-check

Example workflow:
```bash
# Hook blocked your commit
# Edit the file to remove credentials
vim myfile.py

# Move credentials to .env
echo "API_KEY=your_key_here" >> .env

# Update code to use environment variable
# Then commit again
git add myfile.py
git commit -m "Update to use environment variables"
```

## 📞 Questions or Issues?

If you encounter issues with the security tools:
- Check this document first
- Ask in the team security channel
- Create an issue in the repository

## 🔗 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [Azure Key Vault Best Practices](https://docs.microsoft.com/en-us/azure/key-vault/general/best-practices)
- [12 Factor App - Config](https://12factor.net/config)

---

**Remember**: Security is everyone's responsibility. When in doubt, ask! 🛡️
