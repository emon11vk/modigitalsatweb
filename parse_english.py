import json
import re

english_text = """
1.A recent study tracked the number of bee species present in twenty-seven New
York apple orchards over a ten-year period. _____ found that when wild growth near
an orchard was cleared, the number of different bee species visiting the orchard
decreased.
Which choice completes the text so that it conforms to the conventions of Standard
English?
A) Entomologist Heather Grab:
B) Entomologist, Heather Grab,
C) Entomologist Heather Grab
D) Entomologist Heather Grab,

2.The haiku-like poems of Tomas Tranströmer, which present nature- and
dream-influenced images in crisp, spare language, have earned the Swedish poet
praise from leading contemporary _____ them Nigerian American essayist and
novelist Teju Cole, who has written that Tranströmer's works "contain a luminous
simplicity."
Which choice completes the text so that it conforms to the conventions of Standard
English?
A) writers. Among
B) writers among
C) writers; among
D) writers, among

3.In 2021, Mexican biologist Martha Lydia Macías-Rubalcava led a review of the
scientific literature related to endophytic fungi (i.e., fungi that live inside a host _____
researching 120 endophytic fungi-produced compounds, she found that their
phytotoxicity can make them viable alternatives to chemical herbicides for
controlling weeds.
Which choice completes the text so that it conforms to the conventions of Standard
English?
A) plant). By
B) plant), by
C) plant) and by
D) plant) by

4.Roughly 300 nights a year, when the cold air descending from the Andes
Mountains meets the warm air rising from Venezuela's coastal Lake Maracaibo, the
result is a spectacular lightning storm, its strikes so bright, so localized, and so _____
that it has become known as "Maracaibo's Lighthouse."
Which choice completes the text so that it conforms to the conventions of Standard
English?
A) dependable:
B) dependable;
C) dependable
D) dependable,

5.Jamaican British artist Willard Wigan is known for his remarkable _____ so small
that they are best viewed through a microscope, Wigan's sculptures are made from
tiny natural materials, such as spiderweb strands.
Which choice completes the text so that it conforms to the conventions of Standard
English?
A) microsculptures creations
B) microsculptures, creations
C) microsculptures. Creations
D) microsculptures and creations

6.To serve local families during the Great Depression, innovative New York City
librarian Pura Belpré offered storytelling in both English and Spanish, an uncommon
_____ celebrated el Día de los Tres Reyes Magos, an important community holiday;
and put on puppet shows dramatizing Puerto Rican folktales.
Which choice completes the text so that it conforms to the conventions of Standard
English?
A) practice, at the time
B) practice at the time;
C) practice, at the time,
D) practice at the time,

7.Recent analysis of 32532 Thereus-an outer solar system object orbiting the Sun
between Jupiter and Saturn-has determined its color to be gray, suggesting an icy
composition. _____ Such interpretations are ultimately _____ the object's gray
coloration may be an incidental effect of radiation, solar wind, or collisions with other
objects rather than evidence of its physical makeup.
Which choice completes the text so that it conforms to the conventions of Standard
English?
A) speculative, though
B) speculative, though;
C) speculative; though
D) speculative, though,

8.Philosopher Peter Kivy was a leading figure in musical _____ evidenced by his belief
that instead of evoking particular emotions, such as sadness or joy, compositions
elicit a listener's emotional response to the structure and artistry of the music itself,
Kivy's approach to the study of music was decidedly formalist.
Which choice completes the text so that it conforms to the conventions of Standard
English?
A) aesthetics as
B) aesthetics and as
C) aesthetics, as
D) aesthetics. As

9.Using natural debris, such as dried _____ such as plastic bags; and more traditional
art supplies, such as tree glue, Ghanaian artist Ed Franklin Gavua creates his striking
Yiiiiikakaii African masks, which he hopes can help viewers rethink how waste is
used in their communities.
Which choice completes the text so that it conforms to the conventions of Standard
English?
A) leaves, man-made trash:
B) leaves; man-made trash,
C) leaves, man-made trash,
D) leaves; man-made trash;

10.In the 1950s, novel audio technologies allowed the addition of another instrument
to jazz and swing _____ relatively quiet instrument, its full range of sound was finally
audible alongside the blaring brass instruments of the time, allowing flautists like
Bennie Maupin and Bobbi Humphrey to perform with other jazz greats.
Which choice completes the text so that it conforms to the conventions of Standard
English?
A) music, the flute, a
B) music. The flute, a
C) music; the flute, a
D) music: the flute. A

11.Despite being cheap, versatile, and easy to produce, _____ they are made from
nonrenewable petroleum, and most do not biodegrade in landfills.
Which choice completes the text so that it conforms to the conventions of Standard
English?
A) there are two problems associated with commercial plastics:
B) two problems are associated with commercial plastics:
C) commercial plastics' two associated problems are that
D) commercial plastics have two associated problems:

12.American abstract artist Richard _____ his installations to make passersby keenly
aware of how one's movements are affected by the physical features of one's
environment, assembles large-scale steel plates into sculptures that dominate the
outdoor spaces they occupy.
Which choice completes the text so that it conforms to the conventions of Standard
English?
A) Serra is intending
B) Serra, intends
C) Serra, intending
D) Serra intends

13.When a given industry-water and electricity are two well-known examples-carries
high infrastructural start-up costs and other barriers that discourage competition,
_____ of just one or two suppliers per municipality. Such industries are known as
natural monopolies.
Which choice completes the text so that it conforms to the conventions of Standard
English?
A) these often consist
B) they often consist
C) it often consists
D) this often consists

14.In a recent analysis of lyrical trends in 350,000 songs, researchers cite increases
in certain measures, such as the ratio of choruses to verses, as evidence music
lyrics are becoming more repetitive. For instance, from 1970 to 2020, _____
chorus-to-verse ratios trended similarly, with each genre's data indicating that
relative to the number of unique verses, the number of repeated choruses in songs
increased.
Which choice completes the text so that it conforms to the conventions of Standard
English?
A) rocks and raps
B) rock's and rap's
C) rocks and rap's
D) rock and rap's

15.Supported by biochemical analyses of over 2,000 skeletons from the Middle
Ages, _____
Which choice completes the text so that it conforms to the conventions of Standard
English?
A) vegetables and grains were, a 2022 study found, the primary components of
early medieval rulers' diets.
B) early medieval rulers' diets were found, in a 2022 study, to have primarily
consisted of vegetables and grains.
C) the primary components of early medieval rulers' diets were vegetables and
grains, according to a 2022 study.
D) findings from a 2022 study suggested that vegetables and grains were the
primary components of early medieval rulers' diets.

16.Entomologists Yash Sondhi and Samuel Fabian have tried to explain why moths
fly erratically around light sources at night. Knowing that flying insects keep their
backs pointed toward sunlight during the day, _____
Which choice completes the text so that it conforms to the conventions of Standard
English?
A) the researchers theorize that moths, mistaking nighttime lights for the Sun,
continually try to reorient their bodies while flying near such lights.
B) the researchers' theory is that moths mistake nighttime lights for the Sun,
continually trying to reorient their bodies while flying near such lights.
C) moths mistake nighttime lights for the Sun and continually try to reorient their
bodies while flying near such lights, the researchers theorize.
D) moths continually try to reorient their bodies while flying near nighttime lights,
the researchers theorize, mistaking such lights for the Sun.

17.In her 1983 book The Managed Heart: Commercialization of Human Feeling,
sociologist Arlie Russell Hochschild first explored at length her conception of a
"sociology of emotions"-the idea that the various cultural and ideological frameworks
a person has internalized (class, gender, political affiliation, etc.) _____ each
emotional reaction that person has within a situation.
Which choice completes the text so that it conforms to the conventions of Standard
English?
A) underlies
B) is underlying
C) underlie
D) has been underlying

8.Rabinal Achí is a precolonial Maya dance drama performed annually in Rabinal, a
town in the Guatemalan highlands. Based on events that occurred when Rabinal was
a city-state ruled by a king, _____ had once been an ally of the king but was later
captured while leading an invading force against him.
Which choice completes the text so that it conforms to the conventions of Standard
English?
A) Rabinal Achí tells the story of K'iche' Achí, a military leader who
B) K'iche' Achí, the military leader in the story of Rabinal Achí,
C) the military leader whose story is told in Rabinal Achí, K'iche' Achí,
D) there was a military leader, K'iche' Achí, who in Rabinal Achí

19.Working from an earlier discovery of Charpentier's, chemists Emmanuelle
Charpentier and Jennifer Doudna-winners of the 2020 Nobel Prize in
Chemistry-re-created and then reprogrammed the so-called "genetic scissors" of a
species of DNA-cleaving bacteria _____ a tool that is revolutionizing the field of gene
technology.
Which choice completes the text so that it conforms to the conventions of Standard
English?
A) to forge
B) forging
C) forged
D) and forging

20.The Herfindahl-Hirschman Index (HHI), a commonly used measure of competition
between companies in a particular market, ranges from a score of zero to 10,000
points. Compared with that of a highly concentrated market-that is, a market
controlled by very few companies- _____
Which choice completes the text so that it conforms to the conventions of Standard
English?
A) a market that is less concentrated will have a much lower HHI score.
B) the HHI score of a less concentrated market will be much lower.
C) when a market is less concentrated, its HHI score will be much lower.
D) a less concentrated market will have an HHI score that is much lower.
"""

