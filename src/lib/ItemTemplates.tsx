export const TEMPLATES = {
    'basic_values': [
        'Spirituality',
        'Family',
        'Friends',
        'Significant Other',
        'Health',
        'Learning',
        'Fun',
        'Career',
    ],
    'blank': [],
    'cuisines': [
        'Italian',
        'Mexican',
        'Japanese',
        'Indian',
        'Thai',
        'French',
        'Korean',
        'Chinese',
        'Mediterranean',
        'American',
        'German',
        'Spanish',
    ],
    // 'detailed_values': [
    //     'Parents',
    //     'Siblings',
    //     'Significant Other',
    //     'Friends',
    //     'Spirituality',
    //     'Health',
    //     'Learning',
    //     'Fun',
    //     'Career',
    //     'Honesty',
    //     'Compassion',
    //     'Discipline',
    //     'Creativity',
    //     'Integrity',
    //     'Kindness',
    //     'Perseverance',
    //     'Growth',
    // ],
    'funny_situations': [
        'Accidentally sending a text to the wrong person',
        'Mooching off your parents even though you\'re an adult',
    ],
    'love_languages': [
        'Acts of Service',
        'Quality Time',
        'Words of Affirmation',
        'Gifts',
        'Physical Touch',
    ],
    'romantic_gestures': [
        'Breakfast in Bed',
        'Home-cooked Meal',
        'Surprise Event Tickets',
        'Small Thoughtful Gifts',
        'Cuddling',
        'Useful Gifts',
        'Movie Night',
        'Compliments, Love Letter',
        'Weekend Getaway',
        'Candlelight Dinner',
        'Massage/Spa',
    ],
    'movies': [
        'Action',
        'Comedy',
        'Drama',
        'Horror',
        'Sci-Fi',
        'Romance',
        'Thriller',
        'Documentary',
        'Animation',
        'Fantasy',
    ],
    'music_genres': [
        'Pop',
        'Rock',
        'Hip Hop',
        'Jazz',
        'Classical',
        'Country',
        'Electronic',
        'R&B',
        'Folk',
        'Metal',
    ],
    'hobbies': [
        'Reading',
        'Gaming',
        'Sports',
        'Cooking',
        'Travel',
        'Photography',
        'Art',
        'Music',
        'Writing',
        'Gardening',
    ],
    'vacation_types': [
        'Beach Resort',
        'Mountain Hiking',
        'City Exploration',
        'Road Trip',
        'Cruise',
        'Camping',
        'Theme Park',
        'Cultural Tour',
        'Adventure Sports',
        'Relaxing Spa',
    ],
    'pets': [
        'Dog',
        'Cat',
        'Bird',
        'Fish',
    ],
    'seasons': [
        'Spring',
        'Summer',
        'Fall',
        'Winter',
    ],
    'coffee_drinks': [
        'Espresso',
        'Latte',
        'Cappuccino',
        'Americano',
        'Mocha',
        'Cold Brew',
        'Macchiato',
        'Flat White',
        'Cortado',
        'Iced Coffee',
    ],
};

// Support both predefined templates and custom string values
export type PredefinedTemplateKey = keyof typeof TEMPLATES;
export type TemplateKey = PredefinedTemplateKey | string;

export const TEMPLATE_DISPLAY_NAMES: Record<PredefinedTemplateKey, string> = {
    'blank': 'Anything',
    'basic_values': 'Core Values',
    'cuisines': 'Cuisines',
    // 'detailed_values': 'Detailed Values',
    'funny_situations': 'Funny Situations',
    'love_languages': 'Love Languages',
    'romantic_gestures': 'Romantic Gestures',
    'movies': 'Movie Genres',
    'music_genres': 'Music Genres',
    'hobbies': 'Hobbies',
    'vacation_types': 'Vacation Types',
    'pets': 'Pets',
    'seasons': 'Seasons',
    'coffee_drinks': 'Coffee Drinks',
};

export function isPredefinedTemplate(topic: TemplateKey): topic is PredefinedTemplateKey {
    return topic in TEMPLATES;
}

export function getTemplateItems(topic: TemplateKey): string[] {
    if (isPredefinedTemplate(topic)) {
        return TEMPLATES[topic];
    }
    return []; // Custom topics start with no items
}

export function getTopicDisplayName(topic: TemplateKey): string {
    if (isPredefinedTemplate(topic)) {
        return TEMPLATE_DISPLAY_NAMES[topic];
    }
    return topic; // For custom topics, use the topic string directly
}
