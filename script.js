/**
 * NORSU Campus Navigator — script.js
 * Maps rebuilt from reference images:
 *   Campus 1: L-shaped layout, Gates 1-4
 *   Campus 2: Rectangular layout, Main Gate
 */
 
/* =========================================
   STATE
   ========================================= */
let currentScreen = 'intro-screen';
let isDayMode = true;
let currentCampus = null;
let zoomLevel = { 1: 1, 2: 1 };
let panOffset = { 1: {x:0,y:0}, 2: {x:0,y:0} };
let isDragging = false;
let dragStart = {x:0,y:0};
let touchStartDist = 0;
let voiceSteps = [];
let voiceIndex = 0;
let voiceInterval = null;
let speechSynth = window.speechSynthesis;
let currentPopupBuilding = { 1: null, 2: null };
 
/* =========================================
   CAMPUS 1 DATA
   SVG ViewBox: 0 0 960 900
   L-shaped campus from reference image 1:
   ─ Large top-left block (full width, ~rows 1-3)
   ─ Bottom-right cluster only (below row 3)
   Gates: Gate4 (top-left), Gate1 (top-center),
          Gate2 (right-mid), Gate3 (bottom-right)
   ========================================= */
const c1 = {
  viewBox: '0 0 960 900',
 
  /* Campus outer boundary (L-shape) */
  boundaryPath: 'M30,30 L930,30 L930,430 L600,430 L600,880 L30,880 Z',
 
  pathways: [
    /* Horizontal: top main road */
    { x:30,  y:30,  w:900, h:28, type:'main' },
    /* Vertical: left edge spine */
    { x:30,  y:30,  w:24,  h:850, type:'main' },
    /* Vertical: Gate 1 drop (center) */
    { x:482, y:30,  w:24,  h:400, type:'main' },
    /* Horizontal: mid-west block row */
    { x:30,  y:248, w:506, h:22,  type:'main' },
    /* Horizontal: bottom of west L-block */
    { x:30,  y:400, w:506, h:24,  type:'main' },
    /* Vertical: right edge of west block */
    { x:900, y:30,  w:24,  h:400, type:'main' },
    /* Horizontal: top-right cross (CAS level) */
    { x:506, y:198, w:418, h:22,  type:'main' },
    /* Lower-right cluster roads */
    { x:600, y:430, w:324, h:24,  type:'main' },
    /* Lower vertical main */
    { x:718, y:430, w:22,  h:450, type:'main' },
    /* Lower vertical east */
    { x:836, y:430, w:22,  h:195, type:'main' },
    /* Lower horizontals */
    { x:600, y:524, w:324, h:20,  type:'main' },
    { x:600, y:608, w:324, h:20,  type:'main' },
    { x:600, y:692, w:324, h:20,  type:'main' },
    { x:600, y:760, w:324, h:20,  type:'main' },
    { x:600, y:840, w:248, h:20,  type:'main' },
  ],
 
  lawns: [
    { x:58,  y:62,  w:155, h:178 },   /* left of CBA col */
    { x:224, y:62,  w:250, h:178 },   /* between Gate4-Gate1 */
    { x:508, y:62,  w:384, h:128 },   /* top-right lawn */
    { x:58,  y:274, w:418, h:118 },   /* mid-west lawn */
  ],
 
  openCourts: [
    { x:598, y:62,  w:195, h:128, label:'OPEN COURT' },
    { x:740, y:452, w:80,  h:64,  label:'CIT\nOpen Ct.' },
  ],
 
  trees: [
    {cx:84,cy:90},{cx:108,cy:118},{cx:140,cy:88},
    {cx:350,cy:88},{cx:378,cy:110},
    {cx:868,cy:88},{cx:892,cy:112},
    {cx:84,cy:288},{cx:112,cy:312},{cx:350,cy:282},{cx:390,cy:302},
    {cx:510,cy:110},{cx:545,cy:128},{cx:578,cy:105},
    {cx:640,cy:468},{cx:672,cy:490},{cx:780,cy:468},
  ],
 
  buildings: [
    /* ── LEFT COLUMN ── */
    {
      id:'ched_nir',
      x:54, y:62, w:158, h:178,
      label:'Commission on Elections & CHED-NIR Building',
      shortLabel:'CHED-NIR',
      desc:'Houses the Commission on Elections satellite office and CHED-NIR (Commission on Higher Education – National Institutional Research) regional office.',
      navPoint:{x:133, y:151}
    },
    {
      id:'cba_cthm_west',
      x:54, y:274, w:158, h:118,
      label:'CBA & CTHM Building (West)',
      shortLabel:'CBA &\nCTHM',
      desc:'West wing of the College of Business Administration and College of Tourism and Hospitality Management.',
      navPoint:{x:133, y:333}
    },
    {
      id:'cnpahs',
      x:54, y:424, w:172, h:88,
      label:'CNPAHS Building',
      shortLabel:'CNPAHS',
      desc:'College of Nursing, Public Administration, and Health Sciences with classrooms and nursing skills laboratory.',
      navPoint:{x:140, y:468}
    },
 
    /* ── TOP CENTER ROW ── */
    {
      id:'cba_cthm_main',
      x:222, y:62, w:252, h:178,
      label:'CBA & CTHM Building',
      shortLabel:'CBA &\nCTHM',
      desc:'Main building of the College of Business Administration and College of Tourism and Hospitality Management.',
      navPoint:{x:348, y:151}
    },
    {
      id:'norsu_complex',
      x:222, y:274, w:252, h:118,
      label:'NORSU Cultural & Sports Complex',
      shortLabel:'CULTURAL &\nSPORTS COMPLEX',
      desc:'The NORSU Cultural and Sports Complex – venue for major campus events, sports tournaments, and cultural performances.',
      navPoint:{x:348, y:333}
    },
    {
      id:'pe_building',
      x:240, y:424, w:172, h:88,
      label:'P.E. Building',
      shortLabel:'P.E.',
      desc:'Physical Education Building with courts and facilities for sports and physical fitness programs.',
      navPoint:{x:326, y:468}
    },
 
    /* ── GATE 1 COLUMN ── */
    {
      id:'infotech',
      x:490, y:62, w:100, h:128,
      label:'Information Technology Building',
      shortLabel:'INFO.\nTECH.',
      desc:'Houses the College of Information Technology and Computer Science programs with modern computer labs.',
      navPoint:{x:540, y:126}
    },
    {
      id:'cr3',
      x:490, y:220, w:100, h:172,
      label:'CR 3',
      shortLabel:'CR 3',
      desc:'Classroom Building 3 – general-purpose academic classrooms for lectures and recitations.',
      navPoint:{x:540, y:306}
    },
    {
      id:'automotive',
      x:424, y:424, w:172, h:88,
      label:'Automotive Building',
      shortLabel:'AUTOMOTIVE',
      desc:'Automotive Technology Building with workshop bays, vehicle lifts, and hands-on training areas.',
      navPoint:{x:510, y:468}
    },
 
    /* ── TOP RIGHT: CAS block ── */
    {
      id:'cas',
      x:602, y:62, w:290, h:128,
      label:'CAS Building',
      shortLabel:'CAS',
      desc:'College of Arts and Sciences – offers natural sciences, social sciences, humanities, and mathematics programs.',
      navPoint:{x:747, y:126}
    },
    {
      id:'cr2',
      x:602, y:220, w:125, h:172,
      label:'CR 2',
      shortLabel:'CR 2',
      desc:'Classroom Building 2 – general-purpose academic classrooms.',
      navPoint:{x:664, y:306}
    },
    {
      id:'multi_tissue',
      x:754, y:220, w:100, h:80,
      label:'Multi-Tissue Culture Laboratory Building',
      shortLabel:'MULTI-TISSUE\nLAB',
      desc:'Specialized laboratory for tissue culture research and advanced biology experiments.',
      navPoint:{x:804, y:260}
    },
    {
      id:'mx_building',
      x:754, y:308, w:100, h:52,
      label:'MX Building',
      shortLabel:'MX',
      desc:'MX Building – multi-purpose academic facility for various departmental uses.',
      navPoint:{x:804, y:334}
    },
    {
      id:'mechanical_bldg',
      x:754, y:368, w:100, h:54,
      label:'Mechanical Building',
      shortLabel:'MECHANICAL',
      desc:'Mechanical Engineering laboratory and workshop building for hands-on engineering training.',
      navPoint:{x:804, y:395}
    },
 
    /* ── FAR RIGHT: Admin ── */
    {
      id:'admin',
      x:864, y:62, w:62, h:360,
      label:'Administration Building',
      shortLabel:'ADMIN',
      desc:'Main administrative hub housing the Office of the President, VP offices, and central university administration.',
      navPoint:{x:895, y:242}
    },
 
    /* ── BOTTOM OF WEST BLOCK ── */
    {
      id:'cr1',
      x:602, y:424, w:210, h:88,
      label:'CR 1',
      shortLabel:'CR 1',
      desc:'Classroom Building 1 – general-purpose academic classrooms.',
      navPoint:{x:707, y:468}
    },
    {
      id:'graduate_school',
      x:820, y:424, w:104, h:68,
      label:'Graduate School Building',
      shortLabel:'GRADUATE\nSCHOOL',
      desc:'Houses postgraduate programs including Master\'s and Doctoral degrees across various fields.',
      navPoint:{x:872, y:458}
    },
    {
      id:'st_building',
      x:820, y:500, w:104, h:108,
      label:'ST Building',
      shortLabel:'ST',
      desc:'Science and Technology Building with specialized science labs and technology classrooms.',
      navPoint:{x:872, y:554}
    },
 
    /* ── LOWER RIGHT CLUSTER ── */
    {
      id:'canteen',
      x:600, y:452, w:210, h:64,
      label:'Canteen',
      shortLabel:'CANTEEN',
      desc:'Main university canteen offering affordable meals and snacks for students, faculty, and staff.',
      navPoint:{x:705, y:484}
    },
    {
      id:'supply_office',
      x:600, y:532, w:110, h:68,
      label:'Supply Office',
      shortLabel:'SUPPLY\nOFFICE',
      desc:'University Supply Office managing procurement, inventory, and distribution of university supplies.',
      navPoint:{x:655, y:566}
    },
    {
      id:'cit_bldg',
      x:820, y:532, w:104, h:68,
      label:'CIT Building',
      shortLabel:'CIT',
      desc:'College of Industrial Technology Building with workshops and laboratories for technical programs.',
      navPoint:{x:872, y:566}
    },
    {
      id:'student_lounge',
      x:718, y:532, w:94, h:68,
      label:'Student Lounge',
      shortLabel:'STUDENT\nLOUNGE',
      desc:'A relaxation and study space for students with tables, seats, and basic amenities.',
      navPoint:{x:765, y:566}
    },
    {
      id:'sao_building',
      x:600, y:616, w:110, h:68,
      label:'SAO Building',
      shortLabel:'SAO',
      desc:'Student Affairs Office – handles student organizations, scholarships, activities, and welfare concerns.',
      navPoint:{x:655, y:650}
    },
    {
      id:'care_center',
      x:600, y:700, w:110, h:52,
      label:'Care Center',
      shortLabel:'CARE\nCENTER',
      desc:'University health and wellness center providing basic medical services and counseling support.',
      navPoint:{x:655, y:726}
    },
    {
      id:'cted_lounge',
      x:718, y:616, w:202, h:52,
      label:'CTED Student Lounge',
      shortLabel:'CTED\nSTUDENT LOUNGE',
      desc:'Student lounge designated for College of Teacher Education and Development (CTED) students.',
      navPoint:{x:819, y:642}
    },
    {
      id:'cted_building',
      x:600, y:768, w:155, h:88,
      label:'CTED Building',
      shortLabel:'CTED',
      desc:'College of Teacher Education and Development – prepares future educators through pre-service teaching programs.',
      navPoint:{x:677, y:812}
    },
    {
      id:'law_building',
      x:790, y:752, w:75,  h:105,
      label:'Law Building',
      shortLabel:'LAW',
      desc:'College of Law offering the Juris Doctor (JD) program to prepare students for the bar examination.',
      navPoint:{x:827, y:804},
      rotate: -18
    },
  ],
 
  gates: [
    { id:'gate4', x:196, y:14, w:80,  h:26, label:'GATE 4', fullLabel:'Gate 4', navPoint:{x:236, y:30} },
    { id:'gate1', x:472, y:14, w:80,  h:26, label:'GATE 1', fullLabel:'Gate 1', navPoint:{x:512, y:30} },
    { id:'gate2', x:924, y:205,w:26,  h:56, label:'GATE 2', fullLabel:'Gate 2', navPoint:{x:924, y:233} },
    { id:'gate3', x:770, y:878,w:80,  h:26, label:'GATE 3', fullLabel:'Gate 3', navPoint:{x:810, y:878} },
  ],
 
  waypoints: {
    /* ── GATE ENTRIES ── */
    'g4_entry':       {x:236, y:58,  conn:['top_w','top_c1']},
    'g1_entry':       {x:512, y:58,  conn:['top_c1','top_c2','g1_drop']},
    'g2_entry':       {x:924, y:233, conn:['east_n','east_mid']},
    'g3_entry':       {x:810, y:878, conn:['lower_s4']},
 
    /* ── TOP HORIZONTAL ── */
    'top_w':          {x:54,  y:58,  conn:['g4_entry','left_n']},
    'top_c1':         {x:348, y:58,  conn:['g4_entry','g1_entry','mid_west_nw']},
    'top_c2':         {x:660, y:58,  conn:['g1_entry','top_e','east_top']},
    'top_e':          {x:868, y:58,  conn:['top_c2','east_top']},
 
    /* ── EAST VERTICAL ── */
    'east_top':       {x:912, y:58,  conn:['top_e','east_n']},
    'east_n':         {x:912, y:200, conn:['east_top','g2_entry','east_mid','cas_road']},
    'east_mid':       {x:912, y:392, conn:['east_n','g2_entry']},
    'cas_road':       {x:748, y:200, conn:['east_n','g1_drop','wp_cas','wp_multi']},
 
    /* ── GATE1 DROP ── */
    'g1_drop':        {x:506, y:130, conn:['g1_entry','g1_drop_s','cas_road']},
    'g1_drop_s':      {x:506, y:332, conn:['g1_drop','bot_cross_e','wp_cr3']},
 
    /* ── LEFT SPINE ── */
    'left_n':         {x:54,  y:130, conn:['top_w','left_mid']},
    'left_mid':       {x:54,  y:260, conn:['left_n','left_s','mid_west_w']},
    'left_s':         {x:54,  y:392, conn:['left_mid','left_bot']},
    'left_bot':       {x:54,  y:454, conn:['left_s','bot_cross_w']},
 
    /* ── MID-WEST HORIZONTALS ── */
    'mid_west_w':     {x:54,  y:260, conn:['left_mid','mid_west_nw']},
    'mid_west_nw':    {x:348, y:260, conn:['mid_west_w','g1_drop_s','top_c1','wp_cba_main','wp_complex']},
    'bot_cross_w':    {x:54,  y:424, conn:['left_bot','bot_cross_c']},
    'bot_cross_c':    {x:340, y:424, conn:['bot_cross_w','bot_cross_e','wp_pe','wp_cnpahs']},
    'bot_cross_e':    {x:506, y:424, conn:['bot_cross_c','lower_entry','g1_drop_s']},
 
    /* ── LOWER CLUSTER ENTRY ── */
    'lower_entry':    {x:612, y:424, conn:['bot_cross_e','lower_v1','lower_n']},
 
    /* ── LOWER VERTICAL ── */
    'lower_v1':       {x:730, y:454, conn:['lower_entry','lower_v2','lower_n']},
    'lower_v2':       {x:730, y:536, conn:['lower_v1','lower_v3','lower_h1']},
    'lower_v3':       {x:730, y:620, conn:['lower_v2','lower_v4','lower_h2']},
    'lower_v4':       {x:730, y:704, conn:['lower_v3','lower_v5','lower_h3']},
    'lower_v5':       {x:730, y:772, conn:['lower_v4','lower_s4']},
    'lower_s4':       {x:730, y:860, conn:['lower_v5','g3_entry','wp_cted','wp_law']},
 
    /* ── LOWER HORIZONTALS ── */
    'lower_n':        {x:612, y:454, conn:['lower_entry','lower_v1','wp_canteen','wp_cr1']},
    'lower_h1':       {x:612, y:536, conn:['lower_v2','wp_supply','wp_cit_bldg','wp_stu_lounge']},
    'lower_h2':       {x:612, y:620, conn:['lower_v3','wp_sao','wp_cted_lounge']},
    'lower_h3':       {x:612, y:704, conn:['lower_v4','wp_care_center']},
 
    /* ── EAST LOWER (Graduate/ST) ── */
    'east_low_n':     {x:844, y:424, conn:['lower_entry','east_low_s','wp_grad','wp_st']},
    'east_low_s':     {x:844, y:612, conn:['east_low_n','lower_h1']},
 
    /* ── BUILDING ACCESS WAYPOINTS ── */
    'wp_ched':        {x:133, y:151, conn:['left_n','mid_west_w']},
    'wp_cba_west':    {x:133, y:333, conn:['left_mid','bot_cross_w']},
    'wp_cnpahs':      {x:140, y:468, conn:['bot_cross_w','bot_cross_c']},
    'wp_cba_main':    {x:348, y:151, conn:['top_c1','mid_west_nw']},
    'wp_complex':     {x:348, y:333, conn:['mid_west_nw','bot_cross_c']},
    'wp_pe':          {x:326, y:468, conn:['bot_cross_c','bot_cross_w']},
    'wp_infotech':    {x:540, y:126, conn:['g1_entry','g1_drop']},
    'wp_cr3':         {x:540, y:306, conn:['g1_drop_s','g1_drop']},
    'wp_automotive':  {x:510, y:468, conn:['bot_cross_e','lower_entry']},
    'wp_cas':         {x:747, y:126, conn:['top_c2','cas_road']},
    'wp_cr2':         {x:664, y:306, conn:['cas_road','g1_drop_s']},
    'wp_multi':       {x:804, y:260, conn:['cas_road','east_n']},
    'wp_mx':          {x:804, y:334, conn:['cas_road','east_mid']},
    'wp_mech':        {x:804, y:395, conn:['east_mid','cas_road']},
    'wp_admin':       {x:895, y:242, conn:['east_n','g2_entry']},
    'wp_cr1':         {x:707, y:468, conn:['lower_n','lower_v1']},
    'wp_canteen':     {x:705, y:484, conn:['lower_n','lower_v1']},
    'wp_grad':        {x:872, y:458, conn:['east_low_n','lower_entry']},
    'wp_st':          {x:872, y:554, conn:['east_low_n','east_low_s']},
    'wp_supply':      {x:655, y:566, conn:['lower_h1','lower_v2']},
    'wp_cit_bldg':    {x:872, y:566, conn:['lower_h1','east_low_s']},
    'wp_stu_lounge':  {x:765, y:566, conn:['lower_h1','lower_v2']},
    'wp_sao':         {x:655, y:650, conn:['lower_h2','lower_v3']},
    'wp_cted_lounge': {x:819, y:642, conn:['lower_h2','lower_v3']},
    'wp_care_center': {x:655, y:726, conn:['lower_h3','lower_v4']},
    'wp_cted':        {x:677, y:812, conn:['lower_s4','lower_v5']},
    'wp_law':         {x:827, y:804, conn:['lower_s4','lower_v5']},
  },
 
  gateWaypoints: {
    'gate4': 'g4_entry',
    'gate1': 'g1_entry',
    'gate2': 'g2_entry',
    'gate3': 'g3_entry',
  },
 
  buildingWaypoints: {
    'ched_nir':       'wp_ched',
    'cba_cthm_west':  'wp_cba_west',
    'cnpahs':         'wp_cnpahs',
    'cba_cthm_main':  'wp_cba_main',
    'norsu_complex':  'wp_complex',
    'pe_building':    'wp_pe',
    'infotech':       'wp_infotech',
    'cr3':            'wp_cr3',
    'automotive':     'wp_automotive',
    'cas':            'wp_cas',
    'cr2':            'wp_cr2',
    'multi_tissue':   'wp_multi',
    'mx_building':    'wp_mx',
    'mechanical_bldg':'wp_mech',
    'admin':          'wp_admin',
    'cr1':            'wp_cr1',
    'canteen':        'wp_canteen',
    'graduate_school':'wp_grad',
    'st_building':    'wp_st',
    'supply_office':  'wp_supply',
    'cit_bldg':       'wp_cit_bldg',
    'student_lounge': 'wp_stu_lounge',
    'sao_building':   'wp_sao',
    'cted_lounge':    'wp_cted_lounge',
    'care_center':    'wp_care_center',
    'cted_building':  'wp_cted',
    'law_building':   'wp_law',
  }
};
 
