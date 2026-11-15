const QUESTIONS = [
  {
    question: 'What measurements can be taken in space?',
    answer: 'For each indicator, the guide lists instruments documented on the ISS—such as an electrocardiograph, blood-pressure cuff, sample kits, and sensor-equipped exercise devices—along with commonly available alternatives on Earth and their sources.',
  },
  {
    question: 'Why is an examination necessary?',
    answer: 'Each indicator states its purpose. Real missions also establish a preflight health baseline and compare it during and after flight; recording a personal pattern is what makes changes noticeable.',
  },
  {
    question: 'How do spaceflight risks affect these indicators?',
    answer: 'NASA HRP’s five hazards and the links listed for each indicator describe general relationships documented in astronauts. They are presented as general associations, not as individual causation.',
  },
  {
    question: 'When might a result require attention from the crew or flight surgeons on Earth?',
    answer: 'Each indicator lists warning signs based on symptoms and repeated deviation from the person’s usual pattern. No thresholds are invented: clinical criteria belong to the mission protocol.',
  },
  {
    question: 'What measures can help prevent a critical health condition?',
    answer: 'Supported preventive measures—exercise countermeasures, sleep, light, environment, supervised nutrition, and social contact—state their context, evidence, and limitations, separately from treatments that require medical assessment.',
  },
]

const MEASURES = {
  'exercise-countermeasures': {
    title: 'Daily exercise as a countermeasure',
    action: 'On the ISS, the crew follows scheduled daily exercise plans—NASA schedules about 2.5 hours per day—using ARED resistance equipment, the T2 treadmill, and the CEVIS cycle. The stated goal is to maintain muscle, bone, aerobic capacity, and sensorimotor health.',
    evidence: 'NASA and JAXA document the equipment and routine. NASA also reports that results vary among individuals and current countermeasures may not be enough for long missions; one NASA-cited study estimates that up to 17% of crew members could lose muscular, skeletal, or cardiorespiratory performance unless countermeasures improve.',
    limits: 'This is not an individual prescription. Mission specialists, including ASCR staff and flight surgeons, adjust each astronaut’s plan.',
  },
  'physical-activity-earth': {
    title: 'Weekly physical activity (general Earth reference)',
    action: 'The 2020 WHO reference for adults recommends at least 150–300 minutes of moderate activity per week, or 75–150 minutes of vigorous activity, plus strengthening major muscle groups on two or more days per week.',
    evidence: 'Public WHO guidelines on physical activity and sedentary behavior.',
    limits: 'This is a population-level wellness reference, not a prescription. People with health conditions should adapt it with a professional. It does not replace space-mission countermeasures.',
  },
  'sleep-schedule': {
    title: 'Regular sleep and wake schedule',
    action: 'NASA schedules strict sleep and wake periods before and during missions and prepares crews several days in advance when a circadian schedule change is expected.',
    evidence: 'The first sleep countermeasure documented by NASA’s fatigue-management team.',
    limits: 'A schedule alone does not guarantee good sleep; persistent insomnia should be discussed with the medical team.',
  },
  'light-management': {
    title: 'Light management for circadian rhythm',
    action: 'The ISS experiences 16 sunrises each day, so NASA uses lighting panels that adjust spectrum and intensity to support alertness or sleep. On Earth, sleep hygiene includes reducing screen light at night.',
    evidence: 'Documented by NASA as a non-pharmacological, safe, and reversible countermeasure when correctly timed.',
    limits: 'Poorly timed light can worsen circadian disruption; mission programs are responsible for fine-tuning it.',
  },
  'sleep-environment': {
    title: 'A carefully managed sleep environment',
    action: 'Private crew quarters and control of temperature, lighting, airflow, noise, and carbon dioxide; on the ISS, restraints also prevent astronauts from floating while asleep.',
    evidence: 'Environmental factors listed by NASA as part of its sleep countermeasures.',
    limits: 'ASTRA does not measure the cabin environment; those readings belong to mission environmental systems.',
  },
  'sleep-cbt': {
    title: 'Sleep education and cognitive behavioral therapy',
    action: 'Education on sleep hygiene and cognitive behavioral therapy techniques can help manage thoughts that interfere with falling asleep.',
    evidence: 'Included by NASA among its seven crew sleep countermeasures.',
    limits: 'CBT is guided by trained personnel. ASTRA only mentions it as a documented option and does not provide therapy.',
  },
  'nutrition-tracking': {
    title: 'Supervised nutrition and hydration',
    action: 'NASA dietitians define nutrient requirements and crews record daily food intake in an application. These records are reviewed weekly alongside blood and urine analyses before, during, and after flight.',
    evidence: 'Described by NASA as part of astronaut healthcare operations.',
    limits: 'ASTRA does not record meals or calculate nutrients; this measure is shown only as a reference for real mission operations.',
  },
  'social-connection': {
    title: 'Social contact and behavioral support',
    action: 'Email, calls, and video conferences with family and friends, crew care packages, and teleconferences with a psychologist when needed. NASA also trains crews in self-care and team care.',
    evidence: 'Individualized psychological support described by NASA as a standard part of its missions.',
    limits: 'ASTRA does not assess mental health or replace professional support. Isolation is a risk the current physical indicators cannot measure.',
  },
}

