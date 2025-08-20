import base64
import json
import logging
import re

from django.conf import settings
from django.core.files.storage import default_storage
from openai import OpenAI

logger = logging.getLogger(__name__)
client = OpenAI(api_key=settings.OPENAI_API_KEY)

GOAL_TYPE_MAP = {
    1: "Lose Weight",
    2: "Build Muscle",
    3: "Improve Health",
    4: "Other",
}


def analyze_food_image(image_path, user_goal=None, user_profile=None):
    try:
        with default_storage.open(image_path, "rb") as f:
            b64 = base64.b64encode(f.read()).decode("utf-8")
        image_url = f"data:image/jpeg;base64,{b64}"
    except Exception as e:
        logger.error(f"Image read/encode failed: {e}")
        return {"error": "Failed to read the uploaded image file."}

    # Gather user context
    user_context = ""
    if user_profile:
        logger.debug("=== Building User Context ===")
        logger.debug(f"User ID: {getattr(user_profile, 'id', 'unknown')}")
        logger.debug(f"Username: {getattr(user_profile, 'username', 'unknown')}")
        user_context = f"""
User profile:
  Age: {getattr(user_profile, 'age', 'unknown')}
  Weight: {getattr(user_profile, 'weight', 'unknown')}
  Height: {getattr(user_profile, 'height', 'unknown')}
  Gender: {getattr(user_profile, 'gender', 'unknown')}
  Activity Level: {getattr(user_profile, 'activity_level', 'unknown')}
"""
        logger.debug(f"Generated user_context: {user_context}")
    goal_context = ""
    if user_goal:
        logger.debug("=== Building Goal Context ===")
        user_goal_type = GOAL_TYPE_MAP.get(user_goal.goal_type, "").lower()
        logger.debug(f"Goal Type: {user_goal.goal_type} -> {user_goal_type}")
        logger.debug(f"Goal Objective: {user_goal.user_objective}")
        goal_context = f"""
User goal type: {user_goal_type}
User objective: {user_goal.user_objective}
Scoring guidance:

!!! IMPORTANT !!! Format your ai_insight EXACTLY like this:
[User Goal: {user_goal_type}] [Objective: {user_goal.user_objective}]
Analysis: [your specific analysis of the meal]
Recommendation: [your specific recommendations based on their goal]
Alignment: [explain why you gave this meal_score and how it aligns with their goals]"
Give meal_score 1–10 reflecting alignment with the "User goal type" and the details of the "User objective" above.
"""

    logger.debug("=== Building System Prompt ===")
    system_prompt = f"""
You are a personalized nutrition coach. Return ONLY valid JSON (no markdown, no commentary).
If information is uncertain, estimate reasonable typical values.
Make the ai_insight and meal_score fields highly personalized to the user's goals and profile when available.

User context:
{user_context}

Required JSON structure:
{{
  "protein_g": float,
  "carbs_g": float,
  "fat_g": float,
  "cal_kcal": integer,
  "meal_score": integer,  // 1-10 (still include even if no goal; base on general health)
  "ai_insight": string,
  "food_items": [
    {{
      "name": string,  // Name with relevant emoji prefix (e.g., "🍗 Grilled Chicken Breast", "🍟 French Fries", "🥗 Greek Salad"). If no specific emoji exists for the food, use 🍽️ (e.g., "🍽️ Quinoa Salad")
      "protein_g": float,
      "carbs_g": float,
      "fat_g": float,
      "cal_kcal": integer,
      "nutrients": [
        {{
          "name": string,  // Nutrient name (e.g., "Vitamin C", "Iron", "Calcium")
          "value": string  // Value with unit (e.g., "25mg", "2.1g", "150mcg")
        }}
      ]  // Include up to 10 most important nutrients per food item
    }}
  ]
}}

CRITICAL: 
1. Identify individual food items in the image (up to 10 most significant items)
2. The sum of all individual food items' macros MUST equal the total meal macros
3. Distribute macros proportionally based on estimated portion sizes
4. Include relevant nutrients for each food item (vitamins, minerals, fiber, etc.)
5. Be specific with food item names (e.g., "French Fries" not just "Potatoes")
6. ALWAYS prefix food names with appropriate food emojis (🍗 for chicken, 🥗 for salads, 🍞 for bread, etc.). Use 🍽️ as fallback for foods without specific emojis

{goal_context}
Respond with JSON only.
"""

    try:
        resp = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": [
                        {"type": "text",
                         "text": "Analyze this meal image, providing total macros and breaking down individual food items with their proportional macros and nutrients."},
                        {"type": "image_url", "image_url": {"url": image_url, "detail": "high"}},
                    ],
                },
            ],
            max_tokens=1500,  # Increased token limit for detailed food item breakdown
        )
    except Exception as e:
        logger.error(f"OpenAI request failed: {e}", exc_info=True)
        return {"error": "AI analysis request failed."}

    raw = resp.choices[0].message.content.strip()
    logger.debug("RAW AI content (first 500 chars): %s", raw[:500])

    # 1. Direct parse
    try:
        return _normalize_result(json.loads(raw))
    except json.JSONDecodeError:
        pass

    # 2. Extract first JSON object
    m = re.search(r"\{.*\}", raw, re.DOTALL)
    if m:
        try:
            return _normalize_result(json.loads(m.group()))
        except json.JSONDecodeError as e:
            logger.warning("Extraction parse failed: %s", e)

    # 3. Fallback minimal structure
    logger.warning("Falling back to heuristic values; raw content: %s", raw[:250])
    return {
        "protein_g": 0.0,
        "carbs_g": 0.0,
        "fat_g": 0.0,
        "cal_kcal": 0,
        "meal_score": 5,
        "ai_insight": raw[:240],
        "food_items": []
    }


