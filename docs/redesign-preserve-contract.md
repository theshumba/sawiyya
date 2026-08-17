# Sawiyya Redesign — Preserve Contract (Regression Firewall)

> Source: 14-screen read-only audit + live read of `src/store/ui.ts`, `src/App.tsx`,
> `src/components/ui.tsx`, `tailwind.config.js`, `src/components/BottomNav.tsx`,
> `scripts/smoke.mjs`, `scripts/shots.mjs`.
>
> **Rule:** the nav + premium-UX redesign is **presentation-only re behaviour**. Every store
> hook/action, every `go({...})` route (with its params), every handler, every `t()`/`pick()`/`num()`
> key, and every guard below MUST survive verbatim. If you remove a JSX twin tree, the surviving
> single tree must still carry 100% of the items listed for that file. Check each box during the re-skin.

---

## 0. Shared invariants (apply to ALL files)

**Routing / Screen union (`src/store/ui.ts`)** — current members, none may be removed or have params dropped:

- `{ name: "home" }`
- `{ name: "lesson"; lessonId: string; reviewOnly?: boolean }` — `lessonId:'review'` + `reviewOnly:true` are load-bearing literals.
- `{ name: "camera"; targetSignId?: string }` — `targetSignId` deep-link is load-bearing.
- `{ name: "family" }`
- `{ name: "flagPicker" }`
- `{ name: "progress" }`
- `{ name: "settings" }`
- `{ name: "aiTransparency" }`
- `{ name: "privacy" }`
- `{ name: "devMetrics" }`
- `{ name: "firstSign" }`
- `{ name: "allSigns" }`
- `go(screen)` calls `set({screen})` then `window.scrollTo({top:0})` — scroll-reset-on-nav behaviour must persist.
- **Additions allowed (additive only):** a Practise goal-chooser screen and (if routed rather than onboarding-step) a startup learn-picker. New members must not change existing members. See spec §2.

**App gate (`src/App.tsx`)**

- `onboarded` + `activeProfile` gate: `if (!onboarded || !profile) return <Onboarding/>`.
- `useEffect(applyDir, [lang])` — RTL/LTR document direction. MUST survive.
- `screen.name` switch renders every screen above; `camera` keyed by `targetSignId ?? "free"`; `lesson` keyed by `lessonId`.
- `NAV_SCREENS = {home, camera, family, progress, allSigns}` decides when BottomNav mounts. Re-skin replaces this with the new shell's mount logic but must preserve which screens are "shelled" vs full-takeover (lesson/firstSign/settings/info/flagPicker/devMetrics are takeovers today).

**i18n (`src/i18n.ts` is FROZEN)**

- `applyDir(lang)` sets `dir` (rtl for `ar`). Re-invoke on every language choice.
- `t(key, lang)`, `pick(lang, en, ar)`, `num(value, lang)` are the only copy paths. Do NOT silently swap a `pick()` literal for a missing `t()` key (renders empty). New keys may be added to `i18n.ts` if a literal is promoted, but the audit assumes the file is frozen — prefer keeping `pick()` literals.

**Recognizer / engine fixes already shipped (`src/recognizer/knn.ts` + CameraTrainer) — NEVER touch logic:**

