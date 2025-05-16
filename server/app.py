from flask import Flask, request, jsonify
from flask_cors import CORS
from langchain_groq import ChatGroq
from langchain_community.embeddings import HuggingFaceBgeEmbeddings
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import Chroma
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from langchain.text_splitter import RecursiveCharacterTextSplitter
from textblob import TextBlob
import os
import json
from datetime import datetime
from pymongo import MongoClient
from bson import ObjectId

app = Flask(__name__)
CORS(app)
@app.route('/api/mood/predict', methods=['POST'])
def predict_mood():
    data = request.get_json()
    message = data.get('message', '')
    # Replace this with your real mood detection logic
    if "happy" in message:
        mood = "happy"
    elif "sad" in message:
        mood = "sad"
    elif "tired" in message:
        mood = "tired"
    elif "anxious" in message or "worried" in message:
        mood = "anxious"
    else:
        mood = "neutral"
    return jsonify({"predicted_mood": mood})

# MongoDB connection
client = MongoClient("mongodb+srv://aashritharaj26:ashu@cluster0.dorl1nm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
db = client['wellness_ai']
mood_collection = db['mood_tracking']
mood_report_collection = db['mood_reports']  # New collection for mood reports
mood_questionnaire_collection = db['mood_questionnaire']

# Initialize the LLM
llm = ChatGroq(
    temperature=0.7,  # Increased for more friendly responses
    groq_api_key="GROQ_API_KEY",
    model_name="llama-3.3-70b-versatile"
)

# Initialize vector database
def create_vector_db():
    loader = PyPDFLoader("mental_health_Document.pdf")
    documents = loader.load()
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    texts = text_splitter.split_documents(documents)
    embeddings = HuggingFaceBgeEmbeddings(model_name='sentence-transformers/all-MiniLM-L6-v2')
    vector_db = Chroma.from_documents(texts, embeddings, persist_directory='./chroma_db')
    vector_db.persist()
    return vector_db

def setup_qa_chain(vector_db, llm):
    retriever = vector_db.as_retriever()
    prompt_templates = """You are a friendly and supportive mental health companion. Keep your responses brief (2-3 sentences) and warm, like a caring friend. Use the following context to help inform your response:

    {context}
    User: {question}
    Chatbot: """
    PROMPT = PromptTemplate(template=prompt_templates, input_variables=['context', 'question'])

    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=retriever,
        chain_type_kwargs={"prompt": PROMPT}
    )
    return qa_chain

# Initialize the chatbot
print("Initializing Chatbot...")
db_path = "./chroma_db"

if not os.path.exists(db_path):
    vector_db = create_vector_db()
else:
    embeddings = HuggingFaceBgeEmbeddings(model_name='sentence-transformers/all-MiniLM-L6-v2')
    vector_db = Chroma(persist_directory=db_path, embedding_function=embeddings)

qa_chain = setup_qa_chain(vector_db, llm)

# Store chat history and sentiment analysis
chat_history = {}

