"""Classification and content for the 262 distinct definition-breakdown
words physics_definition_completeness.py found unresolved (examples/
physics_definition_completeness_report.md, generated before this file
existed). For each: a part of speech, a concise definition, and a
placement -- "common" (promoted into the Common Vocabulary Cache,
assets/common/en/promoted_words.json, so every Domain inherits it),
"physics" (hydrated into the Physics Domain only, alongside the
originally-hydrated Physics vocabulary), or "exclude" (not a genuine
lexical item -- reported, not forced into either domain).

Placement judgement: a word is "physics" when its own primary sense
here is itself physics/science technical vocabulary (subatomic
particles and their plurals, SI units, electromagnetism, the
mechanics/thermodynamics cluster already established in
physics_domain_relationships.py -- e.g. hot/cold are already
Physics-owned ANTONYMs there, so warm/solid/liquid join the same
thermal/state cluster for consistency); "common" otherwise -- ordinary
general-English vocabulary useful in any Domain, matching how the
original Physics seeding already treated depend/position (examples/
README.md's Word-sense conflicts section). Exactly one word, "s", is
excluded: a tokenizer artefact (the trailing letter of a possessive
like "wave's" against the [^\\W_]+ token pattern -- vocabulary/data/
word.py's _definition_tokens), not a lexical item in either domain.

MORPHOLOGICAL_LINKS pairs a derived/inflected word with an existing
base -- either a Word already resolved somewhere in the Physics
Domain's Dictionary before this file ("existing", found by a
suffix-stripping-and-lookup pass, not guessed by eye) or another word
defined in this same file ("batch", e.g. measure/measured, both
unresolved before this file, now linked to each other). Each entry
becomes two edges when seeded, matching the Common Vocabulary
Relationship Cache's own reciprocal-edge convention (assets/common/en/
relationships/README.md): (base, KIND, derived) plus the reverse
(derived, LEMMA_FORM, base) -- see word.py's lemma_forms()/inflections().

EXTRA_SEMANTIC_LINKS is deliberately small: only ANTONYM pairs found
directly within this batch (or against an existing word) that are
obvious and don't need a manufactured taxonomy -- "appropriate"
relationships per the task, not an attempted full WordNet buildout for
262 words in one pass."""

from typing import Dict, List, Tuple

