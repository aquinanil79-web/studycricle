// Fills the database with demo data for CampusHub: 1 admin, 15 students, clubs,
// events, announcements, study resources, memberships, registrations and comments.
//
// Run: SEED_PASSWORD='choose-a-password' npm run seed
// Safe to run again: accounts are reused and all demo content is replaced.
//
// Uses the SECRET key, which bypasses Row Level Security, so it must only ever run
// on a developer's machine, never in the browser.

import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const password = process.env.SEED_PASSWORD;

if (!url || !secretKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set in .env.local.");
  process.exit(1);
}
if (!password || password.length < 8) {
  console.error("Set SEED_PASSWORD (at least 8 characters), e.g. SEED_PASSWORD='...' npm run seed");
  process.exit(1);
}

const supabase = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ---------- date helpers (dates are relative to the day the seed runs) ----------

const DAY = 24 * 60 * 60 * 1000;
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
/** YYYY-MM-DD, `days` from today in India (negative = in the past). */
const dateIn = (days) => new Date(Date.parse(`${today}T00:00:00Z`) + days * DAY).toISOString().slice(0, 10);
/** Timestamp `hours` hours ago. */
const hoursAgo = (hours) => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

// Every image URL below was checked to return HTTP 200 when this script was written.
const unsplash = (id) => `https://images.unsplash.com/photo-${id}?w=1200&q=80&auto=format&fit=crop`;

// ---------- demo data ----------

// Same strings as DEPARTMENTS in lib/constants.ts.
const CSE = "Computer Science & Engineering";
const IT = "Information Technology";
const ECE = "Electronics & Communication";
const EE = "Electrical Engineering";
const ME = "Mechanical Engineering";
const CE = "Civil Engineering";
const AIDS = "Artificial Intelligence & Data Science";
const BBA = "Business Administration";

const ADMIN = {
  email: "admin@campushub.test",
  full_name: "Dr. Meera Iyer",
  student_id: "STAFF001",
  department: CSE,
  year: null,
  bio: "Dean of Student Affairs and faculty coordinator for clubs and events. My door in the Admin Block is always open.",
};

// clubs/events use the keys of CLUBS and EVENTS below.
const STUDENTS = [
  { first: "Aarav", last: "Sharma", student_id: "24CSE047", department: CSE, year: 3, clubs: ["code", "robo"], events: ["hack", "lecture", "iot", "robowars"], bio: "Competitive programmer, chai enthusiast and occasional open-source contributor." },
  { first: "Ananya", last: "Reddy", student_id: "25IT012", department: IT, year: 2, clubs: ["code", "drama"], events: ["hack", "sanskriti", "pitch", "iot"], bio: "Frontend dev by day, Bharatanatyam dancer by evening." },
  { first: "Rohan", last: "Mehta", student_id: "23ME031", department: ME, year: 4, clubs: ["robo", "ecell"], events: ["placement", "pitch", "iot", "robowars"], bio: "Building a low-cost drone for crop monitoring. Final year, placement season mode on." },
  { first: "Priya", last: "Nair", student_id: "24ECE018", department: ECE, year: 3, clubs: ["robo", "nss"], events: ["blood", "iot", "pitch", "outreach"] },
  { first: "Vikram", last: "Singh", student_id: "25EE009", department: EE, year: 2, clubs: ["nss"], events: ["blood", "sanskriti", "outreach"], bio: "NSS volunteer and football goalkeeper." },
  { first: "Sneha", last: "Kulkarni", student_id: "26AID022", department: AIDS, year: 1, clubs: ["code", "drama", "nss"], events: ["lecture", "sanskriti", "natak", "iot"] },
  { first: "Arjun", last: "Patel", student_id: "25CSE063", department: CSE, year: 2, clubs: ["code", "ecell"], events: ["hack", "pitch", "iot"], bio: "Trying to ship one side project every month." },
  { first: "Diya", last: "Banerjee", student_id: "24BBA015", department: BBA, year: 3, clubs: ["ecell", "drama"], events: ["pitch", "sanskriti", "natak", "placement"], bio: "Marketing nerd. Ask me about D2C brands." },
  { first: "Karthik", last: "Subramanian", student_id: "23CE027", department: CE, year: 4, clubs: ["nss"], events: ["placement", "blood", "outreach", "iot"] },
  { first: "Ishita", last: "Gupta", student_id: "26CSE104", department: CSE, year: 1, clubs: ["code", "drama"], events: ["hack", "sanskriti", "natak", "pitch"], bio: "Fresher! Learning C and loving the campus canteen." },
  { first: "Aditya", last: "Joshi", student_id: "23IT041", department: IT, year: 4, clubs: ["code", "ecell", "robo"], events: ["placement", "hack", "pitch", "iot", "robowars"] },
  { first: "Meghna", last: "Das", student_id: "25ECE056", department: ECE, year: 2, clubs: ["robo"], events: ["iot", "robowars", "blood"], bio: "Embedded systems, Arduino and too many jumper wires." },
  { first: "Siddharth", last: "Rao", student_id: "24AID033", department: AIDS, year: 3, clubs: ["code", "ecell"], events: ["lecture", "hack", "pitch", "iot"], bio: "ML projects, Kaggle notebooks and badminton." },
  { first: "Fatima", last: "Sheikh", student_id: "24CSE071", department: CSE, year: 3, clubs: ["drama", "nss"], events: ["sanskriti", "natak", "blood", "iot"] },
  { first: "Harpreet", last: "Kaur", student_id: "26ME008", department: ME, year: 1, clubs: ["robo", "nss", "drama"], events: ["robowars", "outreach", "sanskriti"], bio: "Bhangra, bikes and building things." },
].map((student) => ({
  ...student,
  full_name: `${student.first} ${student.last}`,
  email: `${student.first}.${student.last}@campushub.test`.toLowerCase(),
}));

