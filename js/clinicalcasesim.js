

let currentStep = 1;
const totalSteps = 5;

// Shared progress storage (read by the Clinical Case Library page too)
const PROGRESS_KEY = 'dentor_case_progress';

// Per-case completion counter (how many times a case has been finished)
const COMPLETIONS_KEY = 'dentor_case_completions';

// Ensures the counter only goes up once per attempt (not on every back/forward)
let countedThisAttempt = false;

// ---------------------------------------------------------------------------
// Case data — real clinical cases (Solventum Dental Blog)
// ---------------------------------------------------------------------------
const CASES = {
    diastema: {
        id: 'diastema',
        next: 'crowding',
        specialty: 'Restorative',
        specialtyKey: 'restorative',
        difficulty: 'Advanced',
        difficultyColor: 'text-red-500',
        title: 'Diastema Closure & Direct Veneers',
        description: 'Esthetic closure of anterior diastemas and replacement of defective restorations with a single-shade universal composite (3M Filtek Easy Match) — case by Dr. Rafael Calixto',
        time: '15 minutes',
        patient: [
            ['Patient Initials', 'R.S.'],
            ['Age', '29 years'],
            ['Chief Complaint', 'Inadequate shape and proportion of the front teeth, with diastemas'],
            ['Treatment Area', 'Anterior maxilla (teeth 1.1 & 2.1)']
        ],
        presentation: [
            { icon: 'warning', color: 'text-yellow-500', text: 'Diastemas (spaces) between the anterior teeth' },
            { icon: 'warning', color: 'text-yellow-500', text: 'Inadequate shape and proportion of the front teeth' },
            { icon: 'warning', color: 'text-yellow-500', text: 'Poorly adapted existing restorations with stained margins and excesses' },
            { icon: 'check_circle', color: 'text-green-500', text: 'Patient seeking a natural, esthetic anterior result' }
        ],
        examImage: 'https://dentalblog.solventum.com/wp-content/uploads/2026/01/Figura-1-scaled.jpg',
        examCaption: 'Fig. 1 — Initial situation: anterior diastemas with poorly adapted restorations.',
        findings: [
            { title: 'Visual Examination', html: 'Anterior teeth show diastemas and disproportionate shape. Existing composite restorations are poorly adapted, with marginal staining and material excesses compromising esthetics.' },
            { title: 'Shade Selection (Button Technique)', html: 'A Bright shade button was placed on tooth 1.1 and a Natural shade on tooth 2.1. The <span class="font-semibold text-text-primary dark:text-dark-text-primary">Natural</span> shade of 3M Filtek Easy Match was selected for its better blending effect.' },
            { title: 'Planning', html: 'A digital treatment plan was produced with a 3D-printed model, and a silicon index was fabricated to guide the palatal layer and tooth length.' }
        ],
        diagnoses: [
            { title: 'Anterior diastemas with defective restorations', sub: 'Esthetic/proportion problem and poorly adapted restorations indicated for direct composite resolution' },
            { title: 'Active carious lesions requiring extraction', sub: 'Extensive decay with non-restorable anterior teeth' },
            { title: 'Generalized severe periodontitis', sub: 'Advanced attachment loss requiring surgical periodontal therapy' }
        ],
        treatmentPrompt: 'Select the steps that belong in the clinical protocol for this direct composite case:',
        treatments: [
            { title: 'Remove defective restorations & isolate', sub: 'Remove poorly adapted restorations and place rubber dam isolation' },
            { title: 'Build palatal layer with silicon index', sub: 'Apply the palatal layer (Natural shade) over the verified silicon index to set tooth length' },
            { title: 'Establish proximal walls & contacts', sub: 'Build proximal enamel and contact points to close the diastemas' },
            { title: 'Finish & polish', sub: 'Sof-Lex Pop-On discs, Sof-Lex Diamond Spiral (beige/pink), then felt disc with paste' }
        ],
        materials: [
            '3M&trade; Filtek&trade; Easy Match Universal Restorative (Natural)',
            '3M&trade; Express&trade; XT VPS impression material',
            '3M&trade; Sof-Lex&trade; Pop-On discs (Medium)',
            '3M&trade; Sof-Lex&trade; Diamond Spiral (beige &amp; pink)',
            'Polishing paste &amp; felt disc'
        ],
        prescription: [
            { label: '1. Ibuprofen 400 mg', text: '1 tablet every 8 hours as needed for discomfort (max 3 days).' },
            { label: '2. Chlorhexidine 0.12% mouth rinse', text: 'rinse twice daily for 7 days.' },
            { label: '3. Oral hygiene', text: 'soft brushing, daily flossing around new contact points; avoid biting hard objects with anterior teeth.' },
            { label: '4. Follow-up', text: 'review at 1 week to evaluate gloss, margins and tissue response.' }
        ],
        quiz: {
            question: 'Why was the <span class="font-semibold">Natural</span> shade selected over the Bright shade for this restoration?',
            options: [
                { value: 'a', text: 'It gave a better blending effect with the surrounding teeth' },
                { value: 'b', text: 'It was the only shade available in the kit' },
                { value: 'c', text: 'It is the most opaque shade, masking the diastema completely' }
            ],
            correct: 'a',
            correctMsg: 'Correct! The Natural shade was chosen for its better blending effect.',
            wrongMsg: 'Not quite. The Natural shade was selected because it blended better with the adjacent teeth.'
        },
        gallery: [
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/01/Figura-2-scaled.jpg', caption: 'Fig. 2 — Pre-operative view' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/01/Figura-3-scaled.jpg', caption: 'Fig. 3 — Shade selection (button technique)' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/01/Figura-4-scaled.jpg', caption: 'Fig. 4 — Rubber dam & silicon index check' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/01/Figura-5-scaled.jpg', caption: 'Fig. 5 — Isolation' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/01/Figura-6-scaled.jpg', caption: 'Fig. 6 — Palatal layer application' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/01/Figura-7-scaled.jpg', caption: 'Fig. 7 — Layering' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/01/Figura-8-scaled.jpg', caption: 'Fig. 8 — Proximal enamel application' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/01/Figura-9-scaled.jpg', caption: 'Fig. 9 — Contact points established' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/01/Figura-10-scaled.jpg', caption: 'Fig. 10 — Sculpting' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/01/Figura-11-scaled.jpg', caption: 'Fig. 11 — Finishing & polishing' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/01/Figura-12-scaled.jpg', caption: 'Fig. 12 — Polished restorations' }
        ],
        resultImage: 'https://dentalblog.solventum.com/wp-content/uploads/2026/01/Figura-13-scaled.jpg',
        resultCaption: 'Fig. 13 — One-week follow-up: diastemas closed with a natural, well-integrated result.',
        feedback: 'Excellent work! You correctly identified the anterior diastemas with defective restorations and followed a sound single-shade direct composite protocol — isolation, palatal layer over a silicon index, proximal build-up, then finishing and polishing. To refine your esthetics, keep practicing thickness control and tooth proportioning so a single shade and opacity reads as a natural restoration.',
        objectives: [
            'Diagnose anterior diastemas & defective restorations',
            'Select shade with the button technique',
            'Apply single-shade direct composite layering',
            'Finish & polish for natural esthetics'
        ]
    },

    crowding: {
        id: 'crowding',
        next: 'onlay-ceramic',
        specialty: 'Orthodontics',
        specialtyKey: 'orthodontics',
        difficulty: 'Advanced',
        difficultyColor: 'text-red-500',
        title: 'Class I Crowding — Combination Case',
        description: 'Clear-aligner combination treatment of a Class I malocclusion with lower crowding and an impacted second molar (3M Clarity Aligners & brackets) — case by Dr. Faye Goodyear',
        time: '20 minutes',
        patient: [
            ['Patient', '16-year-old female'],
            ['Active Treatment', '12 months'],
            ['Chief Complaint', 'Food packing in the lower right quadrant and lower crowding'],
            ['Treatment Area', 'Lower arch; impacted tooth 47']
        ],
        presentation: [
            { icon: 'warning', color: 'text-yellow-500', text: 'Lower arch crowding' },
            { icon: 'warning', color: 'text-yellow-500', text: 'Impacted lower right second molar (tooth 47)' },
            { icon: 'warning', color: 'text-yellow-500', text: 'Food packing in the lower right quadrant' },
            { icon: 'check_circle', color: 'text-green-500', text: 'Class I incisor relationship; patient seeking improved alignment' }
        ],
        examImage: 'https://dentalblog.solventum.com/wp-content/uploads/2026/05/260526_Ortho_case_4.png',
        examCaption: 'Initial retracted buccal view showing the lower crowding.',
        findings: [
            { title: 'Occlusal Relationship', html: 'Class I incisor relationship with lower arch crowding and an irregular mandibular arch form.' },
            { title: 'Impaction', html: 'Tooth <span class="font-semibold text-text-primary dark:text-dark-text-primary">47</span> (lower right second molar) is impacted, contributing to food packing in the lower right quadrant.' },
            { title: 'Diagnostic Records', html: 'A panoramic radiograph and occlusal photographs were taken to plan space management and uprighting.' }
        ],
        diagnoses: [
            { title: 'Class I malocclusion with lower crowding & impacted 47', sub: 'Crowding and an impacted second molar suited to clear-aligner therapy with adjuncts' },
            { title: 'Class III skeletal malocclusion', sub: 'Anterior crossbite requiring orthognathic surgery' },
            { title: 'Generalized aggressive periodontitis', sub: 'Rapid attachment loss requiring periodontal surgery before any movement' }
        ],
        treatmentPrompt: 'Select the steps appropriate for this clear-aligner combination case:',
        treatments: [
            { title: 'Clear aligners with overcorrections', sub: '3M Clarity Aligners staged at 10-day wear, including overcorrection aligners' },
            { title: 'Interproximal reduction (IPR) on the lower arch', sub: 'Create space and limit incisor proclination while relieving crowding' },
            { title: 'Lower indirect bonding with Clarity brackets', sub: 'Bond the 7s during a 0.016 x 0.022 archwire phase to upright and align' },
            { title: 'Refinement aligners', sub: 'Additional aligners to finish alignment and settle the occlusion' }
        ],
        materials: [
            '3M&trade; Clarity&trade; Aligners',
            '3M&trade; Clarity&trade; brackets (lower indirect bonding)',
            '0.016 x 0.022 archwire',
            'Overcorrection aligners (Flex / Force configuration)',
            'Attachments &amp; IPR instrumentation'
        ],
        prescription: [
            { label: '1. Aligner wear', text: 'wear 22 hours/day, change to the next aligner every 10 days as directed.' },
            { label: '2. Attachments & elastics', text: 'wear elastics/attachments exactly as prescribed to follow the staging.' },
            { label: '3. Oral hygiene', text: 'brush after meals, clean aligners daily, floss; use chewies to fully seat each aligner.' },
            { label: '4. Follow-up', text: 'review every 6–8 weeks; refinement scan once active aligners are completed.' }
        ],
        quiz: {
            question: 'Why was interproximal reduction (IPR) planned on the lower arch?',
            options: [
                { value: 'a', text: 'To create space and limit incisor proclination while relieving crowding' },
                { value: 'b', text: 'To extract the impacted tooth 47' },
                { value: 'c', text: 'To widen the arch purely by expansion' }
            ],
            correct: 'a',
            correctMsg: 'Correct! IPR creates space to relieve crowding while limiting incisor proclination.',
            wrongMsg: 'Not quite. IPR was used to gain space and control proclination, not to extract or expand.'
        },
        gallery: [
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/05/260526_Ortho_case_1.png', caption: 'Profile at rest (initial)' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/05/260526_Ortho_case_3.png', caption: 'Face smiling (initial)' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/05/260526_Ortho_case_5.png', caption: 'Retracted anterior biting (initial)' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/05/260526_Ortho_case_7.png', caption: 'Occlusal — maxillary (initial)' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/05/260526_Ortho_case_8.png', caption: 'Occlusal — mandibular (initial)' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/05/260526_Ortho_case_9.png', caption: 'Panoramic radiograph (initial)' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/05/260526_Ortho_case_10.png', caption: 'Retracted buccal (progress)' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/05/260526_Ortho_case_11.png', caption: 'Retracted anterior (progress)' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/05/260526_Ortho_case_20.png', caption: 'Final — image 2' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/05/260526_Ortho_case_21.png', caption: 'Final — image 3' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/05/260526_Ortho_case_31.png', caption: 'Face smiling (final)' }
        ],
        resultImage: 'https://dentalblog.solventum.com/wp-content/uploads/2026/05/260526_Ortho_case_19.png',
        resultCaption: 'Final result: lower crowding resolved and occlusion improved after ~12 months of treatment.',
        feedback: 'Great work! You recognised a Class I malocclusion with lower crowding and an impacted 47, and built a sound clear-aligner plan — aligners with overcorrections, IPR to control proclination, lower bonding with Clarity brackets, and a refinement phase. Keep monitoring anchorage and the eruption of tooth 47 as space opens.',
        objectives: [
            'Diagnose Class I crowding with an impacted molar',
            'Plan clear-aligner therapy with overcorrections',
            'Use IPR to manage space and proclination',
            'Combine aligners with fixed appliances for finishing'
        ]
    },

    'onlay-ceramic': {
        id: 'onlay-ceramic',
        next: 'class2',
        specialty: 'Restorative',
        specialtyKey: 'restorative',
        difficulty: 'Intermediate',
        difficultyColor: 'text-orange-500',
        title: 'Adhesive Bonding of a Glass-Ceramic Onlay',
        description: 'Selective-etch adhesive cementation of an IPS e.max glass-ceramic onlay on tooth 36 using Scotchbond Universal Plus & RelyX Universal — case by Dr. Akit Patel',
        time: '15 minutes',
        patient: [
            ['Age', '57 years'],
            ['Chief Complaint', 'Failed onlay on the mandibular first molar'],
            ['Tooth', '#36 (mandibular first molar)'],
            ['Restoration', 'IPS e.max® Press glass-ceramic onlay']
        ],
        presentation: [
            { icon: 'warning', color: 'text-yellow-500', text: 'Failed/defective existing onlay on tooth 36' },
            { icon: 'warning', color: 'text-yellow-500', text: 'Restoration indicated for replacement' },
            { icon: 'check_circle', color: 'text-green-500', text: 'Sufficient remaining tooth structure for an adhesive onlay' },
            { icon: 'check_circle', color: 'text-green-500', text: 'Patient suitable for a glass-ceramic restoration' }
        ],
        examImage: 'https://dentalblog.solventum.com/wp-content/uploads/2026/01/image_4.png',
        examCaption: 'Prepared tooth 36 ready for the adhesive onlay.',
        findings: [
            { title: 'Visual Examination', html: 'Tooth 36 has a failed onlay indicated for replacement; the remaining structure is suitable for a bonded glass-ceramic onlay.' },
            { title: 'Restoration', html: 'An <span class="font-semibold text-text-primary dark:text-dark-text-primary">IPS e.max Press</span> glass-ceramic onlay was fabricated for adhesive cementation.' },
            { title: 'Bonding Strategy', html: 'A selective-etch protocol with a universal adhesive and a universal resin cement was planned.' }
        ],
        diagnoses: [
            { title: 'Failed onlay requiring adhesive replacement', sub: 'Defective restoration on a restorable tooth, indicated for a bonded glass-ceramic onlay' },
            { title: 'Irreversible pulpitis requiring root canal therapy', sub: 'Spontaneous lingering pain indicating endodontic treatment' },
            { title: 'Non-restorable tooth requiring extraction', sub: 'Insufficient structure to support any restoration' }
        ],
        treatmentPrompt: 'Select the steps for the selective-etch adhesive bonding protocol:',
        treatments: [
            { title: 'Etch & silanate the onlay', sub: 'HF-etch the ceramic bonding surface (protect the external surface with wax), then apply Scotchbond Universal Plus as silane and air-dry' },
            { title: 'Clean & selectively etch the prep', sub: 'Clean the prep with 50 µm alumina, then selective enamel etch with Scotchbond Etchant' },
            { title: 'Apply adhesive (no light-cure)', sub: 'Apply Scotchbond Universal Plus to the prep and air-dry without light-curing' },
            { title: 'Cement & clean up', sub: 'Seat with RelyX Universal Resin Cement, remove excess and finish' }
        ],
        materials: [
            '3M&trade; Scotchbond&trade; Universal Plus Adhesive (as silane)',
            '3M&trade; RelyX&trade; Universal Resin Cement',
            '3M&trade; Scotchbond&trade; Etchant',
            'IPS e.max&reg; Press glass-ceramic onlay',
            '50 &micro;m alumina (prep cleaning)'
        ],
        prescription: [
            { label: '1. Analgesia', text: 'Ibuprofen 400 mg every 8 hours as needed for short-term sensitivity.' },
            { label: '2. Sensitivity', text: 'Mild cold sensitivity may occur for a few days; use a desensitising toothpaste.' },
            { label: '3. Oral hygiene', text: 'Normal brushing and flossing around the restoration margins.' },
            { label: '4. Follow-up', text: 'Review occlusion and margins at the next recall.' }
        ],
        quiz: {
            question: 'Why is the universal adhesive applied to the tooth prep but <span class="font-semibold">not</span> light-cured before cementation?',
            options: [
                { value: 'a', text: 'The dual-cure resin cement co-polymerises and cures the adhesive during seating' },
                { value: 'b', text: 'Light-curing the adhesive first weakens the ceramic' },
                { value: 'c', text: 'The adhesive does not need to bond to the tooth' }
            ],
            correct: 'a',
            correctMsg: 'Correct! Leaving the adhesive uncured lets it co-cure with the resin cement for a better-fitting bond.',
            wrongMsg: 'Not quite. The adhesive is left uncured so it co-cures with the dual-cure resin cement.'
        },
        gallery: [
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/01/image_1.png', caption: 'IPS e.max Press onlay' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/01/05012026_Header_741x535_02.png', caption: 'HF etching (external surface protected with wax)' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/01/05012026_Header_741x535_03.png', caption: 'Scotchbond Universal Plus as silane, then air-dry' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/01/image_4.png', caption: 'Prepped tooth' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/01/image_5.png', caption: 'Selective enamel etch with Scotchbond Etchant' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/01/image_6.png', caption: 'Adhesive applied, air-dried, no light-cure' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/01/image_7.png', caption: 'Application of RelyX Universal Resin Cement' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/01/image_8.png', caption: 'Excess clean-up' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/01/image_9.png', caption: 'Final situation' }
        ],
        resultImage: 'https://dentalblog.solventum.com/wp-content/uploads/2026/01/image_9.png',
        resultCaption: 'Final situation: well-integrated glass-ceramic onlay.',
        feedback: 'Great work! You identified a failed onlay suitable for adhesive replacement and followed the selective-etch protocol — HF-etch and silanate the ceramic, clean and selectively etch the prep, apply uncured universal adhesive, then cement with a universal resin cement. Remember the adhesive co-cures with the dual-cure cement.',
        objectives: [
            'Recognise a failed onlay indicated for replacement',
            'Prepare a glass-ceramic onlay surface (HF + silane)',
            'Apply a selective-etch universal adhesive protocol',
            'Cement with a universal resin cement and finish'
        ]
    },

    'class2': {
        id: 'class2',
        next: 'onlay-metal',
        specialty: 'Restorative',
        specialtyKey: 'restorative',
        difficulty: 'Intermediate',
        difficultyColor: 'text-orange-500',
        title: 'Narrow Class II Restorations',
        description: 'Minimally invasive direct composite restoration of narrow interproximal (D1) lesions on the upper left premolars with 3M Filtek Easy Match — case by Dr. Cristiano Bonacina',
        time: '18 minutes',
        patient: [
            ['Age / Gender', '20 years / Male'],
            ['Chief Complaint', 'Routine check-up'],
            ['Teeth', 'Upper left first & second premolars'],
            ['Diagnosis', 'Interproximal caries, class D1 (Anusavice & Benn)']
        ],
        presentation: [
            { icon: 'warning', color: 'text-yellow-500', text: 'Interproximal carious lesions (D1) on the upper left premolars' },
            { icon: 'warning', color: 'text-yellow-500', text: 'No flossing; fair oral hygiene' },
            { icon: 'check_circle', color: 'text-green-500', text: 'Lesions suitable for minimally invasive direct composite' },
            { icon: 'check_circle', color: 'text-green-500', text: 'Patient asymptomatic; found on routine exam' }
        ],
        examImage: 'https://dentalblog.solventum.com/wp-content/uploads/2026/02/DSC_1548-scaled.jpg',
        examCaption: 'Pre-operative occlusal view of the upper left premolars.',
        findings: [
            { title: 'Visual Examination', html: 'Narrow interproximal lesions on the upper left premolars; minimally invasive boxes are planned.' },
            { title: 'Radiographic', html: 'Bitewing confirms <span class="font-semibold text-text-primary dark:text-dark-text-primary">D1</span> interproximal lesions limited to enamel/outer dentin.' },
            { title: 'Shade & Material', html: 'The Natural shade of 3M Filtek Easy Match was chosen for its handling in narrow cavities and colour match.' }
        ],
        diagnoses: [
            { title: 'Interproximal caries (class D1) for direct composite', sub: 'Minimally invasive boxes restored with a single-shade composite' },
            { title: 'Deep caries with pulpal involvement needing endodontics', sub: 'Carious exposure requiring root canal treatment' },
            { title: 'Cracked tooth syndrome requiring a crown', sub: 'Fracture pain indicating full-coverage restoration' }
        ],
        treatmentPrompt: 'Select the steps for these minimally invasive Class II restorations:',
        treatments: [
            { title: 'Isolate & open minimal boxes', sub: 'Rubber dam isolation, then conservative interproximal box preparation' },
            { title: 'Matrices + selective enamel etch', sub: 'Place sectional matrices, wedges and rings; selectively etch enamel' },
            { title: 'Adhesive + thin flowable', sub: 'Apply Scotchbond Universal Plus, light-cure, then a thin flowable layer' },
            { title: 'Pack composite & finish', sub: 'Restore with Filtek Easy Match, build the marginal ridge, then finish and polish' }
        ],
        materials: [
            '3M&trade; Filtek&trade; Easy Match Universal Restorative (Natural)',
            '3M&trade; Scotchbond&trade; Universal Plus Adhesive',
            'Flowable composite (thin layer)',
            'Sectional matrices, wedges &amp; rings',
            'Rubber dam; narrow composite pluggers'
        ],
        prescription: [
            { label: '1. Analgesia', text: 'Ibuprofen 400 mg as needed for mild post-op sensitivity.' },
            { label: '2. Oral hygiene', text: 'Begin daily interdental cleaning/flossing to prevent new interproximal lesions.' },
            { label: '3. Diet', text: 'Reduce the frequency of sugary snacks; use fluoride toothpaste twice daily.' },
            { label: '4. Follow-up', text: 'Recall with bitewings to monitor the margins.' }
        ],
        quiz: {
            question: 'Why were sectional matrices, wedges and a ring used for these Class II restorations?',
            options: [
                { value: 'a', text: 'To re-establish a tight, well-contoured proximal contact and seal the box' },
                { value: 'b', text: 'To bleach the adjacent teeth' },
                { value: 'c', text: 'To avoid using any adhesive' }
            ],
            correct: 'a',
            correctMsg: 'Correct! Sectional matrices with a ring and wedge recreate a tight, anatomical proximal contact.',
            wrongMsg: 'Not quite. They are used to recreate a tight, well-contoured proximal contact and seal the box.'
        },
        gallery: [
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/02/DSC_1548-scaled.jpg', caption: 'Pre-op (occlusal view)' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/02/Pre-OP.001.jpeg', caption: 'Pre-op bitewing radiograph' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/02/DSC_1553-scaled.jpg', caption: 'Rubber dam placed' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/02/DSC_1557-scaled.jpg', caption: 'Minimally invasive interproximal boxes' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/02/DSC_1563-scaled.jpg', caption: 'Matrices in place; selective enamel etch' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/02/DSC_1564-scaled.jpg', caption: 'Adhesive phase (Scotchbond Universal Plus)' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/02/DSC_1568-scaled.jpg', caption: 'Thin flowable layer placed' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/02/DSC_1569-scaled.jpg', caption: 'Cavities filled; marginal ridge built' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/02/DSC_1577-scaled.jpg', caption: 'After finishing and polishing' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/02/DSC_1586-scaled.jpg', caption: 'Immediate post-op (occlusal)' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/02/PostOP.jpg', caption: 'Post-op bitewing verifying compaction' }
        ],
        resultImage: 'https://dentalblog.solventum.com/wp-content/uploads/2026/02/DSC_1586-scaled.jpg',
        resultCaption: 'Immediate post-op: narrow Class II restorations completed.',
        feedback: 'Excellent! You diagnosed narrow interproximal D1 caries and treated them minimally invasively — rubber dam isolation, sectional matrices for tight contacts, selective enamel etch and adhesive, then a single-shade composite finished and polished. Reinforcing flossing will help prevent recurrence.',
        objectives: [
            'Diagnose interproximal (D1) caries',
            'Plan minimally invasive Class II access',
            'Use sectional matrices for tight contacts',
            'Place a single-shade composite and finish'
        ]
    },

    'onlay-metal': {
        id: 'onlay-metal',
        next: 'anterior-longevity',
        specialty: 'Restorative',
        specialtyKey: 'restorative',
        difficulty: 'Intermediate',
        difficultyColor: 'text-orange-500',
        title: 'Adhesive Bonding of a Metal Onlay',
        description: 'Selective-etch adhesive cementation of a non-precious metal onlay on a severely worn tooth 36 using Scotchbond Universal Plus & RelyX Universal — case by Dr. Akit Patel',
        time: '15 minutes',
        patient: [
            ['Age', '68 years'],
            ['Chief Complaint', 'Severe wear on the mandibular first molar'],
            ['Tooth', '#36 (mandibular first molar)'],
            ['Restoration', 'Non-precious metal adhesive onlay']
        ],
        presentation: [
            { icon: 'warning', color: 'text-yellow-500', text: 'Severe occlusal wear on tooth 36 with exposed dentin' },
            { icon: 'warning', color: 'text-yellow-500', text: 'Loss of occlusal contour and tooth structure' },
            { icon: 'check_circle', color: 'text-green-500', text: 'Tooth restorable with a protective adhesive onlay' },
            { icon: 'check_circle', color: 'text-green-500', text: 'Patient prefers a durable, conservative option' }
        ],
        examImage: 'https://dentalblog.solventum.com/wp-content/uploads/2026/01/image_1-1.png',
        examCaption: 'Initial situation: severe occlusal wear on tooth 36.',
        findings: [
            { title: 'Visual Examination', html: 'Severe occlusal wear with exposed dentin on tooth 36; a protective onlay is indicated.' },
            { title: 'Restoration', html: 'A <span class="font-semibold text-text-primary dark:text-dark-text-primary">non-precious metal</span> adhesive onlay was fabricated.' },
            { title: 'Bonding Strategy', html: 'A selective-etch protocol with a universal adhesive and a universal resin cement was planned.' }
        ],
        diagnoses: [
            { title: 'Severe occlusal wear needing a protective onlay', sub: 'Exposed dentin on a restorable tooth, treated with a bonded metal onlay' },
            { title: 'Acute apical abscess requiring drainage', sub: 'Swelling and pain indicating an endodontic emergency' },
            { title: 'Periodontal mobility requiring splinting', sub: 'Attachment loss causing tooth mobility' }
        ],
        treatmentPrompt: 'Select the steps for bonding this metal onlay:',
        treatments: [
            { title: 'Conservative preparation', sub: 'Prepare tooth 36 conservatively for the adhesive onlay' },
            { title: 'Sandblast the onlay & apply adhesive', sub: 'Sandblast the metal bonding surface, apply Scotchbond Universal Plus and air-thin' },
            { title: 'Clean & selectively etch the prep', sub: 'Clean the prep with 50 µm alumina, then selective enamel etch with Scotchbond Etchant' },
            { title: 'Adhesive (no light-cure) then cement', sub: 'Apply and air-thin adhesive without curing, seat with RelyX Universal, clean excess' }
        ],
        materials: [
            '3M&trade; Scotchbond&trade; Universal Plus Adhesive',
            '3M&trade; RelyX&trade; Universal Resin Cement',
            '3M&trade; Scotchbond&trade; Etchant',
            'Non-precious metal adhesive onlay',
            '50 &micro;m alumina (surface cleaning)'
        ],
        prescription: [
            { label: '1. Analgesia', text: 'Ibuprofen 400 mg every 8 hours as needed for short-term sensitivity.' },
            { label: '2. Occlusion', text: 'Report any high spots; the bite will be checked and adjusted if needed.' },
            { label: '3. Oral hygiene', text: 'Normal brushing and flossing around the restoration margins.' },
            { label: '4. Follow-up', text: 'Review occlusion and margins at the next recall.' }
        ],
        quiz: {
            question: 'How is the fitting (bonding) surface of the <span class="font-semibold">metal</span> onlay prepared for adhesion?',
            options: [
                { value: 'a', text: 'Sandblasting (air-abrasion) followed by a universal adhesive' },
                { value: 'b', text: 'Hydrofluoric acid etching, the same as glass-ceramic' },
                { value: 'c', text: 'No surface treatment is required for metal' }
            ],
            correct: 'a',
            correctMsg: 'Correct! Metal is air-abraded (sandblasted), not HF-etched, then treated with the universal adhesive.',
            wrongMsg: 'Not quite. Metal surfaces are sandblasted (HF etching is for glass-ceramic).'
        },
        gallery: [
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/01/image_1-1.png', caption: 'Initial situation' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/01/image_2.png', caption: 'Preparation' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/01/image_3.png', caption: 'Sandblasting the metal bonding surface' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/01/image_4-1.png', caption: 'Adhesive applied, then air-thinning' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/01/image_5-1.png', caption: 'Selective enamel etch with Scotchbond Etchant' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/01/image_6-1.png', caption: 'After adhesive air-thinning, no light-cure' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/01/image_7-1.png', caption: 'Application of RelyX Universal Resin Cement' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/01/image_8-1.png', caption: 'Excess clean-up' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/01/image_9-1.png', caption: 'Final situation' }
        ],
        resultImage: 'https://dentalblog.solventum.com/wp-content/uploads/2026/01/image_9-1.png',
        resultCaption: 'Final situation: bonded metal onlay restoring occlusal form.',
        feedback: 'Great work! You recognised severe wear needing a protective onlay and bonded it correctly — sandblast the metal surface (not HF), apply uncured universal adhesive, selectively etch the prep, then cement with a universal resin cement. The key difference from ceramic is the surface treatment.',
        objectives: [
            'Recognise severe wear needing a protective onlay',
            'Air-abrade (sandblast) a metal bonding surface',
            'Apply a selective-etch universal adhesive protocol',
            'Cement with a universal resin cement'
        ]
    },

    'anterior-longevity': {
        id: 'anterior-longevity',
        next: 'inlay-cadcam',
        specialty: 'Restorative',
        specialtyKey: 'restorative',
        difficulty: 'Advanced',
        difficultyColor: 'text-red-500',
        title: 'Anterior Restoration Longevity',
        description: '13-year follow-up of direct composite restorations masking hypomineralization white spots on the incisors with 3M Filtek Supreme XTE — case by Dr. Rafael Calixto',
        time: '15 minutes',
        patient: [
            ['Age', '15 years (at treatment)'],
            ['Chief Complaint', 'White spots on the front teeth'],
            ['Teeth', 'Incisors 11, 21, 12, 22'],
            ['Follow-up', '13 years']
        ],
        presentation: [
            { icon: 'warning', color: 'text-yellow-500', text: 'Deep white stains from enamel hypomineralization' },
            { icon: 'warning', color: 'text-yellow-500', text: 'Microabrasion alone did not remove the stains' },
            { icon: 'check_circle', color: 'text-green-500', text: 'Resin infiltration was unavailable at the time' },
            { icon: 'check_circle', color: 'text-green-500', text: 'Patient seeking a conservative esthetic result' }
        ],
        examImage: 'https://dentalblog.solventum.com/wp-content/uploads/2026/06/Anterior_restoration_1.png',
        examCaption: 'Fig. 1 — Initial situation: white spots on incisors 11, 21, 12 and 22.',
        findings: [
            { title: 'Visual Examination', html: 'White hypomineralization stains on the middle and incisal thirds of the incisors.' },
            { title: 'Prior Treatment', html: 'Conservative microabrasion (~0.2 mm) was attempted but the stains remained.' },
            { title: 'Material Selection', html: '<span class="font-semibold text-text-primary dark:text-dark-text-primary">3M Filtek Supreme XTE</span> was chosen for its body opacity, handling and polishability.' }
        ],
        diagnoses: [
            { title: 'Enamel hypomineralization (white spots) for masking', sub: 'Esthetic defect treated with conservative enamel-level direct composite' },
            { title: 'Active proximal caries requiring fillings', sub: 'Cavitated lesions needing operative treatment' },
            { title: 'Tetracycline staining requiring crowns', sub: 'Intrinsic discoloration needing full coverage' }
        ],
        treatmentPrompt: 'Select the steps for this conservative esthetic restoration:',
        treatments: [
            { title: 'Attempt microabrasion', sub: 'Conservative enamel microabrasion (~0.2 mm) to reduce the staining' },
            { title: 'Enamel-level prep only', sub: 'Limit the restoration to the buccal enamel; avoid dentin removal' },
            { title: 'Layer body + enamel shades', sub: 'Place a body (opacity) layer then an enamel shade with Filtek Supreme XTE' },
            { title: 'Finish, polish & maintain', sub: 'Initial polish, a second polish at 3 days, then periodic maintenance polishing' }
        ],
        materials: [
            '3M&trade; Filtek&trade; Supreme XTE Universal Restorative',
            'Body shade (opacity) layer',
            'Enamel shade layer',
            'Polishing paste, rubber cup &amp; felt wheel'
        ],
        prescription: [
            { label: '1. Oral hygiene', text: 'Brush twice daily; avoid staining foods/drinks for the first 48 hours.' },
            { label: '2. Maintenance', text: 'Periodic polishing to preserve the surface gloss over the years.' },
            { label: '3. Sensitivity', text: 'Transient sensitivity is possible; use a desensitising toothpaste if needed.' },
            { label: '4. Follow-up', text: 'Recall to monitor the margins and esthetics.' }
        ],
        quiz: {
            question: 'Why was the preparation limited to the enamel layer without removing dentin?',
            options: [
                { value: 'a', text: 'To stay conservative and preserve tooth structure for long-term longevity' },
                { value: 'b', text: 'Because composite cannot bond to dentin' },
                { value: 'c', text: 'To make room for a veneer later' }
            ],
            correct: 'a',
            correctMsg: 'Correct! Staying at the enamel level preserves sound tooth structure and supports long-term longevity.',
            wrongMsg: 'Not quite. The prep was kept conservative (enamel only) to preserve tooth structure for longevity.'
        },
        gallery: [
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/06/Anterior_restoration_1.png', caption: 'Fig. 1 — Initial white spots' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/06/Anterior_restoration_2.png', caption: 'Fig. 2 — After stain removal & restoration' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/06/Anterior_restoration_3.png', caption: 'Fig. 3 — 6 years, no maintenance polishing' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2026/06/Anterior_restoration_4.png', caption: 'Fig. 4 — 13 years, after maintenance polishing' }
        ],
        resultImage: 'https://dentalblog.solventum.com/wp-content/uploads/2026/06/Anterior_restoration_4.png',
        resultCaption: 'Fig. 4 — After 13 years with maintenance polishing: a stable, esthetic result.',
        feedback: 'Excellent! You recognised hypomineralization white spots and chose a conservative, enamel-level direct composite — microabrasion first, then body and enamel layering with a polishable nanocomposite. The 13-year follow-up shows how conservative prep and good finishing support long-term restoration longevity.',
        objectives: [
            'Diagnose enamel hypomineralization white spots',
            'Choose a conservative enamel-level restoration',
            'Layer body and enamel composite shades',
            'Plan finishing and long-term maintenance'
        ]
    },

    'inlay-cadcam': {
        id: 'inlay-cadcam',
        next: 'diastema',
        specialty: 'Restorative',
        specialtyKey: 'restorative',
        difficulty: 'Intermediate',
        difficultyColor: 'text-orange-500',
        title: 'Adhesive Cementation of CAD/CAM Inlays',
        description: 'Selective-etch adhesive cementation of chairside CAD/CAM glass-ceramic inlays on teeth 45–47 for secondary caries, using Scotchbond Universal Plus, RelyX Universal and Elipar DeepCure — case by Dr. Alwin van Daelen',
        time: '18 minutes',
        patient: [
            ['Age', '46 years'],
            ['Chief Complaint', 'Secondary caries on the lower right teeth'],
            ['Teeth', '#45, #46, #47'],
            ['Restoration', 'Chairside CAD/CAM glass-ceramic inlays']
        ],
        presentation: [
            { icon: 'warning', color: 'text-yellow-500', text: 'Secondary caries around existing restorations on 45, 46, 47' },
            { icon: 'check_circle', color: 'text-green-500', text: 'Defects restorable with bonded ceramic inlays' },
            { icon: 'check_circle', color: 'text-green-500', text: 'Chairside CAD/CAM (Straumann n!ce) inlays milled' },
            { icon: 'check_circle', color: 'text-green-500', text: 'Selective-etch adhesive cementation planned' }
        ],
        examImage: 'https://dentalblog.solventum.com/wp-content/uploads/2025/12/image_1.png',
        examCaption: 'Preparations on teeth 45–47 under rubber dam.',
        findings: [
            { title: 'Visual Examination', html: 'Secondary caries on teeth 45–47 requiring replacement with bonded inlays.' },
            { title: 'Restoration', html: 'Chairside CAD/CAM glass-ceramic (<span class="font-semibold text-text-primary dark:text-dark-text-primary">Straumann n!ce A2 LT</span>) inlays were milled.' },
            { title: 'Bonding Strategy', html: 'Selective-etch with a universal adhesive, a universal resin cement and a final light-cure.' }
        ],
        diagnoses: [
            { title: 'Secondary caries for bonded ceramic inlays', sub: 'Recurrent caries on restorable teeth, treated with adhesive CAD/CAM inlays' },
            { title: 'Irreversible pulpitis requiring extraction', sub: 'Non-vital teeth that cannot be restored' },
            { title: 'Enamel fluorosis requiring whitening', sub: 'Intrinsic staining managed by bleaching' }
        ],
        treatmentPrompt: 'Select the steps for adhesive cementation of the CAD/CAM inlays:',
        treatments: [
            { title: 'Prepare, isolate & try-in', sub: 'Prepare the teeth with rubber dam isolation and try-in the milled inlays' },
            { title: 'Etch & silanate inlays', sub: 'HF-etch the ceramic and apply Scotchbond Universal Plus as a silane primer' },
            { title: 'Selective etch + adhesive on tooth', sub: 'Selective enamel etch, then apply adhesive to the tooth structure' },
            { title: 'Cement & light-cure', sub: 'Place RelyX Universal in the cavities, seat, clean excess, then final cure with Elipar DeepCure' }
        ],
        materials: [
            'Straumann&reg; n!ce&reg; A2 LT CAD/CAM inlays',
            '3M&trade; Scotchbond&trade; Universal Plus Adhesive',
            '3M&trade; RelyX&trade; Universal Resin Cement',
            '3M&trade; Elipar&trade; DeepCure LED Curing Light'
        ],
        prescription: [
            { label: '1. Analgesia', text: 'Ibuprofen 400 mg every 8 hours as needed for short-term sensitivity.' },
            { label: '2. Sensitivity', text: 'Mild cold sensitivity may occur for a few days; use a desensitising toothpaste.' },
            { label: '3. Oral hygiene', text: 'Normal brushing and flossing around the inlay margins.' },
            { label: '4. Follow-up', text: 'Review occlusion and margins at the next recall.' }
        ],
        quiz: {
            question: 'When can the resin cement be fully light-cured in this protocol?',
            options: [
                { value: 'a', text: 'After seating the inlay and removing the excess cement' },
                { value: 'b', text: 'Before placing the inlay' },
                { value: 'c', text: 'It never needs light-curing' }
            ],
            correct: 'a',
            correctMsg: 'Correct! Excess is cleaned first, then the cement is fully light-cured with the Elipar DeepCure.',
            wrongMsg: 'Not quite. The final light-cure is done after seating and cleaning the excess cement.'
        },
        gallery: [
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2025/12/image_1.png', caption: 'Preparations' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2025/12/image_2.png', caption: 'Try-in of inlays' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2025/12/image_3.png', caption: 'HF etching' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2025/12/image_4.png', caption: 'Scotchbond Universal Plus as silane primer' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2025/12/image_5.png', caption: 'Selective enamel etching' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2025/12/image_6.png', caption: 'Adhesive application to the tooth' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2025/12/image_7.png', caption: 'RelyX Universal placed into the cavities' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2025/12/image_8.png', caption: 'Excess stays put for easy clean-up' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2025/12/image_9.png', caption: 'Final light-cure with Elipar DeepCure' },
            { src: 'https://dentalblog.solventum.com/wp-content/uploads/2025/12/image_10.png', caption: 'Final situation' }
        ],
        resultImage: 'https://dentalblog.solventum.com/wp-content/uploads/2025/12/image_10.png',
        resultCaption: 'Final situation: bonded CAD/CAM inlays restoring teeth 45–47.',
        feedback: 'Great work! You diagnosed secondary caries suited to bonded inlays and followed the adhesive protocol — try-in, HF-etch and silanate the ceramic, selectively etch and bond the tooth, then cement with a universal resin cement and a final light-cure after cleaning excess.',
        objectives: [
            'Diagnose secondary caries for inlay replacement',
            'Prepare ceramic inlays (HF + silane)',
            'Apply a selective-etch adhesive to the tooth',
            'Cement and light-cure CAD/CAM inlays'
        ]
    }
};

