"""
Synthetic NGO Feedback Dataset Generator for VoiceLens
Mimics real feedback from UPAY NGO volunteers, beneficiaries, and community members.
Labels: positive, negative, neutral
"""

import pandas as pd
import os

# ── Raw synthetic feedback sentences ──────────────────────────────────────────
SYNTHETIC_DATA = [
    # ── POSITIVE ──────────────────────────────────────────────────────────────
    ("The tutoring sessions helped my child improve significantly in math.", "positive"),
    ("Volunteers were extremely caring and dedicated to our community.", "positive"),
    ("I feel hopeful about my future after attending the skill development program.", "positive"),
    ("The free health camp was a blessing for our entire village.", "positive"),
    ("UPAY's education program gave my daughter confidence she never had before.", "positive"),
    ("The mentors were patient, kind, and genuinely interested in helping us.", "positive"),
    ("I am grateful for the scholarships provided to underprivileged students.", "positive"),
    ("The workshop on digital literacy opened new opportunities for our youth.", "positive"),
    ("Our community feels more united thanks to UPAY's efforts.", "positive"),
    ("The vocational training helped me find a stable job for the first time.", "positive"),
    ("Children in our slum are now excited about going to school every day.", "positive"),
    ("The nutrition program improved the health of many children in our area.", "positive"),
    ("UPAY volunteers treat us with dignity and respect, which means everything.", "positive"),
    ("The women's empowerment workshop was truly life-changing for me.", "positive"),
    ("I never thought I could learn to read at my age, but UPAY made it possible.", "positive"),
    ("The program has given our village children a real shot at a better life.", "positive"),
    ("Exceptional support from the team during the flood relief operations.", "positive"),
    ("My son learned computer skills that helped him get a job in the city.", "positive"),
    ("The counseling sessions helped me overcome my anxiety about the future.", "positive"),
    ("I feel empowered and motivated after the leadership training program.", "positive"),
    ("The monthly food distribution program saved many families during lockdown.", "positive"),
    ("Volunteers showed up consistently, which built trust in our community.", "positive"),
    ("The cleanliness drive transformed the look and feel of our neighborhood.", "positive"),
    ("My daughter is the first in our family to pass her board exams, thanks to UPAY.", "positive"),
    ("The mobile health unit reached areas no doctor had ever visited before.", "positive"),
    ("I appreciate how UPAY listens to our needs before designing their programs.", "positive"),
    ("The sports program gave our youth a healthy outlet and discipline.", "positive"),
    ("Financial literacy training helped our self-help group manage funds better.", "positive"),
    ("UPAY's presence has brought real hope to a community that had little.", "positive"),
    ("The awareness campaign on hygiene reduced illness in our village noticeably.", "positive"),
    ("Volunteers went above and beyond during the exam preparation sessions.", "positive"),
    ("The environmental project taught our children to care for nature.", "positive"),
    ("I am proud to see young volunteers giving back to society through UPAY.", "positive"),
    ("The safe spaces created for women made us feel protected and heard.", "positive"),
    ("Our children now dream of becoming doctors and engineers — UPAY gave them that.", "positive"),
    ("The skill training was practical, job-oriented, and completely free.", "positive"),
    ("UPAY changed the direction of my life at a time when I had lost all hope.", "positive"),
    ("The reading program helped slow learners catch up with their peers.", "positive"),
    ("Community kitchens set up by UPAY ensured no child slept hungry.", "positive"),
    ("I never felt judged — the volunteers accepted us exactly as we are.", "positive"),
    ("The program materials were well-designed and easy for children to understand.", "positive"),
    ("My confidence to speak in public improved after the communication workshops.", "positive"),
    ("UPAY's blood donation camps saved lives in our town.", "positive"),
    ("The after-school program kept children off the streets and focused on learning.", "positive"),
    ("I witnessed real transformation in children who had given up on education.", "positive"),
    ("The training helped me start a small business from home.", "positive"),
    ("Volunteers were always available on phone whenever we needed guidance.", "positive"),
    ("The cultural programs helped preserve our local traditions and pride.", "positive"),
    ("Every interaction with UPAY staff left me feeling valued and supported.", "positive"),
    ("The impact of UPAY's work is visible in the smiles of children here.", "positive"),

    # ── NEGATIVE ──────────────────────────────────────────────────────────────
    ("The sessions were too infrequent and not enough to make a real difference.", "negative"),
    ("I felt the program was poorly organized and volunteers were unprepared.", "negative"),
    ("The materials distributed were damaged and of very poor quality.", "negative"),
    ("There was a lack of follow-up after the initial training sessions.", "negative"),
    ("Some volunteers seemed disinterested and were often late or absent.", "negative"),
    ("The program did not address the specific needs of our community at all.", "negative"),
    ("I had to travel very far for the sessions with no transport support given.", "negative"),
    ("The registration process was confusing and took too long to complete.", "negative"),
    ("Promised resources were never delivered to our school.", "negative"),
    ("The health camp ran out of medicines within the first hour of opening.", "negative"),
    ("There was no female counselor available, which made many women uncomfortable.", "negative"),
    ("The training was too theoretical and had no practical application.", "negative"),
    ("Communication from the organization was poor and often inconsistent.", "negative"),
    ("Our feedback from last year was never acknowledged or acted upon.", "negative"),
    ("The program ended abruptly without any proper closure or follow-up plan.", "negative"),
    ("I felt discriminated against based on my caste during one of the sessions.", "negative"),
    ("The food distributed during the camp was stale and made people sick.", "negative"),
    ("Volunteers lacked cultural sensitivity when interacting with our community.", "negative"),
    ("The noise and crowd at the event made it impossible to concentrate.", "negative"),
    ("There were too many dropouts because the schedule was not flexible enough.", "negative"),
    ("Important program updates were not communicated to beneficiaries on time.", "negative"),
    ("The program felt like a one-time event rather than a sustained effort.", "negative"),
    ("Quality of teaching was inconsistent — some teachers were far better than others.", "negative"),
    ("The scholarship disbursement was delayed by several months without explanation.", "negative"),
    ("I felt the program was designed more for publicity than for actual impact.", "negative"),
    ("Some beneficiaries were excluded from sessions without clear reasons given.", "negative"),
    ("The venue was not accessible for people with physical disabilities.", "negative"),
    ("No childcare was arranged for mothers, preventing many from attending.", "negative"),
    ("The digital devices provided were broken or did not function properly.", "negative"),
    ("There was visible favoritism in how resources and benefits were distributed.", "negative"),

    # ── NEUTRAL ───────────────────────────────────────────────────────────────
    ("The program session took place at the community hall on Sunday morning.", "neutral"),
    ("UPAY conducted a survey in our area to understand community needs.", "neutral"),
    ("Volunteers from the local engineering college participated in the camp.", "neutral"),
    ("The event was attended by approximately two hundred people from three villages.", "neutral"),
    ("Program registration forms were distributed at the start of the week.", "neutral"),
    ("The health camp provided basic checkups and blood pressure testing.", "neutral"),
    ("Classes were held every Saturday and Sunday for two months.", "neutral"),
    ("The materials included notebooks, pens, and a printed syllabus.", "neutral"),
    ("UPAY has been operating in this district for the past five years.", "neutral"),
    ("The program covered topics like hygiene, nutrition, and basic first aid.", "neutral"),
    ("Volunteers were present from 9 AM to 5 PM during the event.", "neutral"),
    ("The next session has been scheduled for the first week of next month.", "neutral"),
    ("A report on program outcomes was submitted to the district authority.", "neutral"),
    ("Participants were divided into three groups based on their age.", "neutral"),
    ("The training lasted for three days and covered four main modules.", "neutral"),
    ("Attendance was recorded at the beginning of each session by the coordinator.", "neutral"),
    ("The camp was organized in collaboration with the local municipal corporation.", "neutral"),
    ("Printed certificates were distributed to participants after the workshop.", "neutral"),
    ("The program is funded by corporate social responsibility contributions.", "neutral"),
    ("A total of eighty-five students enrolled in the digital literacy course.", "neutral"),
]


