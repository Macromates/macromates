import json
import re
from datetime import datetime, timedelta

from django.conf import settings
from openai import OpenAI

# Initialize OpenAI client
client = OpenAI(api_key=settings.OPENAI_API_KEY)

VALIDATION_SYSTEM_PROMPT = """
You are a personalized health and fitness expert. Analyze the user's fitness goal for realism, safety, and achievability based on their specific biometric profile and the timeframe extracted from their objective.

IMPORTANT: Make your response highly personalized by referencing their specific:
- Age (consider life stage, metabolism, recovery needs)
- Current weight (for weight loss/gain calculations and realistic expectations)
- Height (for BMI context and body composition goals)
- Gender (for muscle-building potential, metabolic differences)
- Activity level (for caloric needs and training capacity)

Calculate personalized daily macro recommendations and caloric intake based on their goal and biometrics:
1. Calculate their TDEE (Total Daily Energy Expenditure) using their biometrics and activity level
2. Adjust calories based on their goal (deficit for weight loss, surplus for muscle building)
3. Calculate optimal protein, carbs, and fat grams and percentages for their specific goal

Return a JSON object with values in the following types:
{
    "is_reasonable": true/false,
    "feedback": "Personalized explanation referencing their age, weight, height, gender, and activity level. Explain why this goal fits or doesn't fit their specific profile.",
    "suggestion": "If unreasonable, provide a personalized alternative that considers their specific biometrics and circumstances.",
    "extracted_timeframe": "The timeframe you identified in the user's objective (e.g., '2 weeks', '3 months', '1 year')",
    "timeframe_days": 30,
    "daily_cal_kcal": 2200,
    "daily_protein_g": 165.0,
    "daily_fat_g": 73.0,
    "daily_carbs_g": 220.0,
    "protein_perc": 0.30,
    "carbs_perc": 0.40,
    "fat_perc": 0.30
}

Macro calculation guidelines:
- For muscle building: Higher protein (1.6-2.2g/kg body weight), moderate carbs (40-50%), moderate fat (25-35%)
- For weight loss: High protein to preserve muscle (1.6-2.4g/kg), moderate carbs (30-40%), moderate fat (25-35%)
- For general health: Balanced approach (1.2-1.6g/kg protein, 45-55% carbs, 25-35% fat)
- Consider their activity level for total calorie needs
- Ensure percentages add up to 1.0 (100%)

Activity level multipliers for TDEE:
- Sedentary: BMR × 1.2
- Low activity: BMR × 1.375
- Moderate activity: BMR × 1.55
- High activity: BMR × 1.725
- Very high activity: BMR × 1.9

BMR calculation (Mifflin-St Jeor):
- Men: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age + 5
- Women: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age - 161

Guidelines for personalization:
- For younger users (18-25): Mention higher metabolism and recovery capacity
- For older users (35+): Consider slower metabolism and longer recovery needs
- For beginners (low activity): Start with conservative goals
- For active users: Can handle more ambitious but still realistic goals
- Reference their current weight in context of their goal (e.g., "Given your current weight of X kg...")
- Consider gender differences in muscle-building potential and fat loss patterns
- Mention specific BMI context if relevant to their goal

Be encouraging but scientifically accurate. Always reference their specific data points in your feedback and macro calculations.
"""


def extract_timeframe_from_text(text):
    """
    Extract timeframe from user objective text using regex patterns
    Returns number of days or None if not found
    """
    text = text.lower()

    # Patterns for different time units
    patterns = [
        (r'(\d+)\s*days?', 1),
        (r'(\d+)\s*weeks?', 7),
        (r'(\d+)\s*months?', 30),
        (r'(\d+)\s*years?', 365),
        (r'a\s*week', 7),
        (r'a\s*month', 30),
        (r'a\s*year', 365),
    ]

    for pattern, multiplier in patterns:
        match = re.search(pattern, text)
        if match:
            try:
                if match.group(1) and match.group(1).isdigit():
                    return int(match.group(1)) * multiplier
            except IndexError:
                # For patterns without capture groups like "a week", "a month", etc.
                return multiplier

    return None


def calculate_end_date(start_date, days):
    """Calculate end date from start date and number of days"""
    if days:
        return start_date + timedelta(days=days)
    return None


def validate_goal_with_ai(user_biometrics, goal_type, user_objective):
    """
    Validate goal with AI and extract timeframe automatically from user_objective
    """
    prompt = (
        f"User biometrics: Age: {user_biometrics.get('age')}, Weight: {user_biometrics.get('weight')} kg, "
        f"Height: {user_biometrics.get('height')} cm, Gender: {user_biometrics.get('gender')}\n"
        f"Activity level: {user_biometrics.get('activity_level')}\n"
        f"Goal type: {goal_type}\n"
        f"User objective: {user_objective}\n\n"
        "Please extract the timeframe from the user's objective and analyze if this goal is reasonable and safe. "
        "If no specific timeframe is mentioned, assume a reasonable timeframe based on the goal type."
    )

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            temperature=0.7,
            messages=[
                {"role": "system", "content": VALIDATION_SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
        )
        ai_result = json.loads(response.choices[0].message.content)

        # Also try to extract timeframe using regex as backup
        extracted_days = extract_timeframe_from_text(user_objective)

        # Use AI's timeframe_days if available, otherwise use regex extraction
        timeframe_days = ai_result.get('timeframe_days', extracted_days)

        # Calculate end_date
        start_date = datetime.now().date()
        end_date = calculate_end_date(start_date, timeframe_days)

        # Add calculated fields to result
        ai_result['calculated_end_date'] = end_date.isoformat() if end_date else None
        ai_result['timeframe_days'] = timeframe_days

        return ai_result

    except Exception as e:
        return {
            "is_reasonable": False,
            "feedback": f"AI service temporarily unavailable: {str(e)}",
            "suggestion": "Please try again later or consult with a fitness professional.",
            "extracted_timeframe": None,
            "timeframe_days": None,
            "calculated_end_date": None
        }