const CLUBS = {
  code: {
    name: "CodeCraft - The Coding Club",
    category: "Technical",
    image: "1517694712202-14dd9538aa97",
    description:
      "Weekly DSA sessions, competitive programming contests and project nights for everyone from first-year beginners to ICPC aspirants. We also run the annual HackVerse hackathon and help juniors with placement-style coding rounds.",
  },
  drama: {
    name: "Rangmanch Dramatics Society",
    category: "Cultural",
    image: "1503095396549-807759245b35",
    description:
      "The home of theatre on campus: stage plays, nukkad nataks, mime and improv. Rangmanch performs at Sanskriti every year and takes street plays on social issues to nearby villages with the NSS unit.",
  },
  robo: {
    name: "RoboNexus Robotics Club",
    category: "Technical",
    image: "1485827404703-89b55fcc595e",
    description:
      "Line followers, robotic arms, drones and combat bots. Members get access to the robotics lab, 3D printer and sensor kits, and our teams compete in inter-college RoboWars and e-Yantra style challenges.",
  },
  nss: {
    name: "NSS Unit - National Service Scheme",
    category: "Social Service",
    image: "1559027615-cd4628902d4a",
    description:
      "Not me but you. The NSS unit organises blood donation camps, teaching drives in the adopted village, cleanliness campaigns and tree plantation. Volunteers who complete 120 hours earn the NSS certificate.",
  },
  ecell: {
    name: "E-Cell - Entrepreneurship Cell",
    category: "Entrepreneurship",
    image: "1556761175-5973dc0f32e7",
    description:
      "For students who want to build startups. E-Cell hosts founder talks, pitch clinics, ideathons and an incubation track with mentors from our alumni network and the campus innovation centre.",
  },
};