/* =========================================
   CAMPUS 2 DATA
   SVG ViewBox: 0 0 960 900
   Rectangular campus from reference image 2:
   ─ Left column: CCJE(N), CCJE(S), Mech.Eng, CEA, Guard House
   ─ Top row: Canteen, CIT Building, Old Maritime Building
   ─ Center: CCJE/PE/Aviation (with parking ring)
   ─ Center-lower: Aviation Working Area, Stage, Open Field
   ─ Right: STS Building
   ─ Main Gate at bottom-center
   ========================================= */
const c2 = {
  viewBox: '0 0 960 900',
 
  boundaryPath: 'M30,30 L930,30 L930,870 L30,870 Z',
 
  pathways: [
    /* Horizontal */
    { x:30,  y:30,  w:900, h:25, type:'main' },
    { x:30,  y:835, w:900, h:25, type:'main' },
    /* Left vertical road */
    { x:30,  y:30,  w:25,  h:840, type:'main' },
    /* Right vertical road */
    { x:905, y:30,  w:25,  h:840, type:'main' },
    /* Inner-left lane (right of left buildings) */
    { x:362, y:30,  w:22,  h:810, type:'main' },
    /* Inner-right lane (left of right buildings) */
    { x:838, y:30,  w:22,  h:640, type:'main' },
    /* Horizontal: below top row buildings */
    { x:55,  y:205, w:875, h:22,  type:'main' },
    /* Central horizontal at mid */
    { x:362, y:472, w:498, h:22,  type:'main' },
    /* Central horizontal lower */
    { x:362, y:665, w:498, h:22,  type:'main' },
    /* Central horizontal bottom */
    { x:362, y:755, w:498, h:22,  type:'main' },
    /* Gate path */
    { x:440, y:755, w:80,  h:105, type:'main' },
  ],
 
  lawns: [
    { x:55,  y:230, w:300, h:235 },
    { x:55,  y:690, w:300, h:140 },
    { x:385, y:495, w:445, h:165 },
  ],
 
  openField: { x:385, y:495, w:445, h:245, label:'OPEN FIELD' },
 
  openCourts: [],
 
  trees: [
    {cx:80,cy:62},{cx:115,cy:62},{cx:150,cy:62},{cx:185,cy:62},
    {cx:225,cy:62},{cx:275,cy:62},{cx:700,cy:62},{cx:748,cy:62},
    {cx:798,cy:62},{cx:862,cy:62},
    {cx:55,cy:255},{cx:55,cy:308},{cx:55,cy:362},
    {cx:55,cy:510},{cx:55,cy:570},{cx:55,cy:640},
    {cx:55,cy:710},{cx:55,cy:768},
    {cx:900,cy:710},{cx:900,cy:768},{cx:900,cy:820},
  ],
 
  buildings: [
    /* ── TOP ROW ── */
    {
      id:'canteen',
      x:384, y:40, w:118, h:158,
      label:'Canteen',
      shortLabel:'CANTEEN',
      desc:'Campus 2 canteen serving affordable meals and snacks to students and university personnel.',
      navPoint:{x:443, y:119}
    },
    {
      id:'cit_building',
      x:510, y:40, w:245, h:158,
      label:'CIT Building',
      shortLabel:'CIT\nBUILDING',
      desc:'College of Industrial Technology – workshops, laboratories, and technical classrooms for automotive, electronics, and other technology programs.',
      navPoint:{x:632, y:119}
    },
    {
      id:'old_maritime',
      x:762, y:40, w:168, h:158,
      label:'Old Maritime Building',
      shortLabel:'OLD\nMARITIME',
      desc:'Former Maritime Department building, now repurposed for other academic programs and administrative use.',
      navPoint:{x:846, y:119}
    },
 
    /* ── LEFT COLUMN ── */
    {
      id:'ccje_north',
      x:55, y:232, w:302, h:110,
      label:'CCJE Building (North)',
      shortLabel:'CCJE',
      desc:'College of Criminal Justice Education – offers Criminology and Law Enforcement Administration programs. North wing.',
      navPoint:{x:206, y:287}
    },
    {
      id:'ccje_south',
      x:55, y:352, w:302, h:110,
      label:'CCJE Building (South)',
      shortLabel:'CCJE',
      desc:'College of Criminal Justice Education – South wing with additional classrooms and faculty offices.',
      navPoint:{x:206, y:407}
    },
    {
      id:'mech_eng',
      x:55, y:474, w:302, h:110,
      label:'Mechanical Engineering Building',
      shortLabel:'MECHANICAL\nENGINEERING',
      desc:'Houses Mechanical Engineering classrooms, design laboratories, and workshop facilities for engineering students.',
      navPoint:{x:206, y:529}
    },
    {
      id:'cea',
      x:55, y:596, w:302, h:135,
      label:'CEA Building',
      shortLabel:'CEA',
      desc:'College of Engineering and Architecture – offers Civil Engineering, Electrical Engineering, and Architecture programs.',
      navPoint:{x:206, y:663}
    },
 
    /* ── CENTER: CCJE/PE/Aviation with parking ring ── */
    {
      id:'ccje_pe_aviation',
      x:440, y:228, w:380, h:232,
      label:'CCJE / P.E. / Aviation Building',
      shortLabel:'CCJE/P.E.\nAVIATION',
      desc:'Multi-department building housing CCJE, Physical Education, and Aviation Technology programs with integrated facilities.',
      navPoint:{x:630, y:344}
    },
 
    /* ── AVIATION WORKING AREA ── */
    {
      id:'aviation_work',
      x:614, y:496, w:212, h:158,
      label:'Aviation Working Area',
      shortLabel:'AVIATION\nWORK AREA',
      desc:'Dedicated area for Aviation Technology students to practice aircraft systems, maintenance procedures, and technical skills.',
      navPoint:{x:720, y:575}
    },
 
    /* ── STAGE ── */
    {
      id:'stage',
      x:450, y:688, w:140, h:52,
      label:'Stage',
      shortLabel:'STAGE',
      desc:'Outdoor performance stage used for university programs, graduation ceremonies, and cultural presentations.',
      navPoint:{x:520, y:714}
    },
 
    /* ── RIGHT: STS ── */
    {
      id:'sts',
      x:860, y:474, w:165, h:182,
      label:'STS Building',
      shortLabel:'STS',
      desc:'Science and Technology Studies Building – houses advanced science programs, research facilities, and technology laboratories.',
      navPoint:{x:942, y:565}
    },
 
    /* ── GUARD HOUSE ── */
    {
      id:'guardhouse',
      x:388, y:782, w:58, h:48,
      label:'Guard House',
      shortLabel:'GUARD\nHOUSE',
      desc:'Campus security guard house monitoring the Main Gate entrance and all vehicles entering/leaving the campus.',
      navPoint:{x:417, y:806}
    },
  ],
 
  gates: [
    { id:'maingate', x:436, y:852, w:88, h:28, label:'MAIN GATE', fullLabel:'Main Gate', navPoint:{x:480, y:854} },
  ],
 
  waypoints: {
    /* ── GATE ── */
    'mg_entry':       {x:480, y:858, conn:['gate_path']},
    'gate_path':      {x:480, y:760, conn:['mg_entry','main_s','wp_guardhouse']},
 
    /* ── MAIN VERTICAL (center) ── */
    'main_s':         {x:480, y:668, conn:['gate_path','main_c','wp_stage']},
    'main_c':         {x:480, y:472, conn:['main_s','main_n','wp_ccje_pe']},
    'main_n':         {x:480, y:200, conn:['main_c','top_h_c','wp_canteen']},
 
    /* ── TOP HORIZONTAL ── */
    'top_h_c':        {x:480, y:55,  conn:['main_n','top_h_l','top_h_r']},
    'top_h_l':        {x:200, y:55,  conn:['top_h_c','lft_top']},
    'top_h_r':        {x:740, y:55,  conn:['top_h_c','rgt_top','wp_cit','wp_maritime']},
    'lft_top':        {x:55,  y:55,  conn:['top_h_l','lft_n']},
    'rgt_top':        {x:920, y:55,  conn:['top_h_r','rgt_n']},
 
    /* ── LEFT SPINE ── */
    'lft_n':          {x:55,  y:200, conn:['lft_top','lft_c1','wp_ccje_n']},
    'lft_c1':         {x:55,  y:352, conn:['lft_n','lft_c2','wp_ccje_s']},
    'lft_c2':         {x:55,  y:474, conn:['lft_c1','lft_c3','wp_mech_eng']},
    'lft_c3':         {x:55,  y:596, conn:['lft_c2','lft_s','wp_cea']},
    'lft_s':          {x:55,  y:755, conn:['lft_c3','lft_bot']},
    'lft_bot':        {x:55,  y:858, conn:['lft_s','mg_entry']},
 
    /* ── INNER LEFT LANE ── */
    'ilft_n':         {x:373, y:200, conn:['main_n','ilft_c']},
    'ilft_c':         {x:373, y:472, conn:['ilft_n','ilft_s','main_c']},
    'ilft_s':         {x:373, y:668, conn:['ilft_c','ilft_bot','main_s']},
    'ilft_bot':       {x:373, y:760, conn:['ilft_s','gate_path']},
 
    /* ── RIGHT SPINE ── */
    'rgt_n':          {x:920, y:200, conn:['rgt_top','rgt_c']},
    'rgt_c':          {x:920, y:668, conn:['rgt_n','rgt_s','wp_sts']},
    'rgt_s':          {x:920, y:858, conn:['rgt_c','mg_entry']},
 
    /* ── INNER RIGHT LANE ── */
    'irgt_n':         {x:850, y:200, conn:['top_h_r','irgt_c']},
    'irgt_c':         {x:850, y:472, conn:['irgt_n','irgt_s','wp_sts']},
    'irgt_s':         {x:850, y:668, conn:['irgt_c','main_s']},
 
    /* ── BUILDING ACCESS ── */
    'wp_canteen':     {x:443, y:119, conn:['main_n','top_h_c']},
    'wp_cit':         {x:632, y:119, conn:['top_h_r','top_h_c']},
    'wp_maritime':    {x:846, y:119, conn:['top_h_r','irgt_n']},
    'wp_ccje_n':      {x:206, y:287, conn:['lft_n','lft_c1','ilft_n']},
    'wp_ccje_s':      {x:206, y:407, conn:['lft_c1','lft_c2','ilft_c']},
    'wp_mech_eng':    {x:206, y:529, conn:['lft_c2','lft_c3','ilft_c']},
    'wp_cea':         {x:206, y:663, conn:['lft_c3','lft_s','ilft_s']},
    'wp_ccje_pe':     {x:630, y:344, conn:['main_c','main_n','ilft_c','irgt_c']},
    'wp_aviation':    {x:720, y:575, conn:['main_c','main_s','irgt_c']},
    'wp_stage':       {x:520, y:714, conn:['main_s','gate_path']},
    'wp_sts':         {x:920, y:565, conn:['irgt_c','irgt_s','rgt_c']},
    'wp_guardhouse':  {x:417, y:806, conn:['gate_path','main_s']},
  },
 
  gateWaypoints: { 'maingate': 'mg_entry' },
 
  buildingWaypoints: {
    'canteen':         'wp_canteen',
    'cit_building':    'wp_cit',
    'old_maritime':    'wp_maritime',
    'ccje_north':      'wp_ccje_n',
    'ccje_south':      'wp_ccje_s',
    'mech_eng':        'wp_mech_eng',
    'cea':             'wp_cea',
    'ccje_pe_aviation':'wp_ccje_pe',
    'aviation_work':   'wp_aviation',
    'stage':           'wp_stage',
    'sts':             'wp_sts',
    'guardhouse':      'wp_guardhouse',
  }
};
 
