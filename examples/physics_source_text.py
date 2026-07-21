"""The representative Physics source text used by
physics_domain_seeding.py. Covers mechanics, energy, motion, forces,
matter, waves, electromagnetism, and thermodynamics, per the
specification's requested spread of core Physics areas. Extended with
a second paragraph (atom/nucleus/proton/neutron/electron,
melt/expand/attract, open/inverse/stationary, apply, characteristic,
speed) specifically to give the seeded vocabulary enough breadth to
support at least 5 genuine examples of every Lexical Semantic
relationship kind -- see physics_domain_relationships.py."""

PHYSICS_SOURCE_TEXT = """
Physics is the branch of science that studies matter, energy, and force. In mechanics, force causes mass to accelerate, and acceleration is proportional to net force. Work is done when force moves an object through distance, and the rate at which work is done is called power. Energy exists in several forms. Kinetic energy depends on mass and velocity of a moving body, while potential energy depends on position within a field. A gravitational field exists around mass, and an electric field exists around charge. Electric current is the flow of charge through a conductor, and current in a circuit depends on voltage and resistance. A magnetic field can exert force on a moving charge. A wave transfers energy without transfer of matter, and wavelength is the distance between successive crest points of a wave. In thermodynamics, heat flows from a hot body to a cold body until both reach the same temperature. Momentum is conserved in a closed system, and total momentum before a collision equals total momentum after collision. A particle may possess both mass and charge, and spin is a quantum property of a particle.

An atom has a nucleus. A nucleus has a proton and a neutron. An atom also has an electron. Heat can melt matter, and heat can expand matter. A charge can attract another charge. A system may be open or closed. Current and resistance can be inverse. A stationary object has zero velocity. To apply a force is to exert a force. Charge is a characteristic of matter, and mass is a characteristic of matter. Speed depends on distance.
""".strip()
