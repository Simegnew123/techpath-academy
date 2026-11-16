// Auto-seed: runs on server startup if database is empty
// This ensures courses appear automatically on fresh deployments (e.g. Render.com)
import { readDB, mutate, uid, nowISO } from "@/lib/store";
import { createCourse, createModule, addLesson } from "@/lib/courses";
import { CATEGORIES } from "@/lib/categories";
import bcrypt from "bcryptjs";

export function autoSeed() {
  const db = readDB();
  if (db.courses.length > 0) return; // already seeded

  console.log("[autoseed] Database is empty — seeding sample data...");

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

  // 2. Create admin user
  const hash = bcrypt.hashSync("admin123", 10);
  const admin = {
    id: uid(),
    name: "Simegnew",
    email: "admin@techpath.academy",
    passwordHash: hash,
    role: "admin" as const,
    bio: "IT educator and founder of TechPath Academy. Passionate about helping students build real-world IT skills.",
    avatar: "",
    title: "Founder & Lead Instructor",
    createdAt: nowISO(),
  };
  mutate((d) => { d.users.push(admin); });
  const instructorId = admin.id;

  // 3. Create courses (same as seed route)
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

  console.log("[autoseed] Done! 6 courses, 7 categories, reviews created.");
}