/* =========================================
   HELPER
   ========================================= */
function campusData(n) { return n === 1 ? c1 : c2; }
 
/* =========================================
   SCREEN TRANSITIONS
   ========================================= */
function showScreen(id) {
  const prev = document.querySelector('.screen.active');
  const next = document.getElementById(id);
  if (!next) return;
  if (prev) {
    prev.classList.remove('active');
    prev.classList.add('slide-out');
    setTimeout(() => prev.classList.remove('slide-out'), 350);
  }
  setTimeout(() => {
    next.classList.add('active', 'slide-in');
    setTimeout(() => next.classList.remove('slide-in'), 450);
  }, prev ? 150 : 0);
  currentScreen = id;
}
 
function showCampusSelect() { showScreen('campus-select'); }
 
function openCampus(n) {
  currentCampus = n;
  showScreen('campus' + n + '-screen');
  populateBuildingSelect(n);
  renderCampusMap(n);
  setupMapInteraction(n);
}
 
function goBack() {
  stopNavigation(1); stopNavigation(2);
  showScreen('campus-select');
}
 
/* =========================================
   POPULATE BUILDING SELECT
   ========================================= */
function populateBuildingSelect(n) {
  const data = campusData(n);
  const sel = document.getElementById('dest-building' + n);
  if (!sel) return;
  sel.innerHTML = '<option value="">Select Destination</option>';
  data.buildings.forEach(b => {
    if (!b.label || b.w === 0) return;
    const opt = document.createElement('option');
    opt.value = b.id;
    opt.textContent = b.label;
    sel.appendChild(opt);
  });
}
 