let currentCase = CASES.diastema;
let caseStartTime = Date.now();

// ---------------------------------------------------------------------------
// Progress persistence helpers
// ---------------------------------------------------------------------------
function getProgress() {
    try {
        return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {};
    } catch (e) {
        return {};
    }
}

function getCompletions() {
    try {
        return JSON.parse(localStorage.getItem(COMPLETIONS_KEY)) || {};
    } catch (e) {
        return {};
    }
}

function incrementCompletion(id) {
    const counts = getCompletions();
    counts[id] = (counts[id] || 0) + 1;
    localStorage.setItem(COMPLETIONS_KEY, JSON.stringify(counts));
}

function saveCaseResult(id, score, timeMin, specialtyKey) {
    const progress = getProgress();
    const existing = progress[id];
    // Keep the best score if the case was already completed
    const bestScore = existing && existing.completed ? Math.max(existing.score, score) : score;
    progress[id] = {
        completed: true,
        score: bestScore,
        time: timeMin,
        specialty: specialtyKey
    };
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', function() {
    // Render the case data FIRST so the page is never blank, even if a
    // non-critical header/nav widget fails to initialise.
    const params = new URLSearchParams(window.location.search);
    const requested = params.get('case');
    currentCase = CASES[requested] || CASES.diastema;

    renderCase(currentCase);
    caseStartTime = Date.now();

    currentStep = 1;
    updateProgress();
    initializeDiagnosisSelection();

    // Header / navigation widgets — isolated so one failure can't blank the case.
    try { initializeMobileMenu(); } catch (e) { console.error(e); }
    try { initializeDarkMode(); } catch (e) { console.error(e); }
    try { initializeDropdowns(); } catch (e) { console.error(e); }
    try { hideCurrentPageFromDropdown(); } catch (e) { console.error(e); }
});

