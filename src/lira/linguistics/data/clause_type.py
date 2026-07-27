from enum import Enum


class ClauseType(Enum):
    """The clause types Clause.read() can recognise (Linguistics Layer
    developer specification, 5.1; spec 13.1). All four are defined from
    the outset so the values are stable, but only INDEPENDENT has a
    populated clause_element_template
    (GrammarConfigurator.clause_element_templates) in this phase --
    DEPENDENT/RELATIVE/COORDINATED clauses require clause-level
    recursion ClauseReader does not yet implement (see linguistics/
    documentation/README.md, Not Yet Built). A Clause.read() result
    that would need one of those three is reported UNRESOLVED, never
    guessed into INDEPENDENT."""

    INDEPENDENT = 0
    DEPENDENT = 1
    RELATIVE = 2
    COORDINATED = 3
