import express from 'express';
import QuestionnaireQuestion from '../models/QuestionnaireQuestion';

const router = express.Router();

// Get all active questions
router.get('/questions', async (req, res) => {
  try {
    const questions = await QuestionnaireQuestion.find({ isActive: true })
      .sort({ order: 1 });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching questions', error });
  }
});

// Add a new question
router.post('/questions', async (req, res) => {
  try {
    const { text, name, order } = req.body;
    const question = new QuestionnaireQuestion({
      text,
      name,
      order,
      isActive: true
    });
    await question.save();
    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({ message: 'Error creating question', error });
  }
});

// Update a question
router.put('/questions/:id', async (req, res) => {
  try {
    const { text, name, order, isActive } = req.body;
    const question = await QuestionnaireQuestion.findByIdAndUpdate(
      req.params.id,
      { text, name, order, isActive },
      { new: true }
    );
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    res.json(question);
  } catch (error) {
    res.status(500).json({ message: 'Error updating question', error });
  }
});

// Delete a question (soft delete by setting isActive to false)
router.delete('/questions/:id', async (req, res) => {
  try {
    const question = await QuestionnaireQuestion.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting question', error });
  }
});

export default router; 