// ---------------------------------------------------------------------------
// Render the selected case into the page
// ---------------------------------------------------------------------------
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}
function setHTML(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = value;
}

function renderCase(c) {
    document.title = 'Dentor - ' + c.title;

    // Header
    setText('caseSpecialtyBadge', c.specialty);
    setText('caseDifficultyBadge', c.difficulty);
    setText('caseTitle', c.title);
    setText('caseDescription', c.description);
    setText('caseTime', c.time);

    // Step 1 — patient grid
    setHTML('patientGrid', c.patient.map(([label, value]) => `
        <div class="p-4 bg-background dark:bg-dark-background rounded-lg">
            <p class="text-xs text-text-secondary dark:text-dark-text-secondary mb-1">${label}</p>
            <p class="text-sm font-bold text-text-primary dark:text-dark-text-primary">${value}</p>
        </div>`).join(''));

    setHTML('presentationList', c.presentation.map(item => `
        <li class="flex items-start gap-2">
            <span class="material-symbols-outlined ${item.color} text-sm mt-0.5">${item.icon}</span>
            <span>${item.text}</span>
        </li>`).join(''));

    // Step 2 — examination
    const examImg = document.getElementById('examImage');
    if (examImg) examImg.src = c.examImage;
    setText('examCaption', c.examCaption);
    setHTML('findingsList', c.findings.map(f => `
        <div class="p-4 bg-background dark:bg-dark-background rounded-lg">
            <h4 class="font-bold text-text-primary dark:text-dark-text-primary mb-2">${f.title}</h4>
            <p class="text-sm text-text-secondary dark:text-dark-text-secondary">${f.html}</p>
        </div>`).join(''));

    // Optional image gallery (shown only when the case provides photos)
    const galleryWrap = document.getElementById('galleryWrap');
    if (galleryWrap) {
        if (c.gallery && c.gallery.length) {
            setHTML('galleryGrid', c.gallery.map(g => `
                <figure class="overflow-hidden rounded-lg border border-border-color dark:border-dark-border-color bg-background dark:bg-dark-background">
                    <img src="${g.src}" alt="${g.caption || ''}" loading="lazy"
                         class="w-full h-28 sm:h-32 object-cover hover:scale-105 transition-transform duration-300">
                    <figcaption class="text-[11px] leading-tight text-text-secondary dark:text-dark-text-secondary p-2">${g.caption || ''}</figcaption>
                </figure>`).join(''));
            galleryWrap.classList.remove('hidden');
        } else {
            galleryWrap.classList.add('hidden');
        }
    }

    // Step 3 — diagnosis (option value "1" is always the correct one)
    setHTML('diagnosisOptions', c.diagnoses.map((d, i) => `
        <label class="diagnosis-option block p-4 bg-background dark:bg-dark-background rounded-lg border-2 border-border-color dark:border-dark-border-color hover:border-primary cursor-pointer transition-all duration-300">
            <div class="flex items-start gap-3">
                <input aria-label="Diagnosis option ${i + 1}" type="radio" name="diagnosis" value="${i + 1}" class="mt-1">
                <div class="flex-1">
                    <p class="font-bold text-text-primary dark:text-dark-text-primary">${d.title}</p>
                    <p class="text-sm text-text-secondary dark:text-dark-text-secondary mt-1">${d.sub}</p>
                </div>
            </div>
        </label>`).join(''));

    // Step 4 — treatment, materials, prescription, quiz
    setText('treatmentPrompt', c.treatmentPrompt);
    setHTML('treatmentOptions', c.treatments.map(t => `
        <label class="block p-4 bg-background dark:bg-dark-background rounded-lg border-2 border-border-color dark:border-dark-border-color hover:border-primary cursor-pointer transition-all duration-300">
            <div class="flex items-start gap-3">
                <input aria-label="Answer option" type="checkbox" class="treatment-option mt-1">
                <div class="flex-1">
                    <p class="font-bold text-text-primary dark:text-dark-text-primary">${t.title}</p>
                    <p class="text-sm text-text-secondary dark:text-dark-text-secondary mt-1">${t.sub}</p>
                </div>
            </div>
        </label>`).join(''));

    setHTML('materialsList', c.materials.map(m => `
        <li class="flex items-start gap-2"><span class="material-symbols-outlined text-primary text-sm mt-0.5">check</span><span>${m}</span></li>`).join(''));

    setHTML('prescriptionList', c.prescription.map(p => `
        <p><span class="font-semibold text-text-primary dark:text-dark-text-primary">${p.label}</span> &mdash; ${p.text}</p>`).join(''));

    setHTML('quizQuestion', c.quiz.question);
    setHTML('quizOptions', c.quiz.options.map((o, i) => `
        <label class="quiz-option block p-3 bg-card dark:bg-dark-card rounded-lg border-2 border-border-color dark:border-dark-border-color hover:border-purple-400 cursor-pointer transition-all duration-300">
            <div class="flex items-start gap-3">
                <input aria-label="Quiz option ${i + 1}" type="radio" name="quiz1" value="${o.value}" class="mt-1">
                <span class="text-sm text-text-primary dark:text-dark-text-primary">${o.text}</span>
            </div>
        </label>`).join(''));

    // Step 5 — result image/caption + feedback
    const resultImg = document.getElementById('resultImage');
    if (resultImg) resultImg.src = c.resultImage;
    setText('resultCaption', c.resultCaption);
    setText('feedbackText', c.feedback);

    // Next case button
    const nextBtn = document.getElementById('nextCaseBtn');
    if (nextBtn && c.next) nextBtn.href = 'clinicalcasesim.html?case=' + c.next;

    // Sidebar
    const diffEl = document.getElementById('sidebarDifficulty');
    if (diffEl) {
        diffEl.textContent = c.difficulty;
        diffEl.className = 'text-sm font-bold ' + c.difficultyColor;
    }
    setText('sidebarSpecialty', c.specialty);
    setHTML('objectivesList', c.objectives.map(o => `
        <li class="flex items-start gap-2">
            <span class="material-symbols-outlined text-primary text-sm mt-0.5">check</span>
            <span>${o}</span>
        </li>`).join(''));

    // Rating (header, sidebar, results widget)
    renderRating(c);
    initRatingWidget(c);
}