def _normalize_result(data: dict):
    # Ensure required keys & types; add defaults.
    logger.debug(f"Normalizing AI response data: {data}")

    def fnum(v, default=0.0):
        try:
            return float(v)
        except:
            return default

    def inum(v, default=0):
        try:
            return int(round(float(v)))
        except:
            return default

    result = {
        "protein_g": fnum(data.get("protein_g")),
        "carbs_g": fnum(data.get("carbs_g")),
        "fat_g": fnum(data.get("fat_g")),
        "cal_kcal": inum(data.get("cal_kcal")),
        "meal_score": inum(data.get("meal_score", 5)),
        "ai_insight": str(data.get("ai_insight", "")).strip()[:600] or "No insight generated.",
        "food_items": _normalize_food_items(data.get("food_items", []))
    }

    # Validate that food items add up to total (with some tolerance for rounding)
    _validate_macro_totals(result)

    logger.debug(f"Normalized result: {result}")
    return result


def _normalize_food_items(food_items_data):
    """Normalize the food items data from AI response"""
    normalized_items = []

    for item in food_items_data:
        if not isinstance(item, dict):
            continue

        def fnum(v, default=0.0):
            try:
                return float(v)
            except:
                return default

        def inum(v, default=0):
            try:
                return int(round(float(v)))
            except:
                return default

        # Normalize nutrients
        nutrients = []
        raw_nutrients = item.get("nutrients", [])
        if isinstance(raw_nutrients, list):
            for nutrient in raw_nutrients[:10]:  # Limit to 10 nutrients
                if isinstance(nutrient, dict) and "name" in nutrient and "value" in nutrient:
                    nutrients.append({
                        "name": str(nutrient["name"]).strip(),
                        "value": str(nutrient["value"]).strip()
                    })

        normalized_item = {
            "name": str(item.get("name", "Unknown Food")).strip()[:255],  # Limit name length
            "protein_g": fnum(item.get("protein_g")),
            "carbs_g": fnum(item.get("carbs_g")),
            "fat_g": fnum(item.get("fat_g")),
            "cal_kcal": inum(item.get("cal_kcal")),
            "nutrients": nutrients
        }

        normalized_items.append(normalized_item)

    return normalized_items