const EVENTS = {
  blood: {
    title: "Blood Donation Camp",
    days: 3,
    time: "09:30",
    location: "Central Library Foyer",
    organizer: "NSS Unit with the District Red Cross Blood Bank",
    capacity: 120,
    image: "1615461066159-fea0960485d5",
    description:
      "Donate blood, save lives. Doctors from the district blood bank will run a quick health check before donation. Eat a proper breakfast, carry your college ID, and get a donor certificate plus refreshments afterwards.",
  },
  placement: {
    title: "Placement Drive Prep Talk: Cracking Campus Interviews",
    days: 6,
    time: "15:00",
    location: "Seminar Hall 2, Admin Block",
    organizer: "Training & Placement Cell",
    capacity: 150,
    image: "1524178232363-1fb2b075b655",
    description:
      "Seniors placed last season share how they prepared for aptitude tests, coding rounds, group discussions and HR interviews. Includes a live mock interview and a Q&A with the Training & Placement Officer.",
  },
  // Deliberately small: 11 of 12 seats are taken, so it shows as "almost full".
  iot: {
    title: "Innovista Workshop: Build an IoT Weather Station",
    days: 10,
    time: "10:00",
    location: "Electronics Lab 3, ECE Block",
    organizer: "RoboNexus Robotics Club",
    capacity: 12,
    image: "1581091226825-a6a2a5aee158",
    description:
      "A hands-on tech fest workshop: wire up an ESP32 with temperature and humidity sensors and push live readings to a web dashboard. Kits are provided; bring a laptop with the Arduino IDE installed.",
  },
  hack: {
    title: "HackVerse 2026: 24-Hour Hackathon",
    days: 14,
    time: "09:00",
    location: "Innovation Centre, Block C",
    organizer: "CodeCraft - The Coding Club",
    capacity: 60,
    image: "1504384308090-c894fdcc538d",
    description:
      "Form teams of up to four and build something useful for the campus in 24 hours. Problem statements on sustainability, health and ed-tech. Food, Wi-Fi and mentors all night; prizes for the top three teams.",
  },
  lecture: {
    title: "Guest Lecture: Generative AI in Industry",
    days: 18,
    time: "11:00",
    location: "Main Auditorium",
    organizer: "Department of Artificial Intelligence & Data Science",
    capacity: 250,
    image: "1505373877841-8d25f7d46678",
    description:
      "An alumnus working as a principal ML engineer talks about how large language models are actually deployed in products, what skills recruiters look for, and how students can build a strong AI portfolio.",
  },
  // Deliberately tiny and full: used to demo (and test) the EVENT_FULL rule.
  pitch: {
    title: "Startup Pitch Clinic: 1-on-1 Mentoring",
    days: 21,
    time: "14:00",
    location: "E-Cell Office, Innovation Centre",
    organizer: "E-Cell - Entrepreneurship Cell",
    capacity: 8,
    image: "1522071820081-009f0129c71c",
    description:
      "Eight founders-in-the-making get 20 minutes each with an alumni investor to sharpen their pitch deck, business model and go-to-market plan. Seats are limited so that every team gets real feedback.",
  },
  sanskriti: {
    title: "Sanskriti 2026: Cultural Night",
    days: 27,
    time: "18:30",
    location: "Open Air Theatre",
    organizer: "Rangmanch Dramatics Society and Student Council",
    capacity: 500,
    image: "1492684223066-81342ee5ff30",
    description:
      "The biggest night of the semester: classical and folk dance, the college band, a fashion walk and a stand-up set. Food stalls open from 6 PM. Entry with college ID only.",
  },
  natak: {
    title: "Nukkad Natak and Open Mic Evening",
    days: 38,
    time: "17:30",
    location: "Amphitheatre near the Canteen",
    organizer: "Rangmanch Dramatics Society",
    capacity: 80,
    image: "1475721027785-f74eccf877e2",
    description:
      "Street plays on mental health and road safety, followed by an open mic for poetry, shayari, music and comedy. Sign up at the venue for a five-minute open mic slot.",
  },
  robowars: {
    title: "RoboWars Qualifier and Robotics Expo",
    days: -12,
    time: "10:00",
    location: "Mechanical Workshop Ground",
    organizer: "RoboNexus Robotics Club",
    capacity: 100,
    image: "1535378917042-10a22c95931a",
    description:
      "Combat robots battled it out in the arena to qualify for the inter-college RoboWars, while the expo showcased line followers, a robotic arm and a solar-powered rover built by our members.",
  },
  outreach: {
    title: "NSS Village Outreach: Teaching Drive",
    days: -25,
    time: "08:00",
    location: "Government Primary School, Rampur Village",
    organizer: "NSS Unit",
    capacity: 30,
    image: "1488521787991-ed7bbaae773c",
    description:
      "Volunteers spent a Saturday teaching basic English, maths and hygiene to students of our adopted village school, and donated notebooks and stationery collected on campus.",
  },
};

