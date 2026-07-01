# Section 2 — The Game

*Source: VEX V5 Robotics Competition Override — Game Manual, Version 0.2 (Released June 4, 2026)*

---

## VEX V5 Robotics Competition Override: A Primer

VEX V5 Robotics Competition Override is played on a 12' × 12' square Field, set up as illustrated in the figures throughout this manual.

In Head-to-Head Matches, two (2) Alliances — one (1) "red" and one (1) "blue" — composed of two (2) Teams each, compete in Matches consisting of a fifteen (0:15) second Autonomous Period followed by a one minute and forty-five second (1:45) Driver Controlled Period.

The object of the game is to attain a higher score than the opposing Alliance by stacking Pins and Cups on Goals, setting Toggles to your Alliance color, and ending the Match with your Robot in the contested Midfield.

An Autonomous Win Point is awarded to any Alliance that completes a set of assigned tasks by the end of the Autonomous Period.

An Autonomous Bonus is awarded to the Alliance that has the most points at the end of the Autonomous Period.

Teams may also compete in Robot Skills Matches, where one (1) Robot tries to score as many points as possible. See Section 3 for more information.

At the VEX U Collegiate level, Teams play in a modified Tournament with a 30-second Autonomous Period and additional Robot build challenges. See Section 6.

---

## Field Overview

The V5RC Override Field consists of the following:

### Cups — 56 total

- **20 Match Loads**
  - 10 for red Alliance
  - 10 for blue Alliance
- **24** that start the Match in predetermined locations on the Field (gray side up)
- **12** that start the Match in predetermined locations on the Field (clear side up)

### Pins — 63 total

- **4 red/blue** that start the Match in predetermined locations
- **20 red/yellow**
  - 2 Preloads
  - 10 Match Loads
  - 8 that start the Match in predetermined locations
- **20 blue/yellow**
  - 2 Preloads
  - 10 Match Loads
  - 8 that start the Match in predetermined locations
- **19 yellow/yellow**
  - 2 Match Loads
  - 17 that start the Match in predetermined locations

### Goals — 9 total

- **4 Alliance colored**
  - 2 red
  - 2 blue
- **5 neutral colored**
  - 4 short
  - 1 tall

### Other Field Elements

- **4 Toggles**
- **4 Loaders**, two adjacent to each Alliance Station

> **Note:** The illustrations in this section of the Game Manual are intended to provide a general visual understanding of the game. Some figures may highlight or change the appearance of certain Field Elements and Scoring Objects to emphasize or clarify intent.
>
> Teams should refer to official Field specifications, found in Appendix A, for exact Field dimensions, a full Field bill of materials, and exact details of Field construction.

### Figures

**Figure FO-1:** An overhead view of the V5RC Override Field, with Alliance Stations (orange), Loaders (white), Toggles (pink), and Goals (green) highlighted.

**Figure FO-2:** An overhead view of the V5RC Override Field in its starting configuration, with icons representing orientation of Scoring Objects.

**Figure FO-3:** The recommended locations of the Head Referee (black & white stripes), and Scorekeeper Referees (black & white checkerboard).

---

## Scoring

## <SC1>

**All scoring statuses are evaluated after the Match ends.** Scores are calculated five seconds after the *Match* ends, or once all *Scoring Objects*, *Field Elements*, and *Robots* on the *Field* come to rest, whichever comes first. 

- This 5-second delay is intended to be the only permitted “benefit of the doubt” for last-second scoring actions. If an object or *Robot* is still in motion and “too close to call” between two states at the 5-second mark, then the less advantageous of the two states should be awarded to the *Robot*(s) in question. A *Robot* which is breaking the plane of the *Midfield* but slowly droops down and away from the *Midfield* at five (5) seconds would not be considered in the *Midfield*. 

- At the end of the *Match*, the on-screen timer displayed by Tournament Manager will hold the current *Match* information and “0:00” for five (5) seconds before moving to queue the next Match. This should be the primary 5-second visual cue used by *Teams* and *Head Referees*. 

- This 5-second delay is only intended to be a “benefit of the doubt” grace period, not an extra five seconds of *Match* time. *Robots* which are designed to strategically exploit this grace period will receive a Minor Violation, and any post-*Match* movement will not be included in score calculation (i.e., the *Match* will be scored as it was at 0:00). 

- Referees should avoid contacting or moving *Robots* and/or *Scoring Objects* as much as possible while evaluating scoring statuses. If an object must be moved to evaluate the status of another object, its status must be agreed upon by all *Teams* and the *Head Referee*, and noted or recorded, before it is moved. 

- Referees must record counts based on verified scoring statuses evaluated after the *Match*, using final positions of *Scoring Objects*, *Field Elements*, and *Robots*. Point considerations used to determine whether a *Violation* is *Match Affecting* (e.g., specified in *Violation* Notes) should NOT be added to or deducted from the actual score, and points scored during a *Violation* should not be deducted from a score.


---

## <SC2>

**Placed Scoring Object criteria.**

- A *Pin* is considered *Placed* if it meets all of the following criteria: The *Pin* is partially or entirely nested with a *Goal*, or with a *Cup* that is partially or entirely nested with another *Placed* *Pin*. Each *Goal* and/or each half of a *Cup* nested with that *Pin* contains a maximum of one Pin half. (See Figure SC2-2.) 

- A *Cup* is considered *Placed* if it meets the following criteria: The *Cup* is partially or entirely nested with a *Placed* *Pin*. 