def generate_synthetic_dataset(output_dir: str = "data/synthetic") -> pd.DataFrame:
    """
    Converts the raw synthetic data list into a clean DataFrame and saves it as CSV.
    
    Returns:
        pd.DataFrame: The synthetic dataset
    """
    df = pd.DataFrame(SYNTHETIC_DATA, columns=["text", "label"])

    # Add a source column to track data origin during training
    df["source"] = "synthetic_ngo"

    # Map labels to numeric values for ML models
    label_map = {"negative": 0, "neutral": 1, "positive": 2}
    df["label_id"] = df["label"].map(label_map)

    # Basic stats
    print("=" * 50)
    print("  Synthetic NGO Dataset Summary")
    print("=" * 50)
    print(f"  Total samples     : {len(df)}")
    print(f"  Positive samples  : {len(df[df['label'] == 'positive'])}")
    print(f"  Negative samples  : {len(df[df['label'] == 'negative'])}")
    print(f"  Neutral samples   : {len(df[df['label'] == 'neutral'])}")
    print("=" * 50)

    # Save to CSV
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "ngo_feedback.csv")
    df.to_csv(output_path, index=False, encoding="utf-8")
    print(f"  Saved to: {output_path}")
    print("=" * 50)

    return df


if __name__ == "__main__":
    df = generate_synthetic_dataset()
    print("\nSample rows:")
    print(df.sample(5).to_string(index=False))