def analyze_sentiment(text):
    try:
        # Convert text to lowercase for consistent analysis
        text = text.lower()
        
        # Define mood categories and their associated keywords
        mood_categories = {
            'happy': {
                'keywords': ['happy', 'joy', 'delighted', 'cheerful', 'glad', 'pleased', 'content', 'excited', 
                           'great', 'good', 'amazing', 'wonderful', 'fantastic', 'super', 'enthusiastic'],
                'weight': 0.8
            },
            'anxious': {
                'keywords': ['anxious', 'worried', 'nervous', 'stressed', 'tense', 'fearful', 'panicked', 'overwhelmed', 
                           'fail', 'failing', 'test', 'exam', 'study', 'studying', 'pressure', 'deadline', 'due'],
                'weight': -0.7
            },
            'sad': {
                'keywords': ['sad', 'unhappy', 'depressed', 'down', 'blue', 'miserable', 'gloomy', 'heartbroken'],
                'weight': -0.8
            },
            'angry': {
                'keywords': ['angry', 'mad', 'furious', 'irritated', 'annoyed', 'frustrated', 'enraged', 'upset'],
                'weight': -0.9
            },
            'relaxed': {
                'keywords': ['relaxed', 'calm', 'peaceful', 'tranquil', 'serene', 'at ease', 'comfortable', 'alright', 'okay'],
                'weight': 0.6
            },
            'confused': {
                'keywords': ['confused', 'uncertain', 'unsure', 'puzzled', 'lost', 'mixed up', 'disoriented'],
                'weight': -0.4
            },
            'overwhelmed': {
                'keywords': ['overwhelmed', 'overloaded', 'burdened', 'swamped', 'drowned', 'snowed under'],
                'weight': -0.8
            }
        }
        
        # Define academic stress keywords and their sentiment weights
        academic_keywords = {
            'fail': -0.8,
            'failing': -0.8,
            'test': -0.6,
            'exam': -0.7,
            'study': -0.4,
            'studying': -0.4,
            'pressure': -0.7,
            'deadline': -0.6,
            'due': -0.5,
            'assignment': -0.5,
            'homework': -0.4,
            'grade': -0.5,
            'pass': 0.6,
            'passing': 0.6,
            'good grade': 0.7,
            'understand': 0.4,
            'learned': 0.5
        }
        
        # Get base sentiment from TextBlob
        analysis = TextBlob(text)
        base_sentiment = analysis.sentiment.polarity
        
        # Check for specific mood categories
        detected_moods = []
        mood_scores = {}
        
        for mood, data in mood_categories.items():
            for keyword in data['keywords']:
                if keyword in text:
                    detected_moods.append(mood)
                    mood_scores[mood] = mood_scores.get(mood, 0) + 1
        
        # Get the most frequent mood
        primary_mood = max(mood_scores.items(), key=lambda x: x[1])[0] if mood_scores else 'neutral'
        
        # Check for academic keywords and adjust sentiment
        academic_sentiment = 0
        academic_count = 0
        
        for keyword, weight in academic_keywords.items():
            if keyword in text:
                academic_sentiment += weight
                academic_count += 1
        
        # Calculate final sentiment based on multiple factors
        if academic_count > 0:
            # If academic keywords are found, use their sentiment
            final_sentiment = academic_sentiment / academic_count
        elif mood_scores:
            # If mood keywords are found, use their weighted average
            mood_weights = [mood_categories[mood]['weight'] for mood in mood_scores.keys()]
            final_sentiment = sum(mood_weights) / len(mood_weights)
        else:
            # Otherwise use base sentiment
            final_sentiment = base_sentiment
        
        # Convert to 1-5 scale
        sentiment_score = ((final_sentiment + 1) * 2.5)
        sentiment_score = max(1, min(5, sentiment_score))
        
        # Print debug information
        print(f"Text: {text}")
        print(f"Base sentiment: {base_sentiment}")
        print(f"Academic sentiment: {academic_sentiment}")
        print(f"Detected moods: {detected_moods}")
        print(f"Primary mood: {primary_mood}")
        print(f"Final sentiment score: {sentiment_score}")
        
        return {
            'score': round(sentiment_score, 2),
            'mood': 'positive' if sentiment_score > 3 else 'neutral' if sentiment_score > 2 else 'negative',
            'primary_mood': primary_mood,
            'detected_moods': detected_moods
        }
    except Exception as e:
        print(f"Error in sentiment analysis: {str(e)}")
        return {
            'score': 3.0,
            'mood': 'neutral',
            'primary_mood': 'neutral',
            'detected_moods': []
        }

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    message = data.get('message', '')
    user_id = str(data.get('user_id', 'default_user'))
    
    if not message:
        return jsonify({'error': 'No message provided'}), 400
    
    try:
        response = qa_chain.run(message)
        
        # Analyze sentiment of user's message
        sentiment = analyze_sentiment(message)
        
        # Initialize chat history for new users
        if user_id not in chat_history:
            chat_history[user_id] = []
        
        # Store chat history with sentiment
        chat_entry = {
            'message': message,
            'response': response,
            'sentiment': sentiment,
            'timestamp': datetime.now().isoformat()
        }
        chat_history[user_id].append(chat_entry)
        
        # Get today's date
        today = datetime.now().date().isoformat()
        
        # Update or create daily mood summary
        daily_mood = mood_collection.find_one({
            'user_id': user_id,
            'date': today
        })
        
        if daily_mood:
            # Update existing daily mood
            mood_scores = daily_mood.get('mood_scores', []) + [sentiment['score']]
            detected_moods = list(set(daily_mood.get('detected_moods', []) + sentiment['detected_moods']))
            
            # Calculate new averages
            avg_score = sum(mood_scores) / len(mood_scores)
            mood_counts = {
                'positive': len([s for s in mood_scores if s > 3]),
                'neutral': len([s for s in mood_scores if 2 <= s <= 3]),
                'negative': len([s for s in mood_scores if s < 2])
            }
            primary_mood = max(mood_counts.items(), key=lambda x: x[1])[0]
            
            mood_collection.update_one(
                {'_id': daily_mood['_id']},
                {
                    '$set': {
                        'mood_score': round(avg_score, 2),
                        'primary_mood': primary_mood,
                        'detected_moods': detected_moods,
                        'mood_scores': mood_scores,
                        'mood_distribution': mood_counts,
                        'last_updated': datetime.now()
                    }
                }
            )
        else:
            # Create new daily mood entry
            mood_collection.insert_one({
                'user_id': user_id,
                'date': today,
                'mood_score': sentiment['score'],
                'primary_mood': sentiment['primary_mood'],
                'detected_moods': sentiment['detected_moods'],
                'mood_scores': [sentiment['score']],
                'mood_distribution': {
                    'positive': 1 if sentiment['score'] > 3 else 0,
                    'neutral': 1 if 2 <= sentiment['score'] <= 3 else 0,
                    'negative': 1 if sentiment['score'] < 2 else 0
                },
                'created_at': datetime.now(),
                'last_updated': datetime.now()
            })
        
        return jsonify({
            'response': response,
            'sentiment': sentiment
        })
    except Exception as e:
        print(f"Error processing message: {str(e)}")
        return jsonify({'error': 'Error processing message'}), 500