# lexical_form -> (part_of_speech, domain, definition)
# domain is "common", "physics", or "exclude".
WORD_ENTRIES: Dict[str, Tuple[str, str, str]] = {
    "measured": ("VERB", "common", "Determined by measurement; past participle of measure."),
    "physical": ("ADJECTIVE", "common", "Relating to the body or to material things, rather than the mind or spirit."),
    "amount": ("NOUN", "common", "A quantity of something, especially the total of a thing or things in number, size, or extent."),
    "motion": ("NOUN", "physics", "The action or process of moving or being moved; movement."),
    "space": ("NOUN", "physics", "The boundless three-dimensional extent in which objects and events occur and have relative position and direction."),
    "subatomic": ("ADJECTIVE", "physics", "Smaller than, or occurring within, an atom."),
    "change": ("VERB", "common", "To make or become different."),
    "degree": ("NOUN", "common", "A unit of measurement, or a stage in a scale of intensity or amount."),
    "especially": ("ADVERB", "common", "To a great extent; particularly."),
    "make": ("VERB", "common", "To bring into existence by shaping, combining, or transforming material; to cause to happen or exist."),
    "medium": ("NOUN", "physics", "A substance or surroundings through which a physical effect, such as a wave, is transmitted."),
    "quality": ("NOUN", "common", "A distinctive attribute or characteristic possessed by someone or something."),
    "specified": ("ADJECTIVE", "common", "Identified clearly and definitely; stated precisely."),
    "belonging": ("ADJECTIVE", "common", "Being rightly placed or classified as a part, member, or property of something."),
    "branch": ("NOUN", "common", "A division or subdivision of a field of knowledge or activity."),
    "concerned": ("ADJECTIVE", "common", "Involved in or affected by something; relating to."),
    "device": ("NOUN", "common", "An object or piece of equipment made or adapted for a particular purpose."),
    "found": ("VERB", "common", "Past tense and past participle of find; discovered or encountered, typically by chance or search."),
    "material": ("NOUN", "common", "The matter from which something is or can be made."),
    "point": ("NOUN", "common", "An exact location or position, especially one with no extent, or a particular moment in time or stage in a process."),
    "properties": ("NOUN", "physics", "Plural of property; the distinctive attributes or characteristics possessed by something."),
    "relating": ("VERB", "common", "Present participle of relate; making or having a connection with something."),
    "stream": ("NOUN", "common", "A continuous flow of something, such as liquid, gas, particles, or data."),
    "substance": ("NOUN", "common", "The physical material from which something is made or which has discrete existence; matter."),
    "surroundings": ("NOUN", "common", "The conditions, objects, or area around someone or something; environment."),
    "surrounded": ("ADJECTIVE", "common", "Having something on every side; encircled or enclosed."),
    "action": ("NOUN", "common", "The process of doing something, especially to achieve an aim; a thing done."),
    "attribute": ("NOUN", "common", "A quality or feature regarded as a characteristic or inherent part of someone or something."),
    "battery": ("NOUN", "physics", "A device consisting of one or more electrochemical cells that converts stored chemical energy into electrical energy."),
    "become": ("VERB", "common", "To begin to be; to come to be."),
    "bring": ("VERB", "common", "To cause to come with oneself; to lead or carry to a place."),
    "capacity": ("NOUN", "common", "The maximum amount that something can contain, or the ability to do or produce something."),
    "causing": ("VERB", "common", "Present participle of cause; making something happen."),
    "complete": ("ADJECTIVE", "common", "Having all the necessary or appropriate parts; entire, with nothing missing."),
    "considered": ("ADJECTIVE", "common", "Thought about carefully; regarded or judged to be."),
    "continuously": ("ADVERB", "common", "In a continuous manner; without interruption."),
    "difference": ("NOUN", "common", "A point or way in which people or things are not the same; the amount by which quantities differ."),
    "discrete": ("ADJECTIVE", "common", "Individually separate and distinct; not continuous."),
    "effect": ("NOUN", "common", "A change that is a result or consequence of an action or other cause."),
    "exchanging": ("VERB", "common", "Present participle of exchange; giving or receiving something in return for something else."),
    "expressed": ("VERB", "common", "Past participle of express; conveyed or represented in words, symbols, or numbers."),
    "frequency": ("NOUN", "physics", "The number of times a periodic process, such as a wave cycle, occurs in a given period of time."),
    "given": ("ADJECTIVE", "common", "Specified or particular; stated as a known fact or condition."),
    "heating": ("VERB", "physics", "Present participle of heat; the process of making or becoming hot."),
    "high": ("ADJECTIVE", "common", "Of great vertical extent or degree; being far above a reference point or average."),
    "influence": ("NOUN", "common", "The capacity to have an effect on the character, development, or behaviour of someone or something."),
    "instance": ("NOUN", "common", "An example or single occurrence of something."),
    "nature": ("NOUN", "common", "The basic or inherent features of something, especially when seen as characteristic of it."),
    "order": ("NOUN", "common", "The arrangement or disposition of people or things in relation to each other according to a particular sequence or method."),
    "particular": ("ADJECTIVE", "common", "Used to single out an individual member of a specified group or class; specific."),
    "perform": ("VERB", "common", "To carry out an action, task, or function."),
    "pull": ("VERB", "common", "To exert force on something so as to draw it toward oneself or the origin of the force."),
    "radiation": ("NOUN", "physics", "Energy that is emitted or transmitted in the form of waves or particles through space or a medium."),
    "region": ("NOUN", "common", "An area, especially part of a country or the world, having definable characteristics but not always fixed boundaries."),
    "size": ("NOUN", "common", "The relative extent of something; how large or small something is."),
    "stable": ("ADJECTIVE", "common", "Not likely to change or fail; firmly fixed, steady, or resistant to change."),
    "state": ("NOUN", "common", "The particular condition that someone or something is in at a specific time."),
    "steadily": ("ADVERB", "common", "In a steady manner; evenly, or without interruption or change."),
    "steady": ("ADJECTIVE", "common", "Firmly fixed, supported, or balanced; not shaking or moving; not changing or fluctuating."),
    "structure": ("NOUN", "common", "The arrangement of and relations between the parts or elements of something complex."),
    "study": ("NOUN", "common", "The devotion of time and attention to acquiring knowledge, especially through reading or research."),
    "transferred": ("VERB", "physics", "Past participle of transfer; moved or passed from one place, person, or thing to another."),
    "turn": ("VERB", "common", "To move in a circular direction around a point or axis; to change direction."),
    "used": ("ADJECTIVE", "common", "Employed for a purpose; past participle of use."),
    "value": ("NOUN", "common", "The numerical amount or quantity assigned or calculated; the importance or worth of something."),
    "able": ("ADJECTIVE", "common", "Having the power, skill, or means to do something."),
    "according": ("VERB", "common", "Present participle of accord; being in agreement or consistent with (used chiefly in the phrase 'according to')."),
    "accounted": ("VERB", "common", "Past participle of account; explained or gave a reason for."),
    "achieve": ("VERB", "common", "To successfully bring about or reach a desired objective or result."),
    "acts": ("VERB", "common", "Third person singular of act; behaves or performs actions in a specified way."),
    "actual": ("ADJECTIVE", "common", "Existing in fact; real."),
    "amperes": ("NOUN", "physics", "Plural of ampere, the SI base unit of electric current."),
    "angular": ("ADJECTIVE", "physics", "Relating to, measured by, or characterised by an angle; relating to rotation about an axis."),
    "answer": ("NOUN", "common", "A thing said, written, or done to deal with a question, problem, or situation."),
    "appear": ("VERB", "common", "To come into sight; to seem or give the impression of being."),
    "arising": ("VERB", "common", "Present participle of arise; originating from or resulting as a consequence of something."),
    "arrives": ("VERB", "common", "Third person singular of arrive; reaches a place or point."),
    "assemble": ("VERB", "common", "To gather together in one place for a common purpose; to fit together the parts of something."),
    "assign": ("VERB", "common", "To allocate a task, role, or value to someone or something."),
    "atoms": ("NOUN", "physics", "Plural of atom."),
    "basic": ("ADJECTIVE", "common", "Forming an essential foundation or starting point; fundamental."),
    "bear": ("VERB", "common", "To carry or support the weight of something; to exert or experience a force."),
    "behaviour": ("NOUN", "common", "The way in which someone or something acts or functions, especially in response to particular circumstances."),
    "bodies": ("NOUN", "physics", "Plural of body."),
    "central": ("ADJECTIVE", "common", "Of, at, or forming the centre; of primary importance."),
    "challenge": ("NOUN", "common", "A task or situation that tests someone's abilities."),
    "changes": ("VERB", "common", "Third person singular of change; makes or becomes different."),
    "changing": ("VERB", "common", "Present participle of change; making or becoming different."),
    "charged": ("VERB", "physics", "Past participle of charge; given an electric charge, or filled with energy."),
    "chemical": ("ADJECTIVE", "common", "Relating to chemistry or the interactions of substances as studied in chemistry."),
    "closer": ("ADJECTIVE", "common", "Comparative of close; nearer in distance, time, or relationship."),
    "comes": ("VERB", "common", "Third person singular of come; moves toward or arrives at a particular place."),
    "commonly": ("ADVERB", "common", "In a manner that occurs often or is shared by many; usually."),
    "compared": ("VERB", "common", "Past participle of compare; assessed for similarities and differences."),
    "composed": ("VERB", "common", "Past participle of compose; made up of specified parts or elements."),
    "comprising": ("VERB", "common", "Present participle of comprise; consisting of or made up of."),
    "configuration": ("NOUN", "common", "An arrangement of parts or elements in a particular form or figure."),
    "consecutive": ("ADJECTIVE", "common", "Following one after another without interruption."),
    "consisting": ("VERB", "common", "Present participle of consist; being composed or made up of specified parts."),
    "constant": ("ADJECTIVE", "common", "Occurring continuously over time; not changing."),
    "contexts": ("NOUN", "common", "Plural of context; the circumstances that form the setting for an event, statement, or idea."),
    "continuous": ("ADJECTIVE", "common", "Unbroken or uninterrupted in time, sequence, or extent."),
    "controlled": ("VERB", "common", "Past participle of control; determined the behaviour or course of something."),
    "corresponding": ("ADJECTIVE", "common", "Analogous or equivalent in character, form, or function."),
    "coulombs": ("NOUN", "physics", "Plural of coulomb, the SI unit of electric charge."),
    "crests": ("NOUN", "physics", "Plural of crest."),
    "deal": ("VERB", "common", "To take action in order to handle or resolve something; to distribute or apportion."),
    "decreases": ("VERB", "common", "Third person singular of decrease; becomes or makes smaller in size, amount, or degree."),
    "deductions": ("NOUN", "common", "Plural of deduction; amounts subtracted from a total, or conclusions reached by reasoning."),
    "described": ("VERB", "common", "Past participle of describe; given a detailed account of."),
    "determined": ("VERB", "common", "Past participle of determine; established or ascertained precisely."),
    "develop": ("VERB", "common", "To grow or cause to grow and become more mature, advanced, or elaborate."),
    "distinct": ("ADJECTIVE", "common", "Recognisably different in nature from something else of a similar type."),
    "disturbance": ("NOUN", "common", "An interruption of a settled and peaceful condition; a temporary variation that travels through a medium or field."),
    "easily": ("ADVERB", "common", "Without difficulty or effort."),
    "effects": ("NOUN", "common", "Plural of effect; changes that are a result or consequence of an action or other cause."),
    "electrical": ("ADJECTIVE", "physics", "Relating to, worked by, or produced by electricity."),
    "electricity": ("NOUN", "physics", "A form of energy resulting from the existence of charged particles, such as electrons or protons, either statically or in motion."),
    "electromagnetic": ("ADJECTIVE", "physics", "Relating to the interrelation of electric currents or fields and magnetic fields."),
    "electromotive": ("ADJECTIVE", "physics", "Tending to produce an electric current, as in the term electromotive force."),
    "electrons": ("NOUN", "physics", "Plural of electron."),
    "element": ("NOUN", "common", "A part or component of something; a fundamental, irreducible constituent."),
    "else": ("ADVERB", "common", "In addition; besides; other than what has been mentioned."),
    "exerting": ("VERB", "physics", "Present participle of exert; applying a force or influence."),
    "effort": ("NOUN", "common", "A vigorous or determined attempt; the exertion of physical or mental energy."),
    "exist": ("VERB", "physics", "To have real, actual, or continued being."),
    "experience": ("VERB", "common", "To encounter, undergo, or be affected by something, such as a force or event."),
    "experiment": ("NOUN", "common", "A scientific procedure carried out to test a hypothesis or demonstrate a fact."),
    "extent": ("NOUN", "common", "The area or range covered by something; the degree to which something extends."),
    "fact": ("NOUN", "common", "A thing that is known or proved to be true."),
    "factual": ("ADJECTIVE", "common", "Concerned with or containing facts, especially as opposed to interpretation."),
    "feature": ("NOUN", "common", "A distinctive attribute or aspect of something."),
    "forces": ("NOUN", "physics", "Plural of force."),
    "fro": ("ADVERB", "common", "Away; back (used only in the phrase 'to and fro')."),
    "future": ("NOUN", "common", "The time or a period of time following the moment of speaking or writing; time regarded as still to come."),
    "gather": ("VERB", "common", "To bring together in one place; to collect or accumulate."),
    "general": ("ADJECTIVE", "common", "Affecting or concerning all or most people, places, or things; not specific or detailed."),
    "gravity": ("NOUN", "physics", "The force that attracts a body toward the centre of a planet or other massive object."),
    "greeting": ("NOUN", "common", "A word or sign of welcome or recognition, or a gesture such as waving used to express it."),
    "hand": ("NOUN", "common", "The end part of the arm used for grasping and manipulating, or a gesture made with it."),
    "happen": ("VERB", "common", "To take place; to occur, especially without apparent cause or by chance."),
    "happening": ("VERB", "common", "Present participle of happen; taking place or occurring."),
    "human": ("ADJECTIVE", "common", "Relating to or characteristic of people, as opposed to animals or machines."),
    "identified": ("VERB", "common", "Past participle of identify; established or indicated who or what someone or something is."),
    "importance": ("NOUN", "common", "The state of mattering greatly; significance."),
    "important": ("ADJECTIVE", "common", "Of great significance, value, or consequence."),
    "increase": ("VERB", "common", "To become or make greater in size, amount, intensity, or degree."),
    "increases": ("VERB", "common", "Third person singular of increase; becomes or makes greater in size, amount, intensity, or degree."),
    "indivisible": ("ADJECTIVE", "common", "Unable to be divided or separated."),
    "intensity": ("NOUN", "common", "The degree of strength, force, or energy exhibited by something."),
    "interaction": ("NOUN", "common", "Reciprocal action or influence between two or more things."),
    "interchangeably": ("ADVERB", "common", "In a way that allows one thing to be substituted for another without any difference in meaning or effect."),
    "intrinsic": ("ADJECTIVE", "common", "Belonging naturally to something; forming an essential part of it, rather than being acquired."),
    "iron": ("NOUN", "common", "A strong, hard magnetic metallic element, widely used in construction and manufacturing."),
    "kept": ("VERB", "common", "Past tense and past participle of keep; retained, maintained, or continued to have."),
    "larger": ("ADJECTIVE", "common", "Comparative of large; greater in size, extent, or amount."),
    "level": ("NOUN", "common", "A position on a scale of amount, quantity, extent, or quality."),
    "line": ("NOUN", "common", "A long, narrow mark or continuous extent of length, having negligible width, connecting two points."),
    "liquid": ("NOUN", "physics", "A substance that flows freely and has a constant volume but no fixed shape, one of the basic states of matter."),
    "low": ("ADJECTIVE", "common", "Not high or tall; below average in amount, degree, or intensity."),
    "machine": ("NOUN", "common", "An apparatus using mechanical power and having several parts, each with a definite function, used to perform a task."),
    "magnet": ("NOUN", "physics", "An object, typically made of iron or steel, that produces a magnetic field and attracts or repels other magnetic materials."),
    "magnitude": ("NOUN", "common", "The great size or extent of something; the numerical value of a quantity, without regard to its direction."),
    "makes": ("VERB", "common", "Third person singular of make; brings into existence, or causes to happen."),
    "manifest": ("VERB", "common", "To display or show a quality or feeling by one's acts or appearance; to become apparent."),
    "measure": ("VERB", "common", "To ascertain the size, amount, or degree of something using an instrument marked in standard units."),
    "mental": ("ADJECTIVE", "common", "Relating to the mind, especially as opposed to the body or to physical things."),
    "meshed": ("VERB", "common", "Past participle of mesh; interlocked or engaged together, as with the parts of a network."),
    "minute": ("ADJECTIVE", "common", "Extremely small."),
    "molecules": ("NOUN", "physics", "Plural of molecule, the smallest fundamental unit of a chemical compound that can take part in a reaction."),
    "movement": ("NOUN", "common", "An act of changing physical location or position, or a change in position generally."),
    "moments": ("NOUN", "common", "Plural of moment; very brief periods of time, or particular points in time."),
    "name": ("NOUN", "common", "A word or set of words by which a person, animal, place, or thing is known, addressed, or referred to."),
    "natural": ("ADJECTIVE", "common", "Existing in or caused by nature; not made, caused, or influenced by humans."),
    "negative": ("ADJECTIVE", "common", "Less than zero; relating to a type of electric charge opposite to positive."),
    "neutrons": ("NOUN", "physics", "Plural of neutron."),
    "now": ("ADVERB", "common", "At the present time or moment."),
    "numbers": ("NOUN", "common", "Plural of number; arithmetical values used for counting, measuring, or labelling."),
    "observation": ("NOUN", "common", "The action or process of closely watching or monitoring something; a remark based on this."),
    "occupies": ("VERB", "common", "Third person singular of occupy; takes up a certain amount of space, time, or position."),
    "occurs": ("VERB", "common", "Third person singular of occur; happens or takes place."),
    "ohms": ("NOUN", "physics", "Plural of ohm, the SI unit of electrical resistance."),
    "operation": ("NOUN", "common", "The action of functioning or the fact of being active; a process or series of acts."),
    "opposes": ("VERB", "common", "Third person singular of oppose; acts against or in a contrary direction to something."),
    "opposing": ("ADJECTIVE", "common", "Positioned or acting in a contrary or competing direction or position."),
    "overall": ("ADJECTIVE", "common", "Taking everything into account; total or general, rather than particular."),
    "own": ("ADJECTIVE", "common", "Belonging to oneself or itself; not shared or contributed by others."),
    "part": ("NOUN", "common", "A piece or segment of something that, together with other pieces, makes up the whole."),
    "parts": ("NOUN", "common", "Plural of part; pieces or segments of something that, together, make up the whole."),
    "pass": ("VERB", "common", "To move onward, through, or past something; to allow something to go through, as a conductor allows current."),
    "passage": ("NOUN", "common", "The action or process of moving through or past something; a route or channel through which something moves."),
    "path": ("NOUN", "common", "A route or course along which something moves or travels."),
    "permits": ("VERB", "common", "Third person singular of permit; allows or makes possible."),
    "piece": ("NOUN", "common", "A portion or part of something, especially one that has been separated from a larger whole."),
    "placed": ("VERB", "common", "Past participle of place; put something in a particular position."),
    "portion": ("NOUN", "common", "A part of a whole; a share or section."),
    "positions": ("NOUN", "common", "Plural of position; particular places or locations, or ways of being arranged."),
    "positive": ("ADJECTIVE", "common", "Greater than zero; relating to a type of electric charge opposite to negative; constructive or optimistic."),
    "possesses": ("VERB", "physics", "Third person singular of possess; has as an attribute, quality, or characteristic."),
    "powered": ("VERB", "physics", "Past participle of power; supplied with mechanical or electrical energy."),
    "process": ("NOUN", "common", "A series of actions or steps taken in order to achieve a particular result."),
    "producing": ("VERB", "common", "Present participle of produce; making or causing something to exist or happen."),
    "product": ("NOUN", "common", "The result of multiplying two or more numbers or quantities together; something produced."),
    "protons": ("NOUN", "physics", "Plural of proton."),
    "push": ("VERB", "common", "To exert force on something so as to move it away from oneself."),
    "quantifies": ("VERB", "common", "Third person singular of quantify; expresses or measures the quantity of something."),
    "quantities": ("NOUN", "common", "Plural of quantity; amounts or numbers of something measurable."),
    "question": ("NOUN", "common", "A sentence worded or expressed so as to elicit information; a matter requiring resolution or investigation."),
    "quickly": ("ADVERB", "common", "At a fast speed; rapidly."),
    "rank": ("NOUN", "common", "A position in a hierarchy or scale, especially one indicating relative importance or value."),
    "real": ("ADJECTIVE", "common", "Actually existing as a thing or occurring in fact; not imagined or supposed."),
    "reason": ("NOUN", "common", "A cause, explanation, or justification for an action or event."),
    "relation": ("NOUN", "common", "The way in which two or more things are connected, or the state of being connected."),
    "relations": ("NOUN", "common", "Plural of relation; the ways in which two or more things are connected."),
    "remaining": ("ADJECTIVE", "common", "Still present or in existence after the rest has gone, been used, or been dealt with."),
    "represents": ("VERB", "common", "Third person singular of represent; stands for or symbolises something."),
    "respect": ("NOUN", "common", "A particular aspect, point, or detail; regard or relation to."),
    "resulting": ("VERB", "common", "Present participle of result; occurring or following as a consequence."),
    "scale": ("NOUN", "common", "A graduated range of values forming a standard system for measuring or grading something."),
    "seen": ("VERB", "common", "Past participle of see; perceived with the eyes or otherwise noticed or observed."),
    "separately": ("ADVERB", "common", "In a way that is not connected with or related to something else; apart."),
    "serving": ("VERB", "common", "Present participle of serve; performing a function or being of use."),
    "set": ("NOUN", "common", "A group or collection of things that belong together or share a common property."),
    "showing": ("VERB", "common", "Present participle of show; making something visible or apparent."),
    "signal": ("NOUN", "common", "A gesture, action, or sound used to convey information or an instruction, or a variable quantity that conveys information."),
    "significance": ("NOUN", "common", "The quality of being significant or having an important meaning; importance."),
    "solid": ("NOUN", "physics", "A substance that maintains a fixed shape and volume, one of the basic states of matter."),
    "sound": ("NOUN", "common", "Vibrations that travel through the air or another medium and can be heard when they reach a person's or animal's ear."),
    "spots": ("NOUN", "common", "Particular points or locations; small, distinctly marked areas."),
    "standard": ("NOUN", "common", "A level of quality or attainment used as a measure, norm, or model; an accepted measure or unit against which other things are judged."),
    "steel": ("NOUN", "common", "A hard, strong grey or bluish-grey alloy of iron with carbon, widely used as a structural material."),
    "store": ("VERB", "common", "To keep or reserve something for future use."),
    "stored": ("VERB", "common", "Past participle of store; kept or reserved for future use."),
    "straight": ("ADJECTIVE", "common", "Extending or moving in one direction without curving or bending."),
    "strands": ("NOUN", "common", "Plural of strand; individual threads or filaments that are twisted together with others to form a rope, wire, or similar structure."),
    "strength": ("NOUN", "common", "The quality or state of being physically or mechanically strong; the degree of intensity of something."),
    "strict": ("ADJECTIVE", "common", "Demanding that rules concerning behaviour are obeyed and observed; precisely defined or fixed."),
    "striking": ("VERB", "common", "Present participle of strike; hitting or colliding with something forcefully."),
    "successfully": ("ADVERB", "common", "In a way that accomplishes a desired aim or result."),
    "sum": ("NOUN", "common", "The total amount resulting from the addition of two or more numbers, amounts, or items."),
    "superior": ("ADJECTIVE", "common", "Higher in status, quality, or degree; greater in strength or influence."),
    "supply": ("VERB", "common", "To make something needed or wanted available to someone; to provide."),
    "systematic": ("ADJECTIVE", "common", "Done or acting according to a fixed plan or system; methodical."),
    "systems": ("NOUN", "physics", "Plural of system."),
    "technical": ("ADJECTIVE", "common", "Relating to the practical use of machinery, applied sciences, or mechanical arts; involving specialised knowledge."),
    "topmost": ("ADJECTIVE", "common", "Highest in position; uppermost."),
    "touched": ("VERB", "common", "Past participle of touch; came into or was in physical contact with."),
    "types": ("NOUN", "common", "Plural of type; a category of people or things having common characteristics."),
    "unit": ("NOUN", "common", "A single, standard quantity used as a basis for measurement; a single, complete entity, especially as part of a larger whole."),
    "using": ("VERB", "common", "Present participle of use; employing something for a purpose."),
    "varieties": ("NOUN", "common", "Plural of variety; a number of different types of something; the quality of not always following the same pattern."),
    "varying": ("VERB", "common", "Present participle of vary; differing or changing in size, amount, or degree."),
    "violently": ("ADVERB", "common", "In a way that involves or is caused by physical force intended to hurt, damage, or kill; with great force or intensity."),
    "volts": ("NOUN", "physics", "Plural of volt, the SI unit of electric potential difference."),
    "volume": ("NOUN", "common", "The amount of three-dimensional space occupied by an object or substance, or the amount or quantity of something."),
    "warm": ("ADJECTIVE", "physics", "Having or giving out a moderate degree of heat, between cool and hot."),
    "watts": ("NOUN", "physics", "Plural of watt, the SI unit of power."),
    "way": ("NOUN", "common", "A method, style, or manner of doing something; a road, track, or path for travelling along."),
    "whole": ("ADJECTIVE", "common", "Complete; containing all components; not divided or fragmented."),
    "worked": ("VERB", "physics", "Past participle of work; performed physical or mental effort, or transferred energy by force."),
    "world": ("NOUN", "common", "The earth and all its inhabitants and physical features; a particular area of activity or interest."),
}