const INDICATORS = {
  heart_rate: {
    name: 'Heart rate',
    what: 'Beats per minute (bpm), reported with context such as resting or after exercise.',
    instruments: ['On the ISS: electrocardiograph and blood-pressure/ECG monitor; CEVIS also displays heart rate during exercise.', 'On Earth: heart-rate monitor, sensor watch, or manual measurement.'],
    purpose: 'To understand a personal pattern and notice changes; together with symptoms, it can help determine when to seek advice.',
    spaceflight_links: ['NASA documents cardiovascular adaptations during spaceflight and orthostatic intolerance after return to gravity.', 'Maximum oxygen uptake and aerobic capacity may decline during long-duration missions according to NASA-cited studies.'],
    attention: 'Seek immediate help for sudden or crushing chest pain, sudden shortness of breath, sudden confusion, or fainting without recovery within a few minutes. In a mission, notify the flight surgeon immediately. Non-urgent assessment is appropriate after a first fainting episode, repeated fainting, intense palpitations, or readings repeatedly far from the personal pattern without explanation. ASTRA does not define clinical thresholds.',
    not_shown: 'It does not detect arrhythmias or heart disease and does not replace an ECG interpreted by medical personnel.',
  },
  temperature: {
    name: 'Body temperature',
    what: 'Reported degrees Celsius or Fahrenheit; units are never mixed.',
    instruments: ['On the ISS: a thermometer in the onboard medical kit; continuous monitoring remains an active research area.', 'On Earth: digital, ear, or forehead thermometer.'],
    purpose: 'Fever can be an early sign of infection, and early detection matters for the entire crew in a closed environment.',
    spaceflight_links: ['Closed or hostile environments are one of NASA’s five hazards and include monitoring microbes and immune responses.', 'Before launch, crews undergo health stabilization to reduce the risk of bringing infections onboard.'],
    attention: 'Seek immediate help for fever with confusion or difficulty waking the person. Contact the medical team promptly for persistent fever or fever with chills or severe weakness. Earth references do not replace mission protocols, and the app does not decide what temperature constitutes fever.',
    not_shown: 'It cannot identify the cause of a high temperature or distinguish infection from other causes.',
  },
  blood_pressure: {
    name: 'Blood pressure',
    what: 'User-reported systolic and diastolic pressure in mmHg.',
    instruments: ['On the ISS: blood-pressure cuff and combined blood-pressure/ECG monitor.', 'On Earth: a validated upper-arm blood-pressure monitor.'],
    purpose: 'To follow a personal trend and provide information to the medical team; in flight it supports monitoring cardiovascular adaptation.',
    spaceflight_links: ['NASA studies cardiovascular adaptation and orthostatic intolerance after return to gravity, a general relationship documented in astronauts.'],
    attention: 'Seek immediate help for crushing chest pain or sudden shortness of breath. Non-urgent assessment is appropriate for dizziness or brief fainting when standing and for readings repeatedly far from the personal pattern. Medical personnel must interpret the numbers.',
    not_shown: 'It does not diagnose hypertension or hypotension; a single isolated reading does not establish either diagnosis.',
  },
  oxygen_saturation: {
    name: 'Oxygen saturation',
    what: 'The reported percentage of blood oxygen saturation from 0 to 100%.',
    instruments: ['A fingertip pulse oximeter, commonly used in aerospace medicine; exact onboard availability depends on the mission’s medical configuration.'],
    purpose: 'To monitor oxygenation. In a cabin, a change may relate to pressure or air composition, not only to the person.',
    spaceflight_links: ['NASA documents risks to health and performance from hypoxia related to cabin atmosphere and spacewalks.', 'ISS air is monitored by mission life-support systems, not by an individual pulse oximeter.'],
    attention: 'Seek immediate help for sudden breathing difficulty, inability to speak because of breathlessness, sudden confusion, or blue lips or skin. If several crew members develop symptoms together, suspect the environment and report it immediately. Repeated values different from the usual pattern warrant non-urgent consultation.',
    not_shown: 'It does not measure carbon dioxide or cabin air quality and cannot identify the cause of low saturation.',
  },
  glucose: {
    name: 'Glucose',
    what: 'Reported mg/dL or mmol/L, with fasting or post-meal context when provided.',
    instruments: ['Portable glucose meter. The ISS also has blood and urine sample kits whose clinical analysis belongs to the mission program.'],
    purpose: 'To provide background information about energy and metabolism, mainly as a reported historical data point.',
    spaceflight_links: ['A 2002 NASA study proposed changes in insulin secretion and sensitivity during spaceflight; this is a research hypothesis, not current clinical guidance.', 'Mission nutrition is closely supervised through daily intake records and sample analysis.'],
    attention: 'Seek immediate help for confusion or reduced alertness in a person with diabetes or suspected low blood sugar. Symptoms such as shaking, sweating, excessive thirst, frequent urination, or values repeatedly outside the person’s usual pattern warrant consultation. ASTRA does not set clinical thresholds.',
    not_shown: 'It does not diagnose diabetes or adjust medication; fasting, meals, and exercise completely change the context of a reading.',
  },
  sleep: {
    name: 'Reported sleep',
    what: 'Hours of sleep per night reported by the user. Missing reports remain missing and are never estimated.',
    instruments: ['User-reported records in this application and scheduled mission sleep periods. Objective NASA research instruments are not part of this prototype.'],
    purpose: 'Sleep and circadian rhythm support performance and health; chronic sleep loss is associated with errors and long-term health problems.',
    spaceflight_links: ['The ISS orbits every 90 minutes, producing 16 sunrises per day and disrupting circadian rhythm, a risk NASA documents together with sleep loss and workload.'],
    attention: 'Discuss persistent insomnia or sleepiness that interferes with tasks with the medical team. NHLBI describes chronic insomnia as occurring three or more nights a week for more than three months. In missions, sleep medication is a last option and is tested on Earth under flight-surgeon supervision. Sudden confusion is an emergency.',
    not_shown: 'Reported hours do not measure sleep quality or detect disorders such as sleep apnea.',
  },
}