// [category, days ago, title, content]
const ANNOUNCEMENTS = [
  ["Examination", 1, "Mid-Semester Examination Timetable Released", "The timetable for the mid-semester examinations is now on the notice board and the exam cell portal. Exams begin in three weeks. Hall tickets will be issued by your department office; students with less than 75% attendance must meet their HOD before collecting theirs."],
  ["Placement", 2.5, "Campus Placement Drive: Registration Open for the 2027 Batch", "Registrations for the first on-campus drive are open until Friday. Eligible: final-year B.Tech students with no active backlogs and 6.5+ CGPA. Upload your updated resume on the placement portal and attend the prep talk in Seminar Hall 2."],
  ["Event", 5, "Volunteers Needed for Sanskriti 2026", "The Student Council is looking for volunteers for stage management, hospitality, decoration and security at Sanskriti 2026. Volunteers get a certificate and an event T-shirt. Sign up with your class representative by next Wednesday."],
  ["Academic", 8, "Last Date for Open Elective Registration", "Open elective registration for this semester closes on the 30th. Choose your elective on the academic portal; seats are allotted on a first-come, first-served basis. Changes after the deadline will not be entertained."],
  ["General", 11, "Library Timings Extended Before Exams", "The Central Library will stay open from 8 AM to 11 PM on all days, including Sundays, until the end of the mid-semester exams. Carry your ID card; the reading hall is reserved for silent study."],
  ["General", 14, "Hostel Wi-Fi Maintenance This Weekend", "The IT cell will upgrade network switches in hostel blocks A to D on Saturday between 10 AM and 4 PM. Internet will be unavailable during this window. Labs in the main building will remain open for urgent work."],
  ["Placement", 17, "Aptitude Mock Test Every Saturday", "The Training & Placement Cell is conducting a free online aptitude mock test every Saturday at 11 AM in the CSE labs. Scores are shared individually so you can track your preparation before the placement season."],
  ["Examination", 20, "Supplementary Exam Forms Due", "Students with backlogs from the previous semester must submit the supplementary examination form and fee at the exam cell by the 5th of next month. Late forms will be accepted only with a fine."],
];

// [uploader email or "admin", subject, title, description, file kind, file name, days ago, file text lines]
const RESOURCES = [
  ["aarav.sharma", "Data Structures & Algorithms", "DSA Cheat Sheet: Time Complexities", "Big-O of common operations on arrays, linked lists, heaps, hash maps and trees, plus sorting algorithms.", "pdf", "dsa-cheat-sheet.pdf", 19, ["DSA Cheat Sheet", "Array access O(1), search O(n), binary search O(log n)", "Hash map insert/lookup O(1) average", "Heap push/pop O(log n), build heap O(n)", "Merge sort O(n log n), quick sort O(n log n) average"]],
  ["ananya.reddy", "Database Management Systems", "DBMS Normalization Notes (1NF to BCNF)", "Short notes with examples for functional dependencies and each normal form.", "pdf", "dbms-normalization.pdf", 16, ["DBMS Normalization", "1NF: atomic values, no repeating groups", "2NF: no partial dependency on a composite key", "3NF: no transitive dependency", "BCNF: every determinant is a candidate key"]],
  ["arjun.patel", "Operating Systems", "OS Unit 3: CPU Scheduling Summary", "FCFS, SJF, priority and round robin with solved Gantt chart examples.", "txt", "os-cpu-scheduling.txt", 14, ["OS Unit 3 - CPU Scheduling", "", "FCFS: simple, but short jobs wait behind long ones (convoy effect).", "SJF: minimum average waiting time, needs burst time estimates.", "Round Robin: time quantum q; small q = more context switches.", "Priority: can starve low-priority jobs, fixed with ageing."]],
  ["aditya.joshi", "Computer Networks", "OSI vs TCP/IP: Quick Revision", "Layer-by-layer comparison with protocols and devices, handy for viva and interviews.", "pdf", "osi-vs-tcpip.pdf", 12, ["OSI vs TCP/IP", "Application, Presentation, Session -> Application (HTTP, DNS, SMTP)", "Transport -> Transport (TCP, UDP)", "Network -> Internet (IP, ICMP)", "Data Link, Physical -> Network Access (Ethernet, Wi-Fi)"]],
  ["fatima.sheikh", "Web Development", "Web Dev Starter Roadmap", "A week-by-week plan from HTML and CSS to JavaScript, React and deploying your first project.", "txt", "web-dev-roadmap.txt", 10, ["Web Development Roadmap", "", "Week 1-2: HTML semantics and CSS layout (flexbox, grid).", "Week 3-4: JavaScript basics, DOM, fetch.", "Week 5-6: Git, GitHub and a portfolio page.", "Week 7-8: React fundamentals and one full project."]],
  ["siddharth.rao", "Machine Learning", "Machine Learning Formula Sheet", "Loss functions, gradient descent, evaluation metrics and regularisation on one page.", "pdf", "ml-formula-sheet.pdf", 8, ["Machine Learning Formula Sheet", "Linear regression: y = w.x + b, loss = mean squared error", "Logistic regression: sigmoid(z) = 1 / (1 + e^-z)", "Precision = TP / (TP + FP), Recall = TP / (TP + FN)", "L2 regularisation adds lambda * sum(w^2) to the loss"]],
  ["karthik.subramanian", "Engineering Mathematics", "Laplace Transform Table (M3)", "Standard Laplace transforms and properties for Engineering Mathematics III.", "pdf", "laplace-table.pdf", 6, ["Laplace Transform Table", "L{1} = 1/s,  L{t^n} = n!/s^(n+1)", "L{e^at} = 1/(s - a)", "L{sin at} = a/(s^2 + a^2),  L{cos at} = s/(s^2 + a^2)", "First shifting: L{e^at f(t)} = F(s - a)"]],
  ["meghna.das", "Digital Electronics", "K-Map Practice Problems", "Ten Karnaugh map problems (3 and 4 variables) with answers at the end.", "txt", "kmap-practice.txt", 4, ["K-Map Practice Problems", "", "1. F(A,B,C) = sum m(0,2,4,6)       Answer: C'", "2. F(A,B,C) = sum m(1,3,5,7)       Answer: C", "3. F(A,B,C,D) = sum m(0,1,2,3)    Answer: A'B'", "4. F(A,B,C,D) = sum m(5,7,13,15)  Answer: BD"]],
  ["admin", "Placement Preparation", "Placement Aptitude Question Bank (Set 1)", "Quantitative aptitude and logical reasoning questions from previous campus drives.", "pdf", "aptitude-set-1.pdf", 3, ["Placement Aptitude - Set 1", "1. A train 120 m long passes a pole in 6 s. Find its speed. (72 km/h)", "2. If 6 workers finish a job in 10 days, how long do 4 take? (15 days)", "3. Find the next number: 2, 6, 12, 20, 30, ? (42)", "4. Simple interest on Rs 5000 at 8% for 3 years? (Rs 1200)"]],
  ["rohan.mehta", "Placement Preparation", "Top 25 HR Interview Questions", "Common HR questions with tips on structuring your answers (STAR method).", "txt", "hr-interview-questions.txt", 1, ["Top HR Interview Questions", "", "1. Tell me about yourself. (Education, projects, why this role.)", "2. Why should we hire you?", "3. Describe a challenge you faced in a team project. (Use STAR.)", "4. Where do you see yourself in five years?", "5. Are you willing to relocate?"]],
];