/* =========================================
   SVG MAP RENDERER
   ========================================= */
function renderCampusMap(n) {
  const svg = document.getElementById('campus' + n + '-map');
  if (!svg) return;
  const data = campusData(n);
  svg.setAttribute('viewBox', data.viewBox);
  svg.innerHTML = '';
 
  /* ── Defs ── */
  const defs = svgEl('defs');
  const pat = svgEl('pattern');
  pat.setAttribute('id','rsp'+n); pat.setAttribute('width','10'); pat.setAttribute('height','10');
  pat.setAttribute('patternUnits','userSpaceOnUse'); pat.setAttribute('patternTransform','rotate(45)');
  const pr = svgEl('rect'); pr.setAttribute('width','5'); pr.setAttribute('height','10');
  pr.setAttribute('fill','rgba(255,255,255,0.07)');
  pat.appendChild(pr); defs.appendChild(pat);
  const filt = svgEl('filter'); filt.setAttribute('id','bshadow'+n);
  const fe = svgEl('feDropShadow'); fe.setAttribute('dx','2'); fe.setAttribute('dy','3');
  fe.setAttribute('stdDeviation','3'); fe.setAttribute('flood-opacity','0.22');
  filt.appendChild(fe); defs.appendChild(filt);
  svg.appendChild(defs);
 
  /* ── Background ── */
  const bg = svgEl('rect');
  bg.setAttribute('x','0'); bg.setAttribute('y','0');
  bg.setAttribute('width','960'); bg.setAttribute('height','960');
  bg.setAttribute('class','campus-ground');
  svg.appendChild(bg);
 
  /* ── Lawns ── */
  (data.lawns||[]).forEach(l => {
    const el = svgEl('rect');
    el.setAttribute('x',l.x); el.setAttribute('y',l.y);
    el.setAttribute('width',l.w); el.setAttribute('height',l.h);
    el.setAttribute('rx','6'); el.setAttribute('class','lawn');
    svg.appendChild(el);
  });
 
  /* ── Open Field (Campus 2) ── */
  if (data.openField) {
    const of = svgEl('rect');
    of.setAttribute('x',data.openField.x); of.setAttribute('y',data.openField.y);
    of.setAttribute('width',data.openField.w); of.setAttribute('height',data.openField.h);
    of.setAttribute('rx','4'); of.setAttribute('class','lawn'); of.setAttribute('opacity','0.55');
    svg.appendChild(of);
    const ofl = svgEl('text');
    ofl.setAttribute('x',data.openField.x+data.openField.w/2);
    ofl.setAttribute('y',data.openField.y+data.openField.h/2+30);
    ofl.setAttribute('class','building-label'); ofl.setAttribute('font-size','15');
    ofl.setAttribute('fill','#3a6a20'); ofl.setAttribute('opacity','0.75');
    ofl.textContent = data.openField.label;
    svg.appendChild(ofl);
  }
 
  /* ── Campus 2 parking ring ── */
  if (n === 2) {
    // Outer parking box
    const pb = svgEl('rect');
    pb.setAttribute('x','408'); pb.setAttribute('y','206');
    pb.setAttribute('width','452'); pb.setAttribute('height','260');
    pb.setAttribute('rx','5'); pb.setAttribute('fill','#b8c4a0');
    pb.setAttribute('stroke','#9aaa82'); pb.setAttribute('stroke-width','1.5');
    svg.appendChild(pb);
    ['Parking Area','Parking Area','Parking Area'].forEach((t,i) => {
      const pos = [{x:490,y:222},{x:384,y:352},{x:860,y:352}][i];
      const tl = svgEl('text');
      tl.setAttribute('x',pos.x); tl.setAttribute('y',pos.y);
      tl.setAttribute('class','building-label'); tl.setAttribute('font-size','9');
      tl.setAttribute('fill','#5a6a40'); tl.setAttribute('transform',i===1?'rotate(-90 384 352)':i===2?'rotate(90 860 352)':'');
      tl.textContent = t;
      svg.appendChild(tl);
    });
    // Inner box
    const pb2 = svgEl('rect');
    pb2.setAttribute('x','432'); pb2.setAttribute('y','226');
    pb2.setAttribute('width','404'); pb2.setAttribute('height','222');
    pb2.setAttribute('rx','3'); pb2.setAttribute('fill','#c8d4b0');
    pb2.setAttribute('stroke','#9aaa82'); pb2.setAttribute('stroke-width','1');
    svg.appendChild(pb2);
  }
 
  /* ── Pathways ── */
  data.pathways.forEach(p => {
    const el = svgEl('rect');
    el.setAttribute('x',p.x); el.setAttribute('y',p.y);
    el.setAttribute('width',p.w); el.setAttribute('height',p.h);
    el.setAttribute('class', p.type==='main' ? 'road-main' : 'road');
    svg.appendChild(el);
    const st = svgEl('rect');
    st.setAttribute('x',p.x); st.setAttribute('y',p.y);
    st.setAttribute('width',p.w); st.setAttribute('height',p.h);
    st.setAttribute('fill','url(#rsp'+n+')');
    svg.appendChild(st);
  });
 
  /* ── Open Courts ── */
  (data.openCourts||[]).forEach(oc => {
    const el = svgEl('rect');
    el.setAttribute('x',oc.x); el.setAttribute('y',oc.y);
    el.setAttribute('width',oc.w); el.setAttribute('height',oc.h);
    el.setAttribute('rx','4'); el.setAttribute('fill','#90d0f0');
    el.setAttribute('stroke','#60b0e0'); el.setAttribute('stroke-width','1.5');
    svg.appendChild(el);
    oc.label.split('\n').forEach((ln,i,arr) => {
      const t = svgEl('text');
      t.setAttribute('x',oc.x+oc.w/2);
      t.setAttribute('y',oc.y+oc.h/2+(i-(arr.length-1)/2)*13);
      t.setAttribute('class','building-label'); t.setAttribute('font-size','9');
      t.setAttribute('fill','#1a5090'); t.textContent=ln;
      svg.appendChild(t);
    });
  });
 
  /* ── Trees ── */
  (data.trees||[]).forEach(t => {
    const c = svgEl('circle');
    c.setAttribute('cx',t.cx); c.setAttribute('cy',t.cy);
    c.setAttribute('r','9'); c.setAttribute('class','tree');
    svg.appendChild(c);
    const ci = svgEl('circle');
    ci.setAttribute('cx',t.cx); ci.setAttribute('cy',t.cy);
    ci.setAttribute('r','5'); ci.setAttribute('fill','#70b050'); ci.setAttribute('opacity','0.45');
    svg.appendChild(ci);
  });
 
  /* ── Campus Boundary ── */
  const wall = svgEl('path');
  wall.setAttribute('d',data.boundaryPath);
  wall.setAttribute('class','campus-wall');
  svg.appendChild(wall);
 
  /* ── Buildings ── */
  data.buildings.forEach(b => {
    if (!b.label || b.w === 0) return;
    const g = svgEl('g');
    g.setAttribute('id','bldg-'+n+'-'+b.id);
    g.setAttribute('data-id',b.id);
    g.style.cursor = 'pointer';
    g.addEventListener('click', () => showBuildingInfo(n, b));
 
    // Shadow
    const sh = svgEl('rect');
    sh.setAttribute('x',b.x+3); sh.setAttribute('y',b.y+b.h);
    sh.setAttribute('width',b.w); sh.setAttribute('height','5');
    sh.setAttribute('rx','2'); sh.setAttribute('fill','rgba(0,0,0,0.17)');
    if (b.rotate) {
      const cx=b.x+b.w/2, cy=b.y+b.h/2;
      sh.setAttribute('transform',`rotate(${b.rotate} ${cx} ${cy})`);
    }
    g.appendChild(sh);
 
    const rect = svgEl('rect');
    rect.setAttribute('x',b.x); rect.setAttribute('y',b.y);
    rect.setAttribute('width',b.w); rect.setAttribute('height',b.h);
    rect.setAttribute('rx','5'); rect.setAttribute('class','building');
    rect.setAttribute('filter','url(#bshadow'+n+')');
    if (b.rotate) {
      const cx=b.x+b.w/2, cy=b.y+b.h/2;
      rect.setAttribute('transform',`rotate(${b.rotate} ${cx} ${cy})`);
    }
    g.appendChild(rect);
 
    // Label
    const lines = b.shortLabel.split('\n');
    const fsize = b.w < 80 ? 8 : (b.w < 120 ? 9 : (b.w < 200 ? 10 : 11));
    const lineH = fsize + 3;
    lines.forEach((ln, i) => {
      const t = svgEl('text');
      t.setAttribute('x', b.x + b.w/2);
      t.setAttribute('y', b.y + b.h/2 + (i-(lines.length-1)/2)*lineH);
      t.setAttribute('class','building-label');
      t.setAttribute('font-size', fsize);
      t.textContent = ln;
      if (b.rotate) {
        const cx=b.x+b.w/2, cy=b.y+b.h/2;
        t.setAttribute('transform',`rotate(${b.rotate} ${cx} ${cy})`);
      }
      g.appendChild(t);
    });
 
    svg.appendChild(g);
  });
 
  /* ── Gates ── */
  data.gates.forEach(gate => {
    const g = svgEl('g');
    const rect = svgEl('rect');
    rect.setAttribute('x',gate.x); rect.setAttribute('y',gate.y);
    rect.setAttribute('width',gate.w); rect.setAttribute('height',gate.h);
    rect.setAttribute('rx','4'); rect.setAttribute('class','gate-marker');
    g.appendChild(rect);
    const lbl = svgEl('text');
    lbl.setAttribute('x',gate.x+gate.w/2);
    lbl.setAttribute('y',gate.y+gate.h/2);
    lbl.setAttribute('class','gate-label');
    lbl.setAttribute('font-size', gate.w > 70 ? 9 : 8);
    lbl.textContent = gate.label;
    g.appendChild(lbl);
    svg.appendChild(g);
  });
 
  /* ── Compass & Scale ── */
  const vbParts = data.viewBox.split(' ').map(Number);
  drawCompass(svg, vbParts[2]-42, vbParts[3]-38);
  drawScaleBar(svg, 44, vbParts[3]-20);
 
  /* ── Route layer (on top) ── */
  const rl = svgEl('g');
  rl.setAttribute('id','route-layer-'+n);
  svg.appendChild(rl);
}
 