# Not a genuine lexical item: "wave's" tokenizes (per word.py's
# [^\W_]+ pattern) into "wave" and "s" -- "s" is the trailing letter of
# a possessive, not a word in either domain.
EXCLUDED_WORDS: Dict[str, str] = {
    "s": "Tokenizer artefact -- the trailing letter of a possessive ('wave's'), not a lexical item.",
}

# (base_lexical_form, relationship_kind, derived_lexical_form, base_origin)
# base_origin is "existing" (already resolved before this file, found by
# a suffix-stripping-and-lookup pass against the seeded Physics
# Dictionary) or "batch" (the base is itself one of WORD_ENTRIES above).
MorphLink = Tuple[str, str, str, str]
MORPHOLOGICAL_LINKS: List[MorphLink] = [
    # -- derived word's base already resolved (Common or Physics) --
    ("property", "PLURAL_FORM", "properties", "existing"),
    ("relate", "PRESENT_PARTICIPLE_FORM", "relating", "existing"),
    ("cause", "PRESENT_PARTICIPLE_FORM", "causing", "existing"),
    ("express", "PAST_PARTICIPLE_FORM", "expressed", "existing"),
    ("heat", "PRESENT_PARTICIPLE_FORM", "heating", "existing"),
    ("transfer", "PAST_PARTICIPLE_FORM", "transferred", "existing"),
    ("atom", "PLURAL_FORM", "atoms", "existing"),
    ("body", "PLURAL_FORM", "bodies", "existing"),
    ("charge", "PAST_PARTICIPLE_FORM", "charged", "existing"),
    ("common", "ADVERBIAL_DERIVATION", "commonly", "existing"),
    ("compare", "PAST_PARTICIPLE_FORM", "compared", "existing"),
    ("crest", "PLURAL_FORM", "crests", "existing"),
    ("describe", "PAST_PARTICIPLE_FORM", "described", "existing"),
    ("determine", "PAST_PARTICIPLE_FORM", "determined", "existing"),
    ("electron", "PLURAL_FORM", "electrons", "existing"),
    ("exert", "PRESENT_PARTICIPLE_FORM", "exerting", "existing"),
    ("force", "PLURAL_FORM", "forces", "existing"),
    ("neutron", "PLURAL_FORM", "neutrons", "existing"),
    ("number", "PLURAL_FORM", "numbers", "existing"),
    ("place", "PAST_PARTICIPLE_FORM", "placed", "existing"),
    ("position", "PLURAL_FORM", "positions", "existing"),
    ("possess", "THIRD_PERSON_FORM", "possesses", "existing"),
    ("power", "PAST_PARTICIPLE_FORM", "powered", "existing"),
    ("proton", "PLURAL_FORM", "protons", "existing"),
    ("quantity", "PLURAL_FORM", "quantities", "existing"),
    ("represent", "THIRD_PERSON_FORM", "represents", "existing"),
    ("result", "PRESENT_PARTICIPLE_FORM", "resulting", "existing"),
    ("system", "PLURAL_FORM", "systems", "existing"),
    ("work", "PAST_PARTICIPLE_FORM", "worked", "existing"),

    # -- both words newly defined in this same batch --
    ("change", "THIRD_PERSON_FORM", "changes", "batch"),
    ("change", "PRESENT_PARTICIPLE_FORM", "changing", "batch"),
    ("continuous", "ADVERBIAL_DERIVATION", "continuously", "batch"),
    ("effect", "PLURAL_FORM", "effects", "batch"),
    ("happen", "PRESENT_PARTICIPLE_FORM", "happening", "batch"),
    ("increase", "THIRD_PERSON_FORM", "increases", "batch"),
    ("make", "THIRD_PERSON_FORM", "makes", "batch"),
    ("measure", "PAST_PARTICIPLE_FORM", "measured", "batch"),
    ("part", "PLURAL_FORM", "parts", "batch"),
    ("relation", "PLURAL_FORM", "relations", "batch"),
    ("steady", "ADVERBIAL_DERIVATION", "steadily", "batch"),
    ("store", "PAST_PARTICIPLE_FORM", "stored", "batch"),
]

# "exist" is the true infinitive/lemma; "exists" was independently
# hydrated in the original Physics seeding run (no lemmatisation in
# that pipeline -- vocabulary/documentation/README.md, 9.6) without a
# LEMMA_FORM link back to a base that didn't exist yet. This is the one
# case in this batch where the *new* word ("exist") is the base and an
# *already-existing* word ("exists") is the derived form -- every other
# "existing"-origin row above has it the other way round (existing
# base, new derived word) -- so it's recorded with base_origin
# "existing_as_derived" rather than forced into that shape.
MORPHOLOGICAL_LINKS.append(("exist", "THIRD_PERSON_FORM", "exists", "existing_as_derived"))

# Small, deliberately conservative set of additional semantic ties --
# only where genuinely obvious and simple, not a manufactured taxonomy
# (see module docstring).
EXTRA_SEMANTIC_LINKS: List[Tuple[str, str, str]] = [
    ("discrete", "ANTONYM", "continuous"),
    ("high", "ANTONYM", "low"),
    ("push", "ANTONYM", "pull"),
    ("negative", "ANTONYM", "positive"),
]
