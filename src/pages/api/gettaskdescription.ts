import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';

const getTaskDescription = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    const prompt = `Create a task description for a new task in our task management app. The task should be a clear and concise description that outlines the objective, deliverables, and any specific requirements, although exclude writing the title again, since it is already specified by the user.

    Please include the following details:
    1. Objective of the task.
    2. Key deliverables and milestones.
    3. Specific requirements or dependencies.
    
    Format your response using HTML tags for better readability.
    
    Prompt entered by the user: ${req.body.prompt}`;

    // Call the GPT API to generate the task description
    const response = await axios.post(
      'https://api.openai.com/v1/completions',
      {
        model: 'text-davinci-003',
        prompt,
        temperature: 0.7,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        max_tokens: 200,
        n: 1,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPEN_AI_KEY ?? ''}`,
        },
      }
    );

    const description = response.data.choices[0].text.trim();

    res.status(200).json({ description });
  } catch (error) {
    console.error('Error generating task description');
    res.status(500).json({ error: 'Failed to generate task description' });
  }
};

export default getTaskDescription;