/* ── Compass rose ── */
function drawCompass(svg, cx, cy) {
  const g = svgEl('g');
  const bg = svgEl('circle');
  bg.setAttribute('cx',cx); bg.setAttribute('cy',cy);
  bg.setAttribute('r','22'); bg.setAttribute('class','compass-bg');
  g.appendChild(bg);
  const np = svgEl('polygon');
  np.setAttribute('points',`${cx},${cy-17} ${cx-5},${cy+2} ${cx+5},${cy+2}`);
  np.setAttribute('class','compass-n');
  g.appendChild(np);
  const sp = svgEl('polygon');
  sp.setAttribute('points',`${cx},${cy+17} ${cx-5},${cy-2} ${cx+5},${cy-2}`);
  sp.setAttribute('class','compass-s');
  g.appendChild(sp);
  const nl = svgEl('text');
  nl.setAttribute('x',cx); nl.setAttribute('y',cy-22);
  nl.setAttribute('class','compass-label'); nl.textContent='N';
  g.appendChild(nl);
  svg.appendChild(g);
}
 
/* ── Scale bar ── */
function drawScaleBar(svg, x, y) {
  const g = svgEl('g');
  const line = svgEl('line');
  line.setAttribute('x1',x); line.setAttribute('y1',y);
  line.setAttribute('x2',x+100); line.setAttribute('y2',y);
  line.setAttribute('class','scale-bar');
  g.appendChild(line);
  [['0m',0],['50m',50],['100m',100]].forEach(([t,dx]) => {
    const lbl = svgEl('text');
    lbl.setAttribute('x',x+dx); lbl.setAttribute('y',y+12);
    lbl.setAttribute('class','scale-label'); lbl.textContent=t;
    g.appendChild(lbl);
    const tick = svgEl('line');
    tick.setAttribute('x1',x+dx); tick.setAttribute('y1',y-4);
    tick.setAttribute('x2',x+dx); tick.setAttribute('y2',y+4);
    tick.setAttribute('class','scale-bar');
    g.appendChild(tick);
  });
  svg.appendChild(g);
}
 
