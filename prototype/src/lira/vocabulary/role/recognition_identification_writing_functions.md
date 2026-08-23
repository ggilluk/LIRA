# Recognition, Identification and Writing Functions

## Common Functional Model

- **Recognise** -- re-cognises observed information against previously
  known information. Recognition may return 0..* valid candidates.
- **Identify** -- deductively determines the most probable identity
  from recognised candidates using the available evidence.
  Identification does not imply absolute certainty. `ConfidenceWeight`
  is a property associated with an identification; it is not an
  operation.
- **Write** -- produces a written representation from the required
  identified linguistic information.

---

## Section 1 -- Word Functions

Word functions operate on individual Words and their WordForm,
Part of Speech (POS), and Word identity.

### 1.1 Recognise(WordForm)

**Purpose:** Re-cognise all known WordForms compatible with the
observed `ReadWord.Text` and its `Text.Format`.

**Input:** `ReadWord.Text`, `ReadWord.Text.Format`

**Output:** `RecognisedWordForm[0..*]`

**Behaviour:** Multiple WordForms may be recognised for the same
ReadWord.

**Example:**

```
ReadWord.Text = "acts"

Recognise(WordForm)
    → Plural Number Form
    → Third-Person Singular Present Form
```

**Exception Handling:**

Irregular WordForms:

```
went
    → Past Tense Form
    → go

was
    → Past Tense Form
    → be
```

Concatenated WordForms:

```
cannot
    → can
    → not
```

A concatenated WordForm may cause the ReadWord to be decomposed into
its constituent Word components for further processing.

### 1.2 Recognise(POS)

**Purpose:** Re-cognise all known Parts of Speech compatible with the
recognised WordForms.

**Input:** `RecognisedWordForm[0..*]`

**Output:** `RecognisedPOS[0..*]`

**Example:**

```
ReadWord.Text = "acts"

Plural Number Form
    → Noun

Third-Person Singular Present Form
    → Verb

Recognise(POS)
    → Noun
    → Verb
```

**Behaviour:** Recognition retains all valid POS alternatives rather
than prematurely selecting one.

**Exception Handling:** Lexical restrictions and known POS exceptions
are retained where WordForm alone cannot determine the valid POS.

### 1.3 Recognise(Word)

**Purpose:** Re-cognise all known Words compatible with the recognised
WordForms and Parts of Speech.

**Input:** `RecognisedWordForm[0..*]`, `RecognisedPOS[0..*]`

**Output:** `RecognisedWord[0..*]`

**Example:**

```
ReadWord.Text = "acts"

Plural Number Form
    → Noun
        → act

Third-Person Singular Present Form
    → Verb
        → act
```

**Behaviour:** The relationship between WordForm, POS, and Word is
retained.

**Exception Handling:** Non-direct lexical mappings are supported.

```
went
    → Past Tense Form
    → Verb
    → go
```

### 1.4 Identify(WordForm)

**Purpose:** Deductively determine which recognised WordForm most
probably represents the observed ReadWord.

**Input:** `RecognisedWordForm[0..*]`, Available Evidence

**Output:** `IdentifiedWordForm`

**Example 1:**

```
"They acted."

Recognised:
    Past Tense Form
    Past Participle Form

Identify(WordForm)
    → Past Tense Form
```

**Example 2:**

```
"They have acted."

Recognised:
    Past Tense Form
    Past Participle Form

Identify(WordForm)
    → Past Participle Form
```

**Exception Handling:** Where the available evidence is insufficient,
competing WordForm identifications may remain unresolved rather than
forcing an artificial identification.

### 1.5 Identify(POS)

**Purpose:** Deductively determine which recognised Part of Speech
most probably represents the observed ReadWord.

**Input:** `RecognisedPOS[0..*]`, Available Evidence

**Output:** `IdentifiedPOS`

**Example 1:**

```
"She acts."

Recognised:
    Noun
    Verb

Identify(POS)
    → Verb
```

**Example 2:**

```
"The acts were successful."

Recognised:
    Noun
    Verb

Identify(POS)
    → Noun
```

**Exception Handling:** Where available evidence does not sufficiently
distinguish the recognised Parts of Speech, competing alternatives
remain unresolved.

### 1.6 Identify(Word)

**Purpose:** Deductively determine which recognised Word most probably
represents the observed ReadWord.

**Input:** `RecognisedWord[0..*]`, Available Evidence

**Output:** `IdentifiedWord`

**Example:**

```
"She acts."

Identify(Word)
    → act [Verb]
```

**Exception Handling:** Homographs and other lexical ambiguities may
produce multiple recognised Words. Where evidence is insufficient,
identification remains unresolved rather than assuming absolute
certainty.

### 1.7 Write(Word)

**Purpose:** Produce a WrittenWord representing the required Word,
POS, WordForm, and Text.Format.

**Input:** `Word`, `POS`, `WordForm`, `Text.Format`

**Output:** `WrittenWord`

**Example 1:**

```
Word        = act
POS         = Verb
WordForm    = Third-Person Singular Present Form

Write(Word)
    → WrittenWord.Text = "acts"
```

**Example 2:**

```
Word        = act
POS         = Verb
WordForm    = Past Tense Form

Write(Word)
    → WrittenWord.Text = "acted"
```

**Exception Handling:**

Irregular WordForms override normal generation rules where
appropriate.

```
Word        = go
POS         = Verb
WordForm    = Past Tense Form

Write(Word)
    → Irregular WordForm
    → "went"
```

