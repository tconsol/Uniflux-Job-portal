import stripe
from app.config import settings

stripe.api_key = settings.STRIPE_API_KEY
stripe.default_timeout = 30