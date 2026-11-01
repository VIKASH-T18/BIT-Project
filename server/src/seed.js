const dns = require("dns");
try { dns.setServers(["8.8.8.8", "1.1.1.1"]); } catch (e) {}
require("dotenv").config();
const mongoose = require("mongoose");

const User                 = require("./models/User");
const Student              = require("./models/Student");
const Hostel               = require("./models/Hostel");
const Block                = require("./models/Block");
const Floor                = require("./models/Floor");
const Room                 = require("./models/Room");
const Application          = require("./models/Application");
const Allocation           = require("./models/Allocation");
const CompatibilityProfile = require("./models/CompatibilityProfile");
const CompatibilityResult  = require("./models/CompatibilityResult");
const Complaint            = require("./models/Complaint");
const LeaveRequest         = require("./models/LeaveRequest");
const Visitor              = require("./models/Visitor");
const Payment              = require("./models/Payment");
const Notification         = require("./models/Notification");
const { ChatRoom, Message } = require("./models/Chat");
const { Notice, Warden, Admin, AuditLog } = require("./models/Support");
const { Event, MarketplaceItem, LostFoundItem, LaundryBooking, Inventory, Survey } = require("./models/Extra");

const rand = arr => arr[Math.floor(Math.random() * arr.length)];
const rn   = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const ago  = n => new Date(Date.now() - n * 864e5);
const ahead= n => new Date(Date.now() + n * 864e5);

const DEPTS  = ["CSE","ECE","EEE","MECH","CIVIL","IT","AIDS","AIML"];
const BG     = ["A+","A-","B+","B-","O+","O-","AB+","AB-"];
const STATES = ["Tamil Nadu","Kerala","Karnataka","Andhra Pradesh","Telangana"];
const HOBBIES= ["Reading","Gaming","Sports","Music","Coding","Art","Photography"];
const LANGS  = ["Tamil","English","Hindi","Telugu","Malayalam","Kannada"];
const MALES  = ["Arjun Kumar","Vikash S","Karthik R","Manoj P","Suresh B","Arun T","Deepak M","Gowtham K","Harish V","Inban J","Joel D","Kumar S","Lokesh A","Madan G","Naveen R","Praveen C","Rajesh T","Senthil M","Tamil M","Udhay P"];
const FEMALES= ["Priya R","Divya K","Kavitha M","Nithya S","Anitha P","Bhavya T","Chitra V","Dharani G","Eswari J","Geetha L","Hema N","Indhu A","Janani B","Keerthana D","Lavanya M","Meena R","Nivetha S","Oviya T","Pooja K","Ranjitha V"];