Orthographic rules including capitalization, spelling transformations,
and applicable Text.Format properties are applied to the resulting
WrittenWord.

---

## Section 2 -- Phrase Functions

Phrase functions operate on groups of Words and their PhraseType,
Modifier(s), and Head.

### 2.1 Recognise(PhraseType)

**Purpose:** Re-cognise all known PhraseTypes compatible with the
Words and structures observed in a ReadPhrase.

**Input:** `ReadPhrase.Words`, Recognised Word information

**Output:** `RecognisedPhraseType[0..*]`

**Example:**

```
"large house"

Recognise(PhraseType)
    → Noun Phrase
```

**Behaviour:** Recognition may return multiple PhraseTypes where the
observed structure is ambiguous.

**Exception Handling:** Known exceptional phrase structures and
ambiguous phrase patterns are retained as alternative recognised
PhraseTypes.

### 2.2 Recognise(Modifier)

**Purpose:** Re-cognise the elements capable of functioning as
Modifiers within the recognised PhraseType or PhraseTypes.

**Input:** Recognised Words, `RecognisedPhraseType[0..*]`

**Output:** `RecognisedModifier[0..*]`

**Example:**

```
"large house"

Recognise(Modifier)
    → large
```

**Exception Handling:** Multiple and compound Modifiers are supported.

```
"very large house"

Potential Modifiers:
    → very
    → large
    → very large
```

Recognition retains possible structures until they can be identified.

### 2.3 Recognise(Head)

**Purpose:** Re-cognise the elements capable of functioning as the
Head of the recognised PhraseType or PhraseTypes.

**Input:** Recognised Words, `RecognisedPhraseType[0..*]`

**Output:** `RecognisedHead[0..*]`

**Example:**

```
"large house"

Recognise(Head)
    → house
```

**Exception Handling:** Phrase structures containing implicit,
omitted, or otherwise exceptional Heads may retain appropriate Head
alternatives rather than requiring an explicit conventional Head.

### 2.4 Identify(PhraseType)

**Purpose:** Deductively determine which recognised PhraseType most
probably represents the observed ReadPhrase.

**Input:** `RecognisedPhraseType[0..*]`, Available Evidence

**Output:** `IdentifiedPhraseType`

**Example:**

```
"large house"

Recognised:
    Noun Phrase

Identify(PhraseType)
    → Noun Phrase
```

**Exception Handling:** Where more than one PhraseType remains
sufficiently supported, identification may remain unresolved rather
than forcing a PhraseType.

### 2.5 Identify(Modifier)

**Purpose:** Deductively determine which recognised elements function
as Modifiers within the phrase.

**Input:** `RecognisedModifier[0..*]`, Available Evidence

**Output:** `IdentifiedModifier[0..*]`

**Example:**

```
"large house"

Identify(Modifier)
    → large
```

**Behaviour:** A Phrase may legitimately contain multiple identified
Modifiers.

**Exception Handling:** Attachment ambiguity is retained where
available evidence cannot sufficiently establish which element a
Modifier modifies.

### 2.6 Identify(Head)

**Purpose:** Deductively determine which recognised element most
probably functions as the Head of the phrase.

**Input:** `RecognisedHead[0..*]`, Available Evidence

**Output:** `IdentifiedHead`

**Example:**

```
"large house"

Identify(Head)
    → house

Result:
    PhraseType = Noun Phrase
    Modifier   = large
    Head       = house
```

**Exception Handling:** Where multiple Head candidates remain
supported, identification may remain unresolved until sufficient
evidence becomes available.

### 2.7 Write(Phrase)

**Purpose:** Produce a WrittenPhrase from the required PhraseType,
Head, Modifier(s), and associated Word information.

**Input:** `PhraseType`, `Head`, `Modifier[0..*]`, WordForm
information, Text.Format information

**Output:** `WrittenPhrase`

**Example:**

```
PhraseType = Noun Phrase
Modifier   = large
Head       = house

Write(Phrase)
    → WrittenPhrase.Text = "large house"
```

**Behaviour:**

```
Write(Phrase)

    Modifier
        → Write(Word)
        → "large"

    Head
        → Write(Word)
        → "house"

    Phrase Structure
        → "large house"

    Output
        → WrittenPhrase
```

**Exception Handling:** Exceptional PhraseType structures may alter
normal ordering or composition. Concatenated forms, contractions,
agreement requirements, and exceptional WordForms are handled through
the relevant Phrase and Word rules.

---

## Functional Summary

**Word Functions**

- 1.1 Recognise(WordForm)
- 1.2 Recognise(POS)
- 1.3 Recognise(Word)
- 1.4 Identify(WordForm)
- 1.5 Identify(POS)
- 1.6 Identify(Word)
- 1.7 Write(Word) → WrittenWord

**Phrase Functions**

- 2.1 Recognise(PhraseType)
- 2.2 Recognise(Modifier)
- 2.3 Recognise(Head)
- 2.4 Identify(PhraseType)
- 2.5 Identify(Modifier)
- 2.6 Identify(Head)
- 2.7 Write(Phrase) → WrittenPhrase

**Common Functional Model**

- **Recognise** -- re-cognise the known possibilities compatible with
  the observed information.
- **Identify** -- deductively determine the most probable identity
  using the recognised possibilities and available evidence.
- **Write** -- produce the written representation from the required
  linguistic structure.
- **ConfidenceWeight** -- a property associated with an identification.
  It is not an operation or function.
