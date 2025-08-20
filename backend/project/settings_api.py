import os
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'
BASE_DIR = Path(__file__).resolve().parent.parent

# OpenAI settings
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

# Media settings
MEDIA_URL = '/media-files/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media-files') if os.getenv('DJANGO_DEBUG', 'False') == 'True' else '/media-files/'

# Temporary file settings
FILE_UPLOAD_MAX_MEMORY_SIZE = 10485760  # 10MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 10485760  # 10MB