- `classifyAgainst(vec, sign.id)` grades against the **specific** class, never global argmax (#bug fix).
- `addToReview`, `addSample`, `sampleCount`, `clearClass`, `flushSamples`, `trainedClassIds`, `isTrained` persistence path.
- `recordDrillResult` opts schema `{ selfMark?, camera?, matched?, watch? }`; outcome strings `'good' | 'hard' | 'again'`.
- `flaggedSigns` resolved via `signById` NOT `A1_SIGNS.find` (#M3 — keeps alphabet flags resolving).
- Watch/browse must NOT seed SRS or inflate Learned (#M5).
- `cameraGradable → targetSignId` gate: dynamic signs must never enter teach mode.
- `GRADABLE_SIGNS = A1_SIGNS.filter(s=>s.cameraGradable)`.

**Design tokens that MUST exist (`tailwind.config.js`) — primitives in `ui.tsx` depend on them:**

- colors: `teal` (DEFAULT/deep/ink), `coral` (DEFAULT/soft), `gold` (DEFAULT/soft), `sand`, `paper`, `ink`, `muted`, `line`.
- fonts: `font-sans` (Readex Pro), `font-display` (Rubik).
- radii: `xl/2xl/3xl/bowl`. shadows: `soft/lift/gold/coral`. animations: `pop-in/rise/pulse-ring/shimmer`.
- styles.css utilities: `.extruded-coral/.extruded-teal/.extruded-gold` (+ `:active:not(:disabled)`), `.material-fill`, `.safe-bottom`, `.no-scrollbar`.
- Material Symbols `<link>` in `index.html`.
- **New token additions are additive** (see spec §4 hex→token map). Inline SVG hex in `Logo`/`ProgressRing` (`#0F6E6A`, `#E6B24C`) is intentional — keep in sync deliberately.

**Confetti** — `celebrate()` side-effect + `<Confetti burst={burst}/>`; `burst` increments to re-trigger. Preserve ordering wherever used (FirstSign, LessonPlayer, CameraPractice, Progress).

---

## 1. `src/screens/Onboarding.tsx`

- **Hooks:** `useApp()→{createProfile, completeOnboarding}`; `useUi()→{go}`. Local state machine: `step, lang, persona, hand, goal, name`.
- **Actions (ORDER IS LOAD-BEARING):** `createProfile({displayName, role, dominantHand, language, dailyGoal})` → `completeOnboarding()` → `go({name:"firstSign"})`. `completeOnboarding()` MUST fire or user is trapped.
- **Routes:** `go({name:"firstSign"})` — fired in `finish()` for BOTH normal submit and Skip.
- **Handlers:** `finish(overrides?)` — `displayName = name.trim() || (lang==="ar"?"أنا":"Me")`; `skipAll` forces `role="parent", dominantHand="R", dailyGoal="regular"` (but keeps chosen lang). `chooseLang(l)` = `setLang(l)` + **`applyDir(l)`** + `setStep("why")`. `back()` guarded by `stepIndex>0`. Persona select (no auto-advance). Hand/goal select auto-advance today (spec changes to select-then-Continue — preserve the _write_ `setHand/setGoal`). Splash CTA→`setStep("lang")`; Why Continue→`setStep("hand")`; Skip→`finish({skipAll:true})`; name `<form>` onSubmit→`preventDefault()`+`finish()`.
- **t/pick keys:** `tagline`(en), `obStart`(en), `obChooseLang`, `obWhoTitle`(en+ar), `obWhoSub`, persona keys `obParent/obSibling/obTeacher/obFriend/obDeaf` (+ unused `*Sub` data), `obHandTitle/obHandSub/obRight/obLeft`, `obGoalTitle/obGoalSub/obCasual/obRegular/obSerious`, `obNameTitle`, `obSkip`, `obContinue`. `pick(lang,"Special Path","مسار خاص")`. `PERSONA_TAGLINE[persona]` (guarded) from `content/signs`. Brand literals (keep): "Learn to sign — together, as equals.", "Empowering Families", name placeholder, back aria-label, persona AR labels.
- **Guards:** `stepIndex>0` in back; top-bar hidden on splash; `p.value==="deaf"`→gold card variant; skipAll ternaries; `PERSONA_TAGLINE[persona]` existence; displayName fallback; `maxLength={20}`.
- **Other:** `STEP_ORDER = ["splash","lang","why","hand","goal","name"]` drives `stepIndex` + `back()` — **if you add the learn-picker step, insert into STEP_ORDER and fix progress-dot math** (currently fake 4-pip mobile / 3-pip desktop). `applyDir(lang)` side-effect. PERSONAS img paths + ar labels; GOALS material icons; autoFocus name; extruded-\* CSS; BrandPanel (lg+); imports Button/Icon/Logo/Wordmark.

## 2. `src/screens/Home.tsx` (→ Learn tab content; strip nav duties)

- **Hooks:** `useApp()` (app); `useUi()→{go}`; `profile = activeProfile(app)` **early-return null**; `lang=profile.language`; `goalXp=GOAL_XP[profile.dailyGoal]`; `xpToday = xpTodayFor(profile)` (NOT stale total); `prog = app.progress[profile.id] ?? {}`; `due = dueSignIds(app, profile.id)`; `flags = pinnedFlagSigns(app, profile.id).filter(f=>f.raisedByProfileId!==profile.id)`; resolve flag author via `app.profiles.find`; `ms = nextMilestone(app, profile.id, lang)`. Reads `streak, xp, displayName, dailyGoal, id, language`.
- **Actions:** NONE (read-only screen — no mutations to lose).
- **Routes (ALL preserve):** `go({name:"lesson", lessonId: lesson.id})` (current-node START); `go({name:"lesson", lessonId: nextLesson.id})` (Practice Now); `go({name:"lesson", lessonId:"review", reviewOnly:true})` (review card); `go({name:"camera"})` (practiceHero/alphabetCard — **MOVING to Practise tab, keep the route, relocate the trigger**); `go({name:"camera", targetSignId: sign.cameraGradable ? sign.id : undefined})` (flag cards — **cameraGradable gate load-bearing**); `go({name:"family"|"progress"|"settings"})`.
- **Handlers:** journey START; reviewCard; practiceHero; alphabetCard; mobile+desktop flag cards (conditional targetSignId); app-bar gear→settings; desktop side-nav items; Practice Now.
- **t/pick/num keys:** `homeAllDone, xp, homeToday, homeFlagged, homeNeeds, homeReviewDue, homeReviewCta, homeDailyGoal, homeHeroEyebrow, homeHeroTitle, homeHeroSub, homeHeroCta, camPractice, camPrivacy, navHome, navCamera, navFamily, navProgress, setTitle, homeUnit, homeStreak`. `pick`: lesson titles, sign glosses, `UNIT_A1_U1` title, greeting `Ahlan, ${displayName}`/`أهلًا، ${displayName}`. `num`: xpToday, goalXp, goalPct, due.length, streak, xp. Dual-script literals (no key): `startLabel` ابدأ/START; `practiceNowLabel` تدرّب الآن/Practice Now; percent ٪/%; "A1·1"; sidebar wordmark سويّة.
- **Guards:** `if(!profile) return null`; `nextLesson` = first LESSON with any signId masteryLevel<2 else LESSONS[0]; node status current/done/locked via `complete = every signId masteryLevel>=2`; `(prog[id]?.masteryLevel ?? 0)` null-safe; flags self-filter + `slice(0,3)`; flagSection only if `flags.length>0`; reviewCard only `due.length>0`; milestoneCard only if `ms`; desktop challenges block only `(due.length>0||ms)`; goal bar `Math.max(6, min(1,goalProgress)*100)`; milestone bar `Math.max(4, ms.progress*100)`; `goalPct = round(min(1,goalProgress)*100)`; alphabet→`sign.code` else image; `if(!sign) return null` in flag maps.
- **Other:** offsets `['ms-28','me-16','ms-20','-ms-10']` cycled by i%len (winding path); RTL `rtl:rotate-180`, dir on wordmark, ٪ swap; ProgressRing fed unclamped `goalProgress` (ring clamps); progressbar aria on goal bars; SideNavItem + PalmTree local subcomponents; brand assets stitch-31/27/18(x2); UNIT_A1_U1, LESSONS, signById; imports Card/Icon/ProgressRing/Wordmark/Logo.

## 3. `src/screens/CameraPractice.tsx` (→ Practise tab destination; opens pre-targeted)

- **Hooks:** `useApp()→app`; `useUi()→{go}`; `profile=activeProfile(app)` **null→return null**; `lang=profile.language`; `xpTodayFor(profile)`. Indirect via CameraTrainer: `isTrained(sign.id)`, sampleCount/addSample/clearClass/flushSamples/classifyAgainst, useHandTracker, pick.
- **Action (ONLY mutation):** `app.recordDrillResult(signId, 'good', { camera: result==='match', matched: result==='match', selfMark: result==='selfMark' })` — outcome hard-coded `'good'`; **skip does NOT record (early return)**.
- **Routes:** `go({name:'home'})` (close X); `go({name: tab.name} as Screen)` for SideNavBar (home/camera/family/progress — **rail is being deleted; route survives only via shared shell**).
- **Handlers:** `handleResult(result)` — skip→bump round only (no record); else recordDrillResult; match→`celebrate()` + `setBurst(b+1)` + **600ms delay** before round bump, else immediate bump. Word/alphabet chip onClick→`setSignId(s.id)` + `setRound(r+1)`. SideNav tab→go. `onResult={handleResult}` wiring.
- **t/pick keys:** `camPractice, xp, back, navHome/navCamera/navFamily/navProgress`; `pick(lang, s.glossEn, s.glossAr)` chips; `s.glossEn` alphabet aria-label. Indirect (CameraTrainer): camSign/camHold/camConfidence/camReached/camUnsure/camSelfMark/camSelfMarkSub/camSkip/camPrivacy/camLoading/camHandSeen/camLooking/camStart/camBlocked/camTryAgain/camTeach/camTeachSub/camTeachHold/camSamples/camTeachDone/camMatch/camResetClass/fsNowYou + inline literals "Current Goal"/"هدفك الآن", reference helper, "Hold steady for 2 seconds…"/"ثبّت يدك ثانيتين…".
- **Guards:** `if(!profile) return null`; `if(!sign) return null` (signById miss); `GRADABLE_SIGNS` filter; `isTrained(s.id)` tri-state chip (active>trained>untrained; star when trained && !active); skip early-return; match gating on celebrate/burst/600ms; SideNavBar `md:flex` (mobile→shell nav); `initialSignId ?? 'alpha-alif'` default; `aria-current` on active rail.
- **Other:** state `signId, burst, round`; **`CameraTrainer key={`${signId}-${round}`}` remount contract — DO NOT drop**; `<Confetti burst={burst}/>`; alphabet strip `dir='rtl'`; `-mx-5/px-5` bleed + `no-scrollbar`; CameraTrainer invoked WITHOUT allowSkip/autoStart here (skip branch unreachable today but keep it); Logo/Icon/Pill imports.

## 4. `src/screens/FirstSign.tsx` (→ chrome-light onboarding takeover, NO tab bar)

- **Hooks:** `useApp()→app`; `useUi()→{go}`; `profile=activeProfile(app)` **null→return null**; `lang=profile.language`; reads streak/xp/displayName/emoji; `sign=signById('iloveyou')` **null→return null**.
- **Actions:** `recordDrillResult(sign.id, 'good', { camera:match, matched:match, selfMark })`; **`markFirstSignTime()` — fires exactly once on first completion (G1 metric)**.
- **Routes:** home (Keep going, Share, mobile close, desktop logo, sidebar Home), settings (gear), camera (Practice/Camera), family, progress. **`go('home')` on Keep going → spec retargets to Learn home (same route).**
- **Handlers:** `handleResult(result)` → recordDrillResult + markFirstSignTime + celebrate() + setBurst(+1) + setStep('celebrate'). `setStep('try')` (3 triggers — collapse to ONE in spec). `sideItem(icon,label,target,activeNav)` helper. All header/nav go() callbacks.
- **t/pick keys:** `xp`(x3), `fsCelebrate` (AR strips leading "وصلت!" via regex), `fsDone, fsKeepGoing, fsIntro, fsNowYou`; `pick` gloss pair (incl. inverted lang); StepDots `pick(lang, s.winEn||s.en, s.ar)`. Inline literals (keep): Day 1/اليوم ١, Share this moment/شارك هذه اللحظة, Close/إغلاق, Settings/الإعدادات, Home/الرئيسية, Learn/تعلّم, Practice/تدرّب, Family/العائلة, Streak/المواظبة, Camera/الكاميرا, Progress/التقدّم, Learning Together/نتعلّم معًا, "You're on fire!"/أنت متألق!, Start Practice/ابدأ التدريب.
- **Guards:** `if(!profile||!sign) return null`; step machine `'watch'|'try'|'celebrate'` with **celebrate early-return full-takeover**; match vs selfMark branching; desktop `s.winEn` ternary; dir flips on gloss pair + "وصلت!" `dir='rtl'` + `rtl:rotate-180`; **`prefers-reduced-motion → .fs-hero-float animation:none`**; desktop glyphs `md:block`, sidebar `lg:flex`.
- **Other:** `useState<Step>('watch')` + burst counter; `celebrate()`/`<Confetti burst={burst}/>`; **CameraTrainer `autoStart` MUST remain**; SignDemo (sign+lang); brand stitch-22/54; STEPS + StepDots; shared watchBody/tryBody fragments (single tree in spec); animate-pulse-ring/pop-in/rise, extruded-gold/teal, shadow-\* utilities; setBurst ordering.

## 5. `src/screens/LessonPlayer.tsx` (full-screen lesson runtime; launched from Learn)

- **Hooks:** `useApp()→app`; `useUi()→{go}`; `profile=activeProfile(app)`; `profileId=profile?.id ?? ''`; `useApp.getState()` into buildDrillQueue; `lang`; streak; `{recordDrillResult}` destructured in WatchDrill/CameraDrill/ChoiceDrill (3 sites).
- **Actions:** `recordDrillResult(sign.id,'good',{watch:true})` (Watch); `recordDrillResult(sign.id,'hard')` (Camera skip); `recordDrillResult(sign.id,'good',{camera:matched,matched,selfMark})` (Camera match/selfMark); `recordDrillResult(sign.id, id===sign.id?'good':'again')` (Choice, at pick time); **`recordLessonComplete()` — only when `next>=queue.length` (exactly once)**.
- **Routes:** `go({name:'home'})` (close, empty-bounce, onContinue); `go({name:'camera'})` (onCamera, no target today).
- **Handlers:** `advance({xp,scored,correct})` accumulates refs, computes `next`, on last calls recordLessonComplete+celebrate+setBurst, always setIndex(next). WatchDrill onClick. CameraDrill handleResult (skip xp4/match xp10). ChoiceDrill `choose(id)` guarded `if(picked)return`. ChoiceDrill footer onDone. DemoFace replay via `setReplayKey`. ResultsCard onContinue→home / onCamera→camera. **Spec changes end CTA to "Continue" (advance path) but route plumbing stays.**
- **t/pick/num keys:** `close, lsWatchTitle, lsContinue, lsRecogniseTitle, lsRecallTitle, lsReviewTitle, lsCorrect, lsSoftMiss, lsCheck, lsLessonDone, lsXpEarned, accuracy, homeStreak, lsWhatsNext, lsBackHome, practiceCamera`; pick gloss pair (+inverse), choice glosses, choice hint, lesson title; inline "Watch again"/"شاهد مرة أخرى"; num(xp/accuracy/streak).
- **Guards:** `empty = queue.length===0`→useEffect bounce home; `if(!profile||empty) return null`; `done = index>=queue.length`→ResultsCard; `accuracy` divide-by-zero→100; `if(picked)return`; footer `disabled={picked===null}`; recordLessonComplete once; results signIds = lesson.signIds else dedup queue; Drill switch covers watch/camera/recognise/review/recall; iloveyou→stitch-30, alphabet→code; `compact=isCamera` threading.
- **Other:** **`queue = useMemo(buildDrillQueue(...), [lessonId, profileId])` — once per mount, do NOT add app to deps**; refs `xpEarned/scored/correctCount` (stay refs); MeetingBar `progress={index/queue.length}`; **Drill `key={`${drill.type}-${drill.signId}-${index}`}`**; `choices = useState(()=>buildChoices(...))` lazy; pool from ALPHABET vs A1_SIGNS; celebrate/Confetti; CameraTrainer with allowSkip+autoStart; SignDemo vs DemoFace (gloss-less for recognise); MeetingBar/Button/Card/Icon; hint truncation 38; glyph fallback.

## 6. `src/screens/Family.tsx` (→ Family tab; delete in-file desktop shell)

- **Hooks:** `useApp()→app`; `useUi()→{go}`; `profile=activeProfile(app)` **null→return null**; `lang`; `activeFlags(app)→flags`; `signsAllCanDo(app)→board`; `householdStreak(app)→sharedStreak`; `profilesActiveToday(app)→activeToday`; `app.profiles` (filter `role==='deaf'`→deafMembers, `flagger=deafMembers[0]`); `app.activeProfileId`; `todayKey()` vs `p.lastActiveDay`; `signById`.
- **Actions:** `createProfile({displayName, role, dominantHand:'R', language:lang, dailyGoal:'regular'})` via addMember; `switchProfile(p.id)` (tile tap); `switchProfile(app.profiles[0].id)` (guarded desktop "Switch profile").
- **Routes:** `go({name:'flagPicker'})` (flagButton, growCard, intended milestonePill); home/camera/family/progress (desktop rail + Practice Now + partyFab → survive via shared shell).
- **Handlers:** `addMember()` (trim, early-return empty, createProfile, clear, setAdding(false)); setAdding; setNewName (maxLength20); setNewRole (aria-pressed); member tile→switchProfile; desktop nav→go.
- **t/pick/num keys:** `famFlagTitle, famSharedStreak, famSignedToday, famHousehold, famAdd, famName, famFlagged, famOnlyDeafFlags, famBoard, famBoardEmpty, famTitle, famSwitch, homeFlagged, navHome/navCamera/navFamily/navProgress, save, cancel`. pick inline literals (keep): New Milestone/إنجاز جديد, `${milestoneTarget} Combined Signs!`, Grow the mosaic/وسّع الفسيفساء, "Your shared language, growing."/AR, `to Family Milestone (${target})`, Our Majlis/مجلسنا, Practice Now/تدرّب الآن, Majlis Party Mode/وضع احتفال المجلس. `pick` sign glosses + `ROLE_LABEL[r]`. `num` sharedStreak/activeToday/profiles.length/milestoneTarget/boardPct. Hardcoded العائلة alongside `famTitle`.
- **Guards:** `if(!profile) return null`; `flags.length>0` gates flagsRow+needCards; `board.length===0` empty vs honeycomb; `deafMembers.length>0` explainer; flagger fallback heading; adding toggle; `boardPct=min(1,board.length/25)`, bar `Math.max(6,boardPct*100)`; `honeycombCells=Math.max(milestoneTarget,board.length)`; filled cell styling; deaf 🧏 badge + isActive ring/check/zIndex; signedToday ✓; alphabet code vs emoji; RTL gloss-swap on need cards.
- **Other:** `milestoneTarget=25` single source; ROLES + ROLE_LABEL; `CHUNKY='border-[3px] border-teal/15'`; HEX clip-path + stagger + animationDelay; createProfile R/regular defaults; memberAvatars reused mobile+desktop (slice 0,5); stitch-43 hearth; motion-safe animations; **desktop shell (deskRail/deskTopBar/partyFab/navItems) DELETE**; dual layout trees → collapse to one; honeycomb title tooltip.

## 7. `src/screens/FlagPicker.tsx` (sub-route behind Family; delete in-file top nav)

- **Hooks:** `useApp()→app`; `useUi()→{go}`; `profile=activeProfile(app)` **null→return null**; `lang`; `activeFlags(app)→flags`; `app.profiles`; reads streak/emoji/id/language/displayName.
- **Action:** `app.toggleFlag(signId, profile.id)` — per-card tap AND in `clearAll()` loop; `raisedByProfileId` always active profile.id.
- **Routes:** home; camera (no target — spec may add targetSignId); **family (x6 call sites)**; progress.
- **Handlers:** setQuery; `setGroup(gr.id)+setQuery('')` (desktop + mobile); `setMostNeeded(v=>!v)`; `clearAll()`; per-card toggleFlag.
- **t/pick/num keys (extensive):** `famFlagTitle`(x2), `famFlagged, famFlagSub, cancel, save`(x2), `back`; pick group labels Home/Food/Feelings/School + nav labels + "Learning groups"(x2) + "Learning Groups" + "Coming soon"(x2) + "+ New Category" + search placeholder/aria + "Most Needed" + "Filter" + "No signs match" + sign gloss primary/secondary (bilingual swap) + priorityLabel High/Medium + `${num} signs flagged...` + "Tap a sign to flag it." + Requestors + waiting + "Clear all" + Weekly Goal + `${goalPct}% Complete` + progress aria + "You direct what they learn"; num(streak/flaggedSigns.length x3/requestors overflow/goalPct); hardcoded headingAr "علّم الإشارات اللي نحتاجها".
- **Guards:** `if(!profile) return null`; flagged via `flaggedIds = new Set(flags.map(f=>f.signId))`; **search bypasses group filter** (search across ALL A1_SIGNS); mostNeeded stable sort; **`flaggedSigns` via signById NOT A1_SIGNS.find (#M3)**; priorityLabel index-based (first 2 High); requestors distinct + slice(0,4) +N; `goalPct = len>0 ? min(100,round(len/5*100)) : 0`; mobile sticky avatar fallback `requestors.slice(0,2) ?? [profile]`; flaggedSigns.length>0 gates rail + Clear-all; signs.length===0 empty.
- **Other:** `GroupId='all'|'home'|'food'|'feelings'|'school'`, default `'home'`; **`SIGN_GROUP` map + `groupOf` fallback (Sign has no category — frozen content)**; **`useMemo` deps `[group,q,query,mostNeeded,flags.length]` with eslint-disable (flags.length intentional) — keep the comment**; search matches `glossEn.toLowerCase().includes(q) || glossAr.includes(query.trim())`; groups array reused twice; stitch-35; Material icons family_star/close/local_fire_department/home/restaurant/mood/school/search/filter_list/push_pin/star/groups; Button ghost/primary + full; RTL dir + asymmetric padding + logical props; two disabled placeholders (+New Category, Filter); weekly-goal IIFE.

## 8. `src/screens/Progress.tsx` (→ behind profile button "My World"; read-only)

- **Hooks:** `useApp()→app`; `useUi()→{go}`; `profile=activeProfile(app)` **null→return null**; `app.progress[profile.id]`; `app.srs[profile.id]`; reads language/activeDays/streak/dailyGoal/xp/displayName; `dueSignIds(app,profile.id)`; `GOAL_XP[profile.dailyGoal]`.
- **Actions:** NONE (read-only — preserve).
- **Routes:** `go({name:'lesson', lessonId: firstLesson.id, reviewOnly:true})` (firstLesson = LESSONS.find(unitId===UNIT_A1_U1.id) ?? LESSONS[0]); `go({name:'camera'})` (fallback); `go({name:'camera', targetSignId: s.id})` (constellation/starfield/ForecastRow — spec may route via goal-chooser, keep targetSignId).
- **Handlers:** `startReview()` (oasisHero click + Enter/Space keydown, mobile+desktop buttons, Continue Learning); star/ForecastRow→go camera w/ targetSignId; `setCelebrating`; StreakCelebration onContinue + setBurst + celebrate.
- **t/pick/num keys:** many `pick` literals (keep EN+AR): "The World You're Building", "Every sign brings life to the oasis.", "Weekly streak", `Level ${n} Oasis`, "World growth", "The Constellation", "Found", connect copy, `<1d`/`${days}d` badges, "Coming Up", "Start Review Session", "A World Waiting to Bloom", oasis copy, "Continue Learning", "Grow", "Growth", "The Alphabet Starfield", "Exploring", "Did you know?", QSL Finjan fact, "Alphabet"/"Sign review", StreakCelebration headlines + arNumber + Sawiyya + note. `t`: `prMastered, homeReviewDue, prNothingDue, prUpcoming, camPractice, xp, obContinue, close`. `num` everywhere. `DAY_LABELS_EN/AR`.
- **Guards:** `if(!profile) return null`; ForecastRow/starfield `if(!sign) return null`; `empty = due.length===0 && upcoming.length===0`; **StreakCelebration fires only `profile.streak>lastStreak.current && profile.streak>1`** (useEffect+useRef); week machine future/active/missed; `isTrained(s.id)` lit gate; mastery thresholds (mastered>=3, seen>=1 unused, a1Done>=2); `growth = round((a1Done+alphaTaught)/max(1,totalTracked)*100)`, bar `Math.max(4,growth)`; `oasisLevel = max(1, floor(mastered/4)+1)`; upcoming sorted asc slice 6; due slice 4.
- **Other:** **`useRef(profile.streak)` + `useEffect([profile.streak])` celebration trigger — keep ref-comparison or it loops**; useMemo activeSet/week; `todayDow=(getDay()+6)%7`; dayKey ISO slice; Confetti+celebrate+burst; stitch-32/46; load-bearing dir overrides (constellation ltr / starfield rtl / code rtl / dots ltr / wordmark ltr / arNumber rtl); rtl rotate-180; Icon material names; ForecastRow + StreakCelebration subcomponents; `goalXp` plumbed into StreakCelebration (unused — keep plumbing).

## 9. `src/screens/AllSigns.tsx` (→ Dictionary tab; keep structure, remove in-screen Home btn)

- **Hooks:** `useApp()→app`; `go = useUi(s=>s.go)`; `toggleFlag = useApp(s=>s.toggleFlag)`; `addToReview = useApp(s=>s.addToReview)`; `profile=activeProfile(app)`; `lang=profile?.language ?? 'en'`; `rtl=lang==='ar'`; `progress=(profile && app.progress[profile.id])||{}`; `cards=(profile && app.srs[profile.id])||{}`; `flaggedIds = useMemo Set(app.flags.filter(f=>f.active).map(signId))`; deps include app.progress/flags/srs/profile?.id.
- **Actions:** `toggleFlag(selected.id, profile.id)` (desktop + mobile, **profile-guarded**); `addToReview(selected.id)` (desktop only); **Watch/Share do NOT mutate store (#M5)** — handleWatch local setWatched; handleShare navigator.share/clipboard.
- **Routes:** `go({name:'camera', targetSignId: sign.id})` via practiceSign; `go({name:'home'})` (Home btn — **remove btn, route lives in shell**).
- **Handlers:** `practiceSign(sign)` (cameraGradable only); `statusOf(sign)` precedence flagged>mastered(>=3)>review(isDue)>alphabet letter>unit(mastery>0)>A1 unit>new; `learnedCount`; signs useMemo pipeline; selected find; categoryTags; SearchInput→setQuery; filter chip→setFilter; SignCard→setSelectedId; onClose→setSelectedId(null); handleWatch→setWatched(true); handleShare (swallow errors).
- **t/pick keys:** `prAlphabet`(en/ar), `navHome, close, practiceCamera`; pick "Sign Dictionary"/القاموس (+inverse), "Qatari Sign Language · خليجي", "Coming Soon", "Filter signs", FILTERS All/Learned/Flagged/Unit1/Unit2, empty states, "Pick a sign...", search placeholder/aria, STATUS_META pairs, categoryTags, favorite aria, "How to sign", "Watch"/"Watch Again", non-gradable notice, "Add to Daily Review", "Flagged"/"Flag", "Share".
- **Guards:** **cameraGradable gate (CTA only when true; else "this sign moves" notice — DO NOT show camera for non-gradable)**; Watch=no SRS write; `profile && toggleFlag`; filter pipeline (learned masteryLevel>0; flagged flaggedIds.has; alphabet tier; unit1 tier A1; **unit2 ALWAYS false → coming-soon empty, no fabricated set**; search matches glossEn+glossAr+code); statusOf precedence; SignCard code(rtl) vs emoji; learnedCount badge >0.
- **Other:** selectedId drives desktop aside + mobile sheet (one state); DetailPanel shared via `variant='panel'|'sheet'`; watched local inside DetailPanel; `isDue` import; ALL_SIGNS frozen source; route name `allSigns`; no-scrollbar filter row + tablist a11y; RTL code dir + how-to dir + logical props; `pb-28 md:pb-24` (re-skin into shell safe-area).

## 10. `src/screens/Settings.tsx` (→ behind profile button; strip self-hosted chrome)

- **Hooks:** `useApp()→app`; `useUi()→{go}`; `profile=activeProfile(app)` **null→return null**; reads language/dominantHand/dailyGoal/displayName/xp/id.
- **Actions:** `app.updateProfile(profile.id, patch)` via `set()` helper ({language}/{dominantHand}/{dailyGoal}/{displayName}); `clearClass(id)` + `trainedClassIds()` (recognizer/knn) inside resetTraining.
- **Routes:** devMetrics, aiTransparency, privacy, family (Manage profiles + Contact support — **mislabeled, fix not preserve**), allSigns (Manual — fix), home, camera, progress.
- **Handlers:** `set(patch)`; `resetTraining()` (trainedClassIds().forEach(clearClass) + bilingual resetMsg + 3000ms clear); **`bump()` 5-tap → devMetrics easter egg**; LanguageToggle/HandCards (left mirror scale-x-[-1])/GoalList (aria-pressed); NameField onChange; LinkRow/HelpRow/SideNavItem go().
- **t/pick keys:** `navHome/navCamera/navFamily/navProgress, setTitle, back, xp, setCameraPermission, setGranted, setNotGranted, setAi, setPrivacy, setProfiles`; num(xp); pick inline literals (keep): Language·اللغة, Signing hand·يد الإشارة, Daily goal·الهدف اليومي, Your profile·ملفك الشخصي, Your camera·كاميرتك, Help·مساعدة, Contact support/تواصل مع الدعم, Manual & signs library/الدليل ومكتبة الإشارات, pro-tip, "camera learns YOUR hands" string, Reset camera training/إعادة ضبط الكاميرا (x2), reset-success "Cleared N..."/AR, Your name·اسمك, placeholder, goal Casual/Regular/Serious + AR + 3/7/15 min, hand Right/Left + AR, footer "Sawiyya · v1.0 · سويّة" + "Together as Equals"/AR, Notifications/الإشعارات, Privacy Policy, Terms of Service, Mada Innovation/ابتكار مدى, copyright; header الإعدادات after setTitle.
- **Guards:** `if(!profile) return null`; `taps.current>=5`; `camState==='granted'`; resetMsg conditional + 3s clear; left-hand `o.flip → scale-x-[-1]`; on/aria-pressed.
- **Other:** **useEffect mount `navigator.permissions?.query({name:'camera'})` → setCamState (+cancelled cleanup, .catch(null)) — keep**; `taps=useRef(0)`; state camState/resetMsg; lang→dir/rtl; avatar initial fallback 'S'; `role='status' aria-live='polite'` on resetMsg; mobile/desktop duplication of Camera card+Reset+footers (both carry handlers → collapse to one in spec); ChunkyCard/SectionTitle/Row/LinkRow/HelpRow/SideNavItem locals; imports Icon/Logo/Wordmark; **desktop side-nav rail + bespoke footers DELETE (move to shell)**.

## 11. `src/screens/InfoPages.tsx` (AiTransparency + Privacy → behind profile button; delete local chrome)

- **Hooks:** `useApp()→app` (both); `activeProfile(app)` (both); `profile.language→lang`; `useUi()→{go}` in TopBar/SidebarNav/DesktopFooter/both pages.
- **Actions:** NONE via store. `Privacy.eraseEverything()`: **`window.confirm(...)` guard → `localStorage.clear()` in try → `window.location.reload()` in finally; NO store mutation** — preserve confirm + try/finally + reload + local-only semantics.
- **Routes:** settings (back, both), home (CTA + footer Lesson Map + sidebar), privacy (AiT link + footer), aiTransparency (Privacy link), allSigns (footer Dictionary), camera/family/progress (sidebar). **All chrome routes survive via shared shell.**
- **Handlers:** `eraseEverything` wired to BOTH "Clear Local Data" + "Delete Local Data" (**dedup to ONE in spec**); TopBar back→settings; SidebarNav→go(it.screen); DesktopFooter→allSigns/home/privacy/settings; AiT CTA→home; AiT→privacy; Privacy→aiTransparency.
- **t/pick keys:** `navHome/navCamera/navFamily/navProgress, setTitle`; `pick` "Back"/رجوع, portal text (aria-hidden), all DesktopFooter strings, AiTransparency `T=pick` card titles/subtitles/bodies/proudCard/"Mada Innovation Award Winner"/headings/CTA/links, Privacy `T=pick` title/hero (EN+AR swap)/cards/storage rows/erase strings/confirm text/footer link.
- **Guards:** `if(!profile) return null` (BOTH); `eraseEverything if(!ok) return`; `try{clear()}finally{reload()}`.
- **Other:** `pick(lang,en,ar)` bilingual stacking (preserve dual-language); `dir="auto"` on Arabic nodes; `rtl:md:flex-row-reverse` proud band; aria-hidden decoratives; alt="" on stitch images; **brand assets stitch-21/02/09/28/19 + stitch-14 (Privacy hero)**; Icon fill states + material names; Button variant primary; **PageShell(lang,active,children) → SidebarNav+children+DesktopFooter (active='settings' highlight) — DELETE shell, render in global shell**; loading lazy/eager; meeting-curve clipPath divider (fragile — replace); motion-safe animations; SidebarNav items typed.

## 12. `src/components/BottomNav.tsx` (→ becomes/feeds the shared AppNav)

- **Hooks:** `useUi()→{screen, go}`; `lang` is a PROP (parent must keep passing it).
- **Action:** `go({name: tab.name} as Screen)` — **`as Screen` cast load-bearing**; also triggers scroll-to-top.
- **Routes (param-free):** home, camera (NO targetSignId — free entry; spec routes Practise via goal-chooser instead), allSigns, family, progress.
- **t/pick keys:** `navHome, navCamera, navFamily, navProgress`; **`pick(lang,'Signs','القاموس')` for dictionary (NO i18n key today — keep literal or first ADD a real key; do not blind-swap to a missing t()).**
- **Guards:** `active = screen.name === tab.name` drives aria-current + active styling + `Icon fill={active}` (all three same boolean); Icon fill toggle is a real prop.
- **Other:** `key={tab.name}`; `type="button"`; aria-label="Main"; focus-visible ring; **`safe-bottom`**; exact Material icon names home/video_camera_front/menu_book/favorite/monitoring; `tabs` module-level config with `label:(l)=>string`; `max-w-md mx-auto`. **Re-skin: replace with 4-tab AppNav (Learn/Practise/Dictionary/Family) + profile button; Progress/Settings leave the bar.**

## 13. `src/components/CameraTrainer.tsx` (shared grading engine — pure logic-in-presentation; do NOT fork)

- **Hooks/store:** NONE — fully prop-driven (`sign, lang, onResult, allowSkip, autoStart, exerciseLabel`). **Keep store-free.**
- **Recognizer calls (MUST survive):** `addSample(sign.id,vec), sampleCount(sign.id), clearClass(sign.id), flushSamples(), classifyAgainst(vec, sign.id), isTrained(sign.id)`.
- **onResult contract:** report exactly `'match' | 'selfMark' | 'skip'` with existing timing.
- **Handlers (preserve verbatim):** `onFrame(frame)` — early-return finished.current; null-frame reset; `mirror = frame.detectedHand==='Left'` then `normalizeLandmarks(frame.landmarks, mirror)`; teach branch (teaching.current, frameSkip every 3rd, addSample, sampleCount, `TEACH_TARGET=24`→flushSamples+'done'); grade branch (attemptFrames++, `UNSURE_AFTER_FRAMES=140`→showUnsure, **`classifyAgainst(vec, sign.id)` not argmax**, pushConfidence, consecutive, pushHold, `HOLD_FRAMES=10`→finished+tracker.stop()+setMatched+`setTimeout(onResult('match'),900)`). `pushConfidence/pushHold` lastConfPct/lastHoldPct ref gating. `startTeach()`, `finishResult(r)` (guard + flushSamples + stop + onResult), teach-done handoff, re-teach, idle/error Start. `useHandTracker(onFrame)` consumed fully.
- **t/pick keys:** all cam\* keys (see §3); inline literals goalEyebrow "Current Goal"/هدفك الآن, referenceHelper, "Hold steady for 2 seconds…" — promote to i18n in spec but never drop.
- **Guards:** `mode = isTrained(sign.id) ? 'grade' : 'teach'`; teach vs grade branch; `!teaching.current` return; frameSkip; `n>=TEACH_TARGET`; `attemptFrames>UNSURE_AFTER_FRAMES`; `consecutive>=HOLD_FRAMES`; **classifyAgainst against sign.id**; meter/ring only grade+running+!matched; self-mark ALWAYS available (never-hard-fail §6.4/§9.5); allowSkip gates Skip; re-teach only grade+isTrained; idle/error/teach/matched overlays; referenceChip iloveyou→stitch-34 / alphabet→code / else sign_language; `target = alphabet ? code : gloss`; `meter = holdProgress>0 ? holdProgress : confidence`; FPS pill running; exerciseLabel ternary.
- **Other:** refs consecutive/attemptFrames/frameSkip/finished/teaching/modeRef + lastConfPct/lastHoldPct; video/canvas refs both `-scale-x-100` object-cover; `useEffect([autoStart])` (eslint-disable intentional); tracker teardown on unmount; constants HOLD_FRAMES=10/TEACH_TARGET=24/UNSURE_AFTER_FRAMES=140/HOLD_RING_C=2π·36; 900ms delay; tracker.stop on match + finishResult; promptBanner+controls rendered both slots with `contents` wrapper (**collapse to one reflowing banner — keep `contents` semantics**); SVG ring math; stitch-34; progressbar a11y; dir='ltr' on status-pill row.

## 14. `src/components/ui.tsx` (FROZEN foundation — EXTEND, never rewrite)

- **No store/route/i18n wiring** (only `import type {ReactNode}`). Lowest-risk file.
- **Exported API (every signature load-bearing — 14 importers):** `Logo({size=36})`; `Wordmark({className})` (keep `dir="ltr"`); `Icon({name, fill=false, className})`; `Button({children,onClick,variant='primary',disabled,full,className,type='button'})` variants `primary|secondary|ghost|gold`; `Card({children,className,onClick})` — **dual-mode: onClick→`<button>`, else `<div>` (keep both branches)**; `Pill({children,tone='teal',className})` tones `teal|gold|coral|muted`; `ProgressRing({progress,size=64,stroke=7,children})`; `MeetingBar({progress})`.
- **Guards:** ProgressRing clamp `Math.max(0,Math.min(1,progress))` + `>=1?gold:teal`; MeetingBar floor `Math.max(6, progress*100)%`; Button `disabled:opacity-40 disabled:shadow-none` + extruded `:active:not(:disabled)`.
- **Token deps:** brand colors, font-display, extruded-\*/material-fill, Material Symbols link; inline SVG hex in Logo/ProgressRing.
- **Additive only:** add `size` to Button + focus-visible ring + aria props; Title/Subtitle/Body/Caption; Card variants (flat/elevated/selected ring); ScreenShell/Stack; Spinner/Avatar/Badge/Skeleton/Divider. **Never remove or rename existing exports/variants.**

## (15) `src/screens/DevMetrics.tsx` (not separately audited — hidden dev screen)

- Reached only via the Settings 5-tap easter egg (`go({name:'devMetrics'})`). Read-only metrics dump. Keep the route + any `activeProfile` guard. Not part of the 4-tab IA; do not surface in nav. Verify it still renders in the runtime sweep.
