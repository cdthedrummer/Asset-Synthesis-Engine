-- Next Leap demo personas: Maya (baker), Dev (swim instructor), Priya (care).
-- Demo boards are the shop window, so they must look COMPLETE: every one needs
-- at least one skip pin (the triage payoff), checklist items with spread-out
-- done_at values (the week strip), and cycle_index set on moves.
-- Idempotent: deletes and re-inserts both demo boards. Run against dev DB.
BEGIN;

DELETE FROM nl_boards WHERE token IN ('demo-baker','demo-swim','demo-care');

-- ============================================================ MAYA (baker)
INSERT INTO nl_boards (token, kind, name, door, goal_text, ai_familiarity, craft_comfort, stage, stat_chips, trajectory, bet, created_at, updated_at)
VALUES (
  'demo-baker', 'demo', 'Maya', 'ambition',
  $s$I want to turn my weekend cake orders into a real bakery$s$,
  'some', 'confident', 'board',
  $j$[{"value":"52/52","label":"SAT SOLD OUT","tone":"good"},{"value":"$2,000","label":"SAVED","tone":"neutral"},{"value":"10 HRS","label":"FREE / WK","tone":"warn"}]$j$::jsonb,
  $j${"title":"SUMMER '27","headline":"~$2,400","unit":"/wk","series":[{"x":"JAN","y":300,"projected":false},{"x":"FEB","y":340,"projected":false},{"x":"MAR","y":420,"projected":false},{"x":"APR","y":450,"projected":false},{"x":"MAY","y":520,"projected":false},{"x":"JUL","y":750,"projected":true},{"x":"OCT","y":1200,"projected":true},{"x":"JAN","y":1500,"projected":true},{"x":"APR","y":1950,"projected":true},{"x":"JUL","y":2400,"projected":true}],"milestones":[{"x":"OCT","label":"PERMIT"},{"x":"APR","label":"FIRST STALL"}]}$j$::jsonb,
  $j${"pinTitle":"Instagram preorders","text":"Instagram. Week three a wedding order lands, the grid goes quiet, and quiet grids don't take preorders."}$j$::jsonb,
  NOW() - interval '21 days', NOW() - interval '2 hours'
);

INSERT INTO nl_pins (board_id, title, verdict, verdict_why, difficulty, impact, kind, viz_data, detail, verify_yourself, last_touched_at)
SELECT b.id, p.* FROM nl_boards b,
LATERAL (VALUES
  ('Cake orders','start',$s$Demand is proven; the cap is the oven, not the market.$s$,3,9,'bars',
    $j${"unit":"orders/mo","bars":[{"label":"JAN","value":4},{"label":"FEB","value":5},{"label":"MAR","value":7},{"label":"APR","value":8},{"label":"MAY","value":8}],"capLine":{"value":8,"label":"OVEN CAP"}}$j$::jsonb,
    $j${"blocks":[{"type":"text","body":"Eight orders is the ceiling of one oven and two weekend days. When a line sits flat against its cap, price moves before capacity does."},{"type":"bars","title":"IF PRICE MOVES $65 TO $80","bars":[{"label":"NOW","value":520},{"label":"+$15","value":640}],"unit":"$/wk"}]}$j$::jsonb,
    false, NOW() - interval '2 hours'),
  ('Saturday menu','start',$s$Three items sell out every week; the menu already knows what it wants to be.$s$,2,7,'menu',
    $j${"heading":"SATURDAY","items":[{"name":"Lemon poppy loaf","price":"$14"},{"name":"Choc-orange cake","price":"$38"},{"name":"Cardamom buns (6)","price":"$18"}]}$j$::jsonb,
    NULL, false, NOW() - interval '3 days'),
  ('Café wholesale','schedule',$s$Two cafés asked first — but wholesale waits on the permit, not on courage.$s$,5,8,'pipeline',
    $j${"items":[{"name":"Fern & Ground","status":"SAMPLES FRI","state":"active"},{"name":"Blue Door Café","status":"DM'D BACK","state":"active"},{"name":"Northside Deli","status":"COLD","state":"todo"}]}$j$::jsonb,
    NULL, false, NOW() - interval '26 hours'),
  ('Cottage food permit','gethelp',$s$County rules decide your kitchen, your labels, your ceiling. One call beats ten forum threads.$s$,6,9,'table',
    $j${"rows":[{"label":"County application","state":"active","note":"IN REVIEW"},{"label":"Kitchen inspection","state":"waiting","note":"THEY SCHEDULE"},{"label":"Label rules","state":"todo"},{"label":"Food handler card","state":"done"}]}$j$::jsonb,
    $j${"blocks":[{"type":"text","body":"Cottage food rules are county-level and they change. The county food office answers exact questions for free, with your address in front of them. Verify everything on this pin yourself."}]}$j$::jsonb,
    true, NOW() - interval '2 days'),
  ('Food safety cert','start',$s$Twenty hours of online modules stand between you and legal wholesale. That's it.$s$,4,8,'steps',
    $j${"steps":[{"label":"Modules 1-2","state":"done"},{"label":"Module 3","state":"active"},{"label":"Modules 4-6","state":"todo"},{"label":"Exam","state":"todo"}],"caption":"20 HRS TOTAL"}$j$::jsonb,
    NULL, false, NOW() - interval '4 days'),
  ('Instagram preorders','schedule',$s$Preorders beat market mornings for a one-oven bakery — but only if the grid stays alive.$s$,4,6,'calendar',
    $j${"month":"MAR","marks":[{"day":2,"kind":"post"},{"day":5,"kind":"post"},{"day":9,"kind":"post"},{"day":14,"kind":"due"},{"day":16,"kind":"post"},{"day":23,"kind":"post"},{"day":28,"kind":"event"}],"caption":"2 POSTS / WK"}$j$::jsonb,
    NULL, false, NOW() - interval '6 days'),
  ('Call with Rosa','start',$s$One hour with someone who already made every mistake you're lining up.$s$,1,7,'stat',
    $j${"value":"7:00 PM","label":"WEDNESDAY","sub":"BOOKED"}$j$::jsonb,
    NULL, false, NOW() - interval '30 hours')
) AS p(title, verdict, verdict_why, difficulty, impact, kind, viz_data, detail, verify_yourself, last_touched_at)
WHERE b.token = 'demo-baker';

