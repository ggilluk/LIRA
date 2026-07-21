"""Curated external-dictionary-shaped fixture data for the Physics
domain seeding demonstration (physics_domain_seeding.py).

This sandbox's network policy rejects outbound calls to
api.dictionaryapi.dev (the only external provider wired into
AsyncDictionaryHydrator) with a 403 policy denial -- confirmed
directly, not assumed. So this demonstration cannot make a live call
to that API. Instead, this file supplies hand-written responses in
that API's own real shape (a list of entries, each with "word" and
"meanings": [{"partOfSpeech", "definitions": [{"definition",
"example"}]}]) for physics_domain_seeding.py to serve in place of a
live HTTP response. Every other part of the pipeline --
ExternalDictionaryAdapter.parse_api_payload, its domain-relevance
ranking, AsyncDictionaryHydrator._hydrate, DictionaryProcessor.identify_word
-- runs completely unmodified against this data; only the network call
itself is substituted. Every Word this produces carries a
source_references entry that says exactly this, not a live API call
(see physics_domain_seeding.py's FIXTURE_SOURCE_NAME).

Deliberately incomplete: a handful of words used in the source text
("branch", "studies", "acting") have no entry here at all, so the
demonstration also exercises the genuine "no evidence -> stays
unresolved, not guessed" path, the same way a real 404 from the real
API would."""