// [author email, "club" | "event", key, hours ago, content]
const COMMENTS = [
  ["ananya.reddy", "club", "code", 200, "The Saturday DSA sessions are the best thing about this club. Finally understood segment trees!"],
  ["ishita.gupta", "club", "code", 30, "Is there a beginner track for first years? I only know basic C so far."],
  ["aarav.sharma", "club", "code", 28, "@Ishita yes, the Wednesday sessions start from scratch. Just come to Lab 4 at 5 PM."],
  ["harpreet.kaur", "club", "robo", 90, "Can first years join the RoboWars team or is it only for seniors?"],
  ["meghna.das", "club", "robo", 85, "Anyone can join the build team. The lab is open every evening after 4."],
  ["vikram.singh", "club", "nss", 150, "Signed up for the tree plantation drive. How many hours does it count for?"],
  ["diya.banerjee", "club", "ecell", 60, "The founder talk last week was amazing. Please record the next one!"],
  ["fatima.sheikh", "club", "drama", 45, "Auditions for the Sanskriti play are on Monday, right?"],
  ["sneha.kulkarni", "event", "hack", 20, "Looking for one more teammate who knows React. DM me!"],
  ["arjun.patel", "event", "hack", 12, "Will there be a problem statement for ed-tech? Asking for my team."],
  ["rohan.mehta", "event", "placement", 40, "Please share the slides afterwards, I have a lab exam clash."],
  ["priya.nair", "event", "blood", 16, "First time donating. Anything I should know beforehand?"],
  ["karthik.subramanian", "event", "blood", 9, "@Priya have a good breakfast and drink lots of water. The staff are really friendly."],
  ["siddharth.rao", "event", "lecture", 6, "Really looking forward to this one. Hope there is time for Q&A."],
  ["aditya.joshi", "event", "robowars", 260, "Congrats to Team Vajra for qualifying! That flipper design was brilliant."],
];

