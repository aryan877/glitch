import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';

const getTaskDescription = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    const prompt = `Create a task description for a new task in our task management app. The task should be a clear and concise description that outlines the objective, deliverables, and any specific requirements. Prompt entered by the user is: ${req.body.prompt}. Format the response with <br>, <b>, <i>, <u> where required as html. instead of using list, use manually written number 1,2,3 and so on...`;

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
