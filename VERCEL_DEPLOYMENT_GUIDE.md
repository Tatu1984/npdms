# NPDMS - Vercel Manual Deployment Guide

## Step-by-Step Deployment Instructions

---

## Prerequisites

1. GitHub account with the repository
2. Vercel account (https://vercel.com)
3. NeonDB connection string (already have)
4. Custom domain access (npdms.infinititechpartners.com)

---

## STEP 1: Push Code to GitHub

### 1.1 Initialize Git (if not already done)
```bash
cd /Users/sudipto/Desktop/projects/npdms/ui/web

# Initialize git if needed
git init

# Add remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/npdms.git

# Or if remote exists, verify it
git remote -v
```

### 1.2 Create .gitignore (if not exists)
```bash
# Ensure these are in .gitignore
node_modules/
.next/
.env.local
.vercel/
```

### 1.3 Commit and Push
```bash
git add .
git commit -m "NPDMS v1.0 - Demo ready build"
git branch -M main
git push -u origin main
```

---

## STEP 2: Delete Existing Vercel Deployment (If Any)

### Via Vercel Dashboard:
1. Go to https://vercel.com/dashboard
2. Find your existing NPDMS project
3. Click on the project
4. Go to **Settings** (gear icon)
5. Scroll down to **"Delete Project"**
6. Type the project name to confirm
7. Click **Delete**

### Via CLI (Optional):
```bash
# Login to Vercel
npx vercel login

# List projects
npx vercel ls

# Remove project
npx vercel rm npdms --yes
```

---

## STEP 3: Create New Vercel Project

### 3.1 Go to Vercel Dashboard
1. Open https://vercel.com/new
2. Click **"Import Git Repository"**
3. Select **GitHub** and authorize if needed
4. Find and select your **npdms** repository
5. Click **Import**

### 3.2 Configure Project Settings

| Setting | Value |
|---------|-------|
| Project Name | `npdms` |
| Framework Preset | `Next.js` (auto-detected) |
| Root Directory | `ui/web` |
| Build Command | `npm run build` (default) |
| Output Directory | `.next` (default) |
| Install Command | `npm install` (default) |

### 3.3 Add Environment Variables

Click **"Environment Variables"** and add each one:

```
┌─────────────────────────────────┬───────────────────────────────────────────────────────────────────────────────┐
│ NAME                            │ VALUE                                                                         │
├─────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────┤
│ NEXT_PUBLIC_APP_URL             │ https://npdms.infinititechpartners.com                                        │
├─────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────┤
│ NEXT_PUBLIC_APP_NAME            │ NPDMS                                                                         │
├─────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────┤
│ NEXT_PUBLIC_API_URL             │ https://npdms.infinititechpartners.com/api/v1                                 │
├─────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────┤
│ NEXT_PUBLIC_USE_REAL_API        │ false                                                                         │
├─────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────┤
│ NEXTAUTH_URL                    │ https://npdms.infinititechpartners.com                                        │
├─────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────┤
│ NEXTAUTH_SECRET                 │ DPdAGNwYhpaQLBvRAZS6Zjrko+PzFR+Mj4STRnePET4=                                  │
├─────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────┤
│ DATABASE_URL                    │ postgresql://neondb_owner:npg_WpKz7tg4FwGm@ep-fancy-rain-admoirx7-pooler...   │
├─────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────┤
│ POSTGRES_PRISMA_URL             │ postgresql://neondb_owner:npg_WpKz7tg4FwGm@ep-fancy-rain-admoirx7-pooler...   │
└─────────────────────────────────┴───────────────────────────────────────────────────────────────────────────────┘
```

**Full Environment Variables to Copy-Paste:**

```plaintext
NEXT_PUBLIC_APP_URL=https://npdms.infinititechpartners.com
NEXT_PUBLIC_APP_NAME=NPDMS
NEXT_PUBLIC_API_URL=https://npdms.infinititechpartners.com/api/v1
NEXT_PUBLIC_USE_REAL_API=false
NEXTAUTH_URL=https://npdms.infinititechpartners.com
NEXTAUTH_SECRET=DPdAGNwYhpaQLBvRAZS6Zjrko+PzFR+Mj4STRnePET4=
DATABASE_URL=postgresql://neondb_owner:npg_WpKz7tg4FwGm@ep-fancy-rain-admoirx7-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
POSTGRES_PRISMA_URL=postgresql://neondb_owner:npg_WpKz7tg4FwGm@ep-fancy-rain-admoirx7-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&pgbouncer=true
```

### 3.4 Click Deploy
- Click the **"Deploy"** button
- Wait for the build to complete (usually 2-3 minutes)
- You'll see a success message with a preview URL

---

## STEP 4: Configure Custom Domain

### 4.1 Add Domain in Vercel
1. After deployment, go to **Project Settings**
2. Click **"Domains"** in the sidebar
3. Enter: `npdms.infinititechpartners.com`
4. Click **"Add"**

### 4.2 Configure DNS Records

Go to your domain registrar (where infinititechpartners.com is managed) and add:

**Option A: Using CNAME (Recommended)**
```
Type: CNAME
Name: npdms
Value: cname.vercel-dns.com
TTL: 300 (or Auto)
```

**Option B: Using A Records (if CNAME not supported)**
```
Type: A
Name: npdms
Value: 76.76.21.21
TTL: 300

Type: AAAA
Name: npdms
Value: 2606:4700:20::681a:a4f
TTL: 300
```

### 4.3 Wait for DNS Propagation
- Usually takes 5-10 minutes
- Can take up to 48 hours in rare cases
- Check status at: https://dnschecker.org

### 4.4 Enable SSL (Automatic)
- Vercel automatically provisions SSL certificate
- Will show green checkmark when ready

---

## STEP 5: Verify Deployment

### 5.1 Check Deployment Status
1. Go to https://vercel.com/dashboard
2. Click on your project
3. Check **"Deployments"** tab
4. Latest deployment should show green checkmark

### 5.2 Test the Application
1. Visit https://npdms.infinititechpartners.com
2. Try logging in with demo credentials:
   - Username: `demo`
   - Password: `demo123`
3. Navigate through FIR, Cases, Evidence pages
4. Test Export and Delete functionality

### 5.3 Check Build Logs (if issues)
1. Click on the deployment
2. Go to **"Functions"** or **"Build Logs"**
3. Look for any errors

---

## STEP 6: Set Up Automatic Deployments

Vercel automatically deploys on every push to main branch. To configure:

1. Go to **Project Settings** > **Git**
2. Ensure **"Production Branch"** is set to `main`
3. Enable **"Automatically Deploy"**

### Branch Deployments:
| Branch | Environment |
|--------|-------------|
| main | Production (npdms.infinititechpartners.com) |
| develop | Preview (auto-generated URL) |
| feature/* | Preview (auto-generated URL) |

---

## Troubleshooting

### Issue: Build Fails
```bash
# Check locally first
cd /Users/sudipto/Desktop/projects/npdms/ui/web
npm run build
```

### Issue: Environment Variables Not Working
- Ensure variables are set for **all environments** (Production, Preview, Development)
- Variables starting with `NEXT_PUBLIC_` are client-side accessible
- Redeploy after adding new variables

### Issue: Domain Not Working
1. Check DNS propagation: https://dnschecker.org
2. Verify CNAME/A record is correct
3. Clear browser cache
4. Wait 10-15 minutes

### Issue: 500 Error on Pages
1. Check Vercel function logs
2. Verify DATABASE_URL is correct
3. Check if NeonDB is accessible

---

## Quick Reference Commands

```bash
# Deploy from CLI
cd /Users/sudipto/Desktop/projects/npdms/ui/web
npx vercel --prod

# Check deployment status
npx vercel ls

# View logs
npx vercel logs npdms

# Add environment variable
npx vercel env add VARIABLE_NAME

# Pull environment variables locally
npx vercel env pull .env.local
```

---

## Post-Deployment Checklist

- [ ] Deployment successful (green checkmark)
- [ ] Custom domain configured
- [ ] SSL certificate active (HTTPS working)
- [ ] Login page loads
- [ ] Demo credentials work
- [ ] FIR page loads with data
- [ ] Cases page loads with data
- [ ] Evidence page loads with data
- [ ] Export button downloads CSV
- [ ] Delete button shows confirmation
- [ ] Mobile view works

---

## Support

If you encounter any issues:
1. Check Vercel deployment logs
2. Verify environment variables
3. Test build locally with `npm run build`
4. Check NeonDB connection

---

*Guide created for NPDMS deployment - January 2025*
