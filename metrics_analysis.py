import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import confusion_matrix, classification_report
import json
from datetime import datetime
import os

def load_test_data():
    """Load test data from JSON files"""
    with open('test_data/sentiment_test_results.json', 'r') as f:
        sentiment_data = json.load(f)
    with open('test_data/mood_test_results.json', 'r') as f:
        mood_data = json.load(f)
    return sentiment_data, mood_data

def generate_sentiment_metrics(sentiment_data):
    """Generate metrics for sentiment analysis"""
    # Convert to DataFrame
    df = pd.DataFrame(sentiment_data)
    
    # Calculate accuracy
    accuracy = (df['predicted_sentiment'] == df['actual_sentiment']).mean()
    
    # Generate confusion matrix
    cm = confusion_matrix(df['actual_sentiment'], df['predicted_sentiment'])
    
    # Generate classification report
    report = classification_report(df['actual_sentiment'], df['predicted_sentiment'], output_dict=True)
    
    # Create visualizations
    plt.figure(figsize=(12, 6))
    
    # Confusion Matrix
    plt.subplot(1, 2, 1)
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
    plt.title('Sentiment Analysis Confusion Matrix')
    plt.xlabel('Predicted')
    plt.ylabel('Actual')
    
    # Sentiment Distribution
    plt.subplot(1, 2, 2)
    df['predicted_sentiment'].value_counts().plot(kind='bar')
    plt.title('Sentiment Distribution')
    plt.xlabel('Sentiment')
    plt.ylabel('Count')
    
    plt.tight_layout()
    plt.savefig('static/images/sentiment_metrics.png')
    plt.close()
    
    return {
        'accuracy': accuracy,
        'confusion_matrix': cm.tolist(),
        'classification_report': report
    }

def generate_mood_metrics(mood_data):
    """Generate metrics for mood detection"""
    # Convert to DataFrame
    df = pd.DataFrame(mood_data)
    
    # Calculate accuracy
    accuracy = (df['predicted_mood'] == df['actual_mood']).mean()
    
    # Generate confusion matrix
    cm = confusion_matrix(df['actual_mood'], df['predicted_mood'])
    
    # Generate classification report
    report = classification_report(df['actual_mood'], df['predicted_mood'], output_dict=True)
    
    # Create visualizations
    plt.figure(figsize=(12, 6))
    
    # Confusion Matrix
    plt.subplot(1, 2, 1)
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
    plt.title('Mood Detection Confusion Matrix')
    plt.xlabel('Predicted')
    plt.ylabel('Actual')
    
    # Mood Distribution
    plt.subplot(1, 2, 2)
    df['predicted_mood'].value_counts().plot(kind='bar')
    plt.title('Mood Distribution')
    plt.xlabel('Mood')
    plt.ylabel('Count')
    
    plt.tight_layout()
    plt.savefig('static/images/mood_metrics.png')
    plt.close()
    
    return {
        'accuracy': accuracy,
        'confusion_matrix': cm.tolist(),
        'classification_report': report
    }

def generate_performance_metrics(sentiment_data, mood_data):
    """Generate performance metrics for both systems"""
    # Calculate response times
    sentiment_times = [item['response_time'] for item in sentiment_data]
    mood_times = [item['response_time'] for item in mood_data]
    
    # Create visualization
    plt.figure(figsize=(10, 6))
    plt.boxplot([sentiment_times, mood_times], labels=['Sentiment Analysis', 'Mood Detection'])
    plt.title('Response Time Distribution')
    plt.ylabel('Response Time (seconds)')
    plt.savefig('static/images/performance_metrics.png')
    plt.close()
    
    return {
        'sentiment_analysis': {
            'mean_response_time': np.mean(sentiment_times),
            'median_response_time': np.median(sentiment_times),
            'std_response_time': np.std(sentiment_times)
        },
        'mood_detection': {
            'mean_response_time': np.mean(mood_times),
            'median_response_time': np.median(mood_times),
            'std_response_time': np.std(mood_times)
        }
    }

def main():
    # Create output directory if it doesn't exist
    os.makedirs('static/images', exist_ok=True)
    
    # Load test data
    sentiment_data, mood_data = load_test_data()
    
    # Generate metrics
    sentiment_metrics = generate_sentiment_metrics(sentiment_data)
    mood_metrics = generate_mood_metrics(mood_data)
    performance_metrics = generate_performance_metrics(sentiment_data, mood_data)
    
    # Save metrics to JSON
    metrics = {
        'sentiment_analysis': sentiment_metrics,
        'mood_detection': mood_metrics,
        'performance': performance_metrics,
        'generated_at': datetime.now().isoformat()
    }
    
    with open('static/metrics.json', 'w') as f:
        json.dump(metrics, f, indent=2)
    
    print("Metrics and visualizations generated successfully!")

if __name__ == '__main__':
    main() 