answers = {
    1: "C", 2: "D", 3: "A", 4: "C", 5: "C", 6: "B", 7: "B", 8: "D", 9: "B", 10: "D",
    11: "D", 12: "C", 13: "C", 14: "B", 15: "C", 16: "A", 17: "C", 18: "A", 19: "A", 20: "B"
}

questions = []
# split by number + dot
blocks = re.split(r'\n(?=\d+\.)', "\n" + english_text.strip())[1:]

for i, block in enumerate(blocks):
    num_match = re.match(r'(\d+)\.', block)
    q_num = int(num_match.group(1))
    
    # Extract choices
    choices_match = re.search(r'(A\).*?)$', block, re.DOTALL)
    choices_text = choices_match.group(1)
    question_text = block[:choices_match.start()].strip()
    
    choices = re.findall(r'([A-D]\).*?(?=\n[A-D]\)|$))', choices_text, re.DOTALL)
    choices = [c.strip() for c in choices]
    
    # wait, the 8th question says "8.Rabinal Achí" instead of 18, so q_num might be 8 twice. We'll just use i+1
    actual_q_num = i + 1
    
    # Extract passage and question
    passage = None
    if "Which choice" in question_text:
        parts = question_text.split("Which choice", 1)
        raw_passage = parts[0].strip()
        # Remove leading "1." from passage
        passage = re.sub(r'^\d+\.', '', raw_passage).strip()
        question_text = "Which choice " + parts[1].strip()
    else:
        raw_passage = question_text
        passage = re.sub(r'^\d+\.', '', raw_passage).strip()
        question_text = ""
    
    questions.append({
        "position": actual_q_num,
        "question_text": question_text,
        "choices": choices,
        "correct_answer": answers.get(actual_q_num),
        "type": "multiple_choice",
        "explanation": None,
        "image_url": None,
        "passage": passage
    })

with open('english_questions.json', 'w', encoding='utf-8') as f:
    json.dump(questions, f, ensure_ascii=False, indent=2)

print("Saved english_questions.json")