def _validate_macro_totals(result):
    """Validate that individual food items add up to total macros"""
    food_items = result.get("food_items", [])
    if not food_items:
        return

    # Calculate sums from food items
    items_protein = sum(item["protein_g"] for item in food_items)
    items_carbs = sum(item["carbs_g"] for item in food_items)
    items_fat = sum(item["fat_g"] for item in food_items)
    items_calories = sum(item["cal_kcal"] for item in food_items)

    # Get totals
    total_protein = result["protein_g"]
    total_carbs = result["carbs_g"]
    total_fat = result["fat_g"]
    total_calories = result["cal_kcal"]

    # Check if sums are reasonably close (within 10% tolerance)
    tolerance = 0.1

    def within_tolerance(sum_val, total_val):
        if total_val == 0:
            return sum_val == 0
        return abs(sum_val - total_val) / total_val <= tolerance

    # If not within tolerance, adjust proportionally
    if not (within_tolerance(items_protein, total_protein) and
            within_tolerance(items_carbs, total_carbs) and
            within_tolerance(items_fat, total_fat) and
            within_tolerance(items_calories, total_calories)):

        logger.warning("Food item macros don't add up to totals, adjusting proportionally")

        # Calculate adjustment factors
        protein_factor = total_protein / items_protein if items_protein > 0 else 1
        carbs_factor = total_carbs / items_carbs if items_carbs > 0 else 1
        fat_factor = total_fat / items_fat if items_fat > 0 else 1
        calories_factor = total_calories / items_calories if items_calories > 0 else 1

        # Apply adjustments
        for item in food_items:
            item["protein_g"] = round(item["protein_g"] * protein_factor, 1)
            item["carbs_g"] = round(item["carbs_g"] * carbs_factor, 1)
            item["fat_g"] = round(item["fat_g"] * fat_factor, 1)
            item["cal_kcal"] = round(item["cal_kcal"] * calories_factor)


def create_food_items_from_analysis(photo, analysis_data):
    """Create FoodItem objects from the analysis data"""
    from foodItem.models import FoodItem

    food_items_data = analysis_data.get("food_items", [])
    created_items = []

    for item_data in food_items_data:
        try:
            food_item = FoodItem.objects.create(
                name=item_data["name"],
                protein_g=item_data["protein_g"],
                carbs_g=item_data["carbs_g"],
                fat_g=item_data["fat_g"],
                cal_kcal=item_data["cal_kcal"],
                food_photo=photo,
                nutrients=item_data["nutrients"]
            )
            created_items.append(food_item)
            logger.info(f"Created FoodItem: {food_item.name} with {len(item_data['nutrients'])} nutrients")
        except Exception as e:
            logger.error(f"Failed to create FoodItem {item_data.get('name', 'unknown')}: {e}")

    return created_items


def get_or_create_user_day(custom_user, photo_date=None):
    """
    Get or create a UserDay for the given user and date.
    If no date provided, uses current date.
    Also creates UserMonth if it doesn't exist.
    """
    from django.utils import timezone
    from datetime import date, timedelta
    from userday.models import UserDay
    from usermonth.models import UserMonth

    if photo_date is None:
        photo_date = timezone.now()

    # Check if UserDay already exists for this date
    day_date = photo_date.date() if hasattr(photo_date, 'date') else photo_date
    existing_day = UserDay.objects.filter(
        custom_user=custom_user,
        created_at__date=day_date
    ).first()

    if existing_day:
        return existing_day

    # Create UserMonth if it doesn't exist
    month_title = photo_date.strftime('%B %Y')
    start_date = date(photo_date.year, photo_date.month, 1)

    # Calculate end date based on the month
    if photo_date.month == 12:
        end_date = date(photo_date.year + 1, 1, 1) - timedelta(days=1)
    else:
        end_date = date(photo_date.year, photo_date.month + 1, 1) - timedelta(days=1)

    # Get or create the UserMonth
    user_month, created = UserMonth.objects.get_or_create(
        custom_user=custom_user,
        title=month_title,
        defaults={
            'start_date': start_date,
            'end_date': end_date,
            'tot_cal_kcal': 0,
            'tot_protein_g': 0.0,
            'tot_carbs_g': 0.0,
            'tot_fat_g': 0.0,
            'meal_score_avg': 0.0
        }
    )

    # Create new UserDay
    user_day = UserDay.objects.create(
        custom_user=custom_user,
        user_month=user_month,
        created_at=photo_date
    )

    return user_day