> In the context of <SC2>, nested means that one half of a *Pin* is partially or completely contained within the inner volume of the *Cup*. In other words, the *Pin* is breaking an imaginary plane at the opening of a *Cup*, in any way. *Robot* contact does not matter for the purposes of <SC2>, and a *Robot* that is contacting or *Possessing* a *Pin* that still meets the criteria presented in <SC2> does not negate the *Placed* status, provided no other rules are broken (particularly <SG6>).
 

![Figure](https://events.vex.com/storage/game_manual/VEX_V5_Robotics_Competition_2026-2027_Override/images/Scored_Example_1.png)

 

Figure SC2-1: The Scoring Objects stacked in the Goal all count as Placed, as they are all at least partially nested with the Goal and/or other Placed Scoring Objects.
 

![Figure](https://events.vex.com/storage/game_manual/VEX_V5_Robotics_Competition_2026-2027_Override/images/SC2-2.png)

 

Figure SC2-2: The Pin resting on top is partially nested with the Cup, but the Pin is not considered Placed since that half of the Cup contains more than one Pin half.


---

## <SC3>

Each *Pin* consists of two halves. **Each Placed Pin can have zero, one or two Scored halves.** To count as *Scored* for the corresponding *Alliance*, the half of the *Placed* *Pin* must remain fully visible (i.e, cannot be partially or fully nested inside the opaque half of a *Cup*). 

- Each visible red half of a *Placed* *Pin* counts as a *Scored* red *Pin*, earning points for the red *Alliance*. 

- Each visible blue half of a *Placed* *Pin* counts as a *Scored* blue *Pin*, earning points for the blue *Alliance*. 

- Each visible yellow half of a *Placed* and *Owned* *Pin* counts as a *Scored* yellow *Pin*, earning points for the *Alliance* that *Owns* the *Pin*. (See <SC5>.)


---

## <SC4>

**A Toggle is considered set to a color** when it meets all of the following criteria at the end of the *Match*: 

- The *Toggle* must be fully seated, such that there is a face of the *Toggle* in contact and parallel with its mounts on the *Field Perimeter* at rest. (see Figure SC5-1) 

- The *Toggle* is not in contact with a *Robot* from either *Alliance*. If a *Toggle* is not considered set to a color, it is considered a neutral (yellow) *Toggle* by default, and neither *Alliance* receives *Ownership* of the yellow *Pins* *Placed* in that *Quadrant*. While the *Toggle* has infinite potential orientations, only three discrete orientations are considered *Scored* states.


---

## <SC5>

**Yellow Pin Ownership.** Each *Placed* *Pin* with one or more yellow halves can be *Owned* by an *Alliance*. 

- A yellow *Pin* *Placed* in a *Quadrant* is *Owned* by an *Alliance* if the *Toggle* in that *Quadrant* is set to the *Alliance’s* color. If the *Toggle* is set to yellow, *Placed* yellow *Pins* in that *Quadrant* are not *Owned* and do not score points. (See <SC3>.) 

- A yellow *Pin* *Placed* in the *Midfield* is *Owned* by the *Alliance* that ends the *Match* with a greater number of *Robots* in the *Midfield*. (See <SC6>.) If both *Alliances* end the *Match* with an equal number of *Robots* in the *Midfield*, yellow *Pins* *Placed* in the *Midfield* are not *Owned* and do not score points. 

![Figure](https://events.vex.com/storage/game_manual/VEX_V5_Robotics_Competition_2026-2027_Override/images/SC4-1.png)

 

Figure SC5-1: This Quadrant’s Toggle is set to red, so yellow Pins Placed in this Quadrant’s Goals are Owned by the red Alliance.
 

![Figure](https://events.vex.com/storage/game_manual/VEX_V5_Robotics_Competition_2026-2027_Override/images/SC2.png)

 

Figure SC5-2: The blue Alliance has more Robots in the Midfield at the end of the Match, so yellow Pins Placed in the Midfield Goal are Owned by the blue Alliance.
 

| *Toggle*: Yellow | *Toggle*: Blue | *Toggle*: Red |
| --- | --- | --- |
| Red *Pins*: 15 points | Red *Pins*: 15 Points | Red *Pins*: 15 Points |
| Blue *Pins*: 5 Points | Blue *Pins*: 5 Points | Blue *Pins*: 5 Points |
| Yellow *Pins*: 0 Points | Yellow *Pins*: 30 Points (*Scored* for Blue) | Yellow *Pins*: 30 Points (*Scored* for Red) |
| Total Red: 15 Points / Blue: 5 Points | Total Red: 15 Points / Blue: 35 Points | Total Red: 45 Points / Blue: 5 Points |


---

## <SC6>

A *Robot* counts as **being in the Midfield** if any part of the *Robot* is within the infinite 3D vertical projection of the *Midfield* at the end of the *Match*.


---

## <SC7>

Scoring of the **Autonomous Bonus** is evaluated immediately after the *Autonomous Period* ends. 

- Points for ending the *Autonomous Period* in the *Midfield* are not included in the calculation of an *Alliance’s* score for the purposes of determining the *Autonomous Bonus*. 

- If the *Autonomous Period* ends in a tie, including a zero-to-zero tie, each *Alliance* will receive an *Autonomous Bonus* of six (6) points. 

- Any *Violations*, Major or Minor, committed during the *Autonomous Period* will result in the *Autonomous Bonus* being automatically awarded to the opposing *Alliance*. See <GG13>. 

- Per rule <GG13>, if both *Alliances* commit *Violations* during the *Autonomous Period*, then no *Autonomous Bonus* will be awarded. This rule is applied differently for VEX U. See Rule <VUG5>.


---

## <SC8>

An **Autonomous Win Point** is awarded to any *Alliance* that ends the *Autonomous Period* with all of the following tasks completed, and that has committed no *Violations* during the *Autonomous Period*: At least seven (7) *Pins* *Scored* for your *Alliance*. (Does not include *Pins* *Scored* in *Quadrants* on the opposing side of the *Autonomous Line*.) At least three (3) *Goals* each contain at least two (2) *Pins* *Scored* for your *Alliance*. (Does not include *Goals* in *Quadrants* on the opposing side of the *Autonomous Line*.) Neither *Robot* is contacting the *Field Perimeter* 

> *Autonomous Win Point* criteria will be slightly modified for events which qualify directly to the World Championship (e.g., Event Region Championships and Signature Events) and may be further modified for the World Championship. The modified criteria for events which qualify directly to the World Championship will be released in the September 3, 2026, Game Manual update. Any Championship-qualifying events held prior to September 10, 2026, will use the standard criteria listed in this rule. The modification(s) will be minor, and will be intended to provide an increased challenge over the criteria listed above. For example, one possibility could be “At least eight (8) *Pins* *Scored*” instead of seven (7) and/or “At least four (4) *Goals*” instead of three (3). The standard criteria for all other events will not change.
 This rule is applied differently for VEX U. See Rule <VUG6>.


---

## Specific Game Rules

## <SG1>

**Starting a Match.** Prior to the start of each *Match*, each *Robot* must be placed such that it meets all of the following criteria: 

- No larger than 18” (457.2 mm) long by 18” (457.2 mm) wide by 18” (457.2 mm) tall. 

- Not contacting any *Scoring Objects* other than a maximum of one (1) *Preload*. See rule <SG5>. 

- Not contacting *Goals*, *Loaders*, *Load Zones*, or *Toggles*. 

- Not contacting any other *Robots*, and not sharing a *Quadrant* with another *Robot*. 

- Completely stationary (i.e., no motors or other mechanisms in motion). 

- Contacting the *Field* tiles and *Field Perimeter* on their *Alliance’s* side of the *Autonomous Line*. Note: Using external influences, such as *Preloads* or the *Field Perimeter*, to maintain a *Robot’s* starting size is only acceptable if the *Robot* would still satisfy the constraints of <R3> and pass inspection without these influences. This rule has additional *Violation* notes. See Appendix C. Clause A of this rule is applied differently for VEX U. See Rule <VUG1> and <VUG3>.

![Figure](https://events.vex.com/storage/game_manual/VEX_V5_Robotics_Competition_2026-2027_Override/images/SG1.png)

 

Figure SG-1: An overhead view of the Field, with four Robots in legal starting positions.


---

## <SG2>

**Horizontal expansion is limited.** Once the *Match* begins, *Robots* may expand horizontally beyond the starting size limit within the following criteria: 

- The *Robot* can never be larger than 24” wide or 24” long (must always be able to fit within a 24”x24” square horizontal footprint). 

> *Teams* should be aware that *Robots* may incidentally expand horizontally while extending vertically (e.g., mechanisms that arc, swing, or deploy upward). Upon request, *Teams* must be prepared to demonstrate that their *Robot* does not exceed the maximum size constraint of 24” x 24” at any point, including while any vertical expansion mechanisms are in use.
 This rule has additional *Violation* notes. See Appendix C.

![Figure](https://events.vex.com/storage/game_manual/VEX_V5_Robotics_Competition_2026-2027_Override/images/SG2.png)

 

Figure SG2: A demonstration of how the size of the Robot may change horizontally through the course of a vertical expansion.


---

## <SG3>

**Vertical expansion is limited.** Once the *Match* begins and until the *Endgame* period begins, *Robots* may expand vertically beyond the starting size limit, but no part of the *Robot* may exceed an overall height of 50” at any point during the *Match* (must always be able to fit within a hypothetical 50” vertical sizing box).


---

## <SG4>

**Keep Scoring Objects in the Field.** *Teams* may not remove *Scoring Objects* from the *Field*. A *Scoring Object* that leaves the *Field* during *Match* play, intentionally or unintentionally, will be returned to the *Field* in a location near where it left, in contact with the *Field* tiles and the *Field Perimeter* but no other *Field* or *Scoring Objects* and no *Robots*. Volunteers should return *Scoring Objects* as quickly as possible, but this time will vary between Events and *Matches*, and any delay in returning an object should not be considered Match Affecting or cause for a replay. 

- If a *Scoring Object* is leaving the *Field* (as determined by the *Head Referee*), but is deflected back into the *Field* by a *Drive Team Member*, field monitor, ceiling/wall, or other external factor, it should still be considered “out of the *Field*” and removed by a *Scorekeeper Referee* or *Head Referee*. If the redirection occurred due to contact with a *Drive Team Member*, it will be at the *Head Referee’s* discretion whether or not <GG4> (hands out of the *Field*) should apply. 

- A *Scoring Object* that comes to rest on top of the *Field Perimeter* is still considered to be inside the *Field* unless it contacts something outside of the *Field* (e.g., volunteer, *Drive Team Member*, field monitor, etc.), and cannot be retrieved by a *Drive Team Member* or volunteer. This rule has additional *Violation* notes. See Appendix C.


---

## <SG5>

**Each Robot gets one Pin as a Preload.** Red *Alliance* *Preloads* are red/yellow *Pins*; blue *Alliance* *Preloads* are blue/yellow *Pins*. Prior to the start of each *Match*, each *Preload* must be placed such that it meets all of the following criteria: 

- Contacting one *Robot* of the same *Alliance* color as the *Preload*. 

- Not contacting the same *Preload* as another *Robot*. 

- Not contacting other *Scoring Objects*. 

- Not contacting any other *Goals*, *Loaders*, *Load Zones*, or *Toggles*. Note: If a *Robot* is not present for their *Match*, then that *Robot’s* *Preload* may be used as a *Match Load* in accordance with <SG11>. This rule has additional *Violation* notes. See Appendix C.


---

## <SG6>

**Possession is limited to a maximum of one Pin and one Cup.** *Robots* may not have *Possession* of more than one (1) *Pin* at once. *Robots* may not have *Possession* of more than (1) *Cup* at once. *Robots* in *Violation* of this rule must immediately stop all actions except for attempting to remove the excess *Scoring Objects*. If they are unable to remove the excess *Scoring Objects*, then they must return to a legal starting position (as described by <SG1>). They will not be eligible to receive points for ending the *Match* in the *Midfield*, and cannot interact with *Toggles*, *Goals*, or other *Scoring Objects* while in *Possession* of excess *Scoring Objects*. 

- *Plowing* multiple *Scoring Objects* is permitted. *Teams* which employ *Plowing* strategies are encouraged to clearly demonstrate that none of the *Scoring Objects* are being *Possessed*, e.g., by using a flat face of the *Robot* with no active mechanisms.


---

## <SG7>

**Don’t cross the Autonomous Line, and don’t interfere with your opponents’ actions.** During the *Autonomous Period*, *Robots* may not contact foam tiles, *Scoring Objects*, or *Field Elements* which are on the opposing *Alliance’s* side of the *Autonomous Line*. 

- The *Autonomous Period* should be primarily *Offensive*, with *Teams* focusing on scoring and executing strategic maneuvers rather than *Defensive* disruption. *Teams* should avoid actions that are primarily *Defensive* in nature, including but not limited to: Intentionally disrupting *Scoring Objects* or *Field Elements* on the opponent’s side of the *Autonomous Line*. Deliberately contacting an opponent’s *Robot* to interfere with their autonomous path. 

- *Scoring Objects* that begin the *Match* in contact with the *Autonomous Line* are not considered to be on either side, and may be utilized by either *Alliance* during the *Autonomous Period*. For the purpose of this rule, all 20 *Scoring Objects* that begin the *Match* on or at the *Autonomous Line* are considered to be in contact with the *Autonomous Line*. See Figure SG-7. 

- While incidental contact or unintentional interactions may occur with *Robots* on the other side of the *Autonomous Line*, *Teams* that employ deliberate *Defensive* autonomous strategies that impact their opponents’ autonomous routines may be subject to Minor or *Major Violations* at the discretion of the *Head Referee*. 

- *Teams* cannot intentionally place *Scoring Objects* on the opponent’s side of the *Autonomous Line*. 

- Contact with either of the following during the *Autonomous Period* will result in the *Autonomous Bonus* and an *Autonomous Win Point* being awarded to the opposing *Alliance*, unless the opposing *Alliance* also breaks rules in the *Autonomous Period*: An opponent *Robot* that isn’t interacting with the *Autonomous Line*, objects that begin the *Match* positioned above or in contact with the *Autonomous Line*, or the *Midfield* (see <SG8>). *Scoring Objects* on the other side of the *Autonomous Line*.

![Figure](https://events.vex.com/storage/game_manual/VEX_V5_Robotics_Competition_2026-2027_Override/images/SG7.png)

 

Figure SG-7: These Scoring Objects (circled in red) would be considered to be on the Autonomous Line.
 This rule has additional *Violation* notes. See Appendix C.


---

## <SG8>

**Engage with the Midfield and/or Autonomous Line during the Autonomous Period at your own risk.** Any *Robot* that engages with the *Midfield* and/or *Scoring Objects* that begin the *Match* on the *Autonomous Line* should be aware that opponent *Robots* may also choose to do the same. Per <GG12> and <GG13>, *Teams* are responsible for the actions of their *Robots* at all times. 

- For the purposes of this rule, “engages with” means any combination of: Contacting foam tiles within the *Midfield* Contacting the *Goal* in the *Midfield* Contacting *Scoring Objects* that begin the *Match* on the *Autonomous Line* 

- If opposing *Robots* contact one another while both engaging with the *Midfield* or the *Autonomous Line*, and a possible <GG14> *Violation* occurs (e.g., damage, *Entanglement*, or tipping over), a judgment call will be made by the *Head Referee* within the context of <GG14> and <GG15> (just as it would if the interaction had occurred during the *Driver Controlled Period*). 

- If opposing *Robots* contact one another while both engaging with the *Midfield* or *Autonomous Line*, and an incidental *Violation* of <SG4> occurs, no penalty will be assessed on either *Alliance*. 

- Intentional, strategic, repeated, or egregious offenses, such as negatively impacting *Robots* that are not engaging with the *Midfield* or the *Autonomous Line*, may still be deemed a *Violation* of <GG13>, <GG14>, <GG15>, <SG7>, <G1>, and/or <S1> at the *Head Referee’s* discretion. 

> The *Midfield* and the *Scoring Objects* that begin on the *Autonomous Line* are intended to be utilized by both *Alliances* during the *Autonomous Period*. This will inevitably result in *Robot*-on-*Robot* interactions, both incidental and intentional. The overarching intent of <SG8> is for the vast majority of these interactions to result in no rule *Violations* and / or penalties for either *Alliance*, just as no rules *Violations* occur in 99% of Driver Controlled interactions. *Teams* are responsible for the actions of their *Robots* at all times. A *Robot* with a small wheel base, which tips over every time they enter the *Midfield* and contacts an opponent, should not attempt to claim a <GG14> *Violation* on their opponent. With that being said, the *Midfield* is a neutral zone, not a “free-for-all” zone. The intent of clause D is to provide *Head Referees* with the leeway to still make a judgment call, if needed, when a *Team* has chosen to exploit this rule beyond its intent. Reckless or unsafe strategies aimed solely at the destruction, damage, tipping over, *Entanglement*, *Trapping*, or forcing of an opponent into a penalty are still prohibited in the VEX Robotics Competition.


---

## <SG9>

**Alliance Goals are protected.** *Robots* may not directly or indirectly interact with the opposing *Alliance*-colored *Goals*. This includes both *Placing* *Scoring Objects* and removing *Placed* *Scoring Objects*. This rule has additional *Violation* notes. See Appendix C.


---

## <SG10>

**Placed Scoring Objects cannot be removed from neutral or opposing Alliance-colored Goals.** *Robots* may only remove *Placed* *Scoring Objects* from a *Goal* if that *Goal* matches their *Alliance* color. This rule has additional *Violation* notes. See Appendix C.


---

## <SG11>

**Match Loads may be introduced during the Match under certain conditions.** For the purpose of this rule, “introduce” refers to the moment when a *Drive Team Member* has released a *Scoring Object* into a *Loader*. During this action, a *Drive Team Member’s* hands may temporarily break the plane of the *Field Perimeter*. This momentary interaction is an exception to rule <GG4>. Excessive, unnecessary, or unsafe actions while introducing a *Match Load* may be considered a *Violation* of <S1> and/or <G1> at the *Head Referee’s* discretion. *Drive Team Members* may introduce *Match Load* *Scoring Objects* by placing a single *Pin*, a single *Cup*, or a nested *Cup* and *Pin* into either of their *Alliance*-colored *Loaders*. *Scoring Objects* can be introduced through the top of the *Loader* when the *Loader* is not lifted, or through the back of the *Loader* when the *Loader* is raised by a *Drive Team Member*. 

- *Scoring Objects* may only be introduced into *Loaders* during the *Driver Controlled Period* of the *Match*. 

- A *Match Load* *Scoring Object* may not be contacted by a *Robot* prior to being introduced into a *Loader*. 

- *Match Load* *Scoring Objects* may only be removed through the bottom opening of the *Loader*, by a *Robot* whose *Alliance* color matches the *Loader*. This rule is applied differently for VEX U. See Rule <VUG4>. This rule has additional *Violation* notes. See Appendix C.

![Figure](https://events.vex.com/storage/game_manual/VEX_V5_Robotics_Competition_2026-2027_Override/images/Load_Example_1.png)

 

Figure SG11-1: Scoring Objects can be introduced through the top opening of the Loader.
 

![Figure](https://events.vex.com/storage/game_manual/VEX_V5_Robotics_Competition_2026-2027_Override/images/Load_Example_2.png)

 

Figure SG11-2: Scoring Objects may also be introduced through the back of the Loader while it is raised.


---

## <SG12>

**Some rules change during the Endgame period.** Vertical expansion is limited to 18” for any *Robot* that is partially or entirely within the infinite 3D vertical projection of the *Midfield*. *Robots* that attempt to end the *Match* in the *Midfield* should expect vigorous interactions from opponent *Robots*. When a *Robot* is contacting or engaging with the *Midfield*, or is in proximity to the *Midfield*, incidental damage that is caused by opponent *Robots* pushing, tipping, or becoming *Entangled* with them would not be considered a *Violation* of <GG14>. Intentional damage or dangerous mechanisms may still be considered a *Violation* of <S1>, or <G1> at the *Head Referee’s* discretion. This rule is applied differently for VEX U. See Rule <VUG7>


*Rules SC1–SG12 sourced from the [online game manual](https://events.vex.com/storage/game_manual/VEX_V5_Robotics_Competition_2026-2027_Override/rules/).*

---

## Glossary of Terms

*Source: VEX V5 Robotics Competition Override — Game Manual, Version 0.2 (Released June 4, 2026), Appendix B*

### Adult

Anyone who is not a Student or another defined term (e.g., Head Referee).

### Alliance

A pre-assigned grouping of two Robots that are paired together during a given Head-to-Head
Match.

### Alliance Captain

One of the Teams with the privilege of inviting another available Team to form an Alliance
for Elimination Matches . See <T16>.

### Alliance Selection

The process of choosing the permanent Alliances for Elimination Matches . The
Alliance Selection proceeds as follows:

1. The highest-ranked Team at the end of Qualification Matches becomes the first Alliance Captain .

2. The Alliance Captain invites another Team to join their Alliance.

3. The invited Team representative either accepts or declines as outlined in <T16>.

4. The next-highest-ranked Team becomes the next Alliance Captain .

5. Alliance Captains continue to select their Alliances in this order until all Alliances are formed for Elimination Matches.

### Alliance Station

The designated regions where the Drive Team Members must remain for the duration of
the Match.

### Autonomous Bonus

A point bonus awarded to the Alliance that has earned the most points at the end of
the Autonomous Period. See <SC7> for more information.

### Autonomous Coding Skills Match

see Match.

### Autonomous Line

The pair of white tape lines that run diagonally across the Field and around the Midfield,
and the space between those lines. See <SG7> for more information.

### Autonomous Period

A time period during which Robots operate and react only to sensor inputs and
pre-programmed commands.

### Autonomous Points (AP)

The second basis of ranking Teams. An Alliance who wins the Autonomous
Bonus during a Qualification Match earns ten (10) Autonomous Points. In the event of a tie, both Alliances
will receive five (5) Autonomous Points.

### Autonomous Win Point (AWP)

An additional Win Point awarded to any Alliance that has completed a
defined set of tasks at the end of the Autonomous Period of a Qualification Match . Both Alliances can earn
an Autonomous Win Point if both Alliances accomplish these tasks. See <SC7> for more information.

### Builder

Any Student Team member who helps build the Robot. Adults are permitted to teach Builders
associated concepts, but should never work on the Robot.

### Bye

A situation in which an Alliance automatically advances to the next round of Tournament play without
competing.

### Coder

Any Student Team member who contributes to the computer code that is downloaded onto the
Robot. Adults are permitted to teach Coders associated concepts, but should never work on the code that
goes on the Robot.

### Cup

A Scoring Object, measuring approximately 3.15” (80mm) in diameter and 6.5” (164.5mm) tall. Each
Cup consists of two halves: one transparent and one opaque.

### Defensive

A category of strategies, Robot actions, and/or Robot statuses that can be employed by a
Team during a Match; see rules <GG14> and <GG15> for more information. A Robot is Defensive while it
is engaged in actions that cannot increase its Alliance’s score for the current Match, and instead limits an
opponent’s ability to score or play the game. A Robot can be in Possession of a Scoring Object and capable
of scoring, but still be Defensive based on its actions. Examples include, but are not limited to:
- De-scoring in a way that doesn’t increase points for the Robot’s own Alliance
- Limiting access to a portion of the Field while not attempting to score
- Holding, blocking, impeding, or otherwise restricting or controlling an opponent’s movements.

> Remember, Defensive Robot actions or Robot statuses are not automatically Violations.
However, Robot actions or statuses that are performed or achieved in a Defensive manner
are more likely to be Violations, and Teams should be more careful when employing Defensive strategies.

### Designer

Any Student Team member who helps design the Robot to be built for competition. Adults are
permitted to teach Designers associated concepts, but should never work on the design of the Robot.

### Disablement

A penalty applied to a Team for a safety Violation. A Team that receives a Disablement is not
allowed to operate their Robot for the remainder of the Match, and the Drive Team Member(s) will be asked
to place their controller(s) on the ground or another safe location outside of the Field, as directed by the
Head Referee.

### Disqualification

A penalty applied to a Team for a Major Violation (see <GG6> for more details). If a Team
receives a Disqualification in a Match, the Head Referee will notify the Team of their Violation at the end of
the Match. A Team that receives a Disqualification in a Qualification Match receives zero Win Points, zero
Autonomous Win Points, zero Autonomous Points, and zero Strength of Schedule Points . When a Team
receives a Disqualification in an Elimination Match, the entire Alliance is Disqualified and they receive a loss
for the Match. At the Head Referee’s discretion, repeated Violations and/or Disqualifications for a single
Team may lead to its Disqualification for the entire Tournament (see <GG6>). A Team that receives a Disqualification in a Driving Skills Match or Autonomous Coding Skills Match receives a score of zero for that
Robot Skills Match.

### Drive Team Member

A Student who stands in the Alliance Station during a Match. Adults are not allowed
to be Drive Team Members. See rule <GG1>.

### Driver Controlled Period

A time period during which Drive Team Members operate their Robot using a
VEX V5 controller.

### Driving Skills Match

see Match.

### Elimination Bracket

A schedule of Elimination Matches for eight (8) to sixteen (16) Alliances. See <T17>.

### Elimination Match

see Match.

### Endgame

A time period consisting of the last 10 seconds of a Head-to-Head Match, in which Robots
attempt to end the Match in the Midfield. See rule <SG12>.

### Entanglement

A Robot status. A Robot is Entangled if it has grabbed, hooked, or attached to an opposing
Robot or a Field Element. See rule <GG14>.

### Event Partner

The volunteer VEX V5 Robotics Competition Tournament coordinator who serves as an
overall manager for the volunteers, venue, event materials, and all other event considerations.

### Field

The entire playing Field, comprising the Floor and the Field Perimeter.

### Field Element

The Field, white tape, Loaders, Goals, Toggles, and all supporting structures and accessories
(such as field monitors, etc.).

### Field Perimeter

The outer part of the Field, made up of 12 straight sections.

### Floor

The interior flat part of the playing Field, made up of an array of six (6) gray foam field tiles wide by six
(6) gray foam field tiles long (totaling 36 Field tiles) that are within the Field Perimeter.

### Game Design Committee (GDC)

The creators of Override, and authors of this Game Manual. The Game
Design Committee is the only official source for rules clarifications and Q&A responses; see Section 1.

### Goal

One of the nine (9) designated locations around the Field in which Robots attempt to score Pins and
Cups. Goals are octagonal, and each Goal is one of three colors: red, blue, or black. The center Goal is 8.7”
(222.7mm) tall, neutral Goals in Quadrants are 5.8” (146.5mm) tall, and Alliance-specific Goals are 3.25”
(82.5mm) tall.

### Head Referee

A certified impartial volunteer responsible for enforcing the rules in this manual as written.
Head Referees are the only people who may discuss ruling interpretations or scoring questions with Teams
at an event. Large events (e.g., Signature Events, World Championships, etc.) might include multiple Head
Referees at the Event Partner’s discretion.

### Head-to-Head Match

see Match.

### Holding

A Robot status; see rule <GG17> for more information. Holding is legal until it exceeds the limits in
<GG17>. A Robot is considered to be Holding if it meets any of the following criteria during a Match:
- Trapping - Limiting the movement of an opponent Robot to a small or confined area of the Field, approximately the size of one foam field tile or less, without an avenue for escape. Note that if a Robot is not
attempting to escape, it is not considered Trapped.
- Pinning - Preventing the movement of an opponent Robot through contact with the Field Perimeter, a
Field Element, or another Robot.
- Lifting - Controlling an opponent’s movements by raising or tilting the opponent’s Robot off of the Floor.
Preventing a Robot that is already off of the Floor from returning to the Floor may also be considered
Lifting or Trapping.

### Loader

One of the four designated locations (two per Alliance) around the Field where Drive Team Members
can introduce Match Load Pins and Cups. See rule <SG11>.

### Match

A set time period, consisting of an Autonomous Period and/or Driver Controlled Periods , during
which Teams play a defined version of Override to earn points.
Match types:

- Autonomous Coding Skills Match - A Robot Skills Match in which a single Robot operates during a one
minute Autonomous Period. There is no Driver Controlled Period. Teams can elect to end an Autonomous
Coding Skills Match early if they wish to record a Skills Stop Time.

- Driving Skills Match - A Robot Skills Match in which one Team operates their Robot during a one minute
Driver Controlled Period. There is no Autonomous Period. Teams can elect to end a Driving Skills Match
early as described in rule <RSC5> if they wish to record a Skills Stop Time.

- Elimination Match - A Head-to-Head Match used in the process of determining the champion Alliance.
Alliances of two (2) Teams face off according to the Elimination Bracket ; the winning Alliance moves on
to the next round.

- Head-to-Head Match - A Match that consists of two Alliances that work to outscore the other Alliance in
a two-minute Match. Qualification Matches , Finals Matches, and optional Practice Matches are Head-to-Head Matches.

- Practice Match - A non-scored Head-to-Head Match used to provide time for Teams to get acquainted
with the official playing Field and procedures. Head Referees should not record or track standard
gameplay Violations that occur during Practice Matches. Egregious Violations may be recorded and
tracked at the discretion of the Head Referee.

- Qualification Match - A Head-to-Head Match that is used to determine Teams’ rankings for Alliance
Selection. Each Qualification Match consists of two Alliances competing to earn Win Points, Autonomous Points, and Strength of Schedule Points .

- Robot Skills Match - A Driving Skills Match or Autonomous Coding Skills Match .

| Match Type | Participants | Specific Rules | Autonomous Period (m:ss) | Driver Controlled Period (m:ss) |
| --- | --- | --- | --- | --- |
| Head-to-Head Match | Two Alliances (red/blue) each composed of two Teams, with one Robot each | Scoring ("SC"), General Game ("GG") and Specific Game ("SG") sections | 0:15 | 1:45 |
| Driving Skills Match | One Team, with one Robot | Section 3 | None | 1:00 |
| Autonomous Coding Skills Match | One Team, with one Robot | Section 3 | 1:00 | None |
| VEX U Robotics Competition Head-to-Head Match | Two Teams (red/blue), with two Robots each | Section 6 | 0:30 | 1:30 |
| VEX U Robotics Competition Driving Skills Match | One Team, with two Robots | Section 6 | None | 1:00 |
| VEX U Robotics Competition Autonomous Coding Skills Match | One Team, with two Robots | Section 6 | 1:00 | None |

### Match Load

One of the 20 Cups, 10 per Alliance, or 22 Pins, 11 per Alliance, that begin the Match in an
Alliance Station and which may be introduced during the Match. See rule <SG11>.

### Midfield

The center square-shaped area of the Field in which Robots attempt to end the Match to score
additional points. The Midfield is defined by the outer edge of the white tape line square, and can be entered
by all Robots during the Autonomous Period. See Figure Q-1.

### Notebooker

Any Student Team member who contributes to the Team’s engineering notebook or associated documentation. Adults are permitted to teach Notebookers associated concepts, but should never
work on the engineering notebook or other documentation.

### Offensive

A category of strategies, Robot actions, and/or Robot statuses that can be employed by a
Team during a Match; see rules <GG14> and <GG15> for more information. A Robot is Offensive while it is
engaged in actions that could directly increase its Alliance’s score for the current Match. Examples include,
but are not limited to:
- Adding a Scoring Object to a Goal to score points
- Moving toward a Goal with a Scoring Object that could earn points for their Alliance
- Changing the status of a Toggle
- Achieving (or attempting to achieve) any Robot status that adds points to their Alliance’s score
- Obtaining (or attempting to obtain) Scoring Objects

### Match Schedule

A list of Matches that is generated at the start of an event. The Match Schedule includes
the predetermined, randomly-paired Alliances that will be competing in each Qualification Match , and
the expected start times for these Matches. The Match Schedule may be subject to change at the Event
Partner’s discretion.

### Owned

A yellow Pin status. A Placed yellow Pin is Owned by an Alliance if the Toggle in that Quadrant is
set to the Alliance’s color.

### Placed

A Scoring Object status. See <SC2>.

### Plowing

A Robot / Scoring Object status. A Robot is considered to be Plowing a Scoring Object if the
Robot is intentionally moving it in a preferred direction with a flat or convex face of the Robot or with
another Scoring Object.

### Pin

A Scoring Object measuring approximately 1.6” (40mm) in diameter and 6.5” (165mm) tall . Each Pin
consists of two halves, and each half is red, blue, or yellow.

### Possession

A Robot / Scoring Object status. A Scoring Object is considered Possessed by a Robot if
a Robot’s change in direction would result in controlled movement of the Scoring Object. This typically
requires at least one of the following to be true:
- The Scoring Object is fully supported by the Robot
- The Robot is moving the Scoring Object in a preferred direction with a concave face of the Robot (or
inside of a concave angle formed by multiple mechanisms/faces of the Robot)
- The Robot is holding the Scoring Object against the Floor or a Field Element

> The difference between Possession and Plowing is analogous to the difference between
the terms “controlling” and “moving.

### Practice Match

see Match.

### Preload

The Pins, one (1) per Robot, placed by each Team prior to the start of each Match. See <SG5>.

### Quadrant

One of four designated triangular areas of the Field. Each Quadrant contains two Goals and one
Toggle. Robots may score Pins in the Goals within a Quadrant and may attempt to set that Quadrant’s Toggle
to control ownership of yellow Pins Scored in that Quadrant.
A Quadrant is defined by the outer edges of the white tape lines, the Field Perimeter, and the colored tape
that defines the Load Zones.
Each Quadrant is described as red or blue based on the Alliance-colored Goal it includes. See Figure Q-1.

### Qualification Match

see Match.

### Robot

A machine that has passed inspection, designed by Student Team members to execute one or more
tasks autonomously and/or by remote control from a Drive Team Member.

### Robot Skills Match

see Match.

### Scored

A Scoring Object status. See <SC3>.

### Scorekeeper Referee

An impartial volunteer responsible for tallying scores at the end of a Match. Scorekeeper Referees do not make ruling interpretations, and should redirect any Team questions regarding rules
or scores to a Head Referee.

### Scoring Object

A Cup or Pin.

### Skills Stop Time

The time remaining in a Robot Skills Match when a Team ends the Match early. See
<RSC5> for more details.

### Strategist

Any Student Team member who contributes to the Match strategies used to score points
during a Qualification Match or Robot Skills Match, including assessing the impact of other Teams’ performance and strategies on the Team’s strategy (e.g., scouting). Adults are permitted to teach Strategists
associated concepts, but should never create or dictate a Team’s Match strategy.

### Strength of Schedule Points (SP)

The third basis of ranking Teams. Strength of Schedule Points are
equivalent to the score of the losing Alliance in a Qualification Match . In the event of a tie, both Alliances
receive Strength of Schedule Points equal to the tie score. If both Teams on an Alliance are Disqualified, the
Teams on the not Disqualified Alliance will receive their own score as Strength of Schedule Points for that
Match.

### Student

A person is considered a Student if they meet both of the following criteria:

a. Anyone who is earning or has earned credit toward a secondary school (i.e., high school) diploma, certificate, or other equivalent during the six (6) months preceding the VEX Robotics World Championship.
Courses earning credits leading up to high school would satisfy this requirement.

b. Anyone born after May 1, 2007 (i.e., who will be 19 or younger at VEX Worlds 2027). Eligibility may also
be granted based on a disability that has delayed education by at least one year.

i. Middle School Student - A Student born after May 1, 2011 (i.e., who will be 15 or younger at VEX
Worlds 2027). Any Student who meets this criteria may also compete as High School Students.

ii. High School Student - Any eligible Student that is not a Middle School Student.

### Team

One or more Students make up a Team. In the context of this game manual, Student Team members
fill multiple roles related to Robot design, build, coding, strategy, and documentation. See <G2>, <G4>, <G5>
for more information. Adults may not fulfill any of these roles. See Appendix D for more information about
Team classifications and Student roles.

### Time-out

A single break period no greater than three minutes (3:00) allotted for each Alliance during the
Elimination Bracket . See <GG7>.

### Toggle

One of four (4) triangular shaped Field Elements mounted to the Field Perimeter that can be Owned
to control yellow Pins Scored in the corresponding Quadrant. Each Toggle has 3 sides that, when viewed
from inside the Field, indicate which Alliance Owns the Toggle. Toggles are 25.8” (656.2mm) long and each
face of the triangle is approximately 2.05” (52.2mm) wide . See <SC4> for more information.VEX V5 Robotics Competition Override - Game Manual

### Tournament

A competition event that includes scored Matches, and which is run by an Event Partner.

### Violation

The act of breaking a rule in the game manual. See Appendix C for additional information on
Violations and penalties.
- Minor Violation - A Violation which does not result in a Disqualification .
- Major Violation - A Violation which results in a Disqualification .
- Match Affecting - A Violation which changes the winning and losing Alliance in the Match.

### Win Percentage (WP)

Replaces Win Points in a league event. Win Percentage is calculated by the number
of wins divided by the number of Qualification Matches the Team plays. In cases of a tie, the Team is given a
0.5 number of “wins” for that Match. The Autonomous Win Point is also considered 0.5 “wins,” added to the
total number of wins.

### Win Points (WP)

The first basis of ranking Teams. Teams will receive zero (0), one (1), two (2), or three (3)
Win Points for each Qualification Match . Unless a Team is Disqualified, both Teams on an Alliance always
earn the same number of Win Points.
- One (1) Win Point is awarded for completing the Autonomous Win Point task(s).
- Two (2) Win Points are awarded for winning a Qualification Match .
- One (1) Win Point is awarded for tying a Qualification Match .
- Zero (0) Win Points are awarded for losing a Qualification Match .
