import json
import random
from datetime import datetime
import time

def generate_sentiment_test_data():
    """Generate test data for sentiment analysis"""
    sentiments = ['positive', 'negative', 'neutral']
    test_cases = [
        "I'm feeling great today!",
        "This is the worst day ever.",
        "The weather is okay.",
        "I love this new feature!",
        "I'm really disappointed with the service.",
        "It's just another regular day.",
        "This makes me so happy!",
        "I can't believe how terrible this is.",
        "The results are as expected.",
        "I'm thrilled with the outcome!"
    ]
    
    results = []
    for text in test_cases:
        # Simulate API call
        time.sleep(0.1)  # Simulate response time
        start_time = time.time()
        
        # Simulate prediction (in real scenario, this would be your actual model)
        predicted = random.choice(sentiments)
        
        # Determine actual sentiment (simplified for example)
        actual = 'positive' if 'great' in text.lower() or 'love' in text.lower() or 'happy' in text.lower() or 'thrilled' in text.lower() else \
                'negative' if 'worst' in text.lower() or 'disappointed' in text.lower() or 'terrible' in text.lower() else 'neutral'
        
        results.append({
            'text': text,
            'predicted_sentiment': predicted,
            'actual_sentiment': actual,
            'response_time': time.time() - start_time,
            'timestamp': datetime.now().isoformat()
        })
    
    return results

def generate_mood_test_data():
    """Generate test data for mood detection"""
    moods = ['happy', 'sad', 'angry', 'anxious', 'calm']
    test_cases = [
        "I'm feeling joyful and energetic today!",
        "I'm really down and can't seem to shake it.",
        "I'm so frustrated with this situation!",
        "I'm worried about what might happen next.",
        "I feel peaceful and content right now.",
        "Everything is going great!",
        "I'm feeling really low today.",
        "This is making me so angry!",
        "I'm feeling nervous about the presentation.",
        "I'm in a good mood today."
    ]
    
    results = []
    for text in test_cases:
        # Simulate API call
        time.sleep(0.1)  # Simulate response time
        start_time = time.time()
        
        # Simulate prediction (in real scenario, this would be your actual model)
        predicted = random.choice(moods)
        
        # Determine actual mood (simplified for example)
        actual = 'happy' if 'joyful' in text.lower() or 'great' in text.lower() or 'good' in text.lower() else \
                'sad' if 'down' in text.lower() or 'low' in text.lower() else \
                'angry' if 'frustrated' in text.lower() or 'angry' in text.lower() else \
                'anxious' if 'worried' in text.lower() or 'nervous' in text.lower() else 'calm'
        
        results.append({
            'text': text,
            'predicted_mood': predicted,
            'actual_mood': actual,
            'response_time': time.time() - start_time,
            'timestamp': datetime.now().isoformat()
        })
    
    return results

def main():
    # Create test data directory if it doesn't exist
    import os
    os.makedirs('test_data', exist_ok=True)
    
    # Generate test data
    sentiment_data = generate_sentiment_test_data()
    mood_data = generate_mood_test_data()
    
    # Save test data
    with open('test_data/sentiment_test_results.json', 'w') as f:
        json.dump(sentiment_data, f, indent=2)
    
    with open('test_data/mood_test_results.json', 'w') as f:
        json.dump(mood_data, f, indent=2)
    
    print("Test data generated successfully!")

if __name__ == '__main__':
    main() 