function svgEl(tag) {
  return document.createElementNS('http://www.w3.org/2000/svg', tag);
}
 
/* =========================================
   PATHFINDING (Dijkstra)
   ========================================= */
function findPath(waypoints, startId, endId) {
  if (!waypoints[startId]||!waypoints[endId]) return null;
  if (startId===endId) return [startId];
  const dist={}, prev={}, visited=new Set();
  Object.keys(waypoints).forEach(id=>{ dist[id]=Infinity; prev[id]=null; });
  dist[startId]=0;
  const pq=[startId];
  while (pq.length>0) {
    pq.sort((a,b)=>dist[a]-dist[b]);
    const curr=pq.shift();
    if (curr===endId) break;
    if (visited.has(curr)) continue;
    visited.add(curr);
    const wp=waypoints[curr];
    if (!wp) continue;
    (wp.conn||[]).forEach(nb => {
      if (visited.has(nb)||!waypoints[nb]) return;
      const d=Math.sqrt((waypoints[nb].x-wp.x)**2+(waypoints[nb].y-wp.y)**2);
      if (dist[curr]+d<dist[nb]) {
        dist[nb]=dist[curr]+d; prev[nb]=curr;
        if (!visited.has(nb)) pq.push(nb);
      }
    });
  }
  const path=[]; let cur=endId;
  while(cur!==null){path.unshift(cur);cur=prev[cur];}
  return path[0]===startId ? path : null;
}
 