PHYSICS_FIXTURES = {
    "physics": [{"word": "physics", "meanings": [
        {"partOfSpeech": "noun", "definitions": [
            {"definition": "The branch of science concerned with the nature and properties of matter and energy.",
             "example": "the physics of sound"},
        ]},
    ]}],
    "science": [{"word": "science", "meanings": [
        {"partOfSpeech": "noun", "definitions": [
            {"definition": "The systematic study of the structure and behaviour of the physical and natural world through observation and experiment.",
             "example": "the science of physics"},
        ]},
    ]}],
    "matter": [{"word": "matter", "meanings": [
        {"partOfSpeech": "noun", "definitions": [
            {"definition": "Physical substance in general, that occupies space and possesses mass.",
             "example": "energy and matter are related"},
        ]},
        {"partOfSpeech": "verb", "definitions": [
            {"definition": "To be of importance; to have significance.",
             "example": "the outcome matters"},
        ]},
    ]}],
    "energy": [{"word": "energy", "meanings": [
        {"partOfSpeech": "noun", "definitions": [
            {"definition": "The property of matter and radiation that is manifest as a capacity to perform work, such as causing motion or the interaction of molecules.",
             "example": "kinetic energy"},
        ]},
    ]}],
    "force": [{"word": "force", "meanings": [
        {"partOfSpeech": "noun", "definitions": [
            {"definition": "An influence, such as a push or pull, that causes an object with mass to change its velocity.",
             "example": "the net force acting on the object"},
            {"definition": "Strength or power exerted upon an object.",
             "example": "the force of the wind"},
        ]},
        {"partOfSpeech": "verb", "definitions": [
            {"definition": "To make (someone) do something against their will by using superior strength.",
             "example": "forced to comply"},
        ]},
    ]}],
    "mechanics": [{"word": "mechanics", "meanings": [
        {"partOfSpeech": "noun", "definitions": [
            {"definition": "The branch of physics concerned with the motion of bodies under the action of forces.",
             "example": "classical mechanics"},
        ]},
    ]}],
    "mass": [{"word": "mass", "meanings": [
        {"partOfSpeech": "noun", "definitions": [
            {"definition": "A property of a physical body that quantifies its resistance to acceleration by a force.",
             "example": "the mass of the object"},
        ]},
        {"partOfSpeech": "verb", "definitions": [
            {"definition": "To gather or assemble into a mass.",
             "example": "clouds massed on the horizon"},
        ]},
    ]}],
    "accelerate": [{"word": "accelerate", "meanings": [
        {"partOfSpeech": "verb", "definitions": [
            {"definition": "To increase in speed or rate, or cause to do so.",
             "example": "the car accelerated"},
        ]},
    ]}],
    "acceleration": [{"word": "acceleration", "meanings": [
        {"partOfSpeech": "noun", "definitions": [
            {"definition": "The rate of change of velocity of an object with respect to time.",
             "example": "the acceleration due to gravity"},
        ]},
    ]}],
    "object": [{"word": "object", "meanings": [
        {"partOfSpeech": "noun", "definitions": [
            {"definition": "A material thing that can be seen and touched.",
             "example": "a moving object"},
        ]},
        {"partOfSpeech": "verb", "definitions": [
            {"definition": "To express disapproval or opposition.",
             "example": "she objected to the plan"},
        ]},
    ]}],
    "proportional": [{"word": "proportional", "meanings": [
        {"partOfSpeech": "adjective", "definitions": [
            {"definition": "Corresponding in size or amount to something else.",
             "example": "force is proportional to acceleration"},
        ]},
    ]}],
    "net": [{"word": "net", "meanings": [
        {"partOfSpeech": "adjective", "definitions": [
            {"definition": "Remaining after all deductions or opposing effects have been accounted for; total.",
             "example": "the net force on the body"},
        ]},
        {"partOfSpeech": "noun", "definitions": [
            {"definition": "A material with a meshed structure of strands.",
             "example": "a fishing net"},
        ]},
    ]}],
    "work": [{"word": "work", "meanings": [
        {"partOfSpeech": "noun", "definitions": [
            {"definition": "The transfer of energy that occurs when a force acts on a body causing it to move through a distance.",
             "example": "the work done by the force"},
            {"definition": "Activity involving mental or physical effort done to achieve a purpose or result.",
             "example": "a hard day's work"},
        ]},
        {"partOfSpeech": "verb", "definitions": [
            {"definition": "To perform physical or mental effort in order to achieve a result.",
             "example": "she works every day"},
        ]},
    ]}],
    "distance": [{"word": "distance", "meanings": [
        {"partOfSpeech": "noun", "definitions": [
            {"definition": "An amount of space between two points, typically measured in a straight line.",
             "example": "the distance moved by the object"},
        ]},
    ]}],
    "rate": [{"word": "rate", "meanings": [
        {"partOfSpeech": "noun", "definitions": [
            {"definition": "A measure, quantity, or frequency, typically one measured against another quantity.",
             "example": "the rate at which work is done"},
        ]},
        {"partOfSpeech": "verb", "definitions": [
            {"definition": "To assign a standard or value to something.",
             "example": "rate the performance"},
        ]},
    ]}],
    "power": [{"word": "power", "meanings": [
        {"partOfSpeech": "noun", "definitions": [
            {"definition": "The rate at which work is done or energy is transferred, measured in watts.",
             "example": "the power delivered by the engine"},
            {"definition": "The capacity or ability to direct or influence the behaviour of others.",
             "example": "political power"},
        ]},
        {"partOfSpeech": "verb", "definitions": [
            {"definition": "To supply energy to (a machine or device) so as to make it work.",
             "example": "an engine powered by electricity"},
        ]},
    ]}],
    "kinetic": [{"word": "kinetic", "meanings": [
        {"partOfSpeech": "adjective", "definitions": [
            {"definition": "Relating to or resulting from motion.",
             "example": "kinetic energy"},
        ]},
    ]}],
    "depend": [{"word": "depend", "meanings": [
        {"partOfSpeech": "verb", "definitions": [
            {"definition": "To be controlled or determined by.",
             "example": "kinetic energy depends on mass and velocity"},
        ]},
    ]}],
    "velocity": [{"word": "velocity", "meanings": [
        {"partOfSpeech": "noun", "definitions": [
            {"definition": "The speed of something in a given direction.",
             "example": "the velocity of the moving body"},
        ]},
    ]}],
    "moving": [{"word": "moving", "meanings": [
        {"partOfSpeech": "adjective", "definitions": [
            {"definition": "Changing position; in motion.",
             "example": "a moving body"},
        ]},
    ]}],
    "body": [{"word": "body", "meanings": [
        {"partOfSpeech": "noun", "definitions": [
            {"definition": "A physical object or mass of matter distinct from other matter, especially one considered in mechanics.",
             "example": "the momentum of the body"},
        ]},
    ]}],
    "potential": [{"word": "potential", "meanings": [
        {"partOfSpeech": "noun", "definitions": [
            {"definition": "The energy stored in a system as a result of the position or configuration of its parts.",
             "example": "potential energy"},
        ]},
        {"partOfSpeech": "adjective", "definitions": [
            {"definition": "Having or showing the capacity to develop into something in the future.",
             "example": "a potential problem"},
        ]},
    ]}],
    "position": [{"word": "position", "meanings": [
        {"partOfSpeech": "noun", "definitions": [
            {"definition": "A place where someone or something is located, especially within a field or system.",
             "example": "its position within the field"},
        ]},
    ]}],
    "field": [{"word": "field", "meanings": [
        {"partOfSpeech": "noun", "definitions": [
            {"definition": "A region of space at every point of which a physical quantity, such as force or potential, has a value.",
             "example": "a gravitational field"},
            {"definition": "An area of open land, especially one used for pasture or crops.",
             "example": "a field of wheat"},
        ]},
        {"partOfSpeech": "verb", "definitions": [
            {"definition": "To deal with or answer (a question or challenge) successfully.",
             "example": "field a question"},
        ]},
    ]}],
    "gravitational": [{"word": "gravitational", "meanings": [
        {"partOfSpeech": "adjective", "definitions": [
            {"definition": "Relating to or arising from gravity.",
             "example": "a gravitational field"},
        ]},
    ]}],
    "electric": [{"word": "electric", "meanings": [
        {"partOfSpeech": "adjective", "definitions": [
            {"definition": "Of, worked by, charged with, or producing electricity.",
             "example": "an electric field"},
        ]},
    ]}],
    "charge": [{"word": "charge", "meanings": [
        {"partOfSpeech": "noun", "definitions": [
            {"definition": "A property of matter that causes it to experience a force when placed in an electric or magnetic field, measured in coulombs.",
             "example": "an electric charge"},
            {"definition": "A price asked for goods or services.",
             "example": "a delivery charge"},
        ]},
        {"partOfSpeech": "verb", "definitions": [
            {"definition": "To store electrical energy in (a battery or battery-powered device).",
             "example": "charge the battery"},
        ]},
    ]}],
    "current": [{"word": "current", "meanings": [
        {"partOfSpeech": "noun", "definitions": [
            {"definition": "The rate of flow of electric charge through a conductor, measured in amperes.",
             "example": "electric current"},
            {"definition": "A body of water or air moving in a definite direction.",
             "example": "an ocean current"},
        ]},
        {"partOfSpeech": "adjective", "definitions": [
            {"definition": "Happening or being used or done now; belonging to the present time.",
             "example": "current events"},
        ]},
    ]}],
    "flow": [{"word": "flow", "meanings": [
        {"partOfSpeech": "noun", "definitions": [
            {"definition": "The action or fact of moving along in a steady, continuous stream.",
             "example": "the flow of charge"},
        ]},
        {"partOfSpeech": "verb", "definitions": [
            {"definition": "To move steadily and continuously in a current or stream.",
             "example": "current flows through the conductor"},
        ]},
    ]}],
    "conductor": [{"word": "conductor", "meanings": [
        {"partOfSpeech": "noun", "definitions": [
            {"definition": "A material or object that permits an electric current to pass through it easily.",
             "example": "copper is a good conductor"},
        ]},
    ]}],
    "circuit": [{"word": "circuit", "meanings": [
        {"partOfSpeech": "noun", "definitions": [
            {"definition": "A complete and closed path around which an electric current flows or may flow.",
             "example": "an electric circuit"},
        ]},
    ]}],
    "voltage": [{"word": "voltage", "meanings": [
        {"partOfSpeech": "noun", "definitions": [
            {"definition": "An electromotive force or potential difference expressed in volts.",
             "example": "a voltage of twelve volts"},
        ]},
    ]}],
    "resistance": [{"word": "resistance", "meanings": [
        {"partOfSpeech": "noun", "definitions": [
            {"definition": "The degree to which a substance or device opposes the passage of an electric current, measured in ohms.",
             "example": "electrical resistance"},
            {"definition": "The refusal to accept or comply with something.",
             "example": "resistance to change"},
        ]},
    ]}],
    "magnetic": [{"word": "magnetic", "meanings": [
        {"partOfSpeech": "adjective", "definitions": [
            {"definition": "Having the properties of a magnet, in particular the power to attract iron or steel.",
             "example": "a magnetic field"},
        ]},
    ]}],
    "exert": [{"word": "exert", "meanings": [
        {"partOfSpeech": "verb", "definitions": [
            {"definition": "To apply or bring to bear (a force, influence, or quality).",
             "example": "the field exerts a force on the charge"},
        ]},
    ]}],
    "wave": [{"word": "wave", "meanings": [
        {"partOfSpeech": "noun", "definitions": [
            {"definition": "A disturbance that transfers energy through a medium or through space, without the net movement of matter.",
             "example": "a sound wave"},
            {"definition": "A long body of water curling into an arched form and breaking on the shore.",
             "example": "the waves broke on the beach"},
        ]},
        {"partOfSpeech": "verb", "definitions": [
            {"definition": "To move one's hand to and fro in greeting or as a signal.",
             "example": "she waved goodbye"},
        ]},
    ]}],
    "transfer": [{"word": "transfer", "meanings": [
        {"partOfSpeech": "noun", "definitions": [
            {"definition": "An instance of energy or matter moving from one place, medium, or system to another.",
             "example": "energy transfer"},
        ]},
        {"partOfSpeech": "verb", "definitions": [
            {"definition": "To move or cause to move from one place, medium, or system to another.",
             "example": "to transfer energy"},
        ]},
    ]}],
    "transfers": [{"word": "transfers", "meanings": [
        {"partOfSpeech": "verb", "definitions": [
            {"definition": "Moves or causes to move from one place, medium, or system to another.",
             "example": "a wave transfers energy"},
        ]},
    ]}],
    "wavelength": [{"word": "wavelength", "meanings": [
        {"partOfSpeech": "noun", "definitions": [
            {"definition": "The distance between successive crests of a wave, especially points in a sound or electromagnetic wave.",
             "example": "the wavelength of visible light"},
        ]},
    ]}],
    "successive": [{"word": "successive", "meanings": [
        {"partOfSpeech": "adjective", "definitions": [
            {"definition": "Following one after another; consecutive.",
             "example": "successive crests of the wave"},
        ]},
    ]}],
    "crest": [{"word": "crest", "meanings": [
        {"partOfSpeech": "noun", "definitions": [
            {"definition": "The topmost point of a wave.",
             "example": "the crest of the wave"},
        ]},
    ]}],
    "thermodynamics": [{"word": "thermodynamics", "meanings": [
        {"partOfSpeech": "noun", "definitions": [
            {"definition": "The branch of physics concerned with the relations between heat and other forms of energy.",
             "example": "the laws of thermodynamics"},
        ]},
    ]}],
    "heat": [{"word": "heat", "meanings": [
        {"partOfSpeech": "noun", "definitions": [
            {"definition": "A form of energy that is transferred between systems as a result of a temperature difference.",
             "example": "heat flows from hot to cold"},
        ]},
        {"partOfSpeech": "verb", "definitions": [
            {"definition": "To make or become hot or warm.",
             "example": "heat the water"},
        ]},
    ]}],
    "hot": [{"word": "hot", "meanings": [
        {"partOfSpeech": "adjective", "definitions": [
            {"definition": "Having a high degree of heat or a high temperature.",
             "example": "a hot body"},
        ]},
    ]}],
    "cold": [{"word": "cold", "meanings": [
        {"partOfSpeech": "adjective", "definitions": [
            {"definition": "Of or at a low temperature, especially when compared with the human body.",
             "example": "a cold body"},
        ]},
    ]}],
    "temperature": [{"word": "temperature", "meanings": [
        {"partOfSpeech": "noun", "definitions": [
            {"definition": "The degree or intensity of heat present in a substance or object, expressed according to a comparative scale.",
             "example": "both bodies reach the same temperature"},
        ]},
    ]}],
    "momentum": [{"word": "momentum", "meanings": [
        {"partOfSpeech": "noun", "definitions": [
            {"definition": "The quantity of motion of a moving body, measured as the product of its mass and velocity.",
             "example": "momentum is conserved in a collision"},
        ]},
    ]}],
    "conserve": [{"word": "conserve", "meanings": [
        {"partOfSpeech": "verb", "definitions": [
            {"definition": "To keep (a physical quantity, such as energy or momentum) constant in total amount during a process.",
             "example": "momentum is conserved in a closed system"},
        ]},
    ]}],
    "closed": [{"word": "closed", "meanings": [
        {"partOfSpeech": "adjective", "definitions": [
            {"definition": "Not open; of a system, not exchanging matter with its surroundings.",
             "example": "a closed system"},
        ]},
    ]}],
    "system": [{"word": "system", "meanings": [
        {"partOfSpeech": "noun", "definitions": [
            {"definition": "A region of space or quantity of matter under study, considered separately from its surroundings.",
             "example": "a closed system"},
        ]},
    ]}],
    "total": [{"word": "total", "meanings": [
        {"partOfSpeech": "adjective", "definitions": [
            {"definition": "Comprising the whole number or amount; complete.",
             "example": "the total momentum"},
        ]},
        {"partOfSpeech": "noun", "definitions": [
            {"definition": "The overall sum of a set of numbers or quantities.",
             "example": "the total of the momenta"},
        ]},
    ]}],
    "collision": [{"word": "collision", "meanings": [
        {"partOfSpeech": "noun", "definitions": [
            {"definition": "An instance of one moving object or body striking violently against another.",
             "example": "momentum before and after the collision"},
        ]},
    ]}],
    "equal": [{"word": "equal", "meanings": [
        {"partOfSpeech": "verb", "definitions": [
            {"definition": "To be the same in number, amount, degree, rank, or quality as.",
             "example": "the total momentum before equals the total after"},
        ]},
    ]}],
    "particle": [{"word": "particle", "meanings": [
        {"partOfSpeech": "noun", "definitions": [
            {"definition": "A minute portion of matter, especially one with specified properties, such as an atom or subatomic particle.",
             "example": "a charged particle"},
        ]},
    ]}],
    "possess": [{"word": "possess", "meanings": [
        {"partOfSpeech": "verb", "definitions": [
            {"definition": "To have or own (something) as an attribute, quality, or piece of property.",
             "example": "the particle possesses charge"},
        ]},
    ]}],
    "spin": [{"word": "spin", "meanings": [
        {"partOfSpeech": "noun", "definitions": [
            {"definition": "The intrinsic angular momentum of a subatomic particle.",
             "example": "the spin of an electron"},
            {"definition": "A rapid turning or revolving motion.",
             "example": "the spin of a top"},
        ]},
        {"partOfSpeech": "verb", "definitions": [
            {"definition": "To turn or cause to turn quickly around.",
             "example": "the wheel spins"},
        ]},
    ]}],
    "quantum": [{"word": "quantum", "meanings": [
        {"partOfSpeech": "noun", "definitions": [
            {"definition": "A discrete quantity of energy proportional in magnitude to the frequency of the radiation it represents.",
             "example": "a quantum of light"},
        ]},
        {"partOfSpeech": "adjective", "definitions": [
            {"definition": "Relating to quantum mechanics; discrete and indivisible in nature.",
             "example": "a quantum property"},
        ]},
    ]}],
    "property": [{"word": "property", "meanings": [
        {"partOfSpeech": "noun", "definitions": [
            {"definition": "An attribute, quality, or characteristic belonging to something.",
             "example": "spin is a quantum property of the particle"},
        ]},
    ]}],
    # Inflected surface forms below: the real dictionaryapi.dev is
    # looked up by exact surface form, with no stemming -- this
    # pipeline inherits that, so "causes" is a distinct lookup from
    # "cause" (already seeded in the Common cache as a base-form VERB).
    # Realistic enough: several online dictionaries do carry separate
    # inflected-form entries. See physics_domain_seeding.py's report
    # for how this shows up in the results.
    "called": [{"word": "called", "meanings": [
        {"partOfSpeech": "verb", "definitions": [
            {"definition": "Given a specified name to; identified or described as.",
             "example": "the rate is called power"},
        ]},
    ]}],
    "causes": [{"word": "causes", "meanings": [
        {"partOfSpeech": "verb", "definitions": [
            {"definition": "Makes (something) happen; is the reason for.",
             "example": "force causes acceleration"},
        ]},
    ]}],
    "conserved": [{"word": "conserved", "meanings": [
        {"partOfSpeech": "verb", "definitions": [
            {"definition": "Kept constant in total amount during a physical process.",
             "example": "momentum is conserved in a closed system"},
        ]},
    ]}],
    "depends": [{"word": "depends", "meanings": [
        {"partOfSpeech": "verb", "definitions": [
            {"definition": "Is controlled or determined by.",
             "example": "kinetic energy depends on mass and velocity"},
        ]},
    ]}],
    "equals": [{"word": "equals", "meanings": [
        {"partOfSpeech": "verb", "definitions": [
            {"definition": "Is the same in number, amount, degree, rank, or quality as.",
             "example": "momentum before equals momentum after"},
        ]},
    ]}],
    "exists": [{"word": "exists", "meanings": [
        {"partOfSpeech": "verb", "definitions": [
            {"definition": "Has real, actual, or factual being; is present in a specified place.",
             "example": "a field exists around every mass"},
        ]},
    ]}],
    "flows": [{"word": "flows", "meanings": [
        {"partOfSpeech": "verb", "definitions": [
            {"definition": "Moves steadily and continuously in a current or stream.",
             "example": "heat flows from hot to cold"},
        ]},
    ]}],
    "forms": [{"word": "forms", "meanings": [
        {"partOfSpeech": "noun", "definitions": [
            {"definition": "Varieties or types in which something may exist or appear.",
             "example": "energy exists in several forms"},
        ]},
    ]}],
    "moves": [{"word": "moves", "meanings": [
        {"partOfSpeech": "verb", "definitions": [
            {"definition": "Changes position or causes to change position.",
             "example": "a force moves an object through a distance"},
        ]},
    ]}],
    "points": [{"word": "points", "meanings": [
        {"partOfSpeech": "noun", "definitions": [
            {"definition": "Particular spots, positions, or moments.",
             "example": "the crest points of a wave"},
        ]},
    ]}],
    "reach": [{"word": "reach", "meanings": [
        {"partOfSpeech": "verb", "definitions": [
            {"definition": "Arrives at or comes to (a specified point, level, or state).",
             "example": "both bodies reach the same temperature"},
        ]},
    ]}],
}
