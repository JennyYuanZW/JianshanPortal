
export const APPLICATION_CONFIG = {
    // Basic Information & Open-ended Questions
    essays: [
        {
            id: 'email',
            label: 'Email',
            prompt: 'Enter your email address.',
            placeholder: 'email@example.com'
        },
        {
            id: 'fullName',
            label: 'Full Name',
            prompt: 'Full Name (as stated in your passport).',
            placeholder: 'Enter your legal name'
        },
        {
            id: 'phoneNumber',
            label: 'Phone Number',
            prompt: 'Enter your contact number.',
            placeholder: '+44...'
        },
        {
            id: 'nationality',
            label: 'Nationality',
            prompt: 'Please list all passports you hold.',
            placeholder: 'British, Chinese, etc.'
        },
        {
            id: 'gender',
            label: 'Gender',
            prompt: 'Gender (as stated in your passport).',
            placeholder: 'Male/Female/Other'
        },
        {
            id: 'dob',
            label: 'Date of Birth',
            prompt: 'Format: Day Month Year.',
            placeholder: '7 January 2019'
        },
        {
            id: 'fieldOfStudy',
            label: 'Field of Study',
            prompt: 'What is your current academic field?',
            placeholder: 'e.g., Engineering, Medicine'
        },
        {
            id: 'sessionOneTitle',
            label: 'Title of Session One',
            prompt: 'Design an engaging 45-min taster session.',
            placeholder: 'e.g., Why does bread always land butter-side down?'
        },
        {
            id: 'sessionOneOutline',
            label: 'Brief Outline of Session One',
            prompt: 'Include academic concepts, session design (interactive games/activities), and your rationale.',
            placeholder: 'In this session, we will...'
        },
        {
            id: 'sessionTwoTitle',
            label: 'Title of Session Two',
            prompt: 'Design your second 45-min taster session.',
            placeholder: 'e.g., Can elephants help us cure human cancer?'
        },
        {
            id: 'sessionTwoOutline',
            label: 'Brief Outline of Session Two',
            prompt: 'Include academic concepts, session design, and your rationale.',
            placeholder: 'This session explores...'
        },
        {
            id: 'interest',
            label: 'Why are you interested in this program?',
            prompt: 'This can be about the Jianshan Academy, the China Trip, or both.',
            placeholder: 'I am excited because...'
        },
        {
            id: 'aboutMe',
            label: 'About Yourself',
            prompt: 'Share your hobbies, interests, fun facts, or anything outside of your CV.',
            placeholder: 'I enjoy...'
        },
        {
            id: 'tutoringExp',
            label: 'Tutoring Experience',
            prompt: 'Indicate any previous teaching or tutoring experience.',
            placeholder: 'I have experience in...'
        },
        {
            id: 'dietary',
            label: 'Dietary Requirements',
            prompt: 'List any allergies or dietary needs.',
            placeholder: 'None'
        },
        {
            id: 'additionalComments',
            label: 'Additional Comments',
            prompt: 'Ask anything or share comments about the program or trip.',
            placeholder: 'I would like to know...'
        }
    ],

    // Multiple Choice Questions
    selections: [
        {
            id: 'yearOfStudy',
            label: 'Year of Study',
            options: [
                'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12',
                'University Year 1', 'University Year 2', 'University Year 3', 'University Year 4',
                'Masters', 'PhD', 'Other'
            ]
        },
        {
            id: 'subjectGroup',
            label: 'Subject Interest',
            options: [
                'Computer Science', 'Mathematics', 'Physics',
                'Biology', 'Chemistry', 'Economics',
                'History', 'Philosophy', 'Literature', 'Art'
            ]
        }
    ],

    // Program Preference Grid
    programPreferences: {
        label: 'Which program would you like to sign up for?',
        rows: [
            { id: 'hangzhou', label: 'Aug 6-10: Hangzhou' },
            { id: 'shanghai', label: 'Aug 13-17: Shanghai' }
        ],
        options: ['First Preference', 'Second Preference', 'Unavailable/Uninterested']
    },

    // File Upload Requirements
    uploads: [
        {
            id: 'cv',
            label: 'CV / Resume',
            prompt: 'Please attach a copy of your CV.'
        }
    ]
};