async function seed() {
  console.log("\n╔════════════════════════════════════════╗");
  console.log("║   BIT Hostel Portal — Database Seeder  ║");
  console.log("╚════════════════════════════════════════╝\n");

  await mongoose.connect(process.env.MONGODB_URI, { dbName:"bit_hostel", serverSelectionTimeoutMS:15000 });
  console.log("Connected to Atlas:", mongoose.connection.host);

  for (const n of Object.keys(mongoose.connection.collections))
    await mongoose.connection.collections[n].drop().catch(()=>{});
  console.log("Collections dropped.\n");

  // ── ADMIN ────────────────────────────────────────────────────────────────
  const adminUser = await User.create({
    name:"Dr. S. Ramachandran", email:"admin@bitsathy.ac.in", password:"Admin@2026",
    role:"admin", isVerified:true, isActive:true, loginCount:42, lastLoginAt:ago(1)
  });
  await Admin.create({
    user:adminUser._id, employeeId:"ADMIN-001", isSuperAdmin:true,
    permissions:["manage_students","manage_wardens","manage_rooms","manage_fees",
                 "view_analytics","export_reports","manage_settings","super_admin"],
    department:"Hostel Administration", phone:"9876543210",
    joiningDate:new Date("2018-06-01")
  });
  console.log("Admin created: admin@bitsathy.ac.in / Admin@2026");

  // ── WARDENS ───────────────────────────────────────────────────────────────
  const wDefs = [
    { name:"Mr. P. Selvakumar", email:"warden.boysa@bitsathy.ac.in", empId:"WRD-001", blk:"A", ht:"boys"  },
    { name:"Mr. K. Murugesan",  email:"warden.boysb@bitsathy.ac.in", empId:"WRD-002", blk:"B", ht:"boys"  },
    { name:"Mrs. R. Meenakshi", email:"warden.girls@bitsathy.ac.in", empId:"WRD-003", blk:"C", ht:"girls" },
  ];
  const wardenUsers = [];
  for (const wd of wDefs) {
    const u = await User.create({ name:wd.name, email:wd.email, password:"Warden@2026", role:"warden", isVerified:true, isActive:true, loginCount:rn(5,30), lastLoginAt:ago(rn(0,3)) });
    wardenUsers.push({ user:u, def:wd });
    console.log("Warden:", wd.email, "/ Warden@2026");
  }

  // ── HOSTELS ───────────────────────────────────────────────────────────────
  const boysHostel = await Hostel.create({ name:"BIT Boys Hostel", type:"boys", description:"Main boys hostel with modern amenities", totalCapacity:600, currentOccupancy:0, contactPhone:"04295-226000", contactEmail:"boyshostel@bitsathy.ac.in", address:"BIT Campus, Sathyamangalam, Erode - 638401", amenities:["WiFi","Laundry","Mess","Recreation Room","Study Hall","Medical Room","Generator"], rules:["Gates close at 10 PM","No visitors in rooms","Maintain cleanliness","No ragging","No alcohol"], isActive:true, establishedYear:2005 });
  const girlsHostel = await Hostel.create({ name:"BIT Girls Hostel", type:"girls", description:"Dedicated girls hostel with 24/7 security", totalCapacity:400, currentOccupancy:0, contactPhone:"04295-226001", contactEmail:"girlshostel@bitsathy.ac.in", address:"BIT Campus, Sathyamangalam, Erode - 638401", amenities:["WiFi","Laundry","Mess","Study Hall","Medical Room","24/7 Security","Generator"], rules:["Gates close at 9 PM","No male visitors beyond main gate","Night out requires prior approval"], isActive:true, establishedYear:2007 });
  console.log("Hostels: Boys + Girls created");

  // ── BLOCKS + FLOORS + ROOMS ───────────────────────────────────────────────
  const bCfg = [
    { h:boysHostel,  n:"A", fl:4, rPF:10, type:"double",       fee:4500 },
    { h:boysHostel,  n:"B", fl:4, rPF:10, type:"triple",       fee:4000 },
    { h:girlsHostel, n:"C", fl:3, rPF:10, type:"double",       fee:4500 },
    { h:girlsHostel, n:"D", fl:3, rPF:8,  type:"four_sharing", fee:3500 },
  ];
  const capMap = { single:1, double:2, triple:3, four_sharing:4 };
  const createdBlocks={}, createdFloors={}, createdRooms=[];
  for (const bc of bCfg) {
    const block = await Block.create({ hostel:bc.h._id, blockName:bc.n, blockCode:"BLK-"+bc.n, totalFloors:bc.fl, totalRooms:bc.fl*bc.rPF, gender:bc.h.type==="boys"?"boys":"girls", isActive:true, description:"Block "+bc.n });
    createdBlocks[bc.n]=block; createdFloors[bc.n]=[];
    for (let f=1;f<=bc.fl;f++) {
      const floor = await Floor.create({ hostel:bc.h._id, block:block._id, floorNumber:f, floorName:f===1?"Ground Floor":"Floor "+f });
      createdFloors[bc.n].push(floor);
      for (let r=1;r<=bc.rPF;r++) {
        const cap=capMap[bc.type];
        const room = await Room.create({ hostel:bc.h._id, block:block._id, floor:floor._id, roomNumber:bc.n+f+String(r).padStart(2,"0"), floorNumber:f, roomType:bc.type, isAC:false, capacity:cap, currentOccupancy:0, occupants:[], status:"available", amenities:{ fan:cap,table:cap,chair:cap,wardrobe:cap,bed:cap,ac:0,attached_bathroom:f<=1,balcony:false,wifi:true }, monthlyFee:bc.fee, securityDeposit:5000, lastCleaned:ago(rn(1,7)) });
        createdRooms.push({ room, block, floor, hostel:bc.h, cap });
      }
    }
    console.log("Block "+bc.n+": "+bc.fl+" floors x "+bc.rPF+" rooms = "+(bc.fl*bc.rPF)+" rooms");
  }

  // ── WARDEN PROFILES ───────────────────────────────────────────────────────
  const wardenProfiles=[];
  for (const { user, def } of wardenUsers) {
    const hostel = def.ht==="boys"?boysHostel:girlsHostel;
    const block  = createdBlocks[def.blk];
    const w = await Warden.create({ user:user._id, employeeId:def.empId, designation:"Block Warden", department:"Hostel Management", assignedHostel:hostel._id, assignedBlock:block?._id, phone:"987654"+rn(3000,3999), officeLocation:"Block "+def.blk, joiningDate:new Date("2020-07-01"), isActive:true });
    if(block)  await Block.findByIdAndUpdate(block._id,{ warden:w._id });
    if(hostel) await Hostel.findByIdAndUpdate(hostel._id,{ warden:w._id });
    wardenProfiles.push(w);
  }

  // ── STUDENTS ──────────────────────────────────────────────────────────────
  const HS=["allocated","allocated","allocated","checked_in","checked_in","approved","pending","not_applied"];
  const allStudents=[];
  async function makeStudent(name, gender, pfx, idx) {
    const reg  = pfx+String(1000+idx).padStart(4,"0");
    const st   = rand(HS);
    const dept = rand(DEPTS);
    const email= name.toLowerCase().replace(/[^a-z]/g,".")+idx+"@bitsathy.ac.in";
    const u = await User.create({ name, email, password:"Student@2026", role:"student", isVerified:true, isActive:true, loginCount:rn(1,50), lastLoginAt:ago(rn(0,10)) });
    const s = await Student.create({
      user:u._id, registerNumber:reg, rollNumber:reg, department:dept, year:rn(1,4), semester:rn(1,8),
      section:rand(["A","B","C"]), cgpa:parseFloat((rn(60,95)/10).toFixed(2)), admissionYear:2021, gender,
      dateOfBirth:new Date("200"+rn(2,4)+"-0"+rn(1,9)+"-"+String(rn(10,28))),
      bloodGroup:rand(BG), phone:"9"+rn(100000000,999999999), parentPhone:"8"+rn(100000000,999999999),
      nativeState:rand(STATES), nativeCity:rand(["Erode","Coimbatore","Salem","Chennai","Trichy"]),
      homeAddress:rn(10,999)+", Main St, "+rand(["Erode","Salem","Coimbatore"]),
      pincode:String(rn(600001,642999)), distanceFromCollege:rn(50,800),
      emergencyContact:{ name:"Parent Name", relation:gender==="male"?"Father":"Mother", phone:"7"+rn(100000000,999999999) },
      parentDetails:{ fatherName:"Father of "+name.split(" ")[0], fatherOccupation:rand(["Farmer","Teacher","Business","Govt Employee","Doctor"]), annualIncome:rn(150000,600000) },
      bio:"Hi, I am "+name.split(" ")[0]+" from "+dept+".",
      languages:[rand(LANGS),"English"], hobbies:[rand(HOBBIES),rand(HOBBIES)],
      isHostelStudent:["allocated","checked_in","approved"].includes(st),
      hostelStatus:st, hostelJoinDate:["allocated","checked_in"].includes(st)?ago(rn(30,180)):undefined,
      rewardPoints:rn(0,500)
    });
    allStudents.push({ user:u, student:s, gender, status:st });
  }
  for (let i=0;i<MALES.length;i++)   await makeStudent(MALES[i],  "male",   "21CSE",i);
  for (let i=0;i<FEMALES.length;i++) await makeStudent(FEMALES[i],"female", "21ECE",i+20);
  console.log(allStudents.length+" students created. Password: Student@2026");

  // ── APPLICATIONS ──────────────────────────────────────────────────────────
  const hSt=allStudents.filter(s=>["allocated","checked_in","approved","pending"].includes(s.status));
  const appMap={allocated:"allocated",checked_in:"allocated",approved:"approved",pending:"pending"};
  const applications=[];
  for (const s of hSt) {
    const ph=s.gender==="male"?boysHostel:girlsHostel;
    const app=await Application.create({ student:s.student._id, user:s.user._id, academicYear:"2025-26", preferredHostel:ph._id, preferredRoomType:rand(["double","triple","four_sharing"]), preferredAC:false, preferredFloor:rn(1,3), priorityReasons:{ isFinalYear:s.student.year===4,hasMedical:false,hasDisability:false,isScholarship:false,distanceKm:s.student.distanceFromCollege }, priorityScore:rn(50,200), useAiMatching:true, status:appMap[s.status]||"pending", reviewedBy:["allocated","approved"].includes(s.status)?adminUser._id:undefined, reviewedAt:["allocated","approved"].includes(s.status)?ago(rn(10,60)):undefined, submittedAt:ago(rn(30,120)) });
    applications.push({ app, student:s });
  }
  console.log(applications.length+" applications");

  // ── ALLOCATIONS ───────────────────────────────────────────────────────────
  const toAlloc=allStudents.filter(s=>["allocated","checked_in"].includes(s.status));
  const bRooms=createdRooms.filter(r=>r.hostel.type==="boys");
  const gRooms=createdRooms.filter(r=>r.hostel.type==="girls");
  let bi=0,gi=0; const allocations=[];
  for (const s of toAlloc) {
    const pool=s.gender==="male"?bRooms:gRooms;
    let idx=s.gender==="male"?bi:gi;
    while(idx<pool.length){
      const {room,block,floor,hostel}=pool[idx];
      const fr=await Room.findById(room._id);
      if(fr.currentOccupancy<fr.capacity){
        const bed=String.fromCharCode(65+fr.currentOccupancy);
        const al=await Allocation.create({ student:s.student._id, user:s.user._id, hostel:hostel._id, block:block._id, floor:floor._id, room:fr._id, bedNumber:bed, academicYear:"2025-26", status:"active", allocationDate:ago(rn(20,90)), checkInDate:s.status==="checked_in"?ago(rn(10,60)):undefined, allocatedBy:adminUser._id });
        await Room.findByIdAndUpdate(fr._id,{ "$push":{ occupants:{ student:s.student._id, bedNumber:bed, allocatedAt:al.allocationDate } }, "$inc":{ currentOccupancy:1 } });
        const upd=await Room.findById(fr._id);
        await Room.findByIdAndUpdate(fr._id,{ status:upd.currentOccupancy>=upd.capacity?"fully_occupied":"partially_occupied" });
        await Student.findByIdAndUpdate(s.student._id,{ hostelStatus:s.status, isHostelStudent:true });
        allocations.push(al);
        if(s.gender==="male") bi=idx; else gi=idx;
        break;
      }
      idx++;
      if(s.gender==="male") bi=idx; else gi=idx;
    }
  }
  const bOcc=await Allocation.countDocuments({hostel:boysHostel._id,status:"active"});
  const gOcc=await Allocation.countDocuments({hostel:girlsHostel._id,status:"active"});
  await Hostel.findByIdAndUpdate(boysHostel._id,{currentOccupancy:bOcc});
  await Hostel.findByIdAndUpdate(girlsHostel._id,{currentOccupancy:gOcc});
  console.log(allocations.length+" room allocations");

  // ── COMPATIBILITY PROFILES ────────────────────────────────────────────────
  for (const s of allStudents) {
    await CompatibilityProfile.create({ student:s.student._id, sleepTime:rand(["before_9pm","9pm_11pm","11pm_1am","after_1am"]), wakeTime:rand(["before_5am","5am_7am","7am_9am","after_9am"]), studyHabit:rand(["early_morning","daytime","evening","night_owl","irregular"]), studyIntensity:rand(["very_intense","moderate","casual","minimal"]), cleanlinessLevel:rn(2,5), foodPreference:rand(["vegetarian","non_vegetarian","vegan","eggetarian"]), noiseTolerance:rn(1,5), personalityType:rand(["INTJ","INTP","ENTJ","ENTP","INFJ","INFP","ENFJ","ENFP","ISTJ","ISFJ"]), introvertExtrovert:rn(1,5), smoking:rand(["no","no","no","occasionally"]), drinking:rand(["no","no","no","occasionally"]), roomTemperature:rand(["cold","moderate","warm"]), lightsOffTime:rand(["by_10pm","by_11pm","by_midnight","after_midnight"]), musicPreference:rand(["none","headphones_only","soft_music_ok","any_music_ok"]), sportsInterest:Math.random()>0.4, gamingInterest:Math.random()>0.5, readingHabit:Math.random()>0.4, fitnessInterest:Math.random()>0.5, guestsInRoom:rand(["not_ok","occasionally_ok","always_ok"]), languages:[rand(LANGS),"English"], religiousPreference:rand(["not_important","not_important","moderately_important"]), isComplete:true, completedAt:ago(rn(5,60)) });
  }
  console.log(allStudents.length+" compatibility profiles");

  // ── MATCH RESULTS ─────────────────────────────────────────────────────────
  const males=allStudents.filter(s=>s.gender==="male");
  const females=allStudents.filter(s=>s.gender==="female");
  let cr=0;
  async function makeMatch(s1,s2) {
    const sc=rn(55,97);
    await CompatibilityResult.create({
      student1: s1.student._id,
      student2: s2.student._id,
      overallScore: sc,
      overallPercentage: sc,
      compatibilityLevel: sc >= 85 ? "excellent" : sc >= 70 ? "good" : sc >= 55 ? "fair" : "poor",
      dimensionScores: {
        sleepSchedule:  rn(60, 98),
        studyHabits:    rn(60, 98),
        cleanliness:    rn(60, 98),
        foodPreference: rn(60, 98),
        noiseTolerance: rn(60, 98),
        personality:    rn(60, 98),
        lifestyle:      rn(60, 98),
        interests:      rn(60, 98),
        social:         rn(60, 98),
      },
      matchReasons: ["Similar sleep schedule", "Compatible study habits", "Shared hobbies"].slice(0, rn(1, 3)),
      conflictReasons: sc < 70 ? ["Different wake up times"] : [],
      suggestions: ["Establish room study hours together"],
      calculatedAt: ago(rn(1,30))
    });
    cr++;
  }
  for(let i=0;i<Math.min(males.length-1,10);i++)   for(let j=i+1;j<Math.min(males.length,i+3);j++)   await makeMatch(males[i],males[j]);
  for(let i=0;i<Math.min(females.length-1,10);i++) for(let j=i+1;j<Math.min(females.length,i+3);j++) await makeMatch(females[i],females[j]);
  console.log(cr+" match results");

  // ── COMPLAINTS ────────────────────────────────────────────────────────────
  const cT={water:"Water supply issue",electricity:"Fan not working",internet:"WiFi very slow",furniture:"Bed is broken",cleanliness:"Corridor not cleaned",food:"Poor food quality",maintenance:"Door lock broken",noise:"Loud noise from neighbours"};
  const cS=["pending","assigned","in_progress","resolved","resolved","resolved"];
  const alloc_s=allStudents.filter(s=>["allocated","checked_in"].includes(s.status));
  let cc=0;
  for(let i=0;i<Math.min(alloc_s.length,25);i++){
    const s=alloc_s[i]; const tp=rand(Object.keys(cT)); const st=rand(cS);
    await Complaint.create({ student:s.student._id, user:s.user._id, type:tp, priority:rand(["low","medium","medium","high"]), title:cT[tp], description:"Issue in room needs attention.", status:st, assignedTo:st!=="pending"?wardenUsers[0].user._id:undefined, assignedAt:st!=="pending"?ago(rn(1,10)):undefined, resolvedAt:st==="resolved"?ago(rn(0,5)):undefined, resolutionNote:st==="resolved"?"Fixed by maintenance.":undefined, studentRating:st==="resolved"?rn(3,5):undefined });
    cc++;
  }
  console.log(cc+" complaints");

  // ── LEAVE REQUESTS ────────────────────────────────────────────────────────
  const lTypes=["home_visit","medical","emergency","educational","personal","other"];
  const lReas=["Family function","Medical treatment","Festival celebration","Personal emergency"];
  const lSt=["pending","approved","approved","rejected"];
  let lc=0;
  for(let i=0;i<Math.min(alloc_s.length,20);i++){
    const s=alloc_s[i]; const ls=rand(lSt);
    await LeaveRequest.create({
      student:s.student._id, user:s.user._id,
      leaveType: rand(lTypes),
      reason:rand(lReas), fromDate:ago(rn(-7,30)), toDate:ahead(rn(1,5)),
      destination:rand(["Home","Hospital","Relative Home","Wedding Venue"]),
      emergencyPhone:s.student.phone||"9999999999", parentConsent:true,
      status:ls, approvedBy:ls!=="pending"?wardenUsers[0].user._id:undefined,
      approvedAt:ls!=="pending"?ago(rn(0,5)):undefined,
      rejectionReason:ls==="rejected"?"Insufficient reason.":undefined
    });
    lc++;
  }
  console.log(lc+" leave requests");

  // ── VISITORS ──────────────────────────────────────────────────────────────
  const rels=["parent","sibling","relative","friend","guardian","other"];
  let vc=0;
  for(let i=0;i<Math.min(alloc_s.length,15);i++){
    const s=alloc_s[i]; const done=Math.random()>0.5;
    await Visitor.create({
      student:s.student._id, user:s.user._id,
      visitorName:rand(["Ravi","Suresh","Priya","Meena"])+" Family",
      visitorPhone:"9"+rn(100000000,999999999),
      relation:rand(rels),
      visitPurpose:rand(["Family visit","Document delivery","Medical emergency","Festival meet"]),
      visitDate:ago(rn(0,30)), entryTime:ago(rn(0,30)),
      exitTime:done?ago(0):undefined, status:done?"checked_out":"approved",
      approvedBy:wardenUsers[0].user._id, numberOfVisitors:rn(1,3)
    });
    vc++;
  }
  console.log(vc+" visitor records");

  // ── PAYMENTS ──────────────────────────────────────────────────────────────
  const months=["January","February","March","April","May","June","July","August"];
  let pc=0;
  for(const s of alloc_s){
    await Payment.create({ student:s.student._id, user:s.user._id, paymentType:"security_deposit", amount:5000, academicYear:"2025-26", status:"paid", paidAt:ago(rn(60,180)), gateway:"offline", description:"Security deposit" });
    for(let m=0;m<rn(2,4);m++){
      const paid=Math.random()>0.25;
      await Payment.create({ student:s.student._id, user:s.user._id, paymentType:"hostel_fee", amount:rn(4000,5000), academicYear:"2025-26", month:months[m], status:paid?"paid":"pending", paidAt:paid?ago(rn(1,90)):undefined, dueDate:ahead(paid?-1:rn(1,30)), gateway:"offline", description:"Hostel fee for "+months[m]+" 2025" });
    }
    await Payment.create({ student:s.student._id, user:s.user._id, paymentType:"mess_fee", amount:2500, academicYear:"2025-26", month:months[rn(0,3)], status:Math.random()>0.3?"paid":"pending", paidAt:ago(rn(1,60)), gateway:"offline" });
    pc+=3;
  }
  console.log("~"+pc+" payment records");

  // ── NOTICES ───────────────────────────────────────────────────────────────
  const noticeRows=[
    ["Hostel Fee Payment Deadline Sept 2025","fees","urgent",true,"All students must pay September 2025 hostel fee before September 10. Late fine Rs 500 per day."],
    ["Annual Hostel Day Celebrations 2025","events","normal",false,"Hostel Day on Sept 25 2025. Cultural events, sports, talent shows."],
    ["Hostel Gate Timing Update","rules","high",true,"From Sept 1 2025: Boys gate closes 10 PM. Girls gate closes 9 PM."],
    ["Water Supply Interruption 28 August","maintenance","high",false,"Water supply off Aug 28 from 8 AM to 2 PM due to pipeline maintenance."],
    ["WiFi Password Update","general","normal",false,"WiFi password updated. Collect from hostel office with ID card."],
    ["Hostel Inspection Cleanliness Drive","general","normal",false,"Cleanliness inspection on Sept 5. Top rooms get special recognition."],
    ["Emergency Contact Numbers Updated","urgent","urgent",true,"Ambulance: 108, Police: 100, Boys Warden: 9876543210, Girls Warden: 9876543212"],
    ["New Mess Menu September 2025","general","low",false,"Revised mess menu for September available. Submit feedback at mess counter."],
  ];
  for(const [title,cat,pri,pin,content] of noticeRows)
    await Notice.create({ author:adminUser._id, title, content, category:cat, priority:pri, isPinned:pin, targetAudience:"all", views:rn(20,300), isActive:true });
  console.log(noticeRows.length+" notices");

  // ── NOTIFICATIONS ─────────────────────────────────────────────────────────
  const notifTypes=["room_allocated","fee_due","leave_approved","complaint_resolved","notice_posted","visitor_approved","system"];
  const nM=[["Room allocated","You have been allocated a room.","room_allocated"],["Fee reminder","Hostel fee for August is due.","fee_due"],["Leave approved","Your leave request has been approved.","leave_approved"],["Complaint resolved","Your complaint has been resolved.","complaint_resolved"],["New notice","Annual Hostel Day announced.","notice_posted"],["Visitor approved","Your visitor pass has been approved.","visitor_approved"],["Gate timing","Hostel gate timings updated.","system"]];
  let nc=0;
  for(const s of allStudents.slice(0,30)){
    for(let n=0;n<rn(2,5);n++){
      const [title,message,type]=rand(nM);
      await Notification.create({ recipient:s.user._id, title, message, type, isRead:Math.random()>0.4, createdAt:ago(rn(0,30)) });
      nc++;
    }
  }
  for(let i=0;i<5;i++){ await Notification.create({ recipient:adminUser._id, title:"Action required", message:"Pending items need review.", type:"system", isRead:false }); nc++; }
  console.log(nc+" notifications");

  // ── EVENTS ────────────────────────────────────────────────────────────────
  const evts=[["Annual Hostel Day 2025","cultural",ahead(28),"Main Ground",500],["Cricket Match","sports",ahead(15),"Sports Ground",200],["Talent Show","cultural",ahead(20),"Auditorium",300],["Warden Meet","meeting",ahead(10),"Conference Hall",100],["Yoga Workshop","workshop",ahead(5),"Open Ground",150],["Tech Quiz","cultural",ahead(35),"Seminar Hall",120],["Freshers Party","cultural",ago(10),"Main Hall",400],["Badminton Tournament","sports",ago(5),"Sports Court",64]];
  for(const [title,type,date,location,cap] of evts)
    await Event.create({ title, description:"Join us for "+title, type, eventDate:date, location, organizer:adminUser._id, maxCapacity:cap, isPublished:true, hostel:boysHostel._id, registrations:allStudents.slice(0,rn(5,20)).map(s=>({ student:s.student._id, registeredAt:ago(rn(1,14)) })) });
  console.log(evts.length+" events");

  // ── MARKETPLACE ───────────────────────────────────────────────────────────
  const mI=[["Data Structures Book",150,"books","good"],["Calculator",350,"electronics","like_new"],["Study Table",800,"furniture","good"],["Cricket Bat",400,"sports","fair"],["Drawing Kit",120,"stationery","good"],["USB Hub",250,"electronics","like_new"],["Cycle",1500,"transport","good"],["Headphones",600,"electronics","good"],["Alarm Clock",180,"electronics","good"],["JEE Study Material",200,"books","fair"]];
  for(let i=0;i<mI.length;i++){
    const [title,price,cat,cond]=mI[i]; const seller=allStudents[i%allStudents.length];
    await MarketplaceItem.create({ seller:seller.student._id, title, description:"Selling "+title+". Negotiable.", price, category:cat, condition:cond, status:Math.random()>0.2?"available":"sold", isNegotiable:true, views:rn(5,50) });
  }
  console.log(mI.length+" marketplace listings");

  // ── LOST & FOUND ──────────────────────────────────────────────────────────
  const lfR=[["College ID Card","lost","id_card","Mess Hall"],["Nokia Charger","found","electronics","Common Room"],["Denim Jacket","lost","clothing","Sports Ground"],["Room Keys","found","keys","Block A Corridor"],["Leather Wallet","lost","wallet","Hostel Entrance"],["Textbooks","found","books","Study Hall"],["Earphones","lost","electronics","Laundry Room"],["Water Bottle","found","other","Mess Hall"]];
  for(let i=0;i<lfR.length;i++){
    const [item,type,cat,loc]=lfR[i]; const rep=allStudents[i%allStudents.length];
    await LostFoundItem.create({ reporter:rep.student._id, type, itemName:item, description:(type==="lost"?"Lost":"Found")+": "+item+" near "+loc, category:cat, location:loc, dateLostFound:ago(rn(1,30)), status:Math.random()>0.6?"claimed":"open" });
  }
  console.log(lfR.length+" lost & found items");

  // ── LAUNDRY ───────────────────────────────────────────────────────────────
  const slots=["6:00 AM","7:00 AM","8:00 AM","9:00 AM","4:00 PM","5:00 PM","6:00 PM"];
  let la=0;
  for(const s of alloc_s.slice(0,20)){
    try{
      const done=Math.random()>0.3;
      await LaundryBooking.create({ student:s.student._id, bookingDate:ahead(rn(0,7)), timeSlot:rand(slots), machineNumber:rn(1,6), amount:30, status:done?"completed":"booked", completedAt:done?ago(0):undefined });
      la++;
    }catch(e){}
  }
  console.log(la+" laundry bookings");

  // ── INVENTORY ─────────────────────────────────────────────────────────────
  const invIt=[["Ceiling Fan","electronics"],["Study Table","furniture"],["Wooden Chair","furniture"],["Steel Wardrobe","furniture"],["Iron Bed","furniture"],["Tube Light","electrical"],["Power Socket","electrical"]];
  let inv=0;
  for(const r of createdRooms.slice(0,10)){
    for(const [name,cat] of invIt.slice(0,rn(3,5))){
      await Inventory.create({ room:r.room._id, block:r.block._id, itemName:name, itemCode:"INV-"+String(inv+1).padStart(4,"0"), category:cat, quantity:1, condition:rand(["good","good","fair"]), lastInspected:ago(rn(10,60)), purchaseDate:ago(rn(200,1000)), purchasePrice:rn(500,5000) });
      inv++;
    }
  }
  console.log(inv+" inventory items");

  // ── SURVEY ────────────────────────────────────────────────────────────────
  await Survey.create({ title:"Hostel Satisfaction Survey 2025", description:"Rate facilities.", createdBy:adminUser._id, isAnonymous:false, isActive:true, startDate:ago(30), endDate:ahead(30), targetAudience:"all", questions:[{ question:"Rate overall cleanliness?",type:"rating",isRequired:true },{ question:"Mess food quality?",type:"rating",isRequired:true },{ question:"WiFi connectivity?",type:"rating",isRequired:true },{ question:"Warden responsiveness?",type:"rating",isRequired:true },{ question:"Recommend BIT Hostel?",type:"yes_no",isRequired:true },{ question:"Any suggestions?",type:"text",isRequired:false }], responses:allStudents.slice(0,15).map(s=>({ respondent:s.user._id, answers:[{questionIndex:0,answer:rn(3,5)},{questionIndex:1,answer:rn(2,5)},{questionIndex:2,answer:rn(3,5)},{questionIndex:3,answer:rn(3,5)},{questionIndex:4,answer:Math.random()>0.2?"yes":"no"},{questionIndex:5,answer:rand(["More variety in mess","Improve WiFi","Better water supply"])}], submittedAt:ago(rn(1,25)) })) });
  console.log("1 survey with 15 responses");

  // ── CHAT ──────────────────────────────────────────────────────────────────
  const generalRoom = await ChatRoom.create({
    type:"group", name:"BIT Hostel General", description:"General announcements",
    participants:[
      { user:adminUser._id, role:"admin" },
      ...wardenUsers.map(w=>({ user:w.user._id, role:"admin" })),
      ...allStudents.slice(0,15).map(s=>({ user:s.user._id, role:"member" }))
    ],
    isActive:true
  });
  await Message.create({ chatRoom:generalRoom._id, sender:adminUser._id, type:"text", content:"Welcome to BIT Hostel portal!" });
  await Message.create({ chatRoom:generalRoom._id, sender:allStudents[0].user._id, type:"text", content:"Anyone for cricket tomorrow morning?" });
  await Message.create({ chatRoom:generalRoom._id, sender:wardenUsers[0].user._id, type:"text", content:"Gate timings updated. Check notice board." });

  const blockARoom = await ChatRoom.create({
    type:"group", name:"Boys Block A", description:"Block A residents",
    participants:[
      { user:wardenUsers[0].user._id, role:"admin" },
      ...allStudents.filter(s=>s.gender==="male").slice(0,10).map(s=>({ user:s.user._id, role:"member" }))
    ],
    isActive:true
  });
  await Message.create({ chatRoom:blockARoom._id, sender:wardenUsers[0].user._id, type:"text", content:"Good morning Block A!" });
  console.log("2 chat rooms with messages");

  // ── AUDIT LOGS ────────────────────────────────────────────────────────────
  const aL=[["LOGIN","User","success"],["CREATE_APPLICATION","Application","success"],["APPROVE_APPLICATION","Application","success"],["ALLOCATE_ROOM","Room","success"],["RESOLVE_COMPLAINT","Complaint","success"],["APPROVE_LEAVE","LeaveRequest","success"],["PAYMENT_RECEIVED","Payment","success"],["EXPORT_REPORT","Report","success"],["FAILED_LOGIN","User","failure"],["UPDATE_SETTINGS","Settings","success"]];
  for(const [action,resource,status] of aL)
    await AuditLog.create({ actor:adminUser._id, actorRole:"admin", action, resource, details:{ ts:new Date() }, ipAddress:"192.168.1.1", userAgent:"BIT Portal", status, createdAt:ago(rn(0,30)) });
  console.log(aL.length+" audit logs");

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  const cols={
    users: await User.countDocuments(),
    students: await Student.countDocuments(),
    wardens: await Warden.countDocuments(),
    admins: await Admin.countDocuments(),
    hostels: await Hostel.countDocuments(),
    blocks: await Block.countDocuments(),
    rooms: await Room.countDocuments(),
    applications: await Application.countDocuments(),
    allocations: await Allocation.countDocuments(),
    compat_profiles: await CompatibilityProfile.countDocuments(),
    compat_results: await CompatibilityResult.countDocuments(),
    complaints: await Complaint.countDocuments(),
    leave_requests: await LeaveRequest.countDocuments(),
    visitors: await Visitor.countDocuments(),
    payments: await Payment.countDocuments(),
    notifications: await Notification.countDocuments(),
    notices: await Notice.countDocuments(),
    events: await Event.countDocuments(),
    marketplace: await MarketplaceItem.countDocuments(),
    lost_found: await LostFoundItem.countDocuments(),
    laundry: await LaundryBooking.countDocuments(),
    inventory: await Inventory.countDocuments(),
    surveys: await Survey.countDocuments(),
    chat_rooms: await ChatRoom.countDocuments(),
    chat_messages: await Message.countDocuments(),
    audit_logs: await AuditLog.countDocuments(),
  };
  const total=Object.values(cols).reduce((a,b)=>a+b,0);
  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║   🎉 DATABASE SEED COMPLETE!                 ║");
  console.log("╠══════════════════════════════════════════════╣");
  for(const [k,v] of Object.entries(cols))
    console.log("║  "+k.padEnd(22)+" : "+String(v).padStart(4)+" documents  ║");
  console.log("╠══════════════════════════════════════════════╣");
  console.log("║  TOTAL: "+String(total)+" documents                     ║");
  console.log("╠══════════════════════════════════════════════╣");
  console.log("║  admin@bitsathy.ac.in       Admin@2026       ║");
  console.log("║  warden.boysa@bitsathy.ac.in Warden@2026    ║");
  console.log("║  arjun.kumar0@bitsathy.ac.in Student@2026   ║");
  console.log("╚══════════════════════════════════════════════╝\n");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err=>{
  console.error("SEED FAILED:", err.message);
  if(err.stack) console.error(err.stack);
  mongoose.disconnect().finally(()=>process.exit(1));
});