/* =========================================
   NAVIGATION
   ========================================= */
function updateRoute(n) {
  const gate=document.getElementById('start-gate'+n).value;
  const dest=document.getElementById('dest-building'+n).value;
  document.getElementById('btn-nav'+n).disabled=!(gate&&dest);
}
 
function startNavigation(n) {
  const gv=document.getElementById('start-gate'+n).value;
  const dv=document.getElementById('dest-building'+n).value;
  if(!gv||!dv) return;
  const data=campusData(n);
  const swp=data.gateWaypoints[gv];
  const ewp=data.buildingWaypoints[dv];
  if(!swp||!ewp){setVoice(n,'Route data unavailable.'); return;}
  const path=findPath(data.waypoints,swp,ewp);
  if(!path){setVoice(n,'Unable to find a route. Please try again.'); return;}
  const pts=path.map(id=>data.waypoints[id]).filter(Boolean);
  clearHighlights(n);
  drawRoute(n,pts);
  const bldg=data.buildings.find(b=>b.id===dv);
  const gate=data.gates.find(g=>g.id===gv);
  if(bldg){
    const bg=document.getElementById('bldg-'+n+'-'+dv);
    if(bg){const r=bg.querySelector('.building');if(r)r.classList.add('highlighted');}
  }
  generateVoiceGuidance(n,pts,gate,bldg);
  document.getElementById('voice-box'+n).classList.remove('hidden');
}
 
function stopNavigation(n) {
  const layer=document.getElementById('route-layer-'+n);
  if(layer) layer.innerHTML='';
  const vb=document.getElementById('voice-box'+n);
  if(vb) vb.classList.add('hidden');
  clearHighlights(n);
  if(voiceInterval){clearInterval(voiceInterval);voiceInterval=null;}
  if(speechSynth) speechSynth.cancel();
}
 
function clearHighlights(n) {
  document.querySelectorAll('#campus'+n+'-map .building').forEach(el=>el.classList.remove('highlighted'));
}
 
function drawRoute(n, pts) {
  const layer=document.getElementById('route-layer-'+n);
  layer.innerHTML='';
  if(pts.length<2) return;
  const d=pts.map((p,i)=>`${i===0?'M':'L'}${p.x},${p.y}`).join(' ');
 
  // glow
  const bg=svgEl('path');
  bg.setAttribute('d',d); bg.setAttribute('fill','none');
  bg.setAttribute('stroke','rgba(255,255,255,0.3)'); bg.setAttribute('stroke-width','9');
  bg.setAttribute('stroke-linecap','round'); bg.setAttribute('stroke-linejoin','round');
  layer.appendChild(bg);
 
  // route line
  const pe=svgEl('path');
  pe.setAttribute('d',d); pe.setAttribute('class','nav-path');
  const len=pts.reduce((a,p,i)=>i===0?0:a+Math.sqrt((p.x-pts[i-1].x)**2+(p.y-pts[i-1].y)**2),0);
  pe.style.strokeDasharray=len; pe.style.strokeDashoffset=len;
  pe.style.transition='stroke-dashoffset 2s ease-in-out'; pe.style.animation='none';
  layer.appendChild(pe);
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    pe.style.strokeDashoffset='0';
    setTimeout(()=>{pe.style.strokeDasharray='12 6';pe.style.strokeDashoffset='';pe.style.transition='';pe.style.animation='dashMove 0.6s linear infinite';},2100);
  }));
 
  // Start
  const s=pts[0];
  const pul=svgEl('circle'); pul.setAttribute('cx',s.x); pul.setAttribute('cy',s.y); pul.setAttribute('r','14'); pul.setAttribute('class','nav-pulse');
  layer.appendChild(pul);
  const sd=svgEl('circle'); sd.setAttribute('cx',s.x); sd.setAttribute('cy',s.y); sd.setAttribute('r','9'); sd.setAttribute('class','nav-start-marker');
  layer.appendChild(sd);
  const sl=svgEl('text'); sl.setAttribute('x',s.x); sl.setAttribute('y',s.y-16); sl.setAttribute('class','building-label'); sl.setAttribute('fill','#4CAF50'); sl.setAttribute('font-size','10'); sl.textContent='START';
  layer.appendChild(sl);
 
  // End
  const e=pts[pts.length-1];
  const ed=svgEl('circle'); ed.setAttribute('cx',e.x); ed.setAttribute('cy',e.y); ed.setAttribute('r','9'); ed.setAttribute('class','nav-end-marker');
  layer.appendChild(ed);
  const el2=svgEl('text'); el2.setAttribute('x',e.x); el2.setAttribute('y',e.y-16); el2.setAttribute('class','building-label'); el2.setAttribute('fill','#F44336'); el2.setAttribute('font-size','10'); el2.textContent='DEST';
  layer.appendChild(el2);
}
 
