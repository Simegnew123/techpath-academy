// Direct seed script — runs outside Next.js, writes directly to db.json
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const DB_FILE = path.join(__dirname, "..", "data", "db.json");

const uid = () => crypto.randomUUID();
const nowISO = () => new Date().toISOString();

const CATEGORIES = [
  { id: "cat-it-support", name: "IT Support", slug: "it-support", description: "Master the fundamentals of IT support — hardware, software, troubleshooting, and help desk skills.", icon: "🖥️" },
  { id: "cat-networking", name: "Networking", slug: "networking", description: "Learn networking essentials — from OSI model and TCP/IP to routing, switching, and wireless networks.", icon: "🌐" },
  { id: "cat-database", name: "Database Administration", slug: "database-administration", description: "Become a database administrator — SQL, database design, performance tuning, backup and recovery.", icon: "🗄️" },
  { id: "cat-cyber-security", name: "Cyber Security", slug: "cyber-security", description: "Protect systems and data — threat analysis, defense strategies, security policies, and risk management.", icon: "🔐" },
  { id: "cat-ethical-hacking", name: "Ethical Hacking", slug: "ethical-hacking", description: "Learn to think like an attacker — penetration testing, vulnerability assessment, and security auditing.", icon: "🛡️" },
  { id: "cat-ai", name: "Artificial Intelligence", slug: "artificial-intelligence", description: "Discover AI fundamentals — machine learning, deep learning, NLP, and how AI is transforming industries.", icon: "🤖" },
  { id: "cat-other", name: "Other", slug: "other", description: "Additional IT and technology courses outside the main categories.", icon: "📚" },
];