UPDATE nl_pins SET related_pin_ids = jsonb_build_array(
  (SELECT id FROM nl_pins p2 WHERE p2.title='Cottage food permit' AND p2.board_id=nl_pins.board_id),
  (SELECT id FROM nl_pins p3 WHERE p3.title='Food safety cert' AND p3.board_id=nl_pins.board_id))
WHERE title='Café wholesale' AND board_id=(SELECT id FROM nl_boards WHERE token='demo-baker');

UPDATE nl_pins SET related_pin_ids = jsonb_build_array(
  (SELECT id FROM nl_pins p2 WHERE p2.title='Café wholesale' AND p2.board_id=nl_pins.board_id))
WHERE title='Cottage food permit' AND board_id=(SELECT id FROM nl_boards WHERE token='demo-baker');

UPDATE nl_boards SET bet = bet || jsonb_build_object('pinId',
  (SELECT id FROM nl_pins WHERE title='Instagram preorders' AND board_id=nl_boards.id))
WHERE token='demo-baker';

INSERT INTO nl_moves (board_id, pin_id, title, first48, order_index, state, rep_kind, rep_draft, created_at)
VALUES
  ((SELECT id FROM nl_boards WHERE token='demo-baker'),
   (SELECT p.id FROM nl_pins p JOIN nl_boards b ON p.board_id=b.id WHERE b.token='demo-baker' AND p.title='Food safety cert'),
   'Finish module 3',
   $s$Two hours Tuesday night. Finish module 3, screenshot the progress bar, send it to Rosa before Wednesday.$s$,
   0,'pending','plan',NULL, NOW() - interval '4 days'),
  ((SELECT id FROM nl_boards WHERE token='demo-baker'),
   (SELECT p.id FROM nl_pins p JOIN nl_boards b ON p.board_id=b.id WHERE b.token='demo-baker' AND p.title='Café wholesale'),
   'Email Fern & Ground the sample menu',
   $s$Three items, prices included, Friday drop-off offer. Five sentences, sent by tomorrow noon.$s$,
   1,'done','email',
   $s$Subject: Samples for Friday

Hi Dana —

I bake the sourdough and cakes at the Saturday market on Elm. A few of your regulars keep telling me they'd buy my lemon poppy loaf with their coffee, so I'd rather let you taste it than keep hearing about it.

I'll drop three samples Friday morning: lemon poppy loaf ($14 wholesale), cardamom buns ($12 for six), and choc-orange cake by the slice. If any of it fits your case, I can do a standing Friday drop.

— Maya$s$,
   NOW() - interval '4 days'),
  ((SELECT id FROM nl_boards WHERE token='demo-baker'),
   (SELECT p.id FROM nl_pins p JOIN nl_boards b ON p.board_id=b.id WHERE b.token='demo-baker' AND p.title='Instagram preorders'),
   'Open four April preorder slots',
   $s$One post: the choc-orange cake photo, four slots, link in bio. Up before Sunday.$s$,
   2,'pending','post',NULL, NOW() - interval '4 days');

