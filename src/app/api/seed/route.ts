import { NextResponse } from "next/server";
import { readDB, mutate, uid, nowISO } from "@/lib/store";
import { createCourse, createModule, addLesson } from "@/lib/courses";
import { CATEGORIES } from "@/lib/categories";
import { hashPassword } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST() {
  const db = readDB();
  if (db.courses.length > 0) {
    return NextResponse.json(
      { error: "Courses already exist — delete them from the admin panel if you want to re-seed." },
      { status: 409 }
    );
  }

  // 1. Seed categories
  mutate((d) => {
    if (d.categories.length === 0) {
      d.categories = CATEGORIES.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        icon: c.icon,
      }));
    }
  });

  // 2. Create admin/instructor user
  const db2 = readDB();
  let admin = db2.users.find((u) => u.email === "admin@techpath.academy");
  if (!admin) {
    const hash = bcrypt.hashSync("admin123", 10);
    admin = {
      id: uid(),
      name: "Simegnew",
      email: "admin@techpath.academy",
      passwordHash: hash,
      role: "admin",
      bio: "IT educator and founder of TechPath Academy. Passionate about helping students build real-world IT skills.",
      avatar: "",
      title: "Founder & Lead Instructor",
      createdAt: nowISO(),
    };
    mutate((d) => { d.users.push(admin!); });
  }
  const instructorId = admin.id;

  // 3. Create courses with modules and lessons
  // --- Course 1: IT Support Fundamentals (FREE) ---
  const c1 = createCourse({
    title: "IT Support Fundamentals",
    categoryId: "cat-it-support",
    description: "Master the essentials: hardware, software, troubleshooting, and customer service skills for IT support roles. Perfect for beginners starting a career in IT.",
    coverImage: "",
    price: 0,
    published: true,
    instructorId,
    level: "Beginner",
    language: "English",
  });

  const m1a = createModule(c1.id, "Getting Started");
  addLesson({ moduleId: m1a.id, courseId: c1.id, title: "Welcome & Course Overview", type: "text", videoUrl: "", content: "# Welcome to IT Support Fundamentals!\n\nThis free course introduces you to the world of IT support.\n\n## What you'll learn\n\n- Understanding computer hardware\n- Operating systems basics\n- Networking fundamentals\n- Troubleshooting methodology\n- Customer service skills\n\n## Who is this for?\n\nAnyone starting a career in IT — no prior experience needed.", duration: 15, preview: true });
  addLesson({ moduleId: m1a.id, courseId: c1.id, title: "The Role of an IT Support Specialist", type: "text", videoUrl: "", content: "## What does IT Support do?\n\nAn IT support specialist helps users with technology problems.\n\n### Common tasks:\n- Installing and configuring software\n- Troubleshooting hardware issues\n- Setting up user accounts\n- Managing network access\n- Providing technical guidance\n\n### Career path:\n1. **Help Desk Technician** → entry level\n2. **IT Support Specialist** → 1-2 years experience\n3. **System Administrator** → 3+ years\n4. **IT Manager** → 5+ years", duration: 20, preview: true });

  const m1b = createModule(c1.id, "Troubleshooting Fundamentals");
  addLesson({ moduleId: m1b.id, courseId: c1.id, title: "The Troubleshooting Process", type: "text", videoUrl: "", content: "## Step-by-step troubleshooting\n\n1. **Identify the problem** — gather information from the user\n2. **Establish a theory** — based on symptoms\n3. **Test the theory** — confirm or rule out\n4. **Establish a plan** — fix the issue\n5. **Verify functionality** — confirm the fix works\n6. **Document** — record for future reference\n\n> Always start with the simplest solution first!", duration: 25 });
  addLesson({ moduleId: m1b.id, courseId: c1.id, title: "Common Hardware Issues", type: "text", videoUrl: "", content: "## Hardware problems you'll see\n\n- **Won't boot**: Check power supply, RAM, hard drive\n- **Overheating**: Clean fans, check thermal paste\n- **Slow performance**: Check disk space, RAM, malware\n- **Peripherals not working**: Check connections, drivers\n\n### Tools you need\n- Screwdriver set\n- Anti-static wrist strap\n- Cable tester\n- USB boot drive with diagnostic tools", duration: 30 });

  // --- Course 2: Ethical Hacking Basics ---
  const c2 = createCourse({
    title: "Ethical Hacking Basics",
    categoryId: "cat-ethical-hacking",
    description: "Learn the foundations of ethical hacking: reconnaissance, scanning, and vulnerability assessment — legally and ethically. Includes hands-on labs.",
    coverImage: "",
    price: 4900,
    published: true,
    instructorId,
    level: "Intermediate",
    language: "English",
  });

  const m2a = createModule(c2.id, "Introduction to Ethical Hacking");
  addLesson({ moduleId: m2a.id, courseId: c2.id, title: "What is Ethical Hacking?", type: "text", videoUrl: "", content: "## Introduction\n\nEthical hacking is the practice of testing systems for vulnerabilities **with permission**.\n\n### Key concepts\n- **White hats** — ethical hackers, work with permission\n- **Black hats** — malicious hackers, unauthorized\n- **Gray hats** — fall somewhere in between\n\n### The legal framework\n- Always get written permission\n- Stay within scope\n- Follow responsible disclosure\n\n> Never hack a system you don't own or don't have permission to test.", duration: 20, preview: true });
  addLesson({ moduleId: m2a.id, courseId: c2.id, title: "The 5 Phases of Hacking", type: "text", videoUrl: "", content: "## The Hacking Methodology\n\n1. **Reconnaissance** — Gathering information about the target\n2. **Scanning** — Identifying live systems and open ports\n3. **Gaining Access** — Exploiting vulnerabilities\n4. **Maintaining Access** — Setting up backdoors\n5. **Covering Tracks** — Clearing logs (ethical hackers document instead)\n\n### Tools used\n- Nmap — network scanning\n- Wireshark — packet analysis\n- Metasploit — exploitation framework\n- Burp Suite — web application testing", duration: 25, preview: true });

  const m2b = createModule(c2.id, "Reconnaissance Techniques");
  addLesson({ moduleId: m2b.id, courseId: c2.id, title: "Passive Information Gathering", type: "text", videoUrl: "", content: "## Phase 1: Passive Recon\n\nGathering information about a target **without touching** their systems.\n\n### Techniques\n- **OSINT** (Open Source Intelligence)\n  - Google dorking\n  - Social media profiling\n  - Public records\n  - WHOIS lookups\n- **DNS enumeration** — finding subdomains\n- **Web archive** — historical snapshots\n\n### Why passive first?\nMinimize detection risk. The more you know before touching the target, the better your attack plan.", duration: 35 });

  // --- Course 3: Networking Fundamentals ---
  const c3 = createCourse({
    title: "Networking Fundamentals",
    categoryId: "cat-networking",
    description: "Understand IP addressing, routing, switches, and how data moves across networks. Build the foundation for any IT career.",
    coverImage: "",
    price: 3900,
    published: true,
    instructorId,
    level: "Beginner",
    language: "English",
  });

  const m3a = createModule(c3.id, "Network Basics");
  addLesson({ moduleId: m3a.id, courseId: c3.id, title: "How Data Moves Across a Network", type: "text", videoUrl: "", content: "## The OSI Model\n\nA practical walk-through of how packets travel from your device to the internet.\n\n### 7 Layers (top to bottom)\n7. **Application** — HTTP, FTP, DNS\n6. **Presentation** — Encryption, compression\n5. **Session** — Managing connections\n4. **Transport** — TCP/UDP\n3. **Network** — IP addressing, routing\n2. **Data Link** — MAC addresses, switches\n1. **Physical** — Cables, signals\n\n### Real-world example\nWhen you visit a website, your request goes down through all 7 layers, across the internet, and back up on the server side.", duration: 30, preview: true });
  addLesson({ moduleId: m3a.id, courseId: c3.id, title: "IP Addressing Explained", type: "text", videoUrl: "", content: "## What is an IP Address?\n\nAn IP address is a unique identifier for a device on a network.\n\n### IPv4\n- Format: `192.168.1.100`\n- 4 octets, 0-255 each\n- ~4.3 billion addresses\n\n### Private vs Public\n- **Private**: 192.168.x.x, 10.x.x.x, 172.16-31.x.x\n- **Public**: Everything else (routable on internet)\n\n### Subnet Masks\n- `/24` = 255.255.255.0 = 256 addresses\n- `/16` = 255.255.0.0 = 65,536 addresses\n\n### DHCP\nAutomatically assigns IP addresses to devices.", duration: 35 });

  const m3b = createModule(c3.id, "Routing & Switching");
  addLesson({ moduleId: m3b.id, courseId: c3.id, title: "Switches vs Routers", type: "text", videoUrl: "", content: "## Switches\n- Operate at **Layer 2** (Data Link)\n- Forward frames using **MAC addresses**\n- Connect devices within the same network\n- Create a **LAN** (Local Area Network)\n\n## Routers\n- Operate at **Layer 3** (Network)\n- Forward packets using **IP addresses**\n- Connect **different networks** together\n- Determine the best path to destination\n\n## Simple analogy\n- **Switch** = hallway connecting rooms in one building\n- **Router** = road connecting different buildings", duration: 25 });

  // --- Course 4: Database Administration Starter ---
  const c4 = createCourse({
    title: "Database Administration Starter",
    categoryId: "cat-database",
    description: "Introduction to relational databases, SQL, and daily DBA tasks you'll need on the job. Includes backup, recovery, and performance tuning basics.",
    coverImage: "",
    price: 5900,
    published: true,
    instructorId,
    level: "Intermediate",
    language: "English",
  });

  const m4a = createModule(c4.id, "Database Fundamentals");
  addLesson({ moduleId: m4a.id, courseId: c4.id, title: "What is a Database?", type: "text", videoUrl: "", content: "## Databases everywhere\n\nA database is an organized collection of data stored electronically.\n\n### Types of Databases\n- **Relational** (SQL) — MySQL, PostgreSQL, Oracle\n- **NoSQL** — MongoDB, Redis, Cassandra\n- **Cloud** — AWS RDS, Azure SQL\n\n### Why databases matter\n- Power every application you use\n- Store user data, transactions, content\n- Enable fast search and retrieval\n\n### The DBA role\nA Database Administrator (DBA) ensures databases run efficiently and securely.", duration: 20, preview: true });
  addLesson({ moduleId: m4a.id, courseId: c4.id, title: "SQL Basics — SELECT, INSERT, UPDATE, DELETE", type: "text", videoUrl: "", content: "## The 4 basic SQL operations (CRUD)\n\n### Create — INSERT\n```sql\nINSERT INTO students (name, email)\nVALUES ('John Doe', 'john@example.com');\n```\n\n### Read — SELECT\n```sql\nSELECT * FROM students\nWHERE name = 'John Doe';\n```\n\n### Update — UPDATE\n```sql\nUPDATE students\nSET email = 'john.new@example.com'\nWHERE id = 1;\n```\n\n### Delete — DELETE\n```sql\nDELETE FROM students\nWHERE id = 1;\n```\n\n> Always use WHERE with UPDATE and DELETE to avoid affecting all rows!", duration: 40, preview: true });

  const m4b = createModule(c4.id, "DBA Daily Tasks");
  addLesson({ moduleId: m4b.id, courseId: c4.id, title: "Backup & Recovery", type: "text", videoUrl: "", content: "## The #1 DBA responsibility\n\nIf data is lost, it's your fault. Always have backups.\n\n### Backup types\n1. **Full backup** — entire database\n2. **Incremental** — changes since last backup\n3. **Differential** — changes since last full backup\n4. **Log backup** — transaction logs\n\n### The 3-2-1 Rule\n- **3** copies of data\n- **2** different storage types\n- **1** offsite copy\n\n### Recovery testing\nA backup you haven't tested is not a backup. Practice restoring regularly.", duration: 35 });

  // --- Course 5: Cyber Security Essentials ---
  const c5 = createCourse({
    title: "Cyber Security Essentials",
    categoryId: "cat-cyber-security",
    description: "Learn the core principles of cyber security: threat types, defense strategies, and how to protect yourself and your organization from cyber attacks.",
    coverImage: "",
    price: 2500,
    published: true,
    instructorId,
    level: "Beginner",
    language: "English",
  });

  const m5a = createModule(c5.id, "Security Fundamentals");
  addLesson({ moduleId: m5a.id, courseId: c5.id, title: "What is Cyber Security?", type: "text", videoUrl: "", content: "# What is Cyber Security?\n\nCyber security is the practice of protecting systems, networks, and data from digital attacks.\n\n## Key concepts\n\n- **Confidentiality** — keeping data private\n- **Integrity** — keeping data accurate and unaltered\n- **Availability** — keeping systems running when needed\n\nTogether these are known as the **CIA Triad**.\n\n## Why it matters\n\nCyber attacks can:\n- Steal sensitive data\n- Disrupt business operations\n- Damage reputation\n- Cause financial loss\n\nEvery IT professional needs security knowledge.", duration: 20, preview: true });
  addLesson({ moduleId: m5a.id, courseId: c5.id, title: "Common Cyber Threats", type: "text", videoUrl: "", content: "# Common Cyber Threats\n\nUnderstanding the main types of cyber attacks:\n\n- **Phishing** — fraudulent emails tricking users into revealing credentials\n- **Malware** — viruses, ransomware, spyware, trojans\n- **DDoS** — overwhelming systems with traffic to cause downtime\n- **Man-in-the-middle** — intercepting communications between parties\n- **SQL Injection** — exploiting database queries via input fields\n- **Zero-day exploits** — attacking unknown vulnerabilities\n\n### Defense in depth\nNever rely on a single security measure. Layer your defenses:\n1. Firewalls\n2. Antivirus\n3. Strong passwords + MFA\n4. Employee training\n5. Regular updates", duration: 30, preview: true });

  const m5b = createModule(c5.id, "Building a Security Culture");
  addLesson({ moduleId: m5b.id, courseId: c5.id, title: "Security Policies & Best Practices", type: "text", videoUrl: "", content: "## Security starts with people\n\nTechnology alone isn't enough. Your biggest security risk is usually human error.\n\n### Essential policies\n- **Password policy** — minimum 12 characters, unique per service\n- **Access control** — principle of least privilege\n- **Data classification** — public, internal, confidential, restricted\n- **Incident response plan** — what to do when breached\n\n### Best practices\n- Enable Multi-Factor Authentication (MFA) everywhere\n- Keep all software updated\n- Train employees on phishing awareness\n- Backup data regularly\n- Encrypt sensitive data at rest and in transit\n\n### Compliance\nDepending on your industry, you may need to comply with:\n- **GDPR** (Europe)\n- **HIPAA** (US healthcare)\n- **PCI DSS** (payment cards)\n- **ISO 27001** (information security)", duration: 35 });

  // --- Course 6: Introduction to Artificial Intelligence ---
  const c6 = createCourse({
    title: "Introduction to Artificial Intelligence",
    categoryId: "cat-ai",
    description: "Discover the world of AI — from machine learning and neural networks to real-world applications. Learn how AI is transforming industries and how you can get started building AI solutions.",
    coverImage: "",
    price: 4500,
    published: true,
    instructorId,
    level: "Beginner",
    language: "English",
  });

  const m6a = createModule(c6.id, "Understanding AI");
  addLesson({ moduleId: m6a.id, courseId: c6.id, title: "What is Artificial Intelligence?", type: "text", videoUrl: "", content: "# What is Artificial Intelligence?\n\nArtificial Intelligence (AI) is the ability of a computer system to perform tasks that typically require human intelligence — such as learning, reasoning, problem-solving, and decision-making.\n\n## Types of AI\n\n### 1. Narrow AI (ANI)\nAlso called **Weak AI** — designed for a specific task.\n- Siri, Alexa (voice assistants)\n- Spam filters in email\n- Recommendation systems (Netflix, YouTube)\n- ChatGPT, Claude\n\n### 2. General AI (AGI)\nAlso called **Strong AI** — a machine with human-level intelligence across **any** task.\n- Does not exist yet\n- Active research area\n- The subject of much debate\n\n### 3. Superintelligent AI (ASI)\nA machine that surpasses human intelligence in every field.\n- Purely theoretical\n- Raises ethical questions\n\n> **All AI today is Narrow AI** — even the most advanced chatbots and image generators are specialized systems.\n\n## Why AI matters now\n\nThree breakthroughs made modern AI possible:\n1. **Big Data** — massive amounts of data available for training\n2. **Computing power** — GPUs and TPUs can process huge datasets\n3. **Better algorithms** — deep learning, transformers, diffusion models", duration: 25, preview: true });
  addLesson({ moduleId: m6a.id, courseId: c6.id, title: "AI, Machine Learning & Deep Learning — What's the Difference?", type: "text", videoUrl: "", content: "# The AI Hierarchy\n\nMany people use these terms interchangeably, but they're nested concepts:\n\n```\n┌──────────────────────────────────┐\n│         Artificial Intelligence   │  ← Broadest\n│  ┌────────────────────────────┐   │\n│  │    Machine Learning        │   │\n│  │  ┌──────────────────────┐  │   │\n│  │  │   Deep Learning      │  │   │\n│  │  └──────────────────────┘  │   │\n│  └────────────────────────────┘   │\n└──────────────────────────────────┘\n```\n\n## Artificial Intelligence\nThe broad field of making machines intelligent. Includes:\n- Rule-based systems (if-then logic)\n- Expert systems\n- Search algorithms\n- Machine learning\n\n## Machine Learning (ML)\nA **subset of AI** where machines learn patterns from data instead of being explicitly programmed.\n\n### Three main types:\n1. **Supervised Learning** — Learn from labeled examples (e.g., spam detection)\n2. **Unsupervised Learning** — Find patterns in unlabeled data (e.g., customer segmentation)\n3. **Reinforcement Learning** — Learn by trial and error with rewards (e.g., game-playing AI)\n\n## Deep Learning (DL)\nA **subset of ML** using **neural networks** with many layers (hence \"deep\").\n\n### What deep learning powers:\n- Image recognition (facial recognition, medical imaging)\n- Natural language processing (ChatGPT, translation)\n- Speech recognition\n- Autonomous vehicles\n- Generative AI (image generation, text generation)\n\n### Key difference:\n- **ML** often requires manual **feature engineering** (humans pick which features matter)\n- **DL** automatically discovers features from raw data (but needs more data and compute)", duration: 30, preview: true });

  const m6b = createModule(c6.id, "How Machine Learning Works");
  addLesson({ moduleId: m6b.id, courseId: c6.id, title: "The Machine Learning Workflow", type: "text", videoUrl: "", content: "# The ML Workflow\n\nBuilding a machine learning model follows a standard process:\n\n## Step 1: Define the Problem\nWhat are you trying to predict or classify?\n- **Classification**: Is this email spam or not?\n- **Regression**: What will the house price be?\n- **Clustering**: Group similar customers together\n\n## Step 2: Collect Data\nYour model is only as good as your data.\n- **Quality matters** — garbage in, garbage out\n- **Quantity matters** — more data usually = better model\n- **Diversity matters** — data should represent real-world scenarios\n\n## Step 3: Prepare Data (Data Preprocessing)\n- **Clean** — remove errors, duplicates, missing values\n- **Transform** — normalize, scale, encode categorical variables\n- **Split** — divide into training set (80%) and test set (20%)\n\n## Step 4: Choose a Model\n| Problem | Example Algorithms |\n|---------|-------------------|\n| Classification | Logistic Regression, Decision Trees, Random Forest, SVM |\n| Regression | Linear Regression, Gradient Boosting |\n| Clustering | K-Means, DBSCAN |\n| Deep Learning | Neural Networks (CNN, RNN, Transformer) |\n\n## Step 5: Train the Model\nFeed the training data to the algorithm so it can learn patterns.\n\n## Step 6: Evaluate\nTest the model on the **test set** (data it hasn't seen before).\n- **Accuracy** — % of correct predictions\n- **Precision / Recall** — for imbalanced data\n- **Confusion Matrix** — detailed breakdown\n\n## Step 7: Deploy & Monitor\nPut the model into production and monitor its performance over time.\n\n> Models can **degrade** over time as real-world data changes (called **data drift**).", duration: 40 });
  addLesson({ moduleId: m6b.id, courseId: c6.id, title: "Training, Testing & Overfitting", type: "text", videoUrl: "", content: "# Training vs Testing\n\n## The Golden Rule\n**Never test on your training data.**\n\nIf a student memorizes an exam's answer key, they'll score 100% — but they haven't actually learned anything. The same applies to ML models.\n\n## Overfitting\nA model that **memorizes** the training data but fails on new data.\n\n### Signs of overfitting:\n- Training accuracy: 99%\n- Test accuracy: 65%\n\n### How to prevent overfitting:\n1. **More data** — the best solution\n2. **Simpler model** — fewer parameters\n3. **Regularization** — penalize complex models\n4. **Cross-validation** — split data multiple ways\n5. **Early stopping** — stop training before it memorizes\n6. **Dropout** (deep learning) — randomly disable neurons during training\n\n## Underfitting\nA model that's too simple to capture the patterns.\n- Training accuracy: 60%\n- Test accuracy: 58%\n\n## The Sweet Spot 🎯\nYou want a model that **generalizes** well — captures the underlying patterns without memorizing noise.\n\n```\nUnderfitting ←━━━━━━━━━✓━━━━━━━━━→ Overfitting\n  (too simple)    (just right)    (memorizing)\n```", duration: 35 });

  const m6c = createModule(c6.id, "AI in the Real World");
  addLesson({ moduleId: m6c.id, courseId: c6.id, title: "Real-World AI Applications", type: "text", videoUrl: "", content: "# Where AI is Used Today\n\nAI is everywhere — here are the major application areas:\n\n## 🏥 Healthcare\n- **Medical imaging** — AI detects cancer, tumors, and diseases from X-rays and MRIs\n- **Drug discovery** — AI speeds up finding new pharmaceutical compounds\n- **Patient monitoring** — Wearable devices predict health events\n\n## 💰 Finance\n- **Fraud detection** — Banks use AI to flag suspicious transactions in real-time\n- **Algorithmic trading** — AI makes trading decisions in milliseconds\n- **Credit scoring** — AI assesses loan eligibility\n\n## 🚗 Transportation\n- **Autonomous vehicles** — Self-driving cars use AI to perceive and navigate\n- **Route optimization** — GPS apps use AI for traffic prediction\n- **Predictive maintenance** — AI predicts when vehicles need repair\n\n## 🛍️ Retail & E-commerce\n- **Recommendation engines** — \"Customers who bought this also bought...\"\n- **Inventory management** — AI predicts demand\n- **Chatbots** — Customer service automation\n\n## 📱 Everyday AI\n- **Smartphone cameras** — AI enhances photos, detects faces\n- **Email** — Spam filtering, smart replies\n- **Streaming** — Netflix/YouTube recommendations\n- **Translation** — Google Translate, real-time language translation\n\n## 🎨 Generative AI\n- **Text generation** — ChatGPT, Claude, Gemini\n- **Image generation** — DALL-E, Midjourney, Stable Diffusion\n- **Code generation** — GitHub Copilot, AI coding assistants\n- **Music & video** — AI-generated music and video content", duration: 30 });
  addLesson({ moduleId: m6c.id, courseId: c6.id, title: "Getting Started with AI — Your Learning Path", type: "text", videoUrl: "", content: "# Your AI Learning Roadmap 🗺️\n\n## Phase 1: Foundations (1-2 months)\n- **Python programming** — the #1 language for AI\n- **Math basics** — linear algebra, statistics, probability\n- **Data manipulation** — Pandas, NumPy\n- **Data visualization** — Matplotlib, Seaborn\n\n## Phase 2: Machine Learning (2-3 months)\n- **Scikit-learn** — the go-to ML library for beginners\n- **Supervised learning** — regression, classification\n- **Unsupervised learning** — clustering, dimensionality reduction\n- **Model evaluation** — cross-validation, metrics\n- Start with **Kaggle** competitions (beginner level)\n\n## Phase 3: Deep Learning (3-4 months)\n- **Neural networks** — how they work\n- **TensorFlow or PyTorch** — pick one framework\n- **CNN** — for image tasks\n- **RNN / LSTM** — for sequence data\n- **Transformers** — the architecture behind ChatGPT\n\n## Phase 4: Specialization (ongoing)\n- Natural Language Processing (NLP)\n- Computer Vision\n- Reinforcement Learning\n- Generative AI & LLMs\n\n## 🛠️ Tools to install\n```\npip install numpy pandas scikit-learn matplotlib\npip install tensorflow  # or: pip install torch\npip install jupyter     # for interactive notebooks\n```\n\n## 📚 Free resources\n- **Kaggle** — datasets + competitions + courses\n- **Google Colab** — free GPU for AI experiments\n- **Hugging Face** — pre-trained models and datasets\n- **Fast.ai** — free practical deep learning course\n\n> The best way to learn AI is by **doing projects**. Start small, iterate, and build a portfolio.", duration: 40 });

  // 4. Add some demo reviews
  mutate((d) => {
    const studentId = "demo-student-1";
    if (!d.users.find((u) => u.id === studentId)) {
      d.users.push({
        id: studentId,
        name: "Sarah Kimani",
        email: "sarah@example.com",
        passwordHash: bcrypt.hashSync("demo", 10),
        role: "student",
        bio: "",
        avatar: "",
        title: "",
        createdAt: nowISO(),
      });
    }
    if (d.reviews.length === 0) {
      d.reviews.push(
        { id: uid(), courseId: c1.id, userId: studentId, rating: 5, comment: "Excellent course! Very clear explanations and practical examples. Perfect for beginners.", createdAt: nowISO() },
        { id: uid(), courseId: c2.id, userId: studentId, rating: 5, comment: "Loved the hands-on approach. The instructor explains complex topics in a way that's easy to understand.", createdAt: nowISO() },
        { id: uid(), courseId: c3.id, userId: studentId, rating: 4, comment: "Great introduction to networking. Would love to see more advanced content in a follow-up course.", createdAt: nowISO() },
        { id: uid(), courseId: c6.id, userId: studentId, rating: 5, comment: "Brilliant introduction to AI! The workflow lesson made machine learning finally click for me. Highly recommend.", createdAt: nowISO() },
      );
    }
  });

  return NextResponse.json({
    ok: true,
    seeded: 6,
    message: "6 courses with modules, lessons, reviews, and categories created.",
  });
}