// ---------------------------------------------------------------------------
// Student ratings
// ---------------------------------------------------------------------------
const RATINGS_KEY = 'dentor_case_ratings';

function getRatings() {
    try {
        return JSON.parse(localStorage.getItem(RATINGS_KEY)) || {};
    } catch (e) {
        return {};
    }
}

function saveRating(id, value) {
    const data = getRatings();
    const entry = data[id] || { studentSum: 0, studentCount: 0, userRating: 0 };
    if (entry.userRating) {
        // Student is changing their existing rating — adjust the sum, keep the count
        entry.studentSum += value - entry.userRating;
    } else {
        entry.studentSum += value;
        entry.studentCount += 1;
    }
    entry.userRating = value;
    data[id] = entry;
    localStorage.setItem(RATINGS_KEY, JSON.stringify(data));
}

// Overall rating = seed (so it isn't empty) + all student ratings
function computeRating(c) {
    const seed = c.ratingSeed || { sum: 0, count: 0 };
    const entry = getRatings()[c.id];
    const sum = seed.sum + (entry ? entry.studentSum : 0);
    const count = seed.count + (entry ? entry.studentCount : 0);
    const avg = count > 0 ? sum / count : 0;
    return { avg: avg, count: count, userRating: entry ? entry.userRating : 0 };
}

