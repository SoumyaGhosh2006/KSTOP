# K-STOP Setup Guide for Team Members

**Follow these steps to get K-STOP running on your computer.**

---

## ✅ What You Need First

Make sure you have these installed:

- **Node.js** (v18 or higher) → [nodejs.org](https://nodejs.org)
- **Git** → [git-scm.com](https://git-scm.com)
- **VS Code** → [code.visualstudio.com](https://code.visualstudio.com)

**Check if they're installed by opening vs code terminal and copy pasteing the commands below:**
```
node -v
npm -v
git --version
```

If you see version numbers, you're good! ✅

---

## Step 1️⃣ — Create "College Project" Folder

**On Windows:**
- Open File Explorer
- Go to `C:\` drive
- Right-click → New Folder
- Name it: `CollegeProject`

---

## Step 2️⃣ — Open VS Code with This Folder

**Option 1 (Easiest):**
- Open VS Code
- Click File menu → Open Folder
- Navigate to `C:\CollegeProject` 
- Click "Open"

---

## Step 3️⃣ — Open Terminal in VS Code

Once the folder is open in VS Code:
- Click on **Terminal** menu at top
- Click **New Terminal**

A terminal window will open at the bottom of VS Code. ✅

---

## Step 4️⃣ — Clone the Repository

In the terminal, type this command:

```bash
git clone https://github.com/SoumyaGhosh2006/KSTOP.git
cd KSTOP
```

This downloads all the project files into your `College Project` folder.

---

## Step 5️⃣ — Setup Frontend (Second Terminal)

Open a NEW terminal:
- Click **Terminal** menu → **New Terminal** (or press `Ctrl+Shift+`)

In this new terminal, type:

```bash
cd kstop-frontend
npm install
```

Wait for it to finish. Then:

```bash
npm run dev
```

You should see:
```
Local:   http://localhost:5173
```

--- 

## Step 6️⃣ — Setup Backend (First Terminal)

In the same terminal, type:

```bash
cd kstop-backend
npm install
```

Wait for it to finish (1-2 minutes). Then:

```bash
npm run dev
```

You should see:
```
Server is running on port 5000
```

✅ **Leave this terminal open. Don't close it.**

---

✅ **Copy that link and open it in your browser.**

---

## 🎉 You're Done!

You should now see the K-STOP login page.

**Keep both terminals open while working:**
- Terminal 1 → Backend running
- Terminal 2 → Frontend running

---

## 📝 Every Day When You Work

1. Open VS Code with the `College Project` folder
2. **Terminal 1:** 
   ```bash
   cd kstop-backend
   npm run dev
   ```
3. **Terminal 2:** 
   ```bash
   cd kstop-frontend
   npm run dev
   ```
4. Open `http://localhost:5173` in your browser
5. Start coding! 🚀

---

## 🛑 How to Stop

Press `Ctrl+C` in the terminal (or `Cmd+C` on Mac).

---

## ❓ Common Issues

### **"npm: command not found"**
→ Install Node.js from [nodejs.org](https://nodejs.org)

### **"Port 5000 is already in use"**
→ Close any other app using that port, or restart your computer

### **"Cannot find module"**
→ Make sure you ran `npm install` in the right folder

### **Frontend won't connect to backend**
→ Make sure both terminals are running (port 5000 and 5173)

---

## 🔄 Pulling New Code Later

If the team pushes new code:

```bash
git pull origin main
npm install
```

---

## 👥 Need Help?

Ask your me

---
 hfytfhfjujtdry5ehtdry