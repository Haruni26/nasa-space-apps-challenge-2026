from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def home():
    return {
        "message": "Python backend is working!"
    }


@app.get("/api/sky/search")
def search_sky(ra: float, dec: float):

    return {
        "right_ascension": ra,
        "declination": dec,
        "observations": []
    }