@app.route('/api/mood/daily/<user_id>', methods=['GET'])
def get_daily_mood(user_id):
    try:
        today = datetime.now().date().isoformat()
        daily_mood = mood_collection.find_one({
            'user_id': user_id,
            'date': today
        })
        
        if not daily_mood:
            return jsonify({
                'date': today,
                'mood_score': 3.0,
                'primary_mood': 'neutral',
                'detected_moods': [],
                'mood_distribution': {'positive': 0, 'neutral': 0, 'negative': 0}
            })
        
        # Convert ObjectId to string for JSON serialization
        daily_mood['_id'] = str(daily_mood['_id'])
        daily_mood['created_at'] = daily_mood['created_at'].isoformat()
        daily_mood['last_updated'] = daily_mood['last_updated'].isoformat()
        
        return jsonify(daily_mood)
    except Exception as e:
        print(f"Error fetching daily mood: {str(e)}")
        return jsonify({'error': 'Error fetching daily mood'}), 500

@app.route('/api/chat/report/<user_id>', methods=['GET'])
def get_chat_report(user_id):
    # Convert user_id to string to ensure consistent handling
    user_id = str(user_id)
    
    if user_id not in chat_history:
        return jsonify({
            'chat_history': [],
            'average_sentiment': 0,
            'mood_distribution': {'positive': 0, 'neutral': 0, 'negative': 0},
            'statistics': {
                'total_messages': 0,
                'positive_percentage': 0,
                'negative_percentage': 0,
                'average_message_length': 0,
                'most_common_mood': 'neutral'
            },
            'time_series': [],
            'daily_trend': []
        })
    
    # Calculate average sentiment
    sentiments = [entry['sentiment']['score'] for entry in chat_history[user_id]]
    avg_sentiment = sum(sentiments) / len(sentiments) if sentiments else 0
    
    # Get mood distribution
    mood_counts = {
        'positive': len([s for s in sentiments if s > 3]),
        'neutral': len([s for s in sentiments if 2 <= s <= 3]),
        'negative': len([s for s in sentiments if s < 2])
    }
    
    # Calculate additional statistics
    total_messages = len(chat_history[user_id])
    positive_percentage = (mood_counts['positive'] / total_messages * 100) if total_messages > 0 else 0
    negative_percentage = (mood_counts['negative'] / total_messages * 100) if total_messages > 0 else 0
    neutral_percentage = 100 - positive_percentage - negative_percentage
    
    # Prepare time series data for trend graph
    time_series_data = []
    for entry in chat_history[user_id]:
        timestamp = datetime.fromisoformat(entry['timestamp'])
        time_series_data.append({
            'timestamp': timestamp.isoformat(),
            'score': entry['sentiment']['score'],
            'mood': entry['sentiment']['mood']
        })
    
    # Calculate daily averages
    daily_averages = {}
    for entry in time_series_data:
        date = datetime.fromisoformat(entry['timestamp']).date().isoformat()
        if date not in daily_averages:
            daily_averages[date] = {'total': 0, 'count': 0}
        daily_averages[date]['total'] += entry['score']
        daily_averages[date]['count'] += 1
    
    daily_trend = [
        {'date': date, 'average': data['total'] / data['count']}
        for date, data in daily_averages.items()
    ]

    # Prepare essential report data for storage
    today = datetime.now().date().isoformat()
    essential_report = {
        'user_id': user_id,
        'date': today,
        'average_mood': round(avg_sentiment, 2),
        'primary_mood': max(mood_counts.items(), key=lambda x: x[1])[0] if mood_counts else 'neutral',
        'total_messages': total_messages,
        'mood_distribution': {
            'positive': round(positive_percentage, 1),
            'neutral': round(neutral_percentage, 1),
            'negative': round(negative_percentage, 1)
        },
        'mood_trend': daily_trend,
        'detected_moods': list(set(
            mood for entry in chat_history[user_id]
            for mood in entry['sentiment']['detected_moods']
        )),
        'statistics': {
            'average_message_length': round(
                sum(len(entry['message']) for entry in chat_history[user_id]) / total_messages, 1
            ) if total_messages > 0 else 0,
            'negative_percentage': round(negative_percentage, 1),
            'neutral_percentage': round(neutral_percentage, 1)
        },
        'last_updated': datetime.now()
    }

    # Check if a report already exists for today
    existing_report = mood_report_collection.find_one({
        'user_id': user_id,
        'date': today
    })

    try:
        if existing_report:
            # Update existing report
            mood_report_collection.update_one(
                {'_id': existing_report['_id']},
                {'$set': essential_report}
            )
            print(f"Updated existing mood report for user {user_id}")
        else:
            # Insert new report
            essential_report['created_at'] = datetime.now()
            mood_report_collection.insert_one(essential_report)
            print(f"Created new mood report for user {user_id}")
    except Exception as e:
        print(f"Error storing mood report: {str(e)}")

    # Return detailed report for display
    return jsonify({
        'chat_history': [
            {
                'message': entry['message'],
                'response': entry['response'],
                'sentiment': entry['sentiment'],
                'timestamp': entry['timestamp']
            }
            for entry in chat_history[user_id]
        ],
        'average_sentiment': round(avg_sentiment, 2),
        'mood_distribution': mood_counts,
        'statistics': {
            'total_messages': total_messages,
            'positive_percentage': round(positive_percentage, 1),
            'negative_percentage': round(negative_percentage, 1),
            'average_message_length': round(
                sum(len(entry['message']) for entry in chat_history[user_id]) / total_messages, 1
            ) if total_messages > 0 else 0,
            'most_common_mood': max(mood_counts.items(), key=lambda x: x[1])[0] if mood_counts else 'neutral'
        },
        'time_series': time_series_data,
        'daily_trend': daily_trend
    })