function renderRating(c) {
    const r = computeRating(c);
    const avgText = r.avg.toFixed(1);

    setText('caseRating', avgText);
    setText('caseReviews', '(' + r.count + ' ratings)');
    setText('sidebarRating', avgText);
    setText('ratingOverall', avgText + ' / 5 · ' + r.count + ' ratings');

    // Fill the stars: the student's own rating if they voted, else the average
    const fillTo = r.userRating || Math.round(r.avg);
    document.querySelectorAll('#ratingStars [data-value]').forEach(star => {
        const v = parseInt(star.getAttribute('data-value'), 10);
        star.textContent = v <= fillTo ? 'star' : 'star_border';
        star.classList.toggle('text-yellow-400', v <= fillTo);
        star.classList.toggle('text-text-secondary', v > fillTo);
    });

    setText('ratingMessage', r.userRating
        ? 'You rated this case ' + r.userRating + '/5. Tap a star to change it.'
        : 'Tap a star to rate this case.');
}

function initRatingWidget(c) {
    const stars = document.querySelectorAll('#ratingStars [data-value]');
    stars.forEach(star => {
        if (star.dataset.bound) return;
        star.dataset.bound = '1';
        star.addEventListener('click', function() {
            const value = parseInt(star.getAttribute('data-value'), 10);
            saveRating(c.id, value);
            renderRating(c);
            showFeedback('Thanks for rating this case!', 'success');
        });
    });
}