// ---------- helpers ----------

/** Supabase returns { data, error } instead of throwing; this throws on error so the script stops. */
function must({ data, error }, what) {
  if (error) throw new Error(`${what}: ${error.message}`);
  return data;
}

/** Every auth user, page by page (listUsers returns at most perPage users per call). */
async function listAllUsers() {
  const users = [];
  for (let page = 1; ; page++) {
    const { users: batch } = must(await supabase.auth.admin.listUsers({ page, perPage: 1000 }), "List users");
    users.push(...batch);
    if (batch.length < 1000) return users;
  }
}

/** A minimal but valid one-page PDF (Helvetica text), built by hand so no library is needed. */
function makePdf(lines) {
  const escape = (text) => text.replace(/[\\()]/g, "\\$&");
  const content = lines
    .map((line, i) => `BT /F1 ${i === 0 ? 18 : 12} Tf 72 ${720 - i * 28} Td (${escape(line)}) Tj ET`)
    .join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let pdf = "%PDF-1.4\n";
  // The cross-reference table stores the byte offset of every object.
  const offsets = objects.map((body, i) => {
    const offset = pdf.length;
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
    return offset;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, "latin1");
}

/** Deletes every file in the private "resources" bucket (files live in <userId>/ folders). */
async function emptyResourcesBucket() {
  const bucket = supabase.storage.from("resources");
  // ponytail: 1000 folders / 1000 files per folder per run; loop with offset if a real deployment grows past that.
  const folders = must(await bucket.list("", { limit: 1000 }), "List resource folders");
  let removed = 0;
  for (const folder of folders) {
    const files = must(await bucket.list(folder.name, { limit: 1000 }), "List resource files");
    if (!files.length) continue;
    must(await bucket.remove(files.map((file) => `${folder.name}/${file.name}`)), "Remove resource files");
    removed += files.length;
  }
  return removed;
}

// ---------- 1. accounts ----------

async function upsertAccounts() {
  const existing = new Map((await listAllUsers()).map((user) => [user.email, user.id]));
  const ids = {};

  for (const person of [{ ...ADMIN, role: "admin" }, ...STUDENTS.map((s) => ({ ...s, role: "student" }))]) {
    const { email, full_name, student_id, department, year, bio = null, role } = person;
    const metadata = { full_name, student_id, department, year };
    let id = existing.get(email);

    if (id) {
      // Reused account: reset the password so it always matches this run's SEED_PASSWORD.
      must(await supabase.auth.admin.updateUserById(id, { password, user_metadata: metadata }), `Update ${email}`);
    } else {
      // The handle_new_user trigger creates the profile row from user_metadata.
      const data = must(
        await supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: metadata }),
        `Create ${email}`,
      );
      id = data.user.id;
    }

    // Role can only be changed with the secret key (the API has no update grant on it).
    must(
      await supabase.from("profiles").update({ full_name, student_id, department, year, bio, role }).eq("id", id),
      `Update profile of ${email}`,
    );
    ids[email] = id;
  }
  return ids;
}

// ---------- 2. remove old demo content ----------

async function clearContent() {
  console.log(`WARNING: deleting ALL clubs, events, announcements, resources, memberships, registrations`);
  console.log(`         and comments in ${url} (user accounts are kept).`);
  // Children first, although "on delete cascade" would also handle most of these.
  for (const table of ["comments", "event_registrations", "club_members", "resources", "announcements", "events", "clubs"]) {
    // Supabase refuses a delete without a filter; "id is not null" matches every row.
    must(await supabase.from(table).delete().not("id", "is", null), `Clear ${table}`);
  }
  return emptyResourcesBucket();
}

// ---------- 3. insert new demo content ----------

