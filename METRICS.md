# Sentiment Analysis and Mood Detection Metrics

This document explains the metrics and visualizations generated for our sentiment analysis and mood detection systems.

## Setup

1. Install the required packages:
```bash
pip install -r requirements_metrics.txt
```

2. Generate test data:
```bash
python generate_test_data.py
```

3. Generate metrics and visualizations:
```bash
python metrics_analysis.py
```

## Generated Metrics

The system generates the following metrics and visualizations:

### 1. Sentiment Analysis Metrics
- Accuracy: Overall accuracy of sentiment predictions
- Confusion Matrix: Shows the distribution of correct and incorrect predictions
- Classification Report: Detailed metrics including precision, recall, and F1-score for each sentiment class
- Sentiment Distribution: Visual representation of predicted sentiment distribution

### 2. Mood Detection Metrics
- Accuracy: Overall accuracy of mood predictions
- Confusion Matrix: Shows the distribution of correct and incorrect predictions
- Classification Report: Detailed metrics including precision, recall, and F1-score for each mood class
- Mood Distribution: Visual representation of predicted mood distribution

### 3. Performance Metrics
- Response Time Analysis: Box plots showing the distribution of response times
- Mean Response Time: Average time taken for predictions
- Median Response Time: Middle value of response times
- Standard Deviation: Measure of response time variability

## Interpreting the Results

### Confusion Matrices
- The confusion matrices show how well the system predicts each class
- Rows represent actual values, columns represent predicted values
- Higher values on the diagonal indicate better performance

### Classification Reports
- Precision: Ratio of true positives to total predicted positives
- Recall: Ratio of true positives to total actual positives
- F1-score: Harmonic mean of precision and recall
- Support: Number of samples for each class

### Response Time Analysis
- Box plots show the distribution of response times
- The box represents the interquartile range (IQR)
- The line in the box represents the median
- Whiskers extend to the most extreme data points within 1.5 * IQR

## Output Files

The following files are generated in the `static/images` directory:
- `sentiment_metrics.png`: Sentiment analysis visualizations
- `mood_metrics.png`: Mood detection visualizations
- `performance_metrics.png`: Response time analysis

The metrics data is also saved in `static/metrics.json` for further analysis.

## Using the Metrics

These metrics can be used to:
1. Evaluate system performance
2. Identify areas for improvement
3. Compare different versions of the system
4. Monitor system behavior over time
5. Make data-driven decisions about system optimization

## Best Practices

1. Run the metrics generation regularly to track system performance
2. Compare metrics across different time periods
3. Use the visualizations to identify patterns and anomalies
4. Consider both accuracy and performance metrics when making improvements
5. Keep historical metrics for trend analysis 