// Mobile Menu
function initializeMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileSidebar = document.getElementById('mobileSidebar');
    const mobileSidebarPanel = document.getElementById('mobileSidebarPanel');
    const closeMobileMenu = document.getElementById('closeMobileMenu');

    mobileMenuBtn?.addEventListener('click', () => {
        mobileSidebar.classList.remove('hidden');
        setTimeout(() => {
            mobileSidebarPanel.classList.remove('-translate-x-full');
        }, 10);
    });

    const closeSidebar = () => {
        mobileSidebarPanel.classList.add('-translate-x-full');
        setTimeout(() => {
            mobileSidebar.classList.add('hidden');
        }, 300);
    };

    closeMobileMenu?.addEventListener('click', closeSidebar);
    mobileSidebar?.addEventListener('click', (e) => {
        if (e.target === mobileSidebar) {
            closeSidebar();
        }
    });
}

// Hide current page from Features dropdown
function hideCurrentPageFromDropdown() {
    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
    const dropdownLinks = document.querySelectorAll('.absolute.left-0.mt-2 a[href]');

    dropdownLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        if (linkHref === currentPage) {
            link.parentElement.style.display = 'none';
        } else {
            link.parentElement.style.display = '';
        }
    });
}

// Dark Mode - Using Global ThemeManager
function initializeDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const darkModeIcon = document.getElementById('darkModeIcon');
    const logoImage = document.getElementById('logoImage');

    const lightLogo = 'assets/Logo.png';
    const darkLogo = 'assets/Logo0.png';

    if (typeof ThemeManager === 'undefined') return;

    if (darkModeToggle && logoImage) {
        const currentTheme = ThemeManager.getCurrentTheme();
        logoImage.src = currentTheme === 'dark' ? darkLogo : lightLogo;
        if (darkModeIcon) darkModeIcon.textContent = currentTheme === 'dark' ? 'dark_mode' : 'light_mode';

        darkModeToggle.addEventListener('click', function() {
            const newTheme = ThemeManager.toggleTheme();
            if (darkModeIcon) darkModeIcon.textContent = newTheme === 'dark' ? 'dark_mode' : 'light_mode';
            logoImage.src = newTheme === 'dark' ? darkLogo : lightLogo;
        });
    }
}