@app.route('/api/mood/reports/<user_id>', methods=['GET'])
def get_user_mood_reports(user_id):
    try:
        # Convert user_id to string for consistent handling
        user_id = str(user_id)
        
        # Get all reports for the user, sorted by date in descending order
        reports = list(mood_report_collection.find(
            {'user_id': user_id}
        ).sort('date', -1))
        
        if not reports:
            print(f"No reports found for user {user_id}")
            return jsonify([])
        
        # Convert ObjectId to string for JSON serialization and handle timestamps
        for report in reports:
            report['_id'] = str(report['_id'])
            # Handle all possible timestamp fields
            timestamp_fields = ['created_at', 'last_updated', 'timestamp']
            for field in timestamp_fields:
                if field in report and isinstance(report[field], datetime):
                    report[field] = report[field].isoformat()
        
        print(f"Successfully retrieved {len(reports)} reports for user {user_id}")
        return jsonify(reports)
    except Exception as e:
        print(f"Error fetching mood reports: {str(e)}")
        return jsonify({'error': f'Error fetching mood reports: {str(e)}'}), 500

@app.route('/api/mood/calendar/<user_id>', methods=['GET'])
def get_mood_calendar(user_id):
    try:
        # Get the current month's moods
        today = datetime.now()
        start_of_month = datetime(today.year, today.month, 1)
        end_of_month = datetime(today.year, today.month + 1, 1) if today.month < 12 else datetime(today.year + 1, 1, 1)
        
        # Query mood reports instead of mood tracking for more complete data
        moods = list(mood_report_collection.find({
            'user_id': user_id,
            'date': {
                '$gte': start_of_month.date().isoformat(),
                '$lt': end_of_month.date().isoformat()
            }
        }).sort('date', 1))
        
        # Convert ObjectId to string for JSON serialization and format dates
        for mood in moods:
            mood['_id'] = str(mood['_id'])
            # Include all relevant mood data
            mood_data = {
                'date': mood['date'],
                'primary_mood': mood.get('primary_mood', 'neutral'),
                'average_mood': mood.get('average_mood', 3.0),
                'mood_distribution': mood.get('mood_distribution', {
                    'positive': 0,
                    'neutral': 0,
                    'negative': 0
                }),
                'detected_moods': mood.get('detected_moods', [])
            }
            mood.update(mood_data)
        
        return jsonify({
            'moods': moods,
            'month': today.month,
            'year': today.year
        })
    except Exception as e:
        print(f"Error fetching mood calendar: {str(e)}")
        return jsonify({'error': f'Error fetching mood calendar: {str(e)}'}), 500

