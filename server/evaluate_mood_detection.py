import pandas as pd
import requests
from sklearn.metrics import classification_report, confusion_matrix

# CONFIGURE THIS: Your Flask API endpoint for mood prediction
API_URL = "http://localhost:5000/api/mood/predict"  # Update this to your actual endpoint

def predict_mood_api(message):
    """
    Calls your Flask API to get the predicted mood for a message.
    Adjust the payload and response parsing as per your API.
    """
    try:
        response = requests.post(API_URL, json={"message": message})
        response.raise_for_status()
        data = response.json()
        # Adjust this if your API returns a different key
        return data.get("predicted_mood") or data.get("mood") or "unknown"
    except Exception as e:
        print(f"API error for message '{message}': {e}")
        return "unknown"

def main():
    # Load test data
    df = pd.read_csv("mood_test_data.csv")
    messages = df["message"].tolist()
    true_moods = df["true_mood"].tolist()

    # Get predictions from the API
    predicted_moods = [predict_mood_api(msg) for msg in messages]

    # Print and save the classification report
    report = classification_report(true_moods, predicted_moods, output_dict=True)
    print("Classification Report:")
    print(classification_report(true_moods, predicted_moods))

    # Print and save the confusion matrix
    cm = confusion_matrix(true_moods, predicted_moods)
    print("Confusion Matrix:")
    print(cm)

    # Save results to files
    pd.DataFrame(report).transpose().to_csv("mood_classification_report.csv")
    pd.DataFrame(cm).to_csv("mood_confusion_matrix.csv")

    print("Reports saved as 'mood_classification_report.csv' and 'mood_confusion_matrix.csv'")

if __name__ == "__main__":
    main()