async function insertContent(ids) {
  const adminId = ids[ADMIN.email];
  const idOf = (name) => (name === "admin" ? adminId : ids[`${name}@campushub.test`]);

  const clubRows = must(
    await supabase
      .from("clubs")
      .insert(
        Object.values(CLUBS).map((club) => ({
          name: club.name,
          description: club.description,
          category: club.category,
          image_url: unsplash(club.image),
          created_by: adminId,
          created_at: hoursAgo(30 * 24), // a month ago, before the demo comments
        })),
      )
      .select("id, name"),
    "Insert clubs",
  );
  const clubId = Object.fromEntries(
    Object.entries(CLUBS).map(([key, club]) => [key, clubRows.find((row) => row.name === club.name).id]),
  );

  const eventRows = must(
    await supabase
      .from("events")
      .insert(
        Object.values(EVENTS).map((event) => ({
          title: event.title,
          description: event.description,
          event_date: dateIn(event.days),
          event_time: event.time,
          location: event.location,
          organizer: event.organizer,
          capacity: event.capacity,
          image_url: unsplash(event.image),
          created_by: adminId,
          created_at: hoursAgo(30 * 24), // a month ago, before the demo comments
        })),
      )
      .select("id, title"),
    "Insert events",
  );
  const eventId = Object.fromEntries(
    Object.entries(EVENTS).map(([key, event]) => [key, eventRows.find((row) => row.title === event.title).id]),
  );

  must(
    await supabase.from("announcements").insert(
      ANNOUNCEMENTS.map(([category, days, title, content]) => {
        // Same value for both, otherwise the admin list would show every announcement as "edited".
        const publishedAt = hoursAgo(days * 24);
        return { category, title, content, author_id: adminId, created_at: publishedAt, updated_at: publishedAt };
      }),
    ),
    "Insert announcements",
  );

  // Upload each file to resources/<uploaderId>/<uuid>.<ext>, the same layout the app uses.
  const resourceRows = [];
  for (const [uploader, subject, title, description, kind, fileName, days, lines] of RESOURCES) {
    const body = kind === "pdf" ? makePdf(lines) : Buffer.from(lines.join("\n") + "\n", "utf8");
    const fileType = kind === "pdf" ? "application/pdf" : "text/plain";
    const filePath = `${idOf(uploader)}/${randomUUID()}.${kind}`;
    must(
      await supabase.storage.from("resources").upload(filePath, body, { contentType: fileType }),
      `Upload ${fileName}`,
    );
    resourceRows.push({
      title,
      description,
      subject,
      file_path: filePath,
      file_name: fileName,
      file_size: body.length,
      file_type: fileType,
      uploaded_by: idOf(uploader),
      created_at: hoursAgo(days * 24 + 5),
    });
  }
  must(await supabase.from("resources").insert(resourceRows), "Insert resources");

  const memberships = STUDENTS.flatMap((student) =>
    student.clubs.map((key) => ({ club_id: clubId[key], user_id: ids[student.email] })),
  );
  must(await supabase.from("club_members").insert(memberships), "Insert club memberships");

  // The check_event_capacity trigger still runs here: if the data above ever put more
  // students on an event than its capacity, this insert fails with EVENT_FULL.
  const registrations = STUDENTS.flatMap((student) =>
    student.events.map((key) => ({ event_id: eventId[key], user_id: ids[student.email] })),
  );
  must(await supabase.from("event_registrations").insert(registrations), "Insert event registrations");

  must(
    await supabase.from("comments").insert(
      COMMENTS.map(([author, target, key, hours, content]) => ({
        content,
        author_id: idOf(author),
        club_id: target === "club" ? clubId[key] : null,
        event_id: target === "event" ? eventId[key] : null,
        created_at: hoursAgo(hours),
      })),
    ),
    "Insert comments",
  );

  return { memberships: memberships.length, registrations: registrations.length };
}

// ---------- run ----------

try {
  const ids = await upsertAccounts();
  console.log(`Accounts ready: 1 admin, ${STUDENTS.length} students.`);

  const removedFiles = await clearContent();
  console.log(`Old demo content removed (${removedFiles} files from the resources bucket).`);

  const counts = await insertContent(ids);
  console.log(
    `Inserted ${Object.keys(CLUBS).length} clubs, ${Object.keys(EVENTS).length} events, ` +
      `${ANNOUNCEMENTS.length} announcements, ${RESOURCES.length} resources, ${counts.memberships} memberships, ` +
      `${counts.registrations} registrations and ${COMMENTS.length} comments.`,
  );

  console.log("\nDemo accounts (password: the SEED_PASSWORD you ran this with):");
  console.log(`  admin    ${ADMIN.email}`);
  for (const student of STUDENTS) console.log(`  student  ${student.email}`);
} catch (error) {
  console.error(`\nSeed failed. ${error.message}`);
  process.exit(1);
}