function generateVoiceGuidance(n,pts,gate,bldg) {
  if(!gate||!bldg) return;
  const m=Math.round(pts.reduce((a,p,i)=>i===0?0:a+Math.sqrt((p.x-pts[i-1].x)**2+(p.y-pts[i-1].y)**2),0)*0.35);
  const bname=bldg.shortLabel.replace('\n',' ');
  const steps=[
    `Navigation started. You are at ${gate.fullLabel}. Enter through the gate and proceed into the campus.`,
    `Walk along the main pathway. Your destination is approximately ${m} meters away.`,
    `Continue following the highlighted route toward the ${bname}.`,
    `You are approaching your destination. Look for the ${bname} sign.`,
    `You have arrived at the ${bldg.label}. Thank you for using NORSU Campus Navigator.`
  ];
  voiceSteps=steps; voiceIndex=0;
  if(voiceInterval){clearInterval(voiceInterval);voiceInterval=null;}
  if(speechSynth)speechSynth.cancel();
  setVoice(n,steps[0]); speakText(steps[0]); voiceIndex=1;
  voiceInterval=setInterval(()=>{
    if(voiceIndex<voiceSteps.length){setVoice(n,voiceSteps[voiceIndex]);speakText(voiceSteps[voiceIndex]);voiceIndex++;}
    else{clearInterval(voiceInterval);voiceInterval=null;}
  },5000);
}
 
function setVoice(n,t){const el=document.getElementById('voice-text'+n);if(el)el.textContent=t;}
function speakText(t){if(!speechSynth)return;speechSynth.cancel();const u=new SpeechSynthesisUtterance(t);u.rate=0.9;u.pitch=1;u.volume=1;speechSynth.speak(u);}
 
/* =========================================
   BUILDING POPUP
   ========================================= */
function showBuildingInfo(n,b){
  if(!b.label||!b.w)return;
  const pop=document.getElementById('building-popup'+n);
  document.getElementById('popup-name'+n).textContent=b.label;
  document.getElementById('popup-desc'+n).textContent=b.desc;
  currentPopupBuilding[n]=b.id;
  pop.classList.remove('hidden');
}
function closePopup(n){document.getElementById('building-popup'+n).classList.add('hidden');currentPopupBuilding[n]=null;}
function setAsDestination(n){
  const id=currentPopupBuilding[n];if(!id)return;
  document.getElementById('dest-building'+n).value=id;
  updateRoute(n);closePopup(n);
}
 
/* =========================================
   SEARCH
   ========================================= */
function toggleSearch(){
  const n=currentCampus;
  const pid=n===1?'search-panel':'search-panel2';
  const panel=document.getElementById(pid);
  if(!panel)return;
  panel.classList.toggle('hidden');
  if(!panel.classList.contains('hidden')){
    const inp=panel.querySelector('.search-input');
    if(inp)setTimeout(()=>inp.focus(),100);
  }
}
 
function searchBuilding(n,query){
  const data=campusData(n);
  const res=document.getElementById('search-results'+n);
  if(!res)return;
  res.innerHTML='';
  if(!query.trim())return;
  const q=query.toLowerCase();
  data.buildings.filter(b=>b.label&&b.w&&(b.label.toLowerCase().includes(q)||b.shortLabel.toLowerCase().includes(q))).forEach(b=>{
    const item=document.createElement('div');
    item.className='search-result-item';
    item.textContent=b.label;
    item.addEventListener('click',()=>{
      highlightBuilding(n,b.id);
      panToBuilding(n,b);
      document.getElementById(n===1?'search-panel':'search-panel2').classList.add('hidden');
    });
    res.appendChild(item);
  });
}
 
function highlightBuilding(n,id){
  clearHighlights(n);
  const g=document.getElementById('bldg-'+n+'-'+id);
  if(g){const r=g.querySelector('.building');if(r)r.classList.add('highlighted');}
}
 
function panToBuilding(n,b){
  const container=document.getElementById('map'+n+'-container');
  if(!container)return;
  const vb=campusData(n).viewBox.split(' ').map(Number);
  const cW=container.clientWidth,cH=container.clientHeight;
  const scale=Math.min(cW/vb[2],cH/vb[3])*1.7;
  zoomLevel[n]=Math.min(2.5,scale);
  const rx=(cW/vb[2])*zoomLevel[n];
  const ry=(cH/vb[3])*zoomLevel[n];
  panOffset[n]={x:cW/2-b.navPoint.x*rx,y:cH/2-b.navPoint.y*ry};
  applyTransform(n);
}
 
/* =========================================
   ZOOM & PAN
   ========================================= */
function zoom(n,f){zoomLevel[n]=Math.min(3,Math.max(0.4,zoomLevel[n]*f));applyTransform(n);}
function resetZoom(n){zoomLevel[n]=1;panOffset[n]={x:0,y:0};applyTransform(n);}
function applyTransform(n){
  const w=document.getElementById('map'+n+'-wrap');
  if(w)w.style.transform=`translate(${panOffset[n].x}px,${panOffset[n].y}px) scale(${zoomLevel[n]})`;
}
 
function setupMapInteraction(n){
  const c=document.getElementById('map'+n+'-container');
  if(!c||c._interactionSet)return;
  c._interactionSet=true;
  c.addEventListener('mousedown',e=>{if(e.target.closest('.map-zoom-controls'))return;isDragging=true;dragStart={x:e.clientX-panOffset[n].x,y:e.clientY-panOffset[n].y};});
  document.addEventListener('mousemove',e=>{if(!isDragging||currentCampus!==n)return;panOffset[n]={x:e.clientX-dragStart.x,y:e.clientY-dragStart.y};applyTransform(n);});
  document.addEventListener('mouseup',()=>{isDragging=false;});
  c.addEventListener('wheel',e=>{e.preventDefault();zoom(n,e.deltaY<0?1.1:0.9);},{passive:false});
  let lx=0,ly=0;
  c.addEventListener('touchstart',e=>{
    if(e.touches.length===1){isDragging=true;lx=e.touches[0].clientX;ly=e.touches[0].clientY;}
    else if(e.touches.length===2){isDragging=false;const dx=e.touches[1].clientX-e.touches[0].clientX,dy=e.touches[1].clientY-e.touches[0].clientY;touchStartDist=Math.sqrt(dx*dx+dy*dy);}
  },{passive:true});
  c.addEventListener('touchmove',e=>{
    if(e.touches.length===1&&isDragging){panOffset[n].x+=e.touches[0].clientX-lx;panOffset[n].y+=e.touches[0].clientY-ly;lx=e.touches[0].clientX;ly=e.touches[0].clientY;applyTransform(n);}
    else if(e.touches.length===2&&touchStartDist>0){const dx=e.touches[1].clientX-e.touches[0].clientX,dy=e.touches[1].clientY-e.touches[0].clientY;const d=Math.sqrt(dx*dx+dy*dy);zoomLevel[n]=Math.min(3,Math.max(0.4,zoomLevel[n]*(d/touchStartDist)));touchStartDist=d;applyTransform(n);}
  },{passive:true});
  c.addEventListener('touchend',()=>{isDragging=false;touchStartDist=0;});
}
 
/* =========================================
   DAY / NIGHT MODE
   ========================================= */
function toggleMode(){
  isDayMode=!isDayMode;
  document.body.classList.toggle('night-mode',!isDayMode);
  document.body.classList.toggle('day-mode',isDayMode);
  ['','2','3'].forEach(s=>{
    const sun=document.getElementById('mode-icon-sun'+s);
    const moon=document.getElementById('mode-icon-moon'+s);
    if(sun)sun.style.display=isDayMode?'':'none';
    if(moon)moon.style.display=isDayMode?'none':'';
  });
}
 
/* =========================================
   INIT
   ========================================= */
document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('intro-screen').classList.add('active');
});