function slugify(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// Load existing DB
let db;
try {
  db = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
} catch {
  db = { users: [], sessions: [], categories: [], courses: [], modules: [], lessons: [], enrollments: [], progress: [], reviews: [], certificates: [], payments: [] };
}

// 1. Seed categories
db.categories = CATEGORIES;

// 2. Find or create admin/instructor
let admin = db.users.find(u => u.role === "admin");
if (!admin) {
  admin = {
    id: uid(),
    name: "Simegnew",
    email: "admin@techpath.academy",
    passwordHash: bcrypt.hashSync("admin123", 10),
    role: "admin",
    bio: "IT educator and founder of TechPath Academy.",
    avatar: "", title: "Founder & Lead Instructor",
    createdAt: nowISO(),
  };
  db.users.push(admin);
}
const instructorId = admin.id;

// Helpers
function createCourse(title, categoryId, description, price, level) {
  const course = {
    id: uid(), slug: slugify(title), title, categoryId, description,
    coverImage: "", price, published: true, instructorId, level,
    language: "English", createdAt: nowISO(),
  };
  db.courses.push(course);
  return course;
}
function createModule(courseId, title, order) {
  const mod = { id: uid(), courseId, title, order: order || 0 };
  db.modules.push(mod);
  return mod;
}
function addLesson(moduleId, courseId, title, type, content, duration, preview) {
  const lesson = {
    id: uid(), moduleId, courseId, order: 0, title,
    type: type || "text", videoUrl: "", content,
    duration: duration || 15, preview: preview || false,
  };
  db.lessons.push(lesson);
  return lesson;
}

// Clear existing courses/modules/lessons/reviews
db.courses = [];
db.modules = [];
db.lessons = [];
db.reviews = [];
db.certificates = [];

// ===== Course 1: IT Support Fundamentals (FREE) =====
const c1 = createCourse("IT Support Fundamentals", "cat-it-support",
  "Master the essentials: hardware, software, troubleshooting, and customer service skills for IT support roles.", 0, "Beginner");
const m1a = createModule(c1.id, "Getting Started");
addLesson(m1a.id, c1.id, "Welcome & Course Overview", "text",
  "# Welcome to IT Support Fundamentals!\n\nThis free course introduces you to the world of IT support.\n\n## What you'll learn\n- Understanding computer hardware\n- Operating systems basics\n- Networking fundamentals\n- Troubleshooting methodology\n- Customer service skills", 15, true);
addLesson(m1a.id, c1.id, "The Role of an IT Support Specialist", "text",
  "## What does IT Support do?\n\nAn IT support specialist helps users with technology problems.\n\n### Common tasks:\n- Installing and configuring software\n- Troubleshooting hardware issues\n- Setting up user accounts\n- Managing network access\n\n### Career path:\n1. **Help Desk Technician** then entry level\n2. **IT Support Specialist** then 1-2 years\n3. **System Administrator** then 3+ years", 20, true);
const m1b = createModule(c1.id, "Troubleshooting Fundamentals");
addLesson(m1b.id, c1.id, "The Troubleshooting Process", "text",
  "## Step-by-step troubleshooting\n\n1. **Identify the problem**\n2. **Establish a theory**\n3. **Test the theory**\n4. **Establish a plan**\n5. **Verify functionality**\n6. **Document**\n\n> Always start with the simplest solution first!", 25);
addLesson(m1b.id, c1.id, "Common Hardware Issues", "text",
  "## Hardware problems you'll see\n\n- **Won't boot**: Check power supply, RAM, hard drive\n- **Overheating**: Clean fans, check thermal paste\n- **Slow performance**: Check disk space, RAM, malware\n\n### Tools you need\n- Screwdriver set\n- Anti-static wrist strap\n- Cable tester\n- USB boot drive with diagnostic tools", 30);

// ===== Course 2: Ethical Hacking Basics =====
const c2 = createCourse("Ethical Hacking Basics", "cat-ethical-hacking",
  "Learn the foundations of ethical hacking: reconnaissance, scanning, and vulnerability assessment — legally and ethically.", 4900, "Intermediate");
const m2a = createModule(c2.id, "Introduction to Ethical Hacking");
addLesson(m2a.id, c2.id, "What is Ethical Hacking?", "text",
  "## Introduction\n\nEthical hacking is the practice of testing systems for vulnerabilities **with permission**.\n\n### Key concepts\n- **White hats** — ethical hackers\n- **Black hats** — malicious hackers\n- **Gray hats** — fall somewhere in between\n\n> Never hack a system you don't own or don't have permission to test.", 20, true);
addLesson(m2a.id, c2.id, "The 5 Phases of Hacking", "text",
  "## The Hacking Methodology\n\n1. **Reconnaissance** — Gathering information\n2. **Scanning** — Identifying live systems\n3. **Gaining Access** — Exploiting vulnerabilities\n4. **Maintaining Access** — Backdoors\n5. **Covering Tracks** — Clearing logs\n\n### Tools\n- Nmap — network scanning\n- Wireshark — packet analysis\n- Metasploit — exploitation framework\n- Burp Suite — web application testing", 25, true);
const m2b = createModule(c2.id, "Reconnaissance Techniques");
addLesson(m2b.id, c2.id, "Passive Information Gathering", "text",
  "## Phase 1: Passive Recon\n\nGathering information **without touching** their systems.\n\n### Techniques\n- **OSINT** (Open Source Intelligence)\n  - Google dorking\n  - Social media profiling\n  - WHOIS lookups\n- **DNS enumeration** — finding subdomains\n- **Web archive** — historical snapshots", 35);

// ===== Course 3: Networking Fundamentals =====
const c3 = createCourse("Networking Fundamentals", "cat-networking",
  "Understand IP addressing, routing, switches, and how data moves across networks. Build the foundation for any IT career.", 3900, "Beginner");
const m3a = createModule(c3.id, "Network Basics");
addLesson(m3a.id, c3.id, "How Data Moves Across a Network", "text",
  "## The OSI Model\n\n7. **Application** — HTTP, FTP, DNS\n6. **Presentation** — Encryption\n5. **Session** — Managing connections\n4. **Transport** — TCP/UDP\n3. **Network** — IP addressing, routing\n2. **Data Link** — MAC addresses, switches\n1. **Physical** — Cables, signals", 30, true);
addLesson(m3a.id, c3.id, "IP Addressing Explained", "text",
  "## What is an IP Address?\n\n### IPv4\n- Format: 192.168.1.100\n- 4 octets, 0-255 each\n\n### Private vs Public\n- **Private**: 192.168.x.x, 10.x.x.x\n- **Public**: Everything else\n\n### Subnet Masks\n- /24 = 255.255.255.0 = 256 addresses\n\n### DHCP\nAutomatically assigns IP addresses to devices.", 35);
const m3b = createModule(c3.id, "Routing & Switching");
addLesson(m3b.id, c3.id, "Switches vs Routers", "text",
  "## Switches\n- Operate at **Layer 2**\n- Forward frames using **MAC addresses**\n- Connect devices within the same network\n\n## Routers\n- Operate at **Layer 3**\n- Forward packets using **IP addresses**\n- Connect **different networks**\n\n## Analogy\n- **Switch** = hallway connecting rooms\n- **Router** = road connecting buildings", 25);

// ===== Course 4: Database Administration Starter =====
const c4 = createCourse("Database Administration Starter", "cat-database",
  "Introduction to relational databases, SQL, and daily DBA tasks. Includes backup, recovery, and performance tuning basics.", 5900, "Intermediate");
const m4a = createModule(c4.id, "Database Fundamentals");
addLesson(m4a.id, c4.id, "What is a Database?", "text",
  "## Databases everywhere\n\n### Types\n- **Relational** (SQL) — MySQL, PostgreSQL, Oracle\n- **NoSQL** — MongoDB, Redis\n- **Cloud** — AWS RDS, Azure SQL\n\n### The DBA role\nA Database Administrator ensures databases run efficiently and securely.", 20, true);
addLesson(m4a.id, c4.id, "SQL Basics — SELECT, INSERT, UPDATE, DELETE", "text",
  "## The 4 basic SQL operations (CRUD)\n\n### Create — INSERT\n```sql\nINSERT INTO students (name, email)\nVALUES ('John Doe', 'john@example.com');\n```\n\n### Read — SELECT\n```sql\nSELECT * FROM students\nWHERE name = 'John Doe';\n```\n\n### Update — UPDATE\n```sql\nUPDATE students\nSET email = 'john.new@example.com'\nWHERE id = 1;\n```\n\n### Delete — DELETE\n```sql\nDELETE FROM students\nWHERE id = 1;\n```\n\n> Always use WHERE with UPDATE and DELETE!", 40, true);
const m4b = createModule(c4.id, "DBA Daily Tasks");
addLesson(m4b.id, c4.id, "Backup & Recovery", "text",
  "## The #1 DBA responsibility\n\n### Backup types\n1. **Full backup**\n2. **Incremental**\n3. **Differential**\n4. **Log backup**\n\n### The 3-2-1 Rule\n- **3** copies of data\n- **2** different storage types\n- **1** offsite copy\n\n> A backup you haven't tested is not a backup.", 35);

// ===== Course 5: Cyber Security Essentials =====
const c5 = createCourse("Cyber Security Essentials", "cat-cyber-security",
  "Learn the core principles of cyber security: threat types, defense strategies, and how to protect yourself and your organization.", 2500, "Beginner");
const m5a = createModule(c5.id, "Security Fundamentals");
addLesson(m5a.id, c5.id, "What is Cyber Security?", "text",
  "# What is Cyber Security?\n\nCyber security protects systems, networks, and data from digital attacks.\n\n## The CIA Triad\n- **Confidentiality** — keeping data private\n- **Integrity** — keeping data accurate\n- **Availability** — keeping systems running", 20, true);
addLesson(m5a.id, c5.id, "Common Cyber Threats", "text",
  "# Common Cyber Threats\n\n- **Phishing** — fraudulent emails\n- **Malware** — viruses, ransomware\n- **DDoS** — overwhelming with traffic\n- **SQL Injection** — exploiting database queries\n\n### Defense in depth\n1. Firewalls\n2. Antivirus\n3. Strong passwords + MFA\n4. Employee training\n5. Regular updates", 30, true);
const m5b = createModule(c5.id, "Building a Security Culture");
addLesson(m5b.id, c5.id, "Security Policies & Best Practices", "text",
  "## Security starts with people\n\n### Essential policies\n- **Password policy** — min 12 characters\n- **Access control** — least privilege\n- **Incident response plan**\n\n### Best practices\n- Enable MFA everywhere\n- Keep software updated\n- Train employees on phishing\n- Backup regularly\n- Encrypt sensitive data", 35);

// ===== Course 6: Introduction to Artificial Intelligence =====
const c6 = createCourse("Introduction to Artificial Intelligence", "cat-ai",
  "Discover the world of AI — from machine learning and neural networks to real-world applications. Learn how AI is transforming industries and how you can get started building AI solutions.", 4500, "Beginner");
const m6a = createModule(c6.id, "Understanding AI");
addLesson(m6a.id, c6.id, "What is Artificial Intelligence?", "text",
  "# What is Artificial Intelligence?\n\nArtificial Intelligence (AI) is the ability of a computer system to perform tasks that typically require human intelligence — such as learning, reasoning, problem-solving, and decision-making.\n\n## Types of AI\n\n### 1. Narrow AI (ANI)\nAlso called **Weak AI** — designed for a specific task.\n- Siri, Alexa (voice assistants)\n- Spam filters in email\n- Recommendation systems (Netflix, YouTube)\n- ChatGPT, Claude\n\n### 2. General AI (AGI)\nAlso called **Strong AI** — a machine with human-level intelligence across **any** task.\n- Does not exist yet\n- Active research area\n\n### 3. Superintelligent AI (ASI)\nA machine that surpasses human intelligence in every field.\n- Purely theoretical\n\n> **All AI today is Narrow AI** — even the most advanced chatbots are specialized systems.\n\n## Why AI matters now\n\nThree breakthroughs made modern AI possible:\n1. **Big Data** — massive amounts of data\n2. **Computing power** — GPUs and TPUs\n3. **Better algorithms** — deep learning, transformers", 25, true);
addLesson(m6a.id, c6.id, "AI, Machine Learning & Deep Learning", "text",
  "# The AI Hierarchy\n\nAI > ML > DL\n\n## Artificial Intelligence\nThe broad field of making machines intelligent.\n\n## Machine Learning (ML)\nA **subset of AI** where machines learn patterns from data.\n\n### Three main types:\n1. **Supervised Learning** — Learn from labeled examples\n2. **Unsupervised Learning** — Find patterns in unlabeled data\n3. **Reinforcement Learning** — Learn by trial and error with rewards\n\n## Deep Learning (DL)\nA **subset of ML** using **neural networks** with many layers.\n\n### What deep learning powers:\n- Image recognition\n- Natural language processing (ChatGPT)\n- Speech recognition\n- Autonomous vehicles\n- Generative AI\n\n### Key difference:\n- **ML** often requires manual **feature engineering**\n- **DL** automatically discovers features from raw data", 30, true);
const m6b = createModule(c6.id, "How Machine Learning Works");
addLesson(m6b.id, c6.id, "The Machine Learning Workflow", "text",
  "# The ML Workflow\n\n## Step 1: Define the Problem\n- **Classification**: Is this email spam or not?\n- **Regression**: What will the house price be?\n- **Clustering**: Group similar customers together\n\n## Step 2: Collect Data\n- **Quality matters** — garbage in, garbage out\n- **Quantity matters** — more data = better model\n\n## Step 3: Prepare Data\n- **Clean** — remove errors, duplicates\n- **Transform** — normalize, scale, encode\n- **Split** — training set (80%) and test set (20%)\n\n## Step 4: Choose a Model\n| Problem | Example Algorithms |\n|---------|-------------------|\n| Classification | Logistic Regression, Decision Trees, Random Forest |\n| Regression | Linear Regression, Gradient Boosting |\n| Clustering | K-Means, DBSCAN |\n| Deep Learning | CNN, RNN, Transformer |\n\n## Step 5: Train the Model\nFeed training data to the algorithm.\n\n## Step 6: Evaluate\nTest on the **test set** (unseen data).\n- **Accuracy** — % of correct predictions\n- **Precision / Recall** — for imbalanced data\n\n## Step 7: Deploy & Monitor\n> Models can **degrade** over time as real-world data changes (**data drift**).", 40);
addLesson(m6b.id, c6.id, "Training, Testing & Overfitting", "text",
  "# Training vs Testing\n\n## The Golden Rule\n**Never test on your training data.**\n\nIf a student memorizes an exam's answer key, they'll score 100% — but haven't learned anything. Same for ML models.\n\n## Overfitting\nA model that **memorizes** training data but fails on new data.\n\n### Signs:\n- Training accuracy: 99%\n- Test accuracy: 65%\n\n### How to prevent:\n1. **More data**\n2. **Simpler model**\n3. **Regularization**\n4. **Cross-validation**\n5. **Early stopping**\n6. **Dropout** (deep learning)\n\n## Underfitting\nA model too simple to capture patterns.\n- Training accuracy: 60%\n- Test accuracy: 58%\n\n## The Sweet Spot\nUnderfitting  <--  JUST RIGHT  -->  Overfitting\n  (too simple)      (just right)    (memorizing)", 35);
const m6c = createModule(c6.id, "AI in the Real World");
addLesson(m6c.id, c6.id, "Real-World AI Applications", "text",
  "# Where AI is Used Today\n\n## Healthcare\n- **Medical imaging** — AI detects cancer from X-rays\n- **Drug discovery** — AI speeds up finding new compounds\n- **Patient monitoring** — Wearables predict health events\n\n## Finance\n- **Fraud detection** — Flag suspicious transactions\n- **Algorithmic trading** — Decisions in milliseconds\n- **Credit scoring** — Assess loan eligibility\n\n## Transportation\n- **Autonomous vehicles** — Self-driving cars\n- **Route optimization** — Traffic prediction\n- **Predictive maintenance** — Predict when vehicles need repair\n\n## Retail and E-commerce\n- **Recommendation engines** — Customers who bought this also bought...\n- **Inventory management** — Predict demand\n- **Chatbots** — Customer service\n\n## Generative AI\n- **Text generation** — ChatGPT, Claude, Gemini\n- **Image generation** — DALL-E, Midjourney\n- **Code generation** — GitHub Copilot\n- **Music and video** — AI-generated content", 30);
addLesson(m6c.id, c6.id, "Getting Started with AI — Your Learning Path", "text",
  "# Your AI Learning Roadmap\n\n## Phase 1: Foundations (1-2 months)\n- **Python programming** — the #1 language for AI\n- **Math basics** — linear algebra, statistics\n- **Data manipulation** — Pandas, NumPy\n\n## Phase 2: Machine Learning (2-3 months)\n- **Scikit-learn** — the go-to ML library\n- **Supervised learning** — regression, classification\n- **Unsupervised learning** — clustering\n- Start with **Kaggle** competitions\n\n## Phase 3: Deep Learning (3-4 months)\n- **Neural networks** — how they work\n- **TensorFlow or PyTorch** — pick one\n- **CNN** — for image tasks\n- **Transformers** — behind ChatGPT\n\n## Phase 4: Specialization (ongoing)\n- Natural Language Processing (NLP)\n- Computer Vision\n- Generative AI and LLMs\n\n## Tools to install\n```\npip install numpy pandas scikit-learn matplotlib\npip install tensorflow  # or: pip install torch\npip install jupyter     # for notebooks\n```\n\n## Free resources\n- **Kaggle** — datasets + competitions + courses\n- **Google Colab** — free GPU for AI experiments\n- **Hugging Face** — pre-trained models\n- **Fast.ai** — free practical deep learning course\n\n> The best way to learn AI is by **doing projects**.", 40);

// ===== Demo student + reviews =====
let student = db.users.find(u => u.id === "demo-student-1");
if (!student) {
  student = {
    id: "demo-student-1",
    name: "Sarah Kimani",
    email: "sarah@example.com",
    passwordHash: bcrypt.hashSync("demo", 10),
    role: "student",
    bio: "", avatar: "", title: "",
    createdAt: nowISO(),
  };
  db.users.push(student);
}

db.reviews = [
  { id: uid(), courseId: c1.id, userId: student.id, rating: 5, comment: "Excellent course! Very clear explanations and practical examples. Perfect for beginners.", createdAt: nowISO() },
  { id: uid(), courseId: c2.id, userId: student.id, rating: 5, comment: "Loved the hands-on approach. The instructor explains complex topics in a way that's easy to understand.", createdAt: nowISO() },
  { id: uid(), courseId: c3.id, userId: student.id, rating: 4, comment: "Great introduction to networking. Would love to see more advanced content in a follow-up course.", createdAt: nowISO() },
  { id: uid(), courseId: c6.id, userId: student.id, rating: 5, comment: "Brilliant introduction to AI! The workflow lesson made machine learning finally click for me. Highly recommend.", createdAt: nowISO() },
];

// Save
fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
console.log("Seed complete!");
console.log("Categories:", db.categories.length);
console.log("Courses:", db.courses.length);
console.log("Modules:", db.modules.length);
console.log("Lessons:", db.lessons.length);
console.log("Reviews:", db.reviews.length);
console.log("Users:", db.users.length);
console.log("\nCourses:");
db.courses.forEach((c, i) => console.log(`  ${i + 1}. ${c.title} — ${c.price === 0 ? "FREE" : "KES " + c.price} — ${c.level}`));