// Dropdowns
function initializeDropdowns() {
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationDropdown = document.getElementById('notificationDropdown');
    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');

    if (notificationBtn && notificationDropdown) {
        notificationBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            notificationDropdown.classList.toggle('active');
            if (profileDropdown) profileDropdown.classList.remove('active');
        });
    }

    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            profileDropdown.classList.toggle('active');
            if (notificationDropdown) notificationDropdown.classList.remove('active');
        });
    }

    document.addEventListener('click', function() {
        if (notificationDropdown) notificationDropdown.classList.remove('active');
        if (profileDropdown) profileDropdown.classList.remove('active');
    });
}

// Navigation between steps
function goToStep(step) {
    document.querySelectorAll('.step-content').forEach(content => {
        content.classList.remove('active');
    });

    const stepElement = document.getElementById('step' + step);
    if (stepElement) {
        stepElement.classList.add('active');
        currentStep = step;
        updateProgress();

        // Finalise the case when the results step is reached
        if (step === 5) {
            finalizeCase();
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Update progress bar
function updateProgress() {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');

    const percentage = (currentStep / totalSteps) * 100;

    if (progressBar) {
        progressBar.style.width = percentage + '%';
    }

    if (progressText) {
        progressText.textContent = `Step ${currentStep} of ${totalSteps}`;
    }
}

// Initialize diagnosis selection
function initializeDiagnosisSelection() {
    const diagnosisOptions = document.querySelectorAll('input[name="diagnosis"]');

    diagnosisOptions.forEach(option => {
        option.addEventListener('change', function() {
            updateSelectionStatus();
        });
    });
}

// Update selection status banner
function updateSelectionStatus() {
    const selected = document.querySelector('input[name="diagnosis"]:checked');
    const selectionStatus = document.getElementById('selectionStatus');

    if (selected && selectionStatus) {
        selectionStatus.classList.remove('hidden');
    } else if (selectionStatus) {
        selectionStatus.classList.add('hidden');
    }
}

// Clear diagnosis selection
function clearDiagnosis() {
    document.querySelectorAll('input[name="diagnosis"]').forEach(option => {
        option.checked = false;
    });
    updateSelectionStatus();
    showNotification('Selection cleared', 'info');
}

// Retry case
function retryCase() {
    document.querySelectorAll('input[name="diagnosis"]').forEach(option => {
        option.checked = false;
    });
    document.querySelectorAll('input[type="checkbox"]').forEach(option => {
        option.checked = false;
    });
    document.querySelectorAll('input[name="quiz1"]').forEach(option => {
        option.checked = false;
    });
    const quizResult = document.getElementById('quizResult');
    if (quizResult) quizResult.classList.add('hidden');

    // Reset the timer and allow the next completion to be counted again
    caseStartTime = Date.now();
    countedThisAttempt = false;

    goToStep(1);
    showNotification('Case reset - Good luck!', 'info');
}

// Knowledge-check quiz (Step 4)
function checkQuiz() {
    const selected = document.querySelector('input[name="quiz1"]:checked');
    const result = document.getElementById('quizResult');

    if (!result) return;

    if (!selected) {
        result.classList.remove('hidden', 'text-green-500', 'text-red-500');
        result.classList.add('text-yellow-500');
        result.textContent = 'Please select an answer first.';
        return;
    }

    result.classList.remove('hidden');

    if (selected.value === currentCase.quiz.correct) {
        result.classList.remove('text-red-500', 'text-yellow-500');
        result.classList.add('text-green-500');
        result.textContent = currentCase.quiz.correctMsg;
        showFeedback('Correct answer!', 'success');
    } else {
        result.classList.remove('text-green-500', 'text-yellow-500');
        result.classList.add('text-red-500');
        result.textContent = currentCase.quiz.wrongMsg;
        showFeedback('Try again', 'error');
    }
}

// Submit diagnosis
function submitDiagnosis() {
    const selected = document.querySelector('input[name="diagnosis"]:checked');

    if (!selected) {
        showNotification('Please select a diagnosis option before submitting', 'warning');
        return;
    }

    // Option "1" is the correct diagnosis for every case
    if (selected.value === '1') {
        showFeedback('Correct diagnosis!', 'success');
        setTimeout(() => goToStep(4), 1500);
    } else {
        showFeedback('Not quite right. Review the clinical findings.', 'error');
    }
}

// Compute the score, persist progress, and fill in the results step
function finalizeCase() {
    let score = 0;
    let correctDecisions = 0;

    // 1. Diagnosis — reaching step 5 requires the correct diagnosis (40 pts)
    score += 40;
    correctDecisions += 1;

    // 2. Treatment plan — proportion of correct steps selected (30 pts)
    const treatmentBoxes = document.querySelectorAll('#treatmentOptions input[type="checkbox"]');
    const totalTreatments = treatmentBoxes.length || 1;
    let checkedTreatments = 0;
    treatmentBoxes.forEach(box => { if (box.checked) checkedTreatments += 1; });
    score += Math.round((checkedTreatments / totalTreatments) * 30);
    if (checkedTreatments === totalTreatments) correctDecisions += 1;

    // 3. Knowledge-check quiz (30 pts)
    const quizSelected = document.querySelector('input[name="quiz1"]:checked');
    if (quizSelected && quizSelected.value === currentCase.quiz.correct) {
        score += 30;
        correctDecisions += 1;
    }

    score = Math.min(100, score);

    const timeMin = Math.max(1, Math.round((Date.now() - caseStartTime) / 60000));

    setText('scoreOverall', score + '%');
    setText('scoreTime', timeMin + ' min');
    setText('scoreCorrect', correctDecisions + '/3');

    saveCaseResult(currentCase.id, score, timeMin, currentCase.specialtyKey);

    // Count this completion once per attempt
    if (!countedThisAttempt) {
        incrementCompletion(currentCase.id);
        countedThisAttempt = true;
    }
}

// Show notification
function showNotification(message, type) {
    const notification = document.createElement('div');

    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    };

    const icons = {
        success: 'check_circle',
        error: 'error',
        warning: 'warning',
        info: 'info'
    };

    notification.className = `fixed top-24 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 ${
        colors[type] || 'bg-blue-500'
    } text-white font-semibold transform transition-all duration-300 border-2 border-white/20`;
    notification.innerHTML = `
        <span class="material-symbols-outlined text-2xl">${icons[type] || 'info'}</span>
        <span>${message}</span>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.transform = 'translateX(500px)';
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Show feedback
function showFeedback(message, type) {
    const feedback = document.createElement('div');
    feedback.className = `fixed top-24 right-6 z-50 px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white font-semibold transform transition-all duration-300`;
    feedback.innerHTML = `
        <span class="material-symbols-outlined">${type === 'success' ? 'check_circle' : 'error'}</span>
        <span>${message}</span>
    `;

    document.body.appendChild(feedback);

    setTimeout(() => {
        feedback.style.transform = 'translateX(400px)';
        feedback.style.opacity = '0';
        setTimeout(() => feedback.remove(), 300);
    }, 2000);
}
