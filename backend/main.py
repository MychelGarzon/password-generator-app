from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import random
import string

app = FastAPI()

# Enable CORS middleware if needed
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update as necessary
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PasswordRequest(BaseModel):
    length: int
    use_uppercase: bool
    use_lowercase: bool
    use_numbers: bool
    use_symbols: bool


@app.post("/generate-password")
def generate_password(req: PasswordRequest):
    """
    Generate a random password that includes at least one character from each selected category,
    when possible. If the requested length is less than the number of selected types, the password
    is generated from the overall pool without guaranteeing each category.
    """
    # Define character sets based on selections
    uppercase_chars = string.ascii_uppercase if req.use_uppercase else ""
    lowercase_chars = string.ascii_lowercase if req.use_lowercase else ""
    digit_chars = string.digits if req.use_numbers else ""
    symbol_chars = "#$%&()*+,-./:;<=>?@[]^_{|}~" if req.use_symbols else ""

    # Combined overall pool
    overall_pool = uppercase_chars + lowercase_chars + digit_chars + symbol_chars

    if not overall_pool:
        raise HTTPException(status_code=400, detail="No character set selected.")

    if req.length <= 0:
        raise HTTPException(
            status_code=400, detail="Password length must be greater than 0."
        )

    # Count the number of selected types
    required_count = sum(
        [req.use_uppercase, req.use_lowercase, req.use_numbers, req.use_symbols]
    )

    # If requested length is less than the number of selected types,
    # just generate a password from the overall pool.
    if req.length < required_count:
        password = "".join(random.choice(overall_pool) for _ in range(req.length))
        return {"password": password}

    # Guarantee at least one character from each selected category
    required_chars = []
    if req.use_uppercase:
        required_chars.append(random.choice(uppercase_chars))
    if req.use_lowercase:
        required_chars.append(random.choice(lowercase_chars))
    if req.use_numbers:
        required_chars.append(random.choice(digit_chars))
    if req.use_symbols:
        required_chars.append(random.choice(symbol_chars))

    # Generate the remaining characters from the overall pool
    remaining_length = req.length - len(required_chars)
    password_chars = [random.choice(overall_pool) for _ in range(remaining_length)]

    # Combine and shuffle to avoid predictable positions
    full_password = required_chars + password_chars
    random.shuffle(full_password)
    password = "".join(full_password)

    return {"password": password}