const MEDICAL = [
  { title: 'Medication, doses, and sleep aids', detail: 'Melatonin, caffeine as a mission strategy, hypnotics, and alertness medications are used by NASA only when other options are insufficient and are tested on Earth for each person under flight-surgeon supervision. This application never decides a dose.' },
  { title: 'Personalized treatment of any finding', detail: 'Interpreting symptoms, diagnosing, and treating are responsibilities of the medical team. The ISS carries medication and medical equipment, and in an emergency the crew can return to Earth in its spacecraft.' },
  { title: 'Individual exercise and reconditioning plans', detail: 'Mission specialists individualize exercise using preflight baseline testing and postflight recovery programs. General WHO activity guidance does not replace that work.' },
  { title: 'Assessed mental health', detail: 'Mission psychological support is provided by a behavioral-health team through individualized services. This application does not assess mental health.' },
]

const NOT_MONITORED = [
  'Individual radiation dose: monitored by the mission program, not by this application.',
  'Cabin air, water, and microbes: sampled and analyzed by station environmental systems.',
  'Validated mental-health assessment: isolation and confinement are risks the current indicators do not capture.',
  'Actual nutrition: meals and nutrients are not recorded.',
  'No communication is connected to a medical team: application alerts do not notify anyone.',
]

const SOURCES = {
  'nasa-hrp-hazards': ['NASA HRP: the 5 hazards of human spaceflight', 'General NASA research risk framework. It does not interpret personal readings.'],
  'nasa-hrr-risks': ['NASA Human Research Roadmap: risk and evidence records', 'General relationships between research risks and evidence. It does not establish individual causation.'],
  'nasa-astronaut-exercise': ['NASA ISS Research: astronaut exercise', 'Describes ISS exercise countermeasures and equipment. It is not a personal prescription.'],
  'nasa-health-care-faq': ['NASA: astronaut healthcare in space', 'Describes real healthcare organization, flight surgeons, exercise, baseline testing, and behavioral support.'],
  'nasa-sleep-countermeasures': ['NASA: seven ways astronauts improve sleep', 'NASA sleep and circadian countermeasures. It does not validate a remedy for a specific person.'],
  'jaxa-medical-operations': ['JAXA: medical operations on the ISS', 'ISS medical equipment and organization according to JAXA. Exact availability depends on each mission.'],
  'who-physical-activity-2020': ['WHO: 2020 physical activity guidelines', 'General Earth-based wellness reference for healthy adults, not spaceflight guidance or an individual prescription.'],
  'nasa-std-3001-vol2': ['NASA-STD-3001 Volume 2: Human Systems Standard', 'Program-level design, habitability, and environmental-health standard. It does not define personal triage thresholds.'],
  'medlineplus-chest-pain': ['MedlinePlus: chest pain', 'General Earth healthcare reference for urgent chest pain. It is not a mission protocol.'],
  'medlineplus-breathing-difficulty': ['MedlinePlus: breathing difficulty', 'General healthcare reference for sudden or severe breathing difficulty.'],
  'medlineplus-fainting': ['MedlinePlus: fainting', 'General Earth reference on emergencies and medical assessment after fainting.'],
  'medlineplus-confusion': ['MedlinePlus: confusion', 'General Earth reference stating that sudden unexplained confusion is an emergency.'],
  'medlineplus-blue-skin': ['MedlinePlus: bluish skin discoloration', 'General Earth reference about cyanosis and low blood oxygen.'],
  'medlineplus-fever': ['MedlinePlus: fever', 'General Earth reference on when adults should contact medical or emergency services for fever.'],
  'medlineplus-low-blood-sugar': ['MedlinePlus: low blood sugar', 'General reference on low blood sugar symptoms and when to seek immediate help.'],
  'medlineplus-high-blood-sugar': ['MedlinePlus: high blood sugar', 'General reference on high blood sugar symptoms.'],
  'nhlbi-insomnia': ['NHLBI: insomnia', 'General Earth reference defining chronic insomnia and options a clinician may recommend.'],
  'space-apps-2026': ['Health Monitoring Software — NASA Space Apps', 'Challenge objectives and indicators. Not a clinical protocol or endorsement of this software.'],
  osdr: ['NASA Open Science Data Repository', 'Scientific data not connected to personal readings or used as a medical protocol.'],
  'nasa-cv-risk': ['NASA HRP: cardiovascular adaptations risk', 'General astronaut information. It does not interpret personal heart-rate or blood-pressure readings.'],
  'nasa-orthostatic-intolerance': ['NASA NTRS: orthostatic intolerance after return to gravity', 'Astronaut postflight report. It does not interpret personal blood-pressure values.'],
  'nasa-hypoxia-risk': ['NASA HRP: reduced health and performance due to hypoxia', 'Cabin atmosphere and spacewalk risk. It does not interpret a person’s oxygen saturation.'],
  'nasa-body-temperature-rfi': ['NASA HRP: monitoring astronaut body temperature', 'Emerging evidence and research request. It does not define fever or interpret personal temperatures.'],
  'nasa-spaceflight-insulin-2002': ['NASA NTRS: insulin secretion and sensitivity in spaceflight', 'A 2002 research hypothesis, not current clinical guidance. It does not interpret personal glucose readings.'],
  'nasa-sleep-risk': ['NASA HRP: sleep loss, circadian disruption, and workload risk', 'General astronaut information. It does not assess a person or prescribe reference sleep hours.'],
}

const localizeMeasure = (measure) => ({ ...measure, ...(MEASURES[measure.id] || {}) })

export function localizeWellnessGuidance(guidance) {
  return {
    ...guidance,
    intro: 'Wellness guidance curated by the team using public sources from NASA, JAXA, WHO, and NIH health references. It is educational and general, does not interpret personal readings, and does not replace the mission medical team.',
    challenge_questions: guidance.challenge_questions.map((item, index) => ({ ...item, ...(QUESTIONS[index] || {}) })),
    measures: guidance.measures.map(localizeMeasure),
    indicators: guidance.indicators.map((item) => ({
      ...item,
      ...(INDICATORS[item.code] || {}),
      actions: item.actions?.map(localizeMeasure) || [],
    })),
    medical_only: guidance.medical_only.map((item, index) => ({ ...item, ...(MEDICAL[index] || {}) })),
    not_monitored: NOT_MONITORED,
    sources: guidance.sources.map((source) => {
      const translated = SOURCES[source.id]
      return translated ? { ...source, title: translated[0], scope: translated[1] } : source
    }),
  }
}