@app.route('/api/mood/calendar/<user_id>/<int:year>/<int:month>', methods=['GET'])
def get_mood_calendar_by_month(user_id, year, month):
    try:
        # Get moods for the specified month
        start_of_month = datetime(year, month, 1)
        end_of_month = datetime(year, month + 1, 1) if month < 12 else datetime(year + 1, 1, 1)
        
        # Query mood reports instead of mood tracking for more complete data
        moods = list(mood_report_collection.find({
            'user_id': user_id,
            'date': {
                '$gte': start_of_month.date().isoformat(),
                '$lt': end_of_month.date().isoformat()
            }
        }).sort('date', 1))
        
        # Convert ObjectId to string for JSON serialization and format dates
        for mood in moods:
            mood['_id'] = str(mood['_id'])
            # Include all relevant mood data
            mood_data = {
                'date': mood['date'],
                'primary_mood': mood.get('primary_mood', 'neutral'),
                'average_mood': mood.get('average_mood', 3.0),
                'mood_distribution': mood.get('mood_distribution', {
                    'positive': 0,
                    'neutral': 0,
                    'negative': 0
                }),
                'detected_moods': mood.get('detected_moods', [])
            }
            mood.update(mood_data)
        
        return jsonify({
            'moods': moods,
            'month': month,
            'year': year
        })
    except Exception as e:
        print(f"Error fetching mood calendar: {str(e)}")
        return jsonify({'error': f'Error fetching mood calendar: {str(e)}'}), 500