INSERT INTO nl_messages (board_id, pin_id, move_id, role, content, created_at) VALUES
  ((SELECT id FROM nl_boards WHERE token='demo-baker'), NULL, NULL, 'user',
   $s$I want to turn my weekend cake orders into a real bakery$s$, NOW() - interval '21 days'),
  ((SELECT id FROM nl_boards WHERE token='demo-baker'), NULL, NULL, 'assistant',
   $s$Same read as Wednesday: demand is proven, the oven is the cap, the cert is the gate. Board's current — argue with any pin that feels wrong.$s$, NOW() - interval '2 days'),
  ((SELECT id FROM nl_boards WHERE token='demo-baker'),
   (SELECT p.id FROM nl_pins p JOIN nl_boards b ON p.board_id=b.id WHERE b.token='demo-baker' AND p.title='Cottage food permit'),
   NULL, 'user',
   $s$Do I really need the inspection if I'm only selling at markets?$s$, NOW() - interval '2 days'),
  ((SELECT id FROM nl_boards WHERE token='demo-baker'),
   (SELECT p.id FROM nl_pins p JOIN nl_boards b ON p.board_id=b.id WHERE b.token='demo-baker' AND p.title='Cottage food permit'),
   NULL, 'assistant',
   $s$Market-only changes the paperwork in some counties, not the inspection. That's exactly why this pin says GET HELP — the county food office answers this in one free phone call, with your address in front of them. My guess isn't worth your kitchen.$s$, NOW() - interval '2 days' + interval '1 minute'),
  ((SELECT id FROM nl_boards WHERE token='demo-baker'), NULL,
   (SELECT m.id FROM nl_moves m JOIN nl_boards b ON m.board_id=b.id WHERE b.token='demo-baker' AND m.title='Email Fern & Ground the sample menu'),
   'user', $s$Can you help me write the café email? I don't want to sound desperate.$s$, NOW() - interval '4 days'),
  ((SELECT id FROM nl_boards WHERE token='demo-baker'), NULL,
   (SELECT m.id FROM nl_moves m JOIN nl_boards b ON m.board_id=b.id WHERE b.token='demo-baker' AND m.title='Email Fern & Ground the sample menu'),
   'assistant', $s$Desperate is asking permission. You're offering samples — cafés live on good suppliers finding them. Rough cut, tell me what's wrong with it:

Subject: Samples for Friday

Hi Dana —

I bake the sourdough and cakes at the Saturday market on Elm. A few of your regulars keep telling me they'd buy my lemon poppy loaf with their coffee, so I'd rather let you taste it than keep hearing about it.

I'll drop three samples Friday morning: lemon poppy loaf ($14 wholesale), cardamom buns ($12 for six), and choc-orange cake by the slice. If any of it fits your case, I can do a standing Friday drop.

— Maya$s$, NOW() - interval '4 days' + interval '2 minutes');

INSERT INTO nl_checkins (board_id, note, summary, changes, dodged, created_at) VALUES
  ((SELECT id FROM nl_boards WHERE token='demo-baker'),
   $s$Sold out both Saturdays, sent the café samples a day late, didn't open the course once.$s$,
   $s$Two sell-outs and samples out the door — that's a real week, late or not. The cert didn't move again, though. It gates the permit, the permit gates wholesale, and wholesale is the growth story. Module 3 is two hours.$s$,
   '[]'::jsonb,
   $s$Food safety cert — it gates wholesale, and wholesale is the story.$s$,
   NOW() - interval '4 days');

-- ============================================================ DEV (swim)
INSERT INTO nl_boards (token, kind, name, door, goal_text, ai_familiarity, craft_comfort, stage, stat_chips, trajectory, bet, created_at, updated_at)
VALUES (
  'demo-swim', 'demo', 'Dev', 'ambition',
  $s$I want to go from teaching swim lessons to running the whole program$s$,
  'new', 'confident', 'board',
  $j$[{"value":"31","label":"KIDS / WK","tone":"good"},{"value":"14","label":"WAITLIST","tone":"warn"},{"value":"$38","label":"PER LESSON","tone":"neutral"}]$j$::jsonb,
  $j${"title":"NEXT SEPTEMBER","headline":"~$1,150","unit":"/wk","series":[{"x":"FEB","y":590,"projected":false},{"x":"MAR","y":620,"projected":false},{"x":"APR","y":620,"projected":false},{"x":"MAY","y":650,"projected":false},{"x":"JUN","y":780,"projected":true},{"x":"JUL","y":860,"projected":true},{"x":"SEP","y":1150,"projected":true}],"milestones":[{"x":"JUN","label":"WSI CERT"},{"x":"SEP","label":"FALL PROGRAM"}]}$j$::jsonb,
  $j${"pinTitle":"WSI certification","text":"The cert. It's one weekend a town over and it keeps not being this weekend. Five clinic yeses don't matter if June's course fills."}$j$::jsonb,
  NOW() - interval '12 days', NOW() - interval '5 hours'
);

INSERT INTO nl_pins (board_id, title, verdict, verdict_why, difficulty, impact, kind, viz_data, detail, verify_yourself, last_touched_at)
SELECT b.id, p.* FROM nl_boards b,
LATERAL (VALUES
  ('Lesson load','start',$s$Full is proof. Full is also the ceiling — raise the rate or raise your rank.$s$,3,8,'bars',
    $j${"unit":"lessons/wk","bars":[{"label":"MON","value":6},{"label":"TUE","value":7},{"label":"WED","value":7},{"label":"THU","value":6},{"label":"SAT","value":5}],"capLine":{"value":7,"label":"POOL SLOTS"}}$j$::jsonb,
    NULL, false, NOW() - interval '5 hours'),
  ('The waitlist','start',$s$Fourteen waiting families isn't a queue, it's a clinic that hasn't been offered yet.$s$,4,9,'stat',
    $j${"value":"14","label":"FAMILIES WAITING","sub":"5 SAID YES"}$j$::jsonb,
    NULL, false, NOW() - interval '26 hours'),
  ('WSI certification','start',$s$The rec center won't hand a program to someone without the letters. One weekend fixes that.$s$,5,9,'steps',
    $j${"steps":[{"label":"Prereq swim test","state":"done"},{"label":"Weekend course","state":"active"},{"label":"Teach-back","state":"todo"}],"caption":"ONE WEEKEND"}$j$::jsonb,
    NULL, false, NOW() - interval '2 days'),
  ('Rec director pitch','schedule',$s$The proposal lands harder with the cert booked and five clinic yeses attached.$s$,6,10,'pipeline',
    $j${"items":[{"name":"Coffee chat","status":"DONE","state":"done"},{"name":"Program proposal","status":"DRAFTING","state":"active"},{"name":"Budget meeting","status":"JUNE","state":"todo"}]}$j$::jsonb,
    NULL, false, NOW() - interval '3 days'),
  ('Program insurance','gethelp',$s$Program liability is a phone call to the rec admin, not a guess.$s$,4,7,'table',
    $j${"rows":[{"label":"Liability coverage","state":"todo","note":"ASK REC ADMIN"},{"label":"CPR renewal","state":"done"},{"label":"WSI cert","state":"active"},{"label":"Background check","state":"done"}]}$j$::jsonb,
    $j${"blocks":[{"type":"text","body":"Coverage rules live with the rec department, not the internet. Ask the admin what the program needs before fall registration opens — and verify anything legal yourself."}]}$j$::jsonb,
    true, NOW() - interval '4 days'),
  ('Saturday stroke clinic','start',$s$Five yeses turned the pilot from a plan into a booking problem.$s$,4,8,'calendar',
    $j${"month":"MAY","marks":[{"day":9,"kind":"event"},{"day":16,"kind":"event"},{"day":23,"kind":"event"},{"day":30,"kind":"due"}],"caption":"4 SATURDAYS"}$j$::jsonb,
    NULL, false, NOW() - interval '25 hours')
) AS p(title, verdict, verdict_why, difficulty, impact, kind, viz_data, detail, verify_yourself, last_touched_at)
WHERE b.token = 'demo-swim';

UPDATE nl_pins SET related_pin_ids = jsonb_build_array(
  (SELECT id FROM nl_pins p2 WHERE p2.title='WSI certification' AND p2.board_id=nl_pins.board_id),
  (SELECT id FROM nl_pins p3 WHERE p3.title='The waitlist' AND p3.board_id=nl_pins.board_id))
WHERE title='Saturday stroke clinic' AND board_id=(SELECT id FROM nl_boards WHERE token='demo-swim');

UPDATE nl_boards SET bet = bet || jsonb_build_object('pinId',
  (SELECT id FROM nl_pins WHERE title='WSI certification' AND board_id=nl_boards.id))
WHERE token='demo-swim';

INSERT INTO nl_moves (board_id, pin_id, title, first48, order_index, state, rep_kind, rep_draft, created_at)
VALUES
  ((SELECT id FROM nl_boards WHERE token='demo-swim'),
   (SELECT p.id FROM nl_pins p JOIN nl_boards b ON p.board_id=b.id WHERE b.token='demo-swim' AND p.title='WSI certification'),
   'Book the WSI weekend course',
   $s$Register before Friday — the June course caps at 12 and it's the only one within an hour.$s$,
   0,'pending','plan',NULL, NOW() - interval '2 days'),
  ((SELECT id FROM nl_boards WHERE token='demo-swim'),
   (SELECT p.id FROM nl_pins p JOIN nl_boards b ON p.board_id=b.id WHERE b.token='demo-swim' AND p.title='The waitlist'),
   'Tell the five yeses the clinic date',
   $s$One text to five families: first stroke clinic May 9, 8am, $25. First reply gets first lane.$s$,
   1,'pending','message',NULL, NOW() - interval '2 days'),
  ((SELECT id FROM nl_boards WHERE token='demo-swim'),
   (SELECT p.id FROM nl_pins p JOIN nl_boards b ON p.board_id=b.id WHERE b.token='demo-swim' AND p.title='Rec director pitch'),
   'Rough out the program proposal',
   $s$One page: your numbers now, the clinic plan, what fall looks like if it works. Rough is fine.$s$,
   2,'pending','pitch',NULL, NOW() - interval '2 days');

INSERT INTO nl_messages (board_id, pin_id, move_id, role, content, created_at) VALUES
  ((SELECT id FROM nl_boards WHERE token='demo-swim'), NULL, NULL, 'user',
   $s$I want to go from teaching swim lessons to running the whole program$s$, NOW() - interval '12 days'),
  ((SELECT id FROM nl_boards WHERE token='demo-swim'), NULL, NULL, 'assistant',
   $s$You're full five days a week with fourteen families waiting — the demand argument makes itself. What's left is the letters after your name and one page for the director. Board's live; poke it.$s$, NOW() - interval '2 days');

INSERT INTO nl_checkins (board_id, note, summary, changes, dodged, created_at)
VALUES (
  (SELECT id FROM nl_boards WHERE token='demo-swim'),
  $s$Texted six families — five yeses within the hour. Course registration tab is still open.$s$,
  $s$Five yeses in an hour isn't a waitlist, it's a market. And the tab being "still open" tells us both something. Close it the right way: register, then text the five the first clinic date.$s$,
  (SELECT jsonb_build_array(jsonb_build_object(
     'pinId', (SELECT p.id FROM nl_pins p JOIN nl_boards b ON p.board_id=b.id WHERE b.token='demo-swim' AND p.title='Saturday stroke clinic'),
     'field','verdict','from','schedule','to','start',
     'why','Five yeses turned the pilot from a plan into a booking problem.'))),
  $s$WSI certification — a full clinic without the cert is a hobby, not a program.$s$,
  NOW() - interval '26 hours'
);

-- ==================================================== SKIP PINS (the payoff)
-- The product's promise is triage relief, and the reveal leads with what comes
-- OFF the board. A demo with nothing skipped shows a to-do list instead.
INSERT INTO nl_pins (board_id, title, verdict, verdict_why, difficulty, impact, kind, viz_data, verify_yourself, last_touched_at)
VALUES
  ((SELECT id FROM nl_boards WHERE token='demo-baker'),
   'Farmers market second stall', 'skip',
   $s$Another Saturday stall doubles the baking and the oven is already the cap. Costs more than it moves.$s$,
   7, 3, 'bars',
   $j${"unit":"hrs/wk","bars":[{"label":"BAKE","value":18},{"label":"STALL","value":9},{"label":"SPARE","value":10}],"capLine":{"value":10,"label":"spare"}}$j$::jsonb,
   false, NOW() - interval '5 days'),
  ((SELECT id FROM nl_boards WHERE token='demo-swim'),
   'Own pool rental', 'skip',
   $s$Renting water before you run a program is paying for the hard part twice. Not now.$s$,
   8, 2, 'stat',
   $j${"value":"$640","label":"PER MONTH","sub":"RENT"}$j$::jsonb,
   false, NOW() - interval '6 days');

-- ============================================== MOVE CYCLES + DONE STAMPS
-- Every check-in issues a fresh set of three. Maya has been through one, so her
-- board exercises cycle_index and the "2 of 3 this round" count.
UPDATE nl_moves SET cycle_index = 0,
  done_at = CASE WHEN state <> 'pending' THEN NOW() - interval '9 days' ELSE NULL END
WHERE board_id = (SELECT id FROM nl_boards WHERE token='demo-baker');

UPDATE nl_moves SET cycle_index = 1, created_at = NOW() - interval '26 hours'
WHERE board_id = (SELECT id FROM nl_boards WHERE token='demo-baker')
  AND state = 'pending';

INSERT INTO nl_moves (board_id, pin_id, title, first48, order_index, cycle_index, state, rep_kind, done_at, created_at)
VALUES (
  (SELECT id FROM nl_boards WHERE token='demo-baker'),
  (SELECT p.id FROM nl_pins p JOIN nl_boards b ON p.board_id=b.id WHERE b.token='demo-baker' AND p.title='Food safety cert'),
  'Book the food handler exam', $s$Pick a date this week and pay the $28. Two minutes.$s$,
  2, 1, 'done', 'none', NOW() - interval '30 hours', NOW() - interval '26 hours'
);

UPDATE nl_moves SET cycle_index = 0,
  done_at = CASE WHEN state <> 'pending' THEN NOW() - interval '3 days' ELSE NULL END
WHERE board_id = (SELECT id FROM nl_boards WHERE token='demo-swim');

-- ============================================================== CHECKLISTS
-- done_at values are spread across six weeks and deliberately leave one week
-- empty — the strip should read like a real person, not a filled bar.
INSERT INTO nl_tasks (board_id, pin_id, label, done, done_at, order_index)
VALUES
  ((SELECT id FROM nl_boards WHERE token='demo-baker'),
   (SELECT p.id FROM nl_pins p JOIN nl_boards b ON p.board_id=b.id WHERE b.token='demo-baker' AND p.title='Cottage food permit'),
   'Print the county application', true, NOW() - interval '34 days', 0),
  ((SELECT id FROM nl_boards WHERE token='demo-baker'),
   (SELECT p.id FROM nl_pins p JOIN nl_boards b ON p.board_id=b.id WHERE b.token='demo-baker' AND p.title='Cottage food permit'),
   'Measure the kitchen for the diagram', true, NOW() - interval '20 days', 1),
  ((SELECT id FROM nl_boards WHERE token='demo-baker'),
   (SELECT p.id FROM nl_pins p JOIN nl_boards b ON p.board_id=b.id WHERE b.token='demo-baker' AND p.title='Cottage food permit'),
   'Ask Rosa which inspector she got', false, NULL, 2),
  ((SELECT id FROM nl_boards WHERE token='demo-baker'),
   (SELECT p.id FROM nl_pins p JOIN nl_boards b ON p.board_id=b.id WHERE b.token='demo-baker' AND p.title='Food safety cert'),
   'Finish module 3', true, NOW() - interval '6 days', 0),
  ((SELECT id FROM nl_boards WHERE token='demo-baker'),
   (SELECT p.id FROM nl_pins p JOIN nl_boards b ON p.board_id=b.id WHERE b.token='demo-baker' AND p.title='Food safety cert'),
   'Modules 4 to 6', false, NULL, 1),
  ((SELECT id FROM nl_boards WHERE token='demo-swim'),
   (SELECT p.id FROM nl_pins p JOIN nl_boards b ON p.board_id=b.id WHERE b.token='demo-swim' AND p.title='WSI certification'),
   'Find the nearest course date', true, NOW() - interval '13 days', 0),
  ((SELECT id FROM nl_boards WHERE token='demo-swim'),
   (SELECT p.id FROM nl_pins p JOIN nl_boards b ON p.board_id=b.id WHERE b.token='demo-swim' AND p.title='WSI certification'),
   'Register and pay', false, NULL, 1),
  ((SELECT id FROM nl_boards WHERE token='demo-swim'),
   (SELECT p.id FROM nl_pins p JOIN nl_boards b ON p.board_id=b.id WHERE b.token='demo-swim' AND p.title='Saturday stroke clinic'),
   'Text the five who said yes', true, NOW() - interval '2 days', 0);

-- ============================================================ PRIYA (care)
-- The juggle door had no shop window at all, and both other demos are goals
-- that look like small businesses. This one proves the product isn't career
-- software, and it naturally exercises the verify-yourself rail: a Medicaid
-- five-year look-back is exactly where we point at a human, not a guess.
INSERT INTO nl_boards (token, kind, name, door, goal_text, ai_familiarity, craft_comfort, stage, stat_chips, trajectory, bet, created_at, updated_at)
VALUES (
  'demo-care', 'demo', 'Priya', 'juggle',
  $s$Mum can't live alone much longer and I'm the one holding all of it$s$,
  'new', 'none', 'board',
  $j$[{"value":"11","label":"TOURED","tone":"neutral"},{"value":"$2,400","label":"PER MONTH","tone":"warn"},{"value":"14 MO","label":"SAVINGS LAST","tone":"warn"}]$j$::jsonb,
  $j${"title":"NEXT SUMMER","headline":"$2,400","unit":"/mo","series":[{"x":"FEB","y":900,"projected":false},{"x":"MAR","y":900,"projected":false},{"x":"APR","y":1400,"projected":false},{"x":"MAY","y":1400,"projected":false},{"x":"JUN","y":1900,"projected":false},{"x":"SEP","y":2400,"projected":true},{"x":"DEC","y":2400,"projected":true},{"x":"MAR","y":2400,"projected":true},{"x":"JUN","y":2400,"projected":true}],"milestones":[{"x":"SEP","label":"MOVE IN"},{"x":"MAR","label":"REVIEW"}]}$j$::jsonb,
  $j${"pinTitle":"Split the load with siblings","text":"The sibling conversation. You'll keep doing it all yourself because that's faster than asking twice — and it's the only thing on here that gets worse if you wait."}$j$::jsonb,
  NOW() - interval '38 days', NOW() - interval '5 hours'
);

INSERT INTO nl_pins (board_id, title, verdict, verdict_why, difficulty, impact, kind, viz_data, verify_yourself, last_touched_at)
VALUES
  ((SELECT id FROM nl_boards WHERE token='demo-care'), 'Places toured', 'start',
   $s$Eleven visits and a clear top two. You know more than you think you do.$s$,
   3, 6, 'pipeline',
   $j${"items":[{"name":"Northview Care","status":"TOUR MON","state":"active"},{"name":"Rosewood","status":"WAITLIST","state":"todo"},{"name":"Elm House","status":"RULED OUT","state":"done"}]}$j$::jsonb,
   false, NOW() - interval '5 hours'),
  ((SELECT id FROM nl_boards WHERE token='demo-care'), 'What the money covers', 'gethelp',
   $s$A five-year look-back decides whether the savings last two years or fourteen months. That is an elder-law question, not a reading-the-website question.$s$,
   6, 9, 'table',
   $j${"rows":[{"label":"Medicaid look-back","state":"waiting","note":"5 YR RULE"},{"label":"Her pension","state":"done","note":"CONFIRMED"},{"label":"House equity","state":"todo","note":"UNKNOWN"},{"label":"Long-term care policy","state":"waiting","note":"CHECK"}]}$j$::jsonb,
   true, NOW() - interval '2 days'),
  ((SELECT id FROM nl_boards WHERE token='demo-care'), 'Split the load with siblings', 'start',
   $s$Three of you, one doing everything. This is the pin that changes your year, not hers.$s$,
   7, 8, 'bars',
   $j${"unit":"hrs/wk","bars":[{"label":"YOU","value":16},{"label":"RAJ","value":2},{"label":"ANITA","value":1}]}$j$::jsonb,
   false, NOW() - interval '1 day'),
  ((SELECT id FROM nl_boards WHERE token='demo-care'), 'Sell the house now', 'skip',
   $s$Not while the look-back is unanswered — selling first can cost more than it raises. It has a date, and the date is after the lawyer.$s$,
   5, 4, 'stat',
   $j${"value":"AFTER","label":"THE LAWYER","sub":"NOT YET"}$j$::jsonb,
   true, NOW() - interval '4 days'),
  ((SELECT id FROM nl_boards WHERE token='demo-care'), 'Her own say in it', 'start',
   $s$She has toured none of them. The list gets shorter and easier the moment she sees two.$s$,
   4, 7, 'steps',
   $j${"steps":[{"label":"Talked money","state":"done"},{"label":"Talked moving","state":"active"},{"label":"She visits two","state":"todo"},{"label":"She picks","state":"todo"}],"caption":"her decision, your legwork"}$j$::jsonb,
   false, NOW() - interval '3 days'),
  ((SELECT id FROM nl_boards WHERE token='demo-care'), 'Your own week', 'schedule',
   $s$Sixteen hours a week of care and no hours of anything else is how carers end up as patients. Book one evening back, this month.$s$,
   4, 6, 'calendar',
   $j${"month":"AUG","marks":[{"day":6,"kind":"event"},{"day":13,"kind":"event"},{"day":20,"kind":"due"}],"caption":"one evening back"}$j$::jsonb,
   false, NOW() - interval '6 days');

INSERT INTO nl_moves (board_id, pin_id, title, first48, order_index, cycle_index, state, rep_kind, done_at, created_at)
VALUES
  ((SELECT id FROM nl_boards WHERE token='demo-care'),
   (SELECT p.id FROM nl_pins p JOIN nl_boards b ON p.board_id=b.id WHERE b.token='demo-care' AND p.title='What the money covers'),
   'Book an elder-law consult', $s$One call to ask for a paid first appointment. Say "five-year look-back" and they will know what you need.$s$,
   0, 0, 'pending', 'none', NULL, NOW() - interval '2 days'),
  ((SELECT id FROM nl_boards WHERE token='demo-care'),
   (SELECT p.id FROM nl_pins p JOIN nl_boards b ON p.board_id=b.id WHERE b.token='demo-care' AND p.title='Split the load with siblings'),
   'Send Raj and Anita the hours', $s$Not a complaint — the three bars from this board and one question: which of these do you take?$s$,
   1, 0, 'pending', 'message', NULL, NOW() - interval '2 days'),
  ((SELECT id FROM nl_boards WHERE token='demo-care'),
   (SELECT p.id FROM nl_pins p JOIN nl_boards b ON p.board_id=b.id WHERE b.token='demo-care' AND p.title='Her own say in it'),
   'Put Northview in front of her', $s$Monday tour, two seats. Ask her once, then stop selling it.$s$,
   2, 0, 'done', 'none', NOW() - interval '28 hours', NOW() - interval '2 days');

INSERT INTO nl_tasks (board_id, pin_id, label, done, done_at, order_index)
VALUES
  ((SELECT id FROM nl_boards WHERE token='demo-care'),
   (SELECT p.id FROM nl_pins p JOIN nl_boards b ON p.board_id=b.id WHERE b.token='demo-care' AND p.title='What the money covers'),
   'Find her pension statement', true, NOW() - interval '27 days', 0),
  ((SELECT id FROM nl_boards WHERE token='demo-care'),
   (SELECT p.id FROM nl_pins p JOIN nl_boards b ON p.board_id=b.id WHERE b.token='demo-care' AND p.title='What the money covers'),
   'Dig out the insurance folder', true, NOW() - interval '12 days', 1),
  ((SELECT id FROM nl_boards WHERE token='demo-care'),
   (SELECT p.id FROM nl_pins p JOIN nl_boards b ON p.board_id=b.id WHERE b.token='demo-care' AND p.title='What the money covers'),
   'Ask about the look-back', false, NULL, 2),
  ((SELECT id FROM nl_boards WHERE token='demo-care'),
   (SELECT p.id FROM nl_pins p JOIN nl_boards b ON p.board_id=b.id WHERE b.token='demo-care' AND p.title='Places toured'),
   'Second visit to Northview', true, NOW() - interval '30 hours', 0);

INSERT INTO nl_messages (board_id, pin_id, move_id, role, content, created_at) VALUES
  ((SELECT id FROM nl_boards WHERE token='demo-care'), NULL, NULL, 'user',
   $s$Mum can't live alone much longer and I'm the one holding all of it$s$, NOW() - interval '38 days'),
  ((SELECT id FROM nl_boards WHERE token='demo-care'), NULL, NULL, 'assistant',
   $s$Eleven tours in and the housing question is nearly answered. The two that aren't: what the money actually covers, and why you're doing sixteen hours a week to your brother's two. Board's current — argue with anything that reads wrong.$s$, NOW() - interval '5 hours');

INSERT INTO nl_checkins (board_id, note, summary, changes, dodged, created_at)
VALUES (
  (SELECT id FROM nl_boards WHERE token='demo-care'),
  $s$Took Mum to Northview and she liked the garden. Still haven't rung the lawyer or spoken to Raj.$s$,
  $s$She liked the garden — that's the first time she's chosen anything in this, and it moves the whole housing question forward. The two you didn't do are the two that cost money and pride. One of them has a five-year clock on it.$s$,
  (SELECT jsonb_build_array(jsonb_build_object(
     'pinId', (SELECT p.id FROM nl_pins p JOIN nl_boards b ON p.board_id=b.id WHERE b.token='demo-care' AND p.title='Her own say in it'),
     'field','verdict','from','schedule','to','start',
     'why','She picked something. That turns a conversation into a shortlist.'))),
  $s$Split the load with siblings — every week you wait, doing it all yourself becomes the arrangement instead of the emergency.$s$,
  NOW() - interval '27 hours'
);


COMMIT;