@app.route('/api/mood/questionnaire', methods=['POST'])
def submit_questionnaire():
    try:
        data = request.json
        user_id = str(data.get('user_id'))
        answers = data.get('answers', {})
        total_score = data.get('total_score', 0)
        now = datetime.now()
        today_str = now.date().isoformat()

        # Calculate mood based on score
        mood = 'positive' if total_score >= 40 else 'neutral' if total_score >= 30 else 'negative'

        # Store questionnaire data with the correct current date and time
        questionnaire_data = {
            'user_id': user_id,
            'date': today_str,
            'total_score': total_score,
            'answers': answers,
            'mood': mood,
            'created_at': now
        }

        result = mood_questionnaire_collection.insert_one(questionnaire_data)
        questionnaire_data['_id'] = str(result.inserted_id)
        questionnaire_data['created_at'] = now.isoformat()

        # Also update the daily mood summary
        daily_mood = mood_collection.find_one({
            'user_id': user_id,
            'date': today_str
        })

        if daily_mood:
            # Update existing daily mood
            mood_scores = daily_mood.get('mood_scores', []) + [total_score / 10]  # Convert to 1-5 scale
            detected_moods = list(set(daily_mood.get('detected_moods', []) + [mood]))

            # Calculate new averages
            avg_score = sum(mood_scores) / len(mood_scores)
            mood_counts = {
                'positive': len([s for s in mood_scores if s > 3]),
                'neutral': len([s for s in mood_scores if 2 <= s <= 3]),
                'negative': len([s for s in mood_scores if s < 2])
            }
            primary_mood = max(mood_counts.items(), key=lambda x: x[1])[0]

            mood_collection.update_one(
                {'_id': daily_mood['_id']},
                {
                    '$set': {
                        'mood_score': round(avg_score, 2),
                        'primary_mood': primary_mood,
                        'detected_moods': detected_moods,
                        'mood_scores': mood_scores,
                        'mood_distribution': mood_counts,
                        'last_updated': now
                    }
                }
            )
        else:
            # Create new daily mood entry
            mood_collection.insert_one({
                'user_id': user_id,
                'date': today_str,
                'mood_score': total_score / 10,  # Convert to 1-5 scale
                'primary_mood': mood,
                'detected_moods': [mood],
                'mood_scores': [total_score / 10],
                'mood_distribution': {
                    'positive': 1 if total_score >= 40 else 0,
                    'neutral': 1 if 30 <= total_score < 40 else 0,
                    'negative': 1 if total_score < 30 else 0
                },
                'created_at': now,
                'last_updated': now
            })

        # Return the full new entry so the frontend can display it immediately
        return jsonify({
            'success': True,
            'message': 'Questionnaire submitted successfully',
            'data': questionnaire_data
        })
    except Exception as e:
        print(f"Error submitting questionnaire: {str(e)}")
        return jsonify({'error': f'Error submitting questionnaire: {str(e)}'}), 500

@app.route('/api/mood/questionnaire/<user_id>', methods=['GET'])
def get_questionnaire_history(user_id):
    try:
        # Get all questionnaire entries for the user, sorted by date
        entries = list(mood_questionnaire_collection.find(
            {'user_id': user_id}
        ).sort('date', -1))
        
        # Convert ObjectId to string for JSON serialization
        for entry in entries:
            entry['_id'] = str(entry['_id'])
            if 'created_at' in entry:
                entry['created_at'] = entry['created_at'].isoformat()
        
        return jsonify(entries)
    except Exception as e:
        print(f"Error fetching questionnaire history: {str(e)}")
        return jsonify({'error': f'Error fetching questionnaire history: {str(e